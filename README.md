# bio

用于认知神经科学课程的编码模型实验（文本/音频特征 + 岭回归），包含数据、笔记本与工具代码。

## 目录结构
- `data/raw/` 原始数据（不入库，需自行准备）
- `data/atlas/` 皮层分区/标签文件（GIFTI）
- `docs/` 任务清单与项目背景材料
- `notebooks/` 实验笔记本
- `src/` 工具函数

## 数据说明
请将以下文件放在 `data/raw/` 下（这些文件已被 `.gitignore` 忽略）：
- `21styear_align.csv`
- `21styear_all_subs_rois.npy`
- `21styear_audio.wav`

## 环境与依赖（CPU-only）
本项目按 CPU 环境配置，不依赖 NVIDIA/CUDA。

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -U pip
pip install -r requirements.txt
```

## 快速开始
1. 确保 `data/raw/` 已放入数据文件。
2. 运行脚本（推荐）。

## 文件内容速览
- `notebooks/assignment.ipynb` 示例流程（读取 fMRI、提取特征、岭回归、可视化）。
- `src/run_text_models.py` 文本模型特征提取 + 多被试编码模型。
- `src/run_audio_models.py` 音频模型特征提取 + 多被试编码模型。
- `src/run_multimodal_fusion.py` 文本+音频特征融合编码模型。
- `src/run_nonlinear_model.py` 非线性编码模型（Kernel Ridge）。
- `src/run_summary.py` 汇总日志生成 CSV。
- `src/utils.py` 特征提取、延迟拼接、交叉验证等工具函数。
- `data/atlas/` MMP 皮层分区标签。
- `docs/task.txt` 实验任务清单。
- `docs/基于编码模型解析大脑的语义加工机制.pdf` 项目背景材料。

## 脚本用法示例

文本模型（多模型、多层）：
```bash
python -m src.run_text_models --models gpt2 bert-base-uncased qwen2-0.5b --layers 1 3 6 9 12 --ctx-words 200 --save-corr-map
```

音频模型（多模型、多 TR）：
```bash
python -m src.run_audio_models --models facebook/wav2vec2-base-960h microsoft/wavlm-base-plus openai/whisper-small --tr-win 1 2 3 6 9 --layers 1 3 6 9 12 --save-corr-map
```

多模态融合（文本+音频）：
```bash
python -m src.run_multimodal_fusion --text-model gpt2 --audio-model microsoft/wavlm-base-plus --text-layer 6 --audio-layer 6 --ctx-words 200 --tr-win 2 --save-corr-map
```

非线性模型（需要先保存对齐特征）：
```bash
python -m src.run_text_models --models gpt2 --layers 6 --ctx-words 200 --save-aligned
python -m src.run_nonlinear_model --aligned-features results/text/gpt2/win200/aligned_layer6.npy --kernel rbf --alpha 1.0
```

汇总日志：
```bash
python -m src.run_summary --out results/summary.csv
```
