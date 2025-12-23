#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import torch
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

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
from src.text_pipeline import align_word_features_to_tr
from src.modeling import build_fir, run_cv_multi_subjects, summarize, append_log
from src.viz import save_corr_map


def safe_name(model_name: str) -> str:
    return model_name.replace("/", "_")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Multimodal fusion (text + audio)")
    parser.add_argument("--text-model", required=True, help="文本模型")
    parser.add_argument("--audio-model", required=True, help="音频模型")
    parser.add_argument("--text-layer", type=int, required=True, help="文本层")
    parser.add_argument("--audio-layer", type=int, required=True, help="音频层")
    parser.add_argument("--ctx-words", type=int, default=200, help="文本上下文窗口")
    parser.add_argument("--tr-win", type=int, default=2, help="音频TR窗口")
    parser.add_argument("--pca-dim", type=int, default=DEFAULT_PCA_DIM, help="PCA 维度")
    parser.add_argument("--fir-window", type=int, default=DEFAULT_FIR_WINDOW, help="FIR 窗口")
    parser.add_argument("--fir-offset", type=int, default=DEFAULT_FIR_OFFSET, help="FIR 偏移")
    parser.add_argument("--save-corr-map", action="store_true", help="保存皮层相关图")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    fmris = load_fmri()
    df = load_align_df()
    n_trs = fmris[75].shape[0]

    text_dir = RESULTS_ROOT / "text" / safe_name(args.text_model) / f"win{args.ctx_words}" / "features"
    audio_dir = RESULTS_ROOT / "audio" / safe_name(args.audio_model) / f"{args.tr_win}TR" / "features"

    text_file = text_dir / f"text_{safe_name(args.text_model)}_win{args.ctx_words}_layer{args.text_layer}_features.npy"
    audio_file = audio_dir / f"audio_{safe_name(args.audio_model)}_win{args.tr_win}TR_layer{args.audio_layer}_features.npy"

    if not text_file.exists() or not audio_file.exists():
        raise FileNotFoundError("缺少特征文件，请先运行文本与音频特征提取脚本。")

    text_features = np.load(text_file)
    audio_features = np.load(audio_file)

    text_tr = align_word_features_to_tr(df, text_features, n_trs, pooling="mean")

    scaler_text = StandardScaler()
    scaler_audio = StandardScaler()
    text_std = scaler_text.fit_transform(text_tr)
    audio_std = scaler_audio.fit_transform(audio_features)

    fused = np.concatenate([text_std, audio_std], axis=1)
    if args.pca_dim and args.pca_dim < fused.shape[1]:
        pca = PCA(n_components=args.pca_dim)
        fused = pca.fit_transform(fused)

    fir = build_fir(fused, window=args.fir_window, offset=args.fir_offset)
    corr_means, corr_map = run_cv_multi_subjects(
        X=fir,
        fmris=fmris,
        subjects=SUBJECTS,
        excluded_start=10,
        excluded_end=10,
        alphas=DEFAULT_ALPHAS,
        kfold=DEFAULT_KFOLD,
    )

    out_dir = RESULTS_ROOT / "fusion" / f"{safe_name(args.text_model)}__{safe_name(args.audio_model)}"
    out_dir.mkdir(parents=True, exist_ok=True)
    log_path = out_dir / "log.txt"
    stats = summarize(corr_means)
    append_log(log_path, layer=0, stats=stats)
    np.save(out_dir / "corr.npy", corr_map)

    if args.save_corr_map:
        save_corr_map(corr_map, atlas_root=ATLAS_ROOT, out_file=out_dir / "corr.png")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
