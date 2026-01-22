#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path
import sys
import numpy as np
import pandas as pd

# 确保优先使用当前仓库的 src，而不是全局安装的同名包
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.config import ATLAS_ROOT
from src.utils import extract_hemi_data_from_files


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="ROI-level preference analysis")
    parser.add_argument("--corr-map", type=str, default=None, help="corr_map .npy 文件")
    parser.add_argument("--input-dir", type=str, default=None, help="包含 corr_layer*.npy 的目录")
    parser.add_argument("--out", type=str, default="results/roi.csv", help="输出 CSV")
    return parser.parse_args()


def load_rois(atlas_root: Path) -> np.ndarray:
    tpl_files = list(atlas_root.glob("*MMP*gii"))
    if not tpl_files:
        raise FileNotFoundError("Missing atlas GIFTI files in data/atlas")
    return extract_hemi_data_from_files(tpl_files, is_label=True, return_list=False).astype(int)


def roi_summary(corr_map: np.ndarray, rois: np.ndarray) -> pd.DataFrame:
    rows = []
    for roi_ind in np.unique(rois[rois != 0]):
        roi_val = corr_map[roi_ind - 1]
        rows.append({"roi": int(roi_ind), "corr": float(roi_val)})
    return pd.DataFrame(rows)


def main() -> int:
    args = parse_args()
    rois = load_rois(ATLAS_ROOT)

    outputs = []
    sources: list[Path] = []

    if args.corr_map:
        sources.append(Path(args.corr_map))
    if args.input_dir:
        sources.extend(Path(args.input_dir).glob("corr_layer*.npy"))
    if not sources:
        sources.extend(Path("results").rglob("corr_layer*.npy"))

    for path in sources:
        if not path.exists():
            continue
        print(f"[roi] processing: {path}", flush=True)
        corr_map = np.load(path)
        df = roi_summary(corr_map, rois)
        df["source"] = path.as_posix()
        outputs.append(df)

    if not outputs:
        raise ValueError("未找到 corr_layer*.npy")

    out_df = pd.concat(outputs, ignore_index=True)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_df.to_csv(out_path, index=False)
    print(f"已保存 ROI 统计: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
