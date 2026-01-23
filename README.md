# semantic-encoding-brain

用于认知神经科学课程的编码模型实验（文本/音频/多模态特征 + 岭回归），包含数据、脚本与工具代码。默认在服务器计算结果，本地再作图。

## Presentation (Slides)
- 在线演示（GitHub Pages）：`https://suiqingying.github.io/semantic-encoding-brain/`
- 本地启动：`cd presentation && npm install && npm run dev`

## 目录结构
- `data/raw/` 原始数据（不入库，需自行准备）
- `data/atlas/` 皮层分区/标签文件（GIFTI）
- `docs/` 任务清单与项目背景材料
- `notebooks/` 实验笔记本
- `src/` 脚本与工具函数
- `results/` 输出结果（模型日志、相关性、特征）

## 数据说明
将以下文件放在 `data/raw/` 下：
- `21styear_align.csv`
- `21styear_all_subs_rois.npy`
- `21styear_audio.wav`

## 依赖安装
项目依赖见 `requirements.txt`。GPU 环境请先安装 CUDA 版 PyTorch，再安装其余依赖。

## 脚本总览
- `src/run_text_models.py` 文本模型特征提取 + 多被试编码模型（默认 gpt2/bert/roberta）
- `src/run_audio_models.py` 音频模型特征提取 + 多被试编码模型（默认 wav2vec2/wavlm/hubert）
- `src/run_multimodal_models.py` 多模态模型特征提取（音频+文本联合）+ 多被试编码模型（默认 whisper/clap）
- `src/run_multimodal_fusion.py` 文本+音频特征融合编码模型
- `src/run_nonlinear_model.py` 非线性编码模型（Kernel Ridge）
- `src/run_roi_analysis.py` ROI 统计（语义偏好性分析）
- `src/run_summary.py` 汇总日志生成 CSV
- `src/run_plot_corr_maps.py` 本地作图（读取 `corr*.npy`）

## 服务器端运行（只计算，不作图）
在项目根目录逐行执行以下命令（每行含义在上一行注释）：
```bash
# 1) 文本多模型+多层评估（默认保存 aligned）
python -m src.run_text_models
# 2) 音频多模型+多层评估（含多 TR 窗口）
python -m src.run_audio_models
# 3) 多模态模型多层评估
python -m src.run_multimodal_models
# 4) 融合（多文本/多音频/多层/多窗口遍历）
python -m src.run_multimodal_fusion
# 5) 非线性模型（自动遍历 results/text/**/aligned_layer*.npy）
python -m src.run_nonlinear_model
# 6) ROI 统计（自动扫描 corr_layer*.npy）
python -m src.run_roi_analysis
# 7) 汇总
python -m src.run_summary --out results/summary.csv
```


## 本地作图
把服务器端生成的整个 `results/` 目录拷贝到本地项目根目录下（本地路径同样为 `results/`），然后在项目根目录逐行运行：
```bash
python report/scripts/make_figures.py
python -m src.run_plot_corr_maps
```
输出位于 `report/figures/` 与 `report/figures/brainmaps/`（最终 PDF：`report/experiment_main.pdf`）。

## 输出位置
- `results/text/<model>/win200/` 文本模型结果
- `results/audio/<model>/<tr>TR/` 音频模型结果
- `results/multimodal/<model>/<tr>TR/` 多模态模型结果（音频+文本联合特征）
- `results/fusion/` 融合结果
- `results/summary.csv` 汇总表
- `results/roi_*.csv` ROI 统计
