#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path
import csv
import re

import numpy as np
import torch
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

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
from src.text_pipeline import align_word_features_to_tr
from src.modeling import build_fir, run_cv_multi_subjects, summarize, append_log

def safe_name(model_name: str) -> str:
    return model_name.replace("/", "_")


def pick_best_from_summary(summary_path: Path) -> tuple[str, int, int, str, int, int]:
    best_text = ("", -1, -1, float("-inf"))  # model, layer, ctx_words, mean
    best_audio = ("", -1, -1, float("-inf"))  # model, layer, tr_win, mean

    with summary_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            log_path = row.get("log", "")
            if not log_path:
                continue
            try:
                mean_val = float(row.get("mean", "nan"))
            except ValueError:
                continue
            layer = int(row.get("layer", -1))

            if "/text/" in log_path:
                m = re.search(r"/text/([^/]+)/win(\d+)/", log_path)
                if m and mean_val > best_text[3]:
                    best_text = (m.group(1), layer, int(m.group(2)), mean_val)
            elif "/audio/" in log_path:
                m = re.search(r"/audio/([^/]+)/(\d+)TR/", log_path)
                if m and mean_val > best_audio[3]:
                    best_audio = (m.group(1), layer, int(m.group(2)), mean_val)

    if not best_text[0] or not best_audio[0]:
        raise ValueError("Missing text/audio entries in results/summary.csv.")
    return best_text[0], best_text[1], best_text[2], best_audio[0], best_audio[1], best_audio[2]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Multimodal fusion (text + audio)")
    parser.add_argument(
        "--text-models", nargs="+",
        default=["gpt2", "bert-base-uncased", "roberta-base"],
        help="文本模型列表",
    )
    parser.add_argument(
        "--audio-models", nargs="+",
        default=["facebook/wav2vec2-base-960h", "microsoft/wavlm-base-plus", "facebook/hubert-base-ls960"],
        help="音频模型列表",
    )
    parser.add_argument(
        "--text-layers", nargs="+", type=int,
        default=[1, 3, 6, 9, 12],
        help="文本层列表",
    )
    parser.add_argument(
        "--audio-layers", nargs="+", type=int,
        # 与 run_audio_models 默认层保持一致，避免缺失文件造成 skip
        default=[1, 4, 6, 9, 12],
        help="音频层列表",
    )
    parser.add_argument(
        "--ctx-words", nargs="+", type=int,
        default=[200],
        help="文本上下文窗口列表",
    )
    parser.add_argument(
        "--tr-win", nargs="+", type=int,
        # 与已提取的音频窗口对齐
        default=[1, 2, 3],
        help="音频TR窗口列表",
    )
    parser.add_argument("--pca-dim", type=int, default=DEFAULT_PCA_DIM, help="PCA 维度")
    parser.add_argument("--fir-window", type=int, default=DEFAULT_FIR_WINDOW, help="FIR 窗口")
    parser.add_argument("--fir-offset", type=int, default=DEFAULT_FIR_OFFSET, help="FIR 偏移")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    text_models = args.text_models
    audio_models = args.audio_models
    text_layers = args.text_layers
    audio_layers = args.audio_layers
    ctx_list = args.ctx_words
    tr_win_list = args.tr_win

    fmris = load_fmri()
    df = load_align_df()
    n_trs = fmris[75].shape[0]

    total_planned = (
        len(ctx_list)
        * len(tr_win_list)
        * len(text_models)
        * len(audio_models)
        * len(text_layers)
        * len(audio_layers)
    )
    existing = list((RESULTS_ROOT / "fusion").rglob("corr_t*_a*_ctx*_tr*.npy"))
    print(f"[fusion] planned={total_planned} existing={len(existing)}", flush=True)

    for ctx_words in ctx_list:
        for tr_win in tr_win_list:
            for text_model in text_models:
                for audio_model in audio_models:
                    for text_layer in text_layers:
                        for audio_layer in audio_layers:
                            combo_tag = f"ctx={ctx_words} tr={tr_win} text={text_model}@{text_layer} audio={audio_model}@{audio_layer}"
                            print(f"[fusion] {combo_tag} start", flush=True)

                            text_dir = RESULTS_ROOT / "text" / safe_name(text_model) / f"win{ctx_words}" / "features"
                            audio_dir = RESULTS_ROOT / "audio" / safe_name(audio_model) / f"{tr_win}TR" / "features"

                            text_file = text_dir / f"text_{safe_name(text_model)}_win{ctx_words}_layer{text_layer}_features.npy"
                            audio_file = audio_dir / f"audio_{safe_name(audio_model)}_win{tr_win}TR_layer{audio_layer}_features.npy"

                            out_dir = RESULTS_ROOT / "fusion" / f"{safe_name(text_model)}__{safe_name(audio_model)}"
                            layer_tag = f"t{text_layer}_a{audio_layer}_ctx{ctx_words}_tr{tr_win}"
                            out_corr = out_dir / f"corr_{layer_tag}.npy"
                            if out_corr.exists():
                                print(f"[fusion] skip done: {out_corr}", flush=True)
                                continue

                            if not text_file.exists() or not audio_file.exists():
                                print(f"[fusion] skip missing: {text_file} or {audio_file}", flush=True)
                                continue

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

                            out_dir.mkdir(parents=True, exist_ok=True)
                            log_path = out_dir / "log.txt"
                            stats = summarize(corr_means)
                            with log_path.open("a", encoding="utf-8") as f:
                                f.write(f"text_model={text_model}, audio_model={audio_model}, text_layer={text_layer}, audio_layer={audio_layer}, ctx_words={ctx_words}, tr_win={tr_win}\n")
                                f.write(f"层标记: {layer_tag}\n")
                                f.write(f"平均值: {stats.mean:.4f} ± {stats.std:.4f}\n")
                                f.write(f"范围: [{stats.min:.4f}, {stats.max:.4f}]\n")
                                f.write(f"中位数: {stats.median:.4f}\n\n")
                            np.save(out_corr, corr_map)
                            print(f"[fusion] {combo_tag} done", flush=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
