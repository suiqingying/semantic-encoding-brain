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
# 1) 文本多模型+多层评估
python -m src.run_text_models
# 2) 音频多模型+多层评估（含多 TR 窗口）
python -m src.run_audio_models
# 3) 多模态模型多层评估
python -m src.run_multimodal_models
# 4) 汇总结果，生成 results/summary.csv
python -m src.run_summary --out results/summary.csv
# 5) 融合：自动读取 summary.csv 中最优文本/音频模型与层
python -m src.run_multimodal_fusion
# 6) 生成 aligned 特征（用于非线性模型）
python -m src.run_text_models --save-aligned
# 7) 非线性模型（需指定 aligned 文件路径）
python -m src.run_nonlinear_model --aligned-features results/text/gpt2/win200/aligned_layer1.npy
# 8) ROI 统计
python -m src.run_roi_analysis --input-dir results/text/gpt2/win200 --out results/roi_text_gpt2.csv
# 9) 重新汇总
python -m src.run_summary --out results/summary.csv
```


## 本地作图
把整个 `results/` 目录拷贝到本地，然后运行：
```bash
python -m src.run_plot_corr_maps --input-dir results --pattern "corr*.npy" --out-dir results/plots
```

## 输出位置
- `results/text/<model>/win200/` 文本模型结果
- `results/audio/<model>/<tr>TR/` 音频模型结果
- `results/multimodal/<model>/<tr>TR/` 多模态模型结果（音频+文本联合特征）
- `results/fusion/` 融合结果
- `results/summary.csv` 汇总表
- `results/roi_*.csv` ROI 统计
