#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import re
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


def _safe_out_stem(path: Path) -> str:
    parts = list(path.parts)
    if "results" in parts:
        idx = parts.index("results")
        rel = parts[idx + 1 :]
        stem = "_".join([p.replace("-", "-") for p in rel]).replace(".npy", "")
        return stem.replace("corr_layer", "corr_layer")
    return path.stem


def _make_montage(image_paths: list[Path], titles: list[str], out_file: Path) -> None:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.image as mpimg

    out_file.parent.mkdir(parents=True, exist_ok=True)
    n = len(image_paths)
    if n == 0:
        return
    fig, axes = plt.subplots(n, 1, figsize=(12, 4.2 * n), dpi=180)
    if n == 1:
        axes = [axes]
    for ax, img_path, title in zip(axes, image_paths, titles):
        img = mpimg.imread(img_path.as_posix())
        ax.imshow(img)
        ax.set_title(title, fontsize=12)
        ax.axis("off")
    fig.tight_layout()
    fig.savefig(out_file.as_posix(), facecolor="white", bbox_inches="tight")
    plt.close(fig)


def _localize_summary_log_path(log_path: str) -> Path | None:
    """
    summary.csv may contain absolute paths from another machine (e.g. /root/.../results/...).
    Convert it to a local Path under ./results when possible.
    """
    if not log_path:
        return None

    p = log_path.replace("\\", "/")
    # Prefer suffix after "/results/"
    m = re.search(r"/results/(.+)$", p)
    if m:
        return Path("results") / Path(m.group(1))

    # Or if it already contains "results/"
    m = re.search(r"(^|/)results/(.+)$", p)
    if m:
        return Path("results") / Path(m.group(2))

    return None


def _read_encoding_summary(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def _parse_group_and_setting(log_rel: str) -> tuple[str | None, str | None, str | None]:
    """
    Returns (group, model, setting) where setting is like "win200" or "6TR".
    """
    if "/text/" in log_rel:
        m = re.search(r"/text/([^/]+)/win(\d+)/", log_rel)
        if m:
            return "text", m.group(1), f"win{m.group(2)}"
    if "/audio/" in log_rel:
        m = re.search(r"/audio/([^/]+)/(\d+)TR/", log_rel)
        if m:
            return "audio", m.group(1), f"{m.group(2)}TR"
    if "/multimodal/" in log_rel:
        m = re.search(r"/multimodal/([^/]+)/(\d+)TR/", log_rel)
        if m:
            return "multimodal", m.group(1), f"{m.group(2)}TR"
    return None, None, None


def _pick_representative_corr_maps(limit_per_group: int = 9) -> list[tuple[Path, str]]:
    """
    Pick a "rich enough" set of representative corr maps based on results/summary.csv.
    Returns list of (corr_path, title).
    """
    rows = _read_encoding_summary(Path("results/summary.csv"))
    if not rows:
        return []

    parsed: list[tuple[str, str, str, int, float, Path]] = []
    for row in rows:
        log = row.get("log", "")
        local_log = _localize_summary_log_path(log)
        if local_log is None:
            continue
        group, model, setting = _parse_group_and_setting(local_log.as_posix())
        if not group or not model or not setting:
            continue
        try:
            layer = int(float(row.get("layer", "nan")))
            mean_val = float(row.get("mean", "nan"))
        except ValueError:
            continue
        if mean_val != mean_val:
            continue
        corr_path = local_log.parent / f"corr_layer{layer}.npy"
        if not corr_path.exists():
            continue
        parsed.append((group, model, setting, layer, mean_val, corr_path))

    picks: list[tuple[Path, str]] = []
    for group in ("text", "audio", "multimodal"):
        group_rows = [r for r in parsed if r[0] == group]
        if not group_rows:
            continue

        # Best per model
        best_per_model: dict[str, tuple[str, str, str, int, float, Path]] = {}
        for r in group_rows:
            model = r[1]
            if (model not in best_per_model) or (r[4] > best_per_model[model][4]):
                best_per_model[model] = r

        # Top overall (adds extra variety: different window/setting/layer)
        top_overall = sorted(group_rows, key=lambda x: x[4], reverse=True)[: max(3, min(12, limit_per_group))]

        chosen = list(best_per_model.values()) + top_overall
        # De-dup by corr path
        seen: set[str] = set()
        chosen_unique: list[tuple[str, str, str, int, float, Path]] = []
        for r in chosen:
            k = r[5].as_posix()
            if k in seen:
                continue
            seen.add(k)
            chosen_unique.append(r)

        # Cap count per group
        chosen_unique = sorted(chosen_unique, key=lambda x: x[4], reverse=True)[:limit_per_group]

        for _, model, setting, layer, mean_val, corr_path in chosen_unique:
            title = f"{group}:{model} {setting} layer{layer} mean={mean_val:.4f}"
            picks.append((corr_path, title))

    # Add a few best fusion maps if present (not in summary.csv)
    fusion_logs = list(Path("results/fusion").rglob("log.txt"))
    fusion_best: list[tuple[float, str, Path]] = []  # mean, title, corr_path
    for lp in fusion_logs:
        try:
            lines = lp.read_text(encoding="utf-8").splitlines()
        except OSError:
            continue
        meta = ""
        tag = ""
        mean_val = None
        for line in lines:
            if line.startswith("text_model="):
                meta = line.strip()
                tag = ""
                mean_val = None
            elif line.startswith("层标记:"):
                tag = line.split(":", 1)[1].strip()
            elif line.startswith("平均值:"):
                m = re.search(r"平均值: ([0-9.\-]+) ± ([0-9.\-]+)", line)
                if m:
                    try:
                        mean_val = float(m.group(1))
                    except ValueError:
                        mean_val = None
            elif line.startswith("中位数:"):
                if mean_val is not None and tag:
                    corr_path = lp.parent / f"corr_{tag}.npy"
                    if corr_path.exists():
                        title = f"fusion:{lp.parent.name} {tag} mean={mean_val:.4f}"
                        fusion_best.append((mean_val, title, corr_path))
                meta = ""
                tag = ""
                mean_val = None

    if fusion_best:
        fusion_best = sorted(fusion_best, key=lambda x: x[0], reverse=True)[:6]
        for _, title, corr_path in fusion_best:
            picks.append((corr_path, title))

    return picks


def main() -> int:
    args = parse_args()
    paths: list[Path] = []
    if args.input:
        paths.append(Path(args.input))
    if args.input_dir:
        paths.extend(Path(args.input_dir).glob(args.pattern))
    if not paths:
        # 默认：根据 results/summary.csv 动态选取足够多的代表性 corr map（避免参数）
        reps = _pick_representative_corr_maps(limit_per_group=9)
        if reps:
            paths.extend([p for p, _ in reps])
        if not paths:
            raise ValueError("必须提供 --input 或 --input-dir，且未能从 results/summary.csv 选取代表性结果。")

    saved_pngs: list[Path] = []
    title_by_path: dict[str, str] = {}
    png_title: dict[str, str] = {}
    if args.input is None and args.input_dir is None:
        reps = _pick_representative_corr_maps(limit_per_group=9)
        title_by_path = {p.as_posix(): t for p, t in reps}

    for path in paths:
        corr_map = np.load(path)
        # When running with defaults (no input/input-dir), put outputs in the report folder,
        # so the report can include them without copying.
        if args.input is None and args.input_dir is None:
            out_dir = Path(args.out_dir) if args.out_dir else Path("report/figures/brainmaps")
        else:
            out_dir = Path(args.out_dir) if args.out_dir else path.parent
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"{_safe_out_stem(path)}.png"
        save_corr_map(corr_map, atlas_root=ATLAS_ROOT, out_file=out_path)
        saved_pngs.append(out_path)
        png_title[out_path.as_posix()] = title_by_path.get(path.as_posix(), out_path.stem)
        print(f"saved: {out_path}")

    # When using defaults, also output a montage for the class comparison.
    if args.input is None and args.input_dir is None:
        out_dir = Path(args.out_dir) if args.out_dir else Path("report/figures/brainmaps")
        # Build montages from the newly generated images (grouped by out stem prefix).
        def pick_group(prefix: str, max_n: int) -> list[Path]:
            ps = [p for p in saved_pngs if p.name.startswith(prefix)]
            return ps[:max_n]

        # Ensure "class" montages show multiple models/settings if available.
        text_imgs = pick_group("text_", 9)
        if text_imgs:
            _make_montage(
                text_imgs,
                [png_title.get(p.as_posix(), p.stem) for p in text_imgs],
                out_dir / "text_class_montage.png",
            )

        audio_imgs = pick_group("audio_", 9)
        if audio_imgs:
            _make_montage(
                audio_imgs,
                [png_title.get(p.as_posix(), p.stem) for p in audio_imgs],
                out_dir / "audio_class_montage.png",
            )

        multimodal_imgs = pick_group("multimodal_", 9)
        if multimodal_imgs:
            _make_montage(
                multimodal_imgs,
                [png_title.get(p.as_posix(), p.stem) for p in multimodal_imgs],
                out_dir / "multimodal_class_montage.png",
            )

        fusion_imgs = pick_group("fusion_", 9)
        if fusion_imgs:
            _make_montage(
                fusion_imgs,
                [png_title.get(p.as_posix(), p.stem) for p in fusion_imgs],
                out_dir / "fusion_montage.png",
            )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
