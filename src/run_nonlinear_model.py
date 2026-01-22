#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path
from glob import glob

import numpy as np
from sklearn.kernel_ridge import KernelRidge
from sklearn.model_selection import KFold

from src.config import DEFAULT_FIR_WINDOW, DEFAULT_FIR_OFFSET, DEFAULT_KFOLD, SUBJECTS
from src.data import load_fmri
from src.modeling import build_fir
from src.utils import corr_with_np


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Non-linear encoding model (Kernel Ridge)")
    parser.add_argument("--aligned-features", nargs="*", default=None,
                        help="对齐后的TR特征 .npy；留空自动遍历 results/text/**/aligned_layer*.npy")
    parser.add_argument("--alpha", type=float, default=1.0, help="Kernel Ridge alpha")
    parser.add_argument("--kernel", type=str, default="rbf", help="Kernel 类型")
    parser.add_argument("--gamma", type=float, default=None, help="Kernel gamma")
    parser.add_argument("--fir-window", type=int, default=DEFAULT_FIR_WINDOW)
    parser.add_argument("--fir-offset", type=int, default=DEFAULT_FIR_OFFSET)
    parser.add_argument("--out", type=str, default="results/nonlinear/log.txt")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    fmris = load_fmri()
    if args.aligned_features:
        feature_paths = [Path(p) for p in args.aligned_features]
    else:
        feature_paths = [Path(p) for p in glob("results/text/*/win*/aligned_layer*.npy")]
    feature_paths = [p for p in feature_paths if p.exists()]
    if not feature_paths:
        raise FileNotFoundError("未找到 aligned_layer*.npy，请先运行文本特征提取。")

    if DEFAULT_KFOLD <= 1:
        kfold = None  # 单次划分
    else:
        kfold = KFold(n_splits=DEFAULT_KFOLD, shuffle=False)
    excluded_start, excluded_end = 10, 10

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    for feat_path in feature_paths:
        print(f"[nonlinear] features: {feat_path}", flush=True)
        features = np.load(feat_path)
        X = build_fir(features, window=args.fir_window, offset=args.fir_offset)
        X = X[excluded_start:-excluded_end]

        corr_means = []
        for sub in SUBJECTS:
            print(f"[nonlinear] subject start: {sub}", flush=True)
            y = fmris[sub][excluded_start:-excluded_end]
            if kfold is None:
                n = X.shape[0]
                split = int(n * 0.8)
                if split <= 0 or split >= n:
                    raise ValueError("样本量不足以划分训练/测试集。")
                model = KernelRidge(alpha=args.alpha, kernel=args.kernel, gamma=args.gamma)
                model.fit(X[:split], y[:split])
                y_pred = model.predict(X[split:])
                corr = corr_with_np(y_pred, y[split:])
                corr_means.append(float(np.nanmean(corr)))
            else:
                fold_corrs = []
                for train_idx, test_idx in kfold.split(X):
                    model = KernelRidge(alpha=args.alpha, kernel=args.kernel, gamma=args.gamma)
                    model.fit(X[train_idx], y[train_idx])
                    y_pred = model.predict(X[test_idx])
                    corr = corr_with_np(y_pred, y[test_idx])
                    fold_corrs.append(np.nanmean(corr))
                corr_means.append(float(np.mean(fold_corrs)))
            print(f"[nonlinear] subject done: {sub}", flush=True)

        arr = np.array(corr_means)
        with out_path.open("a", encoding="utf-8") as f:
            f.write(f"aligned={feat_path}\n")
            f.write(f"kernel={args.kernel}, alpha={args.alpha}, gamma={args.gamma}\n")
            f.write(f"平均值: {arr.mean():.4f} ± {arr.std():.4f}\n")
            f.write(f"范围: [{arr.min():.4f}, {arr.max():.4f}]\n")
            f.write(f"中位数: {np.median(arr):.4f}\n\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
