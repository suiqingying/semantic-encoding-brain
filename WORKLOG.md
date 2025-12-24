# 工作日志

## 2025-12-23
- 完成任务1前置：确认音频文件 `data/raw/21styear_audio.wav` 已就绪。
- 完成任务1前置：确认 fMRI 数据 `data/raw/21styear_all_subs_rois.npy` 含 25 名被试。
- 完成任务4前置：皮层分区标签已整理在 `data/atlas/`。
- 阶段性产出（音频部分）：整理同伴提交的音频-only 实验笔记本为 `notebooks/archive/demo_audio_only.ipynb`。
- 阶段性产出（音频部分）：归档音频-only 结果图到 `results/audio_only/`（来自同伴提交的结果包）。
- 完成任务代码结构：新增文本/音频/融合/非线性/汇总脚本与通用模块，支持多模型、多层、多被试流程。
- 完成任务5支持：新增 ROI 统计脚本，便于语义偏好性分析。

## 2025-12-24
- 完成文本模型多层结果（ctx=200）：GPT2、BERT、Qwen2-0.5B，结果位于 `results/text/<model>/win200/`。
- 生成文本模型日志与相关图：`results/text/*/win200/log.txt`、`results/text/*/win200/corr_layer*.npy`、`results/text/*/win200/corr_layer*.png`。
- 汇总多模型多层结果到 `results/summary.csv`。
- 生成 ROI 统计：`results/roi_text_gpt2.csv`、`results/roi_text_bert_base_uncased.csv`、`results/roi_text_qwen2_0_5b.csv`。
- 生成模型-层级对比总览图：`results/overview/text_models_layer_compare.png`。
