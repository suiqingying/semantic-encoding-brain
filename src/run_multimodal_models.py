#!/usr/bin/env python3
from __future__ import annotations

import argparse
from collections import defaultdict

import numpy as np
import torch
from torch.utils.data import DataLoader
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
from src.data import load_fmri, load_audio, load_align_df
from src.audio_pipeline import chunk_audio, save_layer_features
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


def build_tr_texts(df, n_trs: int) -> list[str]:
    texts = [""] * n_trs
    grouped = df.groupby("tr")["cased"].apply(list)
    for tr, words in grouped.items():
        if 1 <= tr <= n_trs:
            texts[tr - 1] = " ".join([w for w in words if isinstance(w, str)])
    return texts


def build_tr_text_windows(tr_texts: list[str], tr_win: int) -> list[str]:
    windows = []
    for idx in range(len(tr_texts)):
        start = max(0, idx - tr_win + 1)
        window_text = " ".join(t for t in tr_texts[start: idx + 1] if t)
        windows.append(window_text)
    return windows


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Multimodal models pipeline (audio + text)")
    parser.add_argument(
        "--models",
        nargs="+",
        default=[
            "openai/whisper-small",
            "openai/whisper-base",
            "laion/clap-htsat-unfused",
        ],
        help="多模态模型列表",
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


@torch.inference_mode()
def extract_multimodal_layers(audio_chunks: torch.Tensor,
                              text_windows: list[str],
                              processor,
                              model: torch.nn.Module,
                              layers: list[int],
                              device: torch.device,
                              batch_size: int,
                              autocast: bool,
                              sampling_rate: int) -> dict[int, np.ndarray]:
    if isinstance(layers, int):
        layers = [layers]

    indices = list(range(len(text_windows)))

    def collate_fn(batch_idx: list[int]):
        audio_arrays = [audio_chunks[i].numpy().astype(np.float32) for i in batch_idx]
        texts = [text_windows[i] for i in batch_idx]
        return audio_arrays, texts

    dataloader = DataLoader(indices, batch_size=batch_size, collate_fn=collate_fn, shuffle=False)
    hidden_states = defaultdict(list)

    is_whisper = getattr(model.config, "model_type", "") == "whisper"
    has_dual = hasattr(model, "get_text_features") and hasattr(model, "get_audio_features")

    for idx, (audio_arrays, texts) in enumerate(dataloader):
        if (idx + 1) % 10 == 0 or idx == 0:
            print(f"[multimodal] batch {idx + 1}/{len(dataloader)}", flush=True)
        if is_whisper:
            audio_inputs = processor(
                audio_arrays,
                sampling_rate=sampling_rate,
                return_tensors="pt",
            )
            text_inputs = processor.tokenizer(
                texts,
                padding=True,
                truncation=True,
                return_tensors="pt",
            )
            audio_inputs = {k: v.to(device) for k, v in audio_inputs.items()}
            text_inputs = {k: v.to(device) for k, v in text_inputs.items()}

            with torch.autocast(device_type='cuda' if 'cuda' in str(device) else 'cpu',
                                dtype=torch.bfloat16, enabled=autocast):
                outputs = model(
                    input_features=audio_inputs["input_features"],
                    decoder_input_ids=text_inputs["input_ids"],
                    output_hidden_states=True,
                )

            enc_states = getattr(outputs, "encoder_hidden_states", None)
            dec_states = getattr(outputs, "decoder_hidden_states", None)
            if enc_states is None or dec_states is None:
                raise ValueError("Whisper outputs do not contain encoder/decoder hidden states.")

            text_mask = text_inputs.get("attention_mask", None)
            for layer_idx in layers:
                enc_state = enc_states[layer_idx]
                dec_state = dec_states[layer_idx]

                enc_pool = enc_state.mean(dim=1)
                if text_mask is not None:
                    mask = text_mask.unsqueeze(-1)
                    dec_pool = (dec_state * mask).sum(dim=1) / mask.sum(dim=1)
                else:
                    dec_pool = dec_state.mean(dim=1)

                fused = torch.cat([enc_pool, dec_pool], dim=-1)
                hidden_states[layer_idx].append(fused.cpu().float().numpy())
        elif has_dual:
            batch = processor(
                text=texts,
                audio=audio_arrays,
                sampling_rate=sampling_rate,
                return_tensors="pt",
                padding=True,
                truncation=True,
            )
            batch = {k: v.to(device) for k, v in batch.items()}
            with torch.autocast(device_type='cuda' if 'cuda' in str(device) else 'cpu',
                                dtype=torch.bfloat16, enabled=autocast):
                outputs = model(**batch, output_hidden_states=True)

            text_out = getattr(outputs, "text_model_output", None)
            audio_out = getattr(outputs, "audio_model_output", None)
            text_states = getattr(text_out, "hidden_states", None) if text_out is not None else None
            audio_states = getattr(audio_out, "hidden_states", None) if audio_out is not None else None

            if text_states is None or audio_states is None:
                text_feat = model.get_text_features(**{k: v for k, v in batch.items() if k.startswith("input_ids") or k.startswith("attention_mask")})
                audio_feat = model.get_audio_features(**{k: v for k, v in batch.items() if k.startswith("input_features") or k.startswith("input_values") or k.startswith("attention_mask")})
                if any(l != 0 for l in layers):
                    raise ValueError("Model does not expose hidden states; only layer 0 is supported.")
                fused = torch.cat([text_feat, audio_feat], dim=-1)
                hidden_states[0].append(fused.cpu().float().numpy())
                continue

            text_mask = batch.get("attention_mask", None)
            raw_mask = batch.get("attention_mask", None)

            for layer_idx in layers:
                text_state = text_states[layer_idx]
                audio_state = audio_states[layer_idx]

                if text_mask is not None and text_mask.shape[1] == text_state.shape[1]:
                    mask = text_mask.unsqueeze(-1)
                    text_pool = (text_state * mask).sum(dim=1) / mask.sum(dim=1)
                else:
                    text_pool = text_state.mean(dim=1)

                audio_mask = None
                if raw_mask is not None:
                    if raw_mask.shape[1] == audio_state.shape[1]:
                        audio_mask = raw_mask
                    elif hasattr(model, "_get_feature_vector_attention_mask"):
                        audio_mask = model._get_feature_vector_attention_mask(
                            audio_state.shape[1], raw_mask
                        )
                if audio_mask is not None:
                    mask = audio_mask.unsqueeze(-1)
                    audio_pool = (audio_state * mask).sum(dim=1) / mask.sum(dim=1)
                else:
                    audio_pool = audio_state.mean(dim=1)

                fused = torch.cat([audio_pool, text_pool], dim=-1)
                hidden_states[layer_idx].append(fused.cpu().float().numpy())
        else:
            raise ValueError("Model does not support multimodal (audio+text) features.")

    return {layer_idx: np.concatenate(states, axis=0) for layer_idx, states in hidden_states.items()}


def main() -> int:
    args = parse_args()
    fmris = load_fmri()
    wav, sr = load_audio(sr=AUDIO_SR)
    df = load_align_df()
    n_trs = fmris[75].shape[0]
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    tr_texts = build_tr_texts(df, n_trs)

    for tr_win in args.tr_win:
        print(f"[multimodal] tr_win start: {tr_win}", flush=True)
        audio_chunks = chunk_audio(wav, sr, n_trs=n_trs, tr_seconds=TR_SECONDS, tr_win=tr_win)
        text_windows = build_tr_text_windows(tr_texts, tr_win)

        for model_name in args.models:
            print(f"[multimodal] model start: {model_name}", flush=True)
            model_dir = RESULTS_ROOT / "multimodal" / safe_name(model_name) / f"{tr_win}TR"
            feature_dir = model_dir / "features"
            log_path = model_dir / args.log_file

            try:
                processor = AutoProcessor.from_pretrained(model_name, trust_remote_code=args.trust_remote_code)
            except Exception:
                processor = AutoFeatureExtractor.from_pretrained(model_name, trust_remote_code=args.trust_remote_code)
            model = AutoModel.from_pretrained(model_name, output_hidden_states=True, trust_remote_code=args.trust_remote_code)
            model = model.to(device)
            layers = resolve_layers(model, args.layer_strategy, args.layers, args.n_layers)

            layer_features = extract_multimodal_layers(
                audio_chunks=audio_chunks,
                text_windows=text_windows,
                processor=processor,
                model=model,
                layers=layers,
                device=device,
                batch_size=args.batch_size,
                autocast=args.autocast,
                sampling_rate=sr,
            )
            save_layer_features(layer_features, feature_dir,
                                prefix=f"multimodal_{safe_name(model_name)}_win{tr_win}TR")

            for layer, features in layer_features.items():
                print(f"[multimodal] model={model_name} layer={layer} start", flush=True)
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
                print(f"[multimodal] model={model_name} layer={layer} done", flush=True)
            print(f"[multimodal] model done: {model_name}", flush=True)
        print(f"[multimodal] tr_win done: {tr_win}", flush=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
