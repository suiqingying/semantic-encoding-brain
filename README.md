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
2. 运行 `notebooks/assignment.ipynb`。

## 文件内容速览
- `notebooks/assignment.ipynb` 示例流程（读取 fMRI、提取特征、岭回归、可视化）。
- `src/utils.py` 特征提取、延迟拼接、交叉验证等工具函数。
- `data/atlas/` MMP 皮层分区标签。
- `docs/task.txt` 实验任务清单。
- `docs/基于编码模型解析大脑的语义加工机制.pdf` 项目背景材料。
