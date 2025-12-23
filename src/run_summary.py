#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path
import re

import pandas as pd

from src.config import RESULTS_ROOT


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Summarize log files to CSV")
    parser.add_argument("--out", type=str, default="results/summary.csv", help="输出CSV路径")
    return parser.parse_args()


def parse_log(path: Path) -> list[dict]:
    entries = []
    current = {"log": path.as_posix()}
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("layer="):
            if "layer" in current:
                entries.append(current)
                current = {"log": path.as_posix()}
            current["layer"] = int(line.split("=")[1].split(",")[0])
        elif line.startswith("平均值"):
            m = re.search(r"平均值: ([0-9.]+) ± ([0-9.]+)", line)
            if m:
                current["mean"] = float(m.group(1))
                current["std"] = float(m.group(2))
        elif line.startswith("范围"):
            m = re.search(r"\[([0-9.]+), ([0-9.]+)\]", line)
            if m:
                current["min"] = float(m.group(1))
                current["max"] = float(m.group(2))
        elif line.startswith("中位数"):
            m = re.search(r"中位数: ([0-9.]+)", line)
            if m:
                current["median"] = float(m.group(1))
    if "layer" in current:
        entries.append(current)
    return entries


def main() -> int:
    args = parse_args()
    log_files = list(RESULTS_ROOT.rglob("log.txt"))
    rows = []
    for log_path in log_files:
        rows.extend(parse_log(log_path))

    if not rows:
        print("未找到日志文件。")
        return 1

    df = pd.DataFrame(rows)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_path, index=False)
    print(f"已生成汇总: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
