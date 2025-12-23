#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import torch
from transformers import AutoTokenizer, AutoModel

from src.config import (
    RESULTS_ROOT,
    ATLAS_ROOT,
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
from src.viz import save_corr_map
from src.utils import get_tokenizer_valid_len


def safe_name(model_name: str) -> str:
    return model_name.replace("/", "_")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Text models encoding pipeline")
    parser.add_argument("--models", nargs="+", required=True, help="文本模型列表")
    parser.add_argument("--layers", nargs="+", type=int, required=True, help="层列表")
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
    parser.add_argument("--save-corr-map", action="store_true", help="保存皮层相关图")
    parser.add_argument("--save-aligned", action="store_true", help="保存对齐后的TR特征")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    fmris = load_fmri()
    df = load_align_df()
    n_trs = fmris[75].shape[0]

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    for model_name in args.models:
        model_dir = RESULTS_ROOT / "text" / safe_name(model_name) / f"win{args.ctx_words}"
        feature_dir = model_dir / "features"
        log_path = model_dir / args.log_file

        tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=args.trust_remote_code)
        text_model = AutoModel.from_pretrained(model_name, output_hidden_states=True, trust_remote_code=args.trust_remote_code)
        text_model = text_model.to(device)

        valid_len, _ = get_tokenizer_valid_len(tokenizer)
        if args.ctx_words > valid_len:
            raise ValueError(f"Window size {args.ctx_words} exceeds tokenizer valid length {valid_len}.")

        tokens = build_context_tokens(df, tokenizer, args.ctx_words)
        layer_features = extract_text_layers(
            tokens=tokens,
            tokenizer=tokenizer,
            model=text_model,
            layers=args.layers,
            device=device,
            batch_size=args.batch_size,
            autocast=args.autocast,
            pooling=args.pooling,
        )
        save_layer_features(layer_features, feature_dir,
                            prefix=f"text_{safe_name(model_name)}_win{args.ctx_words}")

        for layer, features in layer_features.items():
            aligned = align_word_features_to_tr(df, features, n_trs, pooling="mean")
            if args.save_aligned:
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
            if args.save_corr_map:
                out_img = model_dir / f"corr_layer{layer}.png"
                save_corr_map(corr_map, atlas_root=ATLAS_ROOT, out_file=out_img)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
