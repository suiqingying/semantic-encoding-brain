from __future__ import annotations

import csv
from pathlib import Path

import matplotlib
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
from matplotlib import font_manager

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
    fig.savefig(figures_dir / "accuracy_bar.pdf", facecolor="white", bbox_inches="tight")
    fig.savefig(figures_dir / "accuracy_bar.png", facecolor="white", bbox_inches="tight")
    plt.close(fig)


def _save_fig(fig: plt.Figure, figures_dir: Path, name: str) -> None:
    figures_dir.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    fig.savefig(figures_dir / f"{name}.pdf", facecolor="white", bbox_inches="tight")
    fig.savefig(figures_dir / f"{name}.png", facecolor="white", bbox_inches="tight")
    plt.close(fig)


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
