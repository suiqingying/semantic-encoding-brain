#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import torch
from transformers import AutoFeatureExtractor, AutoModel, AutoProcessor

from src.config import (
    RESULTS_ROOT,
    TR_SECONDS,
    AUDIO_SR,
    DEFAULT_PCA_DIM,
    DEFAULT_FIR_WINDOW,
    DEFAULT_FIR_OFFSET,
    DEFAULT_ALPHAS,
    DEFAULT_KFOLD,
    SUBJECTS,
)
from src.data import load_fmri, load_audio
from src.audio_pipeline import chunk_audio, extract_audio_layers, save_layer_features
from src.modeling import build_fir, run_cv_multi_subjects, summarize, append_log


def safe_name(model_name: str) -> str:
    return model_name.replace("/", "_")


def get_num_layers(model: torch.nn.Module) -> int:
    cfg = model.config
    for attr in ("num_hidden_layers", "n_layer", "num_layers", "encoder_layers", "decoder_layers"):
        if hasattr(cfg, attr):
            return int(getattr(cfg, attr))
    raise ValueError(f"Cannot infer num layers from config: {cfg.__class__.__name__}")


def resolve_layers(model: torch.nn.Module, strategy: str,
                   layers: list[int] | None, n_layers: int) -> list[int]:
    num_layers = get_num_layers(model)
    if strategy == "relative":
        if n_layers < 1:
            raise ValueError("--n-layers must be >= 1 for relative strategy.")
        picks = np.linspace(1, num_layers, num=n_layers)
        resolved = sorted({int(round(v)) for v in picks})
    else:
        if not layers:
            raise ValueError("Absolute strategy requires --layers.")
        resolved = sorted(set(int(v) for v in layers))
    for layer in resolved:
        if layer < 0 or layer > num_layers:
            raise ValueError(f"Layer {layer} out of range for model with {num_layers} layers.")
    return resolved


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Audio models encoding pipeline")
    parser.add_argument(
        "--models",
        nargs="+",
        default=[
            "facebook/wav2vec2-base-960h",
            "microsoft/wavlm-base-plus",
            "facebook/hubert-base-ls960",
        ],
        help="音频模型列表",
    )
    parser.add_argument(
        "--tr-win",
        nargs="+",
        type=int,
        default=[1, 2, 3, 6],
        help="TR窗口列表",
    )
    parser.add_argument(
        "--layers",
        nargs="+",
        type=int,
        help="层列表",
    )
    parser.add_argument("--layer-strategy", choices=["absolute", "relative"],
                        default="relative", help="层选择策略")
    parser.add_argument("--n-layers", type=int, default=5, help="相对层数量")
    parser.add_argument("--pooling", type=str, default="mean", choices=["mean", "last"],
                        help="时间维 pooling 方式")
    parser.add_argument("--batch-size", type=int, default=16, help="特征提取 batch size")
    parser.add_argument("--autocast", action="store_true", help="使用 autocast")
    parser.add_argument("--pca-dim", type=int, default=DEFAULT_PCA_DIM, help="PCA 维度")
    parser.add_argument("--fir-window", type=int, default=DEFAULT_FIR_WINDOW, help="FIR 窗口")
    parser.add_argument("--fir-offset", type=int, default=DEFAULT_FIR_OFFSET, help="FIR 偏移")
    parser.add_argument("--log-file", type=str, default="log.txt", help="日志文件名")
    parser.add_argument("--trust-remote-code", action="store_true", help="使用 trust_remote_code")
    parser.add_argument("--save-aligned", action="store_true", help="保存对齐后的TR特征")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    fmris = load_fmri()
    wav, sr = load_audio(sr=AUDIO_SR)
    n_trs = fmris[75].shape[0]
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    for tr_win in args.tr_win:
        print(f"[audio] tr_win start: {tr_win}", flush=True)
        audio_chunks = chunk_audio(wav, sr, n_trs=n_trs, tr_seconds=TR_SECONDS, tr_win=tr_win)

        for model_name in args.models:
            print(f"[audio] model start: {model_name}", flush=True)
            model_dir = RESULTS_ROOT / "audio" / safe_name(model_name) / f"{tr_win}TR"
            feature_dir = model_dir / "features"
            log_path = model_dir / args.log_file

            try:
                processor = AutoProcessor.from_pretrained(model_name, trust_remote_code=args.trust_remote_code)
            except Exception:
                processor = AutoFeatureExtractor.from_pretrained(model_name, trust_remote_code=args.trust_remote_code)
            audio_model = AutoModel.from_pretrained(model_name, output_hidden_states=True, trust_remote_code=args.trust_remote_code)
            audio_model = audio_model.to(device)
            layers = resolve_layers(audio_model, args.layer_strategy, args.layers, args.n_layers)

            layer_features = extract_audio_layers(
                audio_chunks=audio_chunks,
                processor=processor,
                model=audio_model,
                layers=layers,
                device=device,
                batch_size=args.batch_size,
                autocast=args.autocast,
                pooling=args.pooling,
                sampling_rate=sr,
            )
            save_layer_features(layer_features, feature_dir,
                                prefix=f"audio_{safe_name(model_name)}_win{tr_win}TR")

            for layer, features in layer_features.items():
                print(f"[audio] model={model_name} layer={layer} start", flush=True)
                if args.save_aligned:
                    np.save(model_dir / f"aligned_layer{layer}.npy", features)
                features_std = (features - features.mean(0)) / (features.std(0) + 1e-8)
                pca_features = features_std
                if args.pca_dim and args.pca_dim < features.shape[1]:
                    from sklearn.decomposition import PCA
                    pca = PCA(n_components=args.pca_dim)
                    pca_features = pca.fit_transform(features_std)

                fir = build_fir(pca_features, window=args.fir_window, offset=args.fir_offset)

                corr_means, corr_map = run_cv_multi_subjects(
                    X=fir,
                    fmris=fmris,
                    subjects=SUBJECTS,
                    excluded_start=10,
                    excluded_end=10,
                    alphas=DEFAULT_ALPHAS,
                    kfold=DEFAULT_KFOLD,
                )
                stats = summarize(corr_means)
                append_log(log_path, layer, stats)

                np.save(model_dir / f"corr_layer{layer}.npy", corr_map)
                print(f"[audio] model={model_name} layer={layer} done", flush=True)
            print(f"[audio] model done: {model_name}", flush=True)
        print(f"[audio] tr_win done: {tr_win}", flush=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
