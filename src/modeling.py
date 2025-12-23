from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
from sklearn.model_selection import KFold

from src.utils import concat_feature, fit_encoding_cv


@dataclass
class SummaryStats:
    mean: float
    std: float
    min: float
    max: float
    median: float


def build_fir(features: np.ndarray, window: int, offset: int) -> np.ndarray:
    fir_features = concat_feature(features, window=window, offset=offset)
    return fir_features.reshape(fir_features.shape[0], -1)


def run_cv_multi_subjects(X: np.ndarray, fmris: dict, subjects: Iterable[int],
                          excluded_start: int, excluded_end: int,
                          alphas: Iterable[float], kfold: int) -> tuple[list[float], np.ndarray]:
    outer_cv = KFold(n_splits=kfold, shuffle=False)
    corr_means: list[float] = []
    last_corr_map = None
    for sub in subjects:
        model, corr_map = fit_encoding_cv(
            X=X,
            y=fmris[sub],
            cv_splitter=outer_cv,
            alphas=alphas,
            excluded_start=excluded_start,
            excluded_end=excluded_end,
        )
        corr_means.append(float(np.mean(corr_map)))
        last_corr_map = corr_map
    return corr_means, last_corr_map


def summarize(corr_means: Iterable[float]) -> SummaryStats:
    arr = np.array(list(corr_means))
    return SummaryStats(
        mean=float(arr.mean()),
        std=float(arr.std()),
        min=float(arr.min()),
        max=float(arr.max()),
        median=float(np.median(arr)),
    )


def append_log(log_path: Path, layer: int, stats: SummaryStats) -> None:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf-8") as f:
        f.write(f"layer={layer}, 多被试结果:\n")
        f.write(f"平均值: {stats.mean:.4f} ± {stats.std:.4f}\n")
        f.write(f"范围: [{stats.min:.4f}, {stats.max:.4f}]\n")
        f.write(f"中位数: {stats.median:.4f}\n\n")
