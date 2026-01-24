from __future__ import annotations

import csv
from pathlib import Path

import matplotlib
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
from matplotlib import font_manager
import numpy as np

matplotlib.use("Agg")

# Nord palette (consistent with generate_figures.py)
NORD = {
    "blue": "#5E81AC",
    "cyan": "#88C0D0",
    "teal": "#8FBCBB",
    "green": "#A3BE8C",
    "orange": "#D08770",
    "red": "#BF616A",
    "purple": "#B48EAD",
    "dark": "#2E3440",
    "gray": "#4C566A",
    "light": "#ECEFF4",
    "snow": "#D8DEE9",
}


def _pick_cjk_font() -> str | None:
    preferred = ["SimHei", "Microsoft YaHei", "Noto Sans CJK SC", "PingFang SC"]
    available = {f.name for f in font_manager.fontManager.ttflist}
    return next((name for name in preferred if name in available), None)


def _set_plot_style() -> bool:
    chosen = _pick_cjk_font()
    if chosen:
        matplotlib.rcParams["font.sans-serif"] = [chosen, "DejaVu Sans"]
        matplotlib.rcParams["axes.unicode_minus"] = False
    return chosen is not None


def _read_summary(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        raise RuntimeError(f"empty csv: {path}")
    row = rows[0]
    return {
        "model": row["model"],
        "tool_accuracy": float(row["tool_accuracy"]),
        "answer_accuracy": float(row["answer_accuracy"]),
    }


def _read_encoding_summary(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def make_accuracy_bar(reports_dir: Path, figures_dir: Path) -> None:
    base = _read_summary(reports_dir / "summary-course_toolbench_20.csv")
    complex_ = _read_summary(reports_dir / "summary-course_toolbench_complex.csv")

    has_cjk = _set_plot_style()
    labels = ["基础集", "复杂集"] if has_cjk else ["base", "complex"]
    title = (
        "CourseToolBench：工具正确率与答案正确率"
        if has_cjk
        else "CourseToolBench: tool_accuracy vs answer_accuracy"
    )

    tool_acc = [base["tool_accuracy"], complex_["tool_accuracy"]]
    ans_acc = [base["answer_accuracy"], complex_["answer_accuracy"]]

    plt.rcParams.update(
        {
            "font.size": 11,
            "axes.titlesize": 12,
            "axes.labelsize": 11,
            "figure.dpi": 200,
        }
    )

    fig, ax = plt.subplots(figsize=(8.6, 4.2))
    ax.set_facecolor("white")

    x = list(range(len(labels)))
    width = 0.34
    bars_tool = ax.bar(
        [i - width / 2 for i in x],
        tool_acc,
        width=width,
        color=NORD["blue"],
        alpha=0.85,
        label="tool_accuracy",
        edgecolor=NORD["snow"],
        linewidth=1.0,
    )
    bars_ans = ax.bar(
        [i + width / 2 for i in x],
        ans_acc,
        width=width,
        color=NORD["teal"],
        alpha=0.85,
        label="answer_accuracy",
        edgecolor=NORD["snow"],
        linewidth=1.0,
    )

    ax.set_xticks(x, labels)
    ax.set_ylim(0.0, 1.12)
    ax.set_ylabel("Accuracy", color=NORD["dark"])
    ax.set_title(title, fontweight="bold", color=NORD["dark"])
    ax.grid(axis="y", alpha=0.25, linestyle="--")
    ax.legend(loc="lower right", frameon=False)

    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(NORD["snow"])
    ax.spines["bottom"].set_color(NORD["snow"])

    ax.bar_label(bars_tool, labels=[f"{v:.3f}" for v in tool_acc], padding=4, color=NORD["dark"], fontsize=10)
    ax.bar_label(bars_ans, labels=[f"{v:.3f}" for v in ans_acc], padding=4, color=NORD["dark"], fontsize=10)

    figures_dir.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    fig.savefig(figures_dir / "accuracy_bar.png", facecolor="white", bbox_inches="tight")
    plt.close(fig)


def _save_fig(fig: plt.Figure, figures_dir: Path, name: str) -> None:
    figures_dir.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    fig.savefig(figures_dir / f"{name}.png", facecolor="white", bbox_inches="tight")
    plt.close(fig)


def _pick_best_by_group(rows: list[dict], group: str) -> list[tuple[str, float]]:
    best: dict[str, float] = {}
    for row in rows:
        log = row.get("log", "")
        if f"/{group}/" not in log:
            continue
        try:
            mean_val = float(row.get("mean", "nan"))
        except ValueError:
            continue
        if mean_val != mean_val:
            continue
        model_key = log.split(f"/{group}/")[1].split("/")[0]
        best[model_key] = max(best.get(model_key, float("-inf")), mean_val)
    return sorted(best.items(), key=lambda kv: -kv[1])


def make_encoding_best_bars(summary_csv: Path, figures_dir: Path) -> None:
    rows = _read_encoding_summary(summary_csv)
    has_cjk = _set_plot_style()

    plt.rcParams.update(
        {
            "font.size": 11,
            "axes.titlesize": 12,
            "axes.labelsize": 11,
            "figure.dpi": 200,
        }
    )

    specs = [
        ("text", "文本模型最佳层（全脑均值相关）", "Text models: best layer (mean corr)", "text_best"),
        ("audio", "音频模型最佳层（全脑均值相关）", "Audio models: best layer (mean corr)", "audio_best"),
        ("multimodal", "多模态模型最佳层（全脑均值相关）", "Multimodal models: best layer (mean corr)", "multimodal_best"),
    ]
    for group, title_cn, title_en, out_name in specs:
        pairs = _pick_best_by_group(rows, group)
        if not pairs:
            continue
        labels = [p[0] for p in pairs]
        vals = [p[1] for p in pairs]
        colors = [NORD["blue"], NORD["teal"], NORD["orange"], NORD["purple"], NORD["green"]] * 10
        fig, ax = plt.subplots(figsize=(9.0, 4.2))
        bars = ax.bar(
            labels,
            vals,
            color=colors[: len(labels)],
            alpha=0.88,
            edgecolor=NORD["snow"],
            linewidth=1.0,
        )
        ax.set_ylabel("相关系数" if has_cjk else "Correlation")
        ax.set_title(title_cn if has_cjk else title_en, fontweight="bold", color=NORD["dark"])
        ax.grid(axis="y", alpha=0.25, linestyle="--")
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.bar_label(bars, labels=[f"{v:.3f}" for v in vals], padding=3, color=NORD["dark"], fontsize=9)
        _save_fig(fig, figures_dir, out_name)


def make_roi_top_bars(roi_csv: Path, figures_dir: Path) -> None:
    if not roi_csv.exists():
        return
    import pandas as pd

    has_cjk = _set_plot_style()
    roi = pd.read_csv(roi_csv)

    def plot(substring: str, name: str, title: str) -> None:
        df = roi[roi["source"].astype(str).str.contains(substring)]
        if df.empty:
            return
        top = df.groupby("roi")["corr"].mean().sort_values(ascending=False).head(20)
        fig, ax = plt.subplots(figsize=(9.0, 4.2))
        top.plot(kind="bar", ax=ax, color=NORD["blue"], alpha=0.88, edgecolor=NORD["snow"], linewidth=0.8)
        ax.set_ylabel("相关系数" if has_cjk else "Correlation")
        ax.set_title(title, fontweight="bold", color=NORD["dark"])
        ax.grid(axis="y", alpha=0.25, linestyle="--")
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        _save_fig(fig, figures_dir, name)

    plot("results/audio/microsoft_wavlm-base-plus/6TR/corr_layer9.npy", "roi_wavlm6tr_l9", "ROI Top20: WavLM 6TR layer9")
    plot("results/multimodal/openai_whisper-base/6TR/corr_layer2.npy", "roi_whisper6tr_l2", "ROI Top20: Whisper-base 6TR layer2")
    plot("results/text/roberta-base/win200/corr_layer4.npy", "roi_roberta_l4", "ROI Top20: RoBERTa layer4")


def _iter_encoding_rows(rows: list[dict], group: str):
    for row in rows:
        log = row.get("log", "")
        if f"/{group}/" not in log:
            continue
        try:
            mean_val = float(row.get("mean", "nan"))
            layer = int(float(row.get("layer", "nan")))
        except ValueError:
            continue
        if mean_val != mean_val:
            continue
        yield log, layer, mean_val


def make_window_trend(summary_csv: Path, figures_dir: Path) -> None:
    rows = _read_encoding_summary(summary_csv)
    has_cjk = _set_plot_style()
    plt.rcParams.update({"font.size": 11, "axes.titlesize": 12, "axes.labelsize": 11, "figure.dpi": 200})

    def parse_tr(setting: str) -> int | None:
        if setting.endswith("TR"):
            try:
                return int(setting[:-2])
            except ValueError:
                return None
        return None

    for group, out_name, title_cn, title_en in [
        ("audio", "audio_tr_window_trend", "音频模型：不同 TR 窗口的最佳层性能", "Audio: best-layer performance across TR windows"),
        ("multimodal", "multimodal_tr_window_trend", "多模态模型：不同 TR 窗口的最佳层性能", "Multimodal: best-layer performance across TR windows"),
    ]:
        by_model: dict[str, dict[int, float]] = {}
        for log, layer, mean_val in _iter_encoding_rows(rows, group):
            tail = log.split(f"/{group}/")[1]
            model = tail.split("/")[0]
            setting = tail.split("/")[1]  # e.g. 6TR
            tr = parse_tr(setting)
            if tr is None:
                continue
            by_model.setdefault(model, {})
            by_model[model][tr] = max(by_model[model].get(tr, float("-inf")), mean_val)

        if not by_model:
            continue

        trs = sorted({t for m in by_model.values() for t in m.keys()})
        fig, ax = plt.subplots(figsize=(9.0, 4.4))
        colors = [NORD["blue"], NORD["teal"], NORD["orange"], NORD["purple"], NORD["green"]]
        for i, (model, series) in enumerate(sorted(by_model.items())):
            ys = [series.get(t, np.nan) for t in trs]
            ax.plot(trs, ys, marker="o", linewidth=2.0, color=colors[i % len(colors)], label=model)

        ax.set_xlabel("TR window")
        ax.set_ylabel("相关系数" if has_cjk else "Correlation")
        ax.set_title(title_cn if has_cjk else title_en, fontweight="bold", color=NORD["dark"])
        ax.grid(alpha=0.25, linestyle="--")
        ax.legend(frameon=False, ncol=2, fontsize=9)
        _save_fig(fig, figures_dir, out_name)


def make_layer_trend(summary_csv: Path, figures_dir: Path) -> None:
    rows = _read_encoding_summary(summary_csv)
    has_cjk = _set_plot_style()
    plt.rcParams.update({"font.size": 11, "axes.titlesize": 12, "axes.labelsize": 11, "figure.dpi": 200})

    def _iter_rows(group: str, setting_filter: str) -> tuple[str, int, float, float | None]:
        for row in rows:
            log = row.get("log", "")
            if f"/{group}/" not in log:
                continue
            tail = log.split(f"/{group}/", 1)[1]
            parts = tail.split("/")
            if len(parts) < 2:
                continue
            model = parts[0]
            setting = parts[1]
            if setting != setting_filter:
                continue
            try:
                layer = int(float(row.get("layer", "nan")))
                mean_val = float(row.get("mean", "nan"))
            except ValueError:
                continue
            if mean_val != mean_val:
                continue
            std_val: float | None
            try:
                std_raw = row.get("std", "")
                std_val = float(std_raw) if std_raw not in ("", None) else None
            except ValueError:
                std_val = None
            yield model, layer, mean_val, std_val

    def _plot(group: str, setting: str, out_name: str, title_cn: str, title_en: str) -> None:
        by_model: dict[str, dict[int, tuple[float, float | None]]] = {}
        for model, layer, mean_val, std_val in _iter_rows(group, setting):
            prev = by_model.setdefault(model, {}).get(layer)
            if prev is None or mean_val > prev[0]:
                by_model[model][layer] = (mean_val, std_val)

        if not by_model:
            return

        layers = sorted({l for m in by_model.values() for l in m.keys()})
        fig, ax = plt.subplots(figsize=(9.2, 4.8))
        colors = [NORD["blue"], NORD["teal"], NORD["orange"], NORD["purple"], NORD["green"]]

        for i, (model, series) in enumerate(sorted(by_model.items())):
            ys = [series.get(l, (np.nan, None))[0] for l in layers]
            yerr = [series.get(l, (np.nan, None))[1] for l in layers]
            if any(v is not None for v in yerr):
                errs = [v if v is not None else 0.0 for v in yerr]
                ax.errorbar(
                    layers,
                    ys,
                    yerr=errs,
                    marker="o",
                    linewidth=2.0,
                    capsize=2.5,
                    color=colors[i % len(colors)],
                    label=model,
                )
            else:
                ax.plot(
                    layers,
                    ys,
                    marker="o",
                    linewidth=2.0,
                    color=colors[i % len(colors)],
                    label=model,
                )

        ax.set_xlabel("layer")
        ax.set_ylabel("相关系数" if has_cjk else "Correlation")
        ax.set_title(title_cn if has_cjk else title_en, fontweight="bold", color=NORD["dark"])
        ax.grid(alpha=0.25, linestyle="--")
        ax.legend(frameon=False, ncol=2, fontsize=9)
        _save_fig(fig, figures_dir, out_name)

    _plot(
        group="text",
        setting="win200",
        out_name="text_layer_trend_win200",
        title_cn="文本模型：不同层的对齐性能（win200）",
        title_en="Text: layer-wise performance (win200)",
    )
    _plot(
        group="audio",
        setting="6TR",
        out_name="audio_layer_trend_6tr",
        title_cn="音频模型：不同层的对齐性能（6TR）",
        title_en="Audio: layer-wise performance (6TR)",
    )


def _read_fusion_records(fusion_root: Path) -> list[dict]:
    import re

    records: list[dict] = []
    for log_path in fusion_root.rglob("log.txt"):
        try:
            lines = log_path.read_text(encoding="utf-8").splitlines()
        except OSError:
            continue

        meta: dict | None = None
        tag: str | None = None
        mean_val: float | None = None
        std_val: float | None = None
        median_val: float | None = None

        for line in lines:
            if line.startswith("text_model="):
                meta = {"log": log_path.as_posix()}
                # example:
                # text_model=gpt2, audio_model=microsoft/wavlm-base-plus, text_layer=9, audio_layer=9, ctx_words=200, tr_win=1
                parts = [p.strip() for p in line.split(",")]
                for p in parts:
                    if "=" not in p:
                        continue
                    k, v = p.split("=", 1)
                    meta[k.strip()] = v.strip()
                tag = None
                mean_val = None
                std_val = None
                median_val = None
            elif line.startswith("层标记:"):
                tag = line.split(":", 1)[1].strip()
            elif line.startswith("平均值:"):
                m = re.search(r"平均值: ([0-9.\-]+) ± ([0-9.\-]+)", line)
                if m:
                    try:
                        mean_val = float(m.group(1))
                        std_val = float(m.group(2))
                    except ValueError:
                        mean_val = std_val = None
            elif line.startswith("中位数:"):
                m = re.search(r"中位数: ([0-9.\-]+)", line)
                if m:
                    try:
                        median_val = float(m.group(1))
                    except ValueError:
                        median_val = None

                if meta and tag and mean_val is not None:
                    rec = dict(meta)
                    rec["tag"] = tag
                    rec["mean"] = mean_val
                    rec["std"] = std_val
                    rec["median"] = median_val
                    # normalize numeric fields
                    for k in ("text_layer", "audio_layer", "ctx_words", "tr_win"):
                        if k in rec:
                            try:
                                rec[k] = int(float(rec[k]))
                            except ValueError:
                                pass
                    records.append(rec)
                meta = None
                tag = None
                mean_val = None
                std_val = None
                median_val = None

    return records


def make_fusion_figures(figures_dir: Path) -> None:
    import pandas as pd

    # figures_dir = <repo>/report/figures
    fusion_root = figures_dir.parents[1] / "results" / "fusion"
    if not fusion_root.exists():
        return

    recs = _read_fusion_records(fusion_root)
    if not recs:
        return

    has_cjk = _set_plot_style()
    df = pd.DataFrame(recs)

    # 1) Top-k fusion configs
    topk = df.sort_values("mean", ascending=False).head(12).copy()
    if not topk.empty:
        labels = [
            f"{r['text_model']}@{r['text_layer']} + {r['audio_model']}@{r['audio_layer']} (tr{r['tr_win']})"
            for _, r in topk.iterrows()
        ]
        vals = topk["mean"].to_numpy()
        fig, ax = plt.subplots(figsize=(12.0, 5.0))
        bars = ax.bar(range(len(labels)), vals, color=NORD["purple"], alpha=0.88, edgecolor=NORD["snow"], linewidth=0.8)
        ax.set_xticks(range(len(labels)), labels, rotation=30, ha="right")
        ax.set_ylabel("相关系数" if has_cjk else "Correlation")
        ax.set_title("融合：Top12 配置（均值相关）" if has_cjk else "Fusion: Top12 configs (mean corr)", fontweight="bold", color=NORD["dark"])
        ax.grid(axis="y", alpha=0.25, linestyle="--")
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.bar_label(bars, labels=[f"{v:.3f}" for v in vals], padding=3, color=NORD["dark"], fontsize=9)
        _save_fig(fig, figures_dir, "fusion_best")

    # 2) Best performance by TR window (overall best per tr_win)
    if "tr_win" in df.columns:
        by_tr = df.groupby("tr_win")["mean"].max().sort_index()
        if not by_tr.empty:
            trs = by_tr.index.to_list()
            ys = by_tr.to_numpy()
            fig, ax = plt.subplots(figsize=(8.5, 4.4))
            ax.plot(trs, ys, marker="o", linewidth=2.2, color=NORD["teal"])
            ax.set_xlabel("TR window")
            ax.set_ylabel("相关系数" if has_cjk else "Correlation")
            ax.set_title("融合：不同 TR 窗口的最优性能" if has_cjk else "Fusion: best performance across TR windows", fontweight="bold", color=NORD["dark"])
            ax.grid(alpha=0.25, linestyle="--")
            _save_fig(fig, figures_dir, "fusion_tr_window_trend")

    # 3) Heatmap for the globally best pair (best mean across all records)
    best_row = df.sort_values("mean", ascending=False).head(1)
    if not best_row.empty and {"text_model", "audio_model", "tr_win", "ctx_words"}.issubset(df.columns):
        bm = best_row.iloc[0]["text_model"]
        am = best_row.iloc[0]["audio_model"]
        tr = int(best_row.iloc[0]["tr_win"])
        ctx = int(best_row.iloc[0]["ctx_words"])
        sub = df[(df["text_model"] == bm) & (df["audio_model"] == am) & (df["tr_win"] == tr) & (df["ctx_words"] == ctx)]
        if not sub.empty and {"text_layer", "audio_layer"}.issubset(sub.columns):
            pivot = sub.pivot_table(index="text_layer", columns="audio_layer", values="mean", aggfunc="max")
            pivot = pivot.sort_index().sort_index(axis=1)
            mat = pivot.to_numpy()
            fig, ax = plt.subplots(figsize=(7.6, 5.4))
            im = ax.imshow(mat, cmap="viridis", aspect="auto")
            ax.set_xticks(range(pivot.shape[1]), [str(c) for c in pivot.columns])
            ax.set_yticks(range(pivot.shape[0]), [str(r) for r in pivot.index])
            ax.set_xlabel("audio_layer")
            ax.set_ylabel("text_layer")
            title = f"融合热图：{bm}+{am}（ctx={ctx}, tr={tr}）" if has_cjk else f"Fusion heatmap: {bm}+{am} (ctx={ctx}, tr={tr})"
            ax.set_title(title, fontweight="bold", color=NORD["dark"])
            cbar = fig.colorbar(im, ax=ax, shrink=0.85, pad=0.02)
            cbar.set_label("mean corr")
            # annotate values (small)
            for i in range(mat.shape[0]):
                for j in range(mat.shape[1]):
                    v = mat[i, j]
                    if v == v:
                        ax.text(j, i, f"{v:.2f}", ha="center", va="center", fontsize=8, color="white")
            _save_fig(fig, figures_dir, "fusion_heatmap_bestpair")


def make_sentiment_bar(figures_dir: Path) -> None:
    has_cjk = _set_plot_style()
    labels = ["TextCNN", "BERT", "qwen-flash"] if has_cjk else ["TextCNN", "BERT", "qwen-flash"]
    acc = [0.8781, 0.93, 0.8173]

    plt.rcParams.update(
        {
            "font.size": 11,
            "axes.titlesize": 12,
            "axes.labelsize": 11,
            "figure.dpi": 200,
        }
    )

    fig, ax = plt.subplots(figsize=(7.6, 4.2))
    ax.set_facecolor("white")

    bars = ax.bar(
        labels,
        acc,
        color=[NORD["blue"], NORD["teal"], NORD["orange"]],
        alpha=0.85,
        edgecolor=NORD["snow"],
        linewidth=1.0,
    )
    ax.set_ylim(0.0, 1.02)
    ax.set_ylabel("Accuracy", color=NORD["dark"])
    ax.set_title("情感分类：模型准确率对比" if has_cjk else "Sentiment: accuracy comparison", fontweight="bold", color=NORD["dark"])
    ax.grid(axis="y", alpha=0.25, linestyle="--")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(NORD["snow"])
    ax.spines["bottom"].set_color(NORD["snow"])
    ax.bar_label(bars, labels=[f"{v:.3f}" for v in acc], padding=4, color=NORD["dark"], fontsize=10)

    _save_fig(fig, figures_dir, "sentiment_acc")


def make_gsm8k_bar(figures_dir: Path) -> None:
    has_cjk = _set_plot_style()
    labels = ["本地验证", "官方报告"] if has_cjk else ["local", "official"]
    acc = [0.89, 0.9249]

    plt.rcParams.update(
        {
            "font.size": 11,
            "axes.titlesize": 12,
            "axes.labelsize": 11,
            "figure.dpi": 200,
        }
    )

    fig, ax = plt.subplots(figsize=(7.0, 4.0))
    ax.set_facecolor("white")

    bars = ax.bar(
        labels,
        acc,
        color=[NORD["blue"], NORD["teal"]],
        alpha=0.85,
        edgecolor=NORD["snow"],
        linewidth=1.0,
    )
    ax.set_ylim(0.0, 1.02)
    ax.set_ylabel("Accuracy", color=NORD["dark"])
    ax.set_title("GSM8K：准确率对比" if has_cjk else "GSM8K: accuracy comparison", fontweight="bold", color=NORD["dark"])
    ax.grid(axis="y", alpha=0.25, linestyle="--")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(NORD["snow"])
    ax.spines["bottom"].set_color(NORD["snow"])
    ax.bar_label(bars, labels=[f"{v:.3f}" for v in acc], padding=4, color=NORD["dark"], fontsize=10)

    _save_fig(fig, figures_dir, "gsm8k_acc")


def make_ner_bar(figures_dir: Path) -> None:
    has_cjk = _set_plot_style()
    labels = ["BiLSTM-CRF（基线）", "BiLSTM-CRF（优化）", "BERT（预训练）"] if has_cjk else ["BiLSTM-CRF (base)", "BiLSTM-CRF (opt)", "BERT"]
    val_f1 = [0.8864, 0.9040, 0.9633]
    test_f1 = [0.83, 0.8373, 0.9152]

    plt.rcParams.update(
        {
            "font.size": 10,
            "axes.titlesize": 12,
            "axes.labelsize": 10,
            "figure.dpi": 200,
        }
    )

    fig, ax = plt.subplots(figsize=(8.6, 4.4))
    ax.set_facecolor("white")

    x = list(range(len(labels)))
    width = 0.36
    bars_val = ax.bar(
        [i - width / 2 for i in x],
        val_f1,
        width=width,
        color=NORD["blue"],
        alpha=0.85,
        label="验证集F1" if has_cjk else "val F1",
        edgecolor=NORD["snow"],
        linewidth=1.0,
    )
    bars_test = ax.bar(
        [i + width / 2 for i in x],
        test_f1,
        width=width,
        color=NORD["teal"],
        alpha=0.85,
        label="测试集F1" if has_cjk else "test F1",
        edgecolor=NORD["snow"],
        linewidth=1.0,
    )

    ax.set_xticks(x, labels)
    ax.set_ylim(0.0, 1.05)
    ax.set_ylabel("F1", color=NORD["dark"])
    ax.set_title("序列标注：验证/测试 F1 对比" if has_cjk else "NER: validation vs test F1", fontweight="bold", color=NORD["dark"])
    ax.grid(axis="y", alpha=0.25, linestyle="--")
    ax.legend(loc="lower right", frameon=False)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(NORD["snow"])
    ax.spines["bottom"].set_color(NORD["snow"])
    ax.bar_label(bars_val, labels=[f"{v:.3f}" for v in val_f1], padding=3, color=NORD["dark"], fontsize=9)
    ax.bar_label(bars_test, labels=[f"{v:.3f}" for v in test_f1], padding=3, color=NORD["dark"], fontsize=9)

    _save_fig(fig, figures_dir, "ner_f1")


def make_ui_overview(figures_dir: Path) -> None:
    has_cjk = _set_plot_style()
    plt.rcParams.update(
        {
            "font.size": 10,
            "figure.dpi": 200,
        }
    )

    fig, ax = plt.subplots(figsize=(8.6, 4.6))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 60)
    ax.axis("off")
    ax.set_facecolor("#2E3440")

    # Sidebar
    ax.add_patch(plt.Rectangle((2, 4), 10, 52, color="#3B4252", ec="#4C566A", lw=1.0, alpha=0.95))
    for i, y in enumerate([46, 36, 26]):
        ax.add_patch(plt.Circle((7, y), 3.2, color="#5E81AC", alpha=0.9))
    ax.add_patch(plt.Circle((7, 10), 3.2, color="#81A1C1", alpha=0.9))

    # Header block
    ax.add_patch(plt.Rectangle((16, 40), 80, 14, color="#3B4252", ec="#4C566A", lw=1.0, alpha=0.9))
    ax.text(20, 48, "CourseToolBench", color="#ECEFF4", fontsize=13, fontweight="bold", va="center")
    ax.text(20, 43.5, "高级 Agent 工作流环境", color="#D8DEE9", fontsize=9, va="center")

    # Cards
    card_x = [18, 58, 18, 58]
    card_y = [28, 28, 16, 16]
    labels = ["文件系统", "数据分析", "Python 执行", "性能评测"]
    for x, y, label in zip(card_x, card_y, labels):
        ax.add_patch(plt.Rectangle((x, y), 34, 9, color="#434C5E", ec="#4C566A", lw=1.0, alpha=0.95))
        ax.text(x + 3, y + 5.5, label, color="#E5E9F0", fontsize=9, va="center")
        ax.add_patch(plt.Circle((x + 28.5, y + 4.5), 2.2, color="#88C0D0", alpha=0.9))

    # Input bar
    ax.add_patch(plt.Rectangle((16, 6), 80, 7, color="#3B4252", ec="#4C566A", lw=1.0, alpha=0.9))
    ax.text(20, 9.5, "输入命令或发送消息...", color="#D8DEE9", fontsize=8, va="center")
    ax.add_patch(plt.Circle((92, 9.5), 2.2, color="#A3BE8C", alpha=0.9))

    title = "Coursework UI 概览" if has_cjk else "Coursework UI overview"
    ax.text(50, 58, title, color="#ECEFF4", fontsize=11, ha="center", va="center")

    _save_fig(fig, figures_dir, "ui_overview")


def make_ui_flow(figures_dir: Path) -> None:
    has_cjk = _set_plot_style()
    plt.rcParams.update(
        {
            "font.size": 10,
            "figure.dpi": 200,
        }
    )

    fig, ax = plt.subplots(figsize=(8.2, 3.8))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 40)
    ax.axis("off")
    ax.set_facecolor("white")

    nodes = [
        ("前端界面", 6),
        ("API 路由", 28),
        ("Agent 循环", 50),
        ("工具执行", 72),
        ("结果回显", 90),
    ]
    for label, x in nodes:
        ax.add_patch(FancyBboxPatch((x - 6, 18), 12, 8, boxstyle="round,pad=0.4", fc="#E5E9F0", ec="#4C566A", lw=1.0))
        ax.text(x, 22, label if has_cjk else label.encode("ascii", "ignore").decode(), ha="center", va="center", color="#2E3440", fontsize=9)

    for x in [12, 34, 56, 78]:
        ax.annotate("", xy=(x + 6, 22), xytext=(x + 16, 22), arrowprops=dict(arrowstyle="-|>", color="#5E81AC", lw=1.2))

    ax.text(50, 32, "前后端交互流程", ha="center", va="center", fontsize=11, color="#2E3440")
    _save_fig(fig, figures_dir, "ui_flow")


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    figures_dir = repo_root / "report" / "figures"

    encoding_summary = repo_root / "results" / "summary.csv"
    roi_csv = repo_root / "results" / "roi.csv"
    if encoding_summary.exists():
        make_encoding_best_bars(encoding_summary, figures_dir)
        make_roi_top_bars(roi_csv, figures_dir)
        make_window_trend(encoding_summary, figures_dir)
        make_layer_trend(encoding_summary, figures_dir)
        make_fusion_figures(figures_dir)
        return

    # fallback: original demo figures (kept for compatibility)
    root = Path(__file__).resolve().parent.parent  # final_report/
    reports_dir = root.parent / "reports"
    figures_dir = root / "figures"
    make_accuracy_bar(reports_dir, figures_dir)
    make_sentiment_bar(figures_dir)
    make_gsm8k_bar(figures_dir)
    make_ner_bar(figures_dir)
    make_ui_overview(figures_dir)
    make_ui_flow(figures_dir)


if __name__ == "__main__":
    main()
