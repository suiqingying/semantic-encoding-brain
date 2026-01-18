#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np

from src.config import ATLAS_ROOT
from src.viz import save_corr_map


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Plot corr maps locally from saved .npy")
    parser.add_argument("--input", type=str, default=None, help="单个 corr_map .npy")
    parser.add_argument("--input-dir", type=str, default=None, help="包含 corr_map 的目录")
    parser.add_argument("--pattern", type=str, default="corr*.npy", help="目录匹配模式")
    parser.add_argument("--out-dir", type=str, default=None, help="输出目录")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    paths: list[Path] = []
    if args.input:
        paths.append(Path(args.input))
    if args.input_dir:
        paths.extend(Path(args.input_dir).glob(args.pattern))
    if not paths:
        raise ValueError("必须提供 --input 或 --input-dir")

    for path in paths:
        corr_map = np.load(path)
        out_dir = Path(args.out_dir) if args.out_dir else path.parent
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"{path.stem}.png"
        save_corr_map(corr_map, atlas_root=ATLAS_ROOT, out_file=out_path)
        print(f"saved: {out_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
