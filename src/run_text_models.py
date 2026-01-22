#!/usr/bin/env python3
from __future__ import annotations

import argparse

import numpy as np
import torch
from transformers import AutoTokenizer, AutoModel

from src.config import (
    RESULTS_ROOT,
    DEFAULT_PCA_DIM,
    DEFAULT_FIR_WINDOW,
    DEFAULT_FIR_OFFSET,
    DEFAULT_ALPHAS,
    DEFAULT_KFOLD,
    SUBJECTS,
)
from src.data import load_fmri, load_align_df
from src.text_pipeline import (
    build_context_tokens,
    extract_text_layers,
    align_word_features_to_tr,
    reduce_pca,
    save_layer_features,
)
from src.modeling import build_fir, run_cv_multi_subjects, summarize, append_log
from src.utils import get_tokenizer_valid_len


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


def load_text_model(model_name: str, trust_remote_code: bool) -> torch.nn.Module:
    try:
        return AutoModel.from_pretrained(
            model_name,
            output_hidden_states=True,
            trust_remote_code=trust_remote_code,
        )
    except OSError as exc:
        if "from_tf=True" in str(exc):
            return AutoModel.from_pretrained(
                model_name,
                output_hidden_states=True,
                trust_remote_code=trust_remote_code,
                from_tf=True,
            )
        if "from_flax=True" in str(exc):
            return AutoModel.from_pretrained(
                model_name,
                output_hidden_states=True,
                trust_remote_code=trust_remote_code,
                from_flax=True,
            )
        raise


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Text models encoding pipeline")
    parser.add_argument(
        "--models",
        nargs="+",
        default=["gpt2", "bert-base-uncased", "roberta-base"],
        help="文本模型列表",
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
    parser.add_argument("--ctx-words", type=int, default=200, help="上下文窗口大小")
    parser.add_argument("--pooling", type=str, default="last", choices=["mean", "last"],
                        help="token pooling方式")
    parser.add_argument("--batch-size", type=int, default=64, help="特征提取 batch size")
    parser.add_argument("--autocast", action="store_true", help="使用 autocast")
    parser.add_argument("--pca-dim", type=int, default=DEFAULT_PCA_DIM, help="PCA 维度")
    parser.add_argument("--fir-window", type=int, default=DEFAULT_FIR_WINDOW, help="FIR 窗口")
    parser.add_argument("--fir-offset", type=int, default=DEFAULT_FIR_OFFSET, help="FIR 偏移")
    parser.add_argument("--log-file", type=str, default="log.txt", help="日志文件名")
    parser.add_argument("--trust-remote-code", action="store_true", help="使用 trust_remote_code")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    fmris = load_fmri()
    df = load_align_df()
    n_trs = fmris[75].shape[0]

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    for model_name in args.models:
        print(f"[text] model start: {model_name}", flush=True)
        model_dir = RESULTS_ROOT / "text" / safe_name(model_name) / f"win{args.ctx_words}"
        feature_dir = model_dir / "features"
        log_path = model_dir / args.log_file

        tokenizer = AutoTokenizer.from_pretrained(
            model_name, trust_remote_code=args.trust_remote_code
        )
        if getattr(tokenizer, "add_prefix_space", None) is not None:
            tokenizer.add_prefix_space = True
        text_model = load_text_model(model_name, args.trust_remote_code)
        text_model = text_model.to(device)
        layers = resolve_layers(text_model, args.layer_strategy, args.layers, args.n_layers)

        valid_len, _ = get_tokenizer_valid_len(tokenizer)
        if args.ctx_words > valid_len:
            raise ValueError(f"Window size {args.ctx_words} exceeds tokenizer valid length {valid_len}.")

        tokens = build_context_tokens(df, tokenizer, args.ctx_words)
        layer_features = extract_text_layers(
            tokens=tokens,
            tokenizer=tokenizer,
            model=text_model,
            layers=layers,
            device=device,
            batch_size=args.batch_size,
            autocast=args.autocast,
            pooling=args.pooling,
        )
        save_layer_features(
            layer_features,
            feature_dir,
            prefix=f"text_{safe_name(model_name)}_win{args.ctx_words}",
        )

        for layer, features in layer_features.items():
            print(f"[text] model={model_name} layer={layer} start", flush=True)
            aligned = align_word_features_to_tr(df, features, n_trs, pooling="mean")
            np.save(model_dir / f"aligned_layer{layer}.npy", aligned)
            aligned = reduce_pca(aligned, args.pca_dim)
            fir = build_fir(aligned, window=args.fir_window, offset=args.fir_offset)

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
            print(f"[text] model={model_name} layer={layer} done", flush=True)
        print(f"[text] model done: {model_name}", flush=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
