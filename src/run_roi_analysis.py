#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path
import numpy as np
import pandas as pd

from src.config import ATLAS_ROOT
from src.utils import extract_hemi_data_from_files


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="ROI-level preference analysis")
    parser.add_argument("--corr-map", type=str, default=None, help="corr_map .npy 文件")
    parser.add_argument("--input-dir", type=str, default=None, help="包含 corr_layer*.npy 的目录")
    parser.add_argument("--out", type=str, required=True, help="输出 CSV")
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
    if args.corr_map:
        corr_map = np.load(args.corr_map)
        df = roi_summary(corr_map, rois)
        df["source"] = Path(args.corr_map).as_posix()
        outputs.append(df)

    if args.input_dir:
        for path in Path(args.input_dir).glob("corr_layer*.npy"):
            corr_map = np.load(path)
            df = roi_summary(corr_map, rois)
            df["source"] = path.as_posix()
            outputs.append(df)

    if not outputs:
        raise ValueError("必须提供 --corr-map 或 --input-dir")

    out_df = pd.concat(outputs, ignore_index=True)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_df.to_csv(out_path, index=False)
    print(f"已保存 ROI 统计: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
