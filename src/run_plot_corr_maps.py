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


def main() -> int:
    args = parse_args()
    paths: list[Path] = []
    if args.input:
        paths.append(Path(args.input))
    if args.input_dir:
        paths.extend(Path(args.input_dir).glob(args.pattern))
    if not paths:
        # 默认：从 results 里挑选代表性的 corr map 作图（避免参数）
        candidates = [
            # Text
            Path("results/text/roberta-base/win200/corr_layer4.npy"),
            Path("results/text/gpt2/win200/corr_layer12.npy"),
            Path("results/text/bert-base-uncased/win200/corr_layer6.npy"),
            # Audio
            Path("results/audio/microsoft_wavlm-base-plus/6TR/corr_layer9.npy"),
            Path("results/audio/facebook_wav2vec2-base-960h/6TR/corr_layer9.npy"),
            Path("results/audio/facebook_hubert-base-ls960/6TR/corr_layer9.npy"),
            # Multimodal
            Path("results/multimodal/openai_whisper-base/6TR/corr_layer2.npy"),
            Path("results/multimodal/openai_whisper-small/6TR/corr_layer9.npy"),
            Path("results/multimodal/laion_clap-htsat-unfused/6TR/corr_layer1.npy"),
        ]
        paths.extend([p for p in candidates if p.exists()])
        if not paths:
            raise ValueError("必须提供 --input 或 --input-dir，且默认候选均不存在。")

    saved_pngs: list[Path] = []
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
        print(f"saved: {out_path}")

    # When using defaults, also output a montage for the class comparison.
    if args.input is None and args.input_dir is None:
        out_dir = Path(args.out_dir) if args.out_dir else Path("report/figures/brainmaps")
        # Audio class montage (best 6TR baselines)
        audio = [
            out_dir / "audio_microsoft_wavlm-base-plus_6TR_corr_layer9.png",
            out_dir / "audio_facebook_wav2vec2-base-960h_6TR_corr_layer9.png",
            out_dir / "audio_facebook_hubert-base-ls960_6TR_corr_layer9.png",
        ]
        audio = [p for p in audio if p.exists()]
        if audio:
            _make_montage(
                audio,
                ["WavLM 6TR layer9", "Wav2Vec2 6TR layer9", "HuBERT 6TR layer9"],
                out_dir / "audio_class_montage.png",
            )

        # Text class montage (best per model among current runs)
        text = [
            out_dir / "text_roberta-base_win200_corr_layer4.png",
            out_dir / "text_gpt2_win200_corr_layer12.png",
            out_dir / "text_bert-base-uncased_win200_corr_layer6.png",
        ]
        text = [p for p in text if p.exists()]
        if text:
            _make_montage(
                text,
                ["RoBERTa win200 layer4", "GPT2 win200 layer12", "BERT win200 layer6"],
                out_dir / "text_class_montage.png",
            )

        # Multimodal class montage
        multi = [
            out_dir / "multimodal_openai_whisper-base_6TR_corr_layer2.png",
            out_dir / "multimodal_openai_whisper-small_6TR_corr_layer9.png",
            out_dir / "multimodal_laion_clap-htsat-unfused_6TR_corr_layer1.png",
        ]
        multi = [p for p in multi if p.exists()]
        if multi:
            _make_montage(
                multi,
                ["Whisper-base 6TR layer2", "Whisper-small 6TR layer9", "CLAP 6TR layer1"],
                out_dir / "multimodal_class_montage.png",
            )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
