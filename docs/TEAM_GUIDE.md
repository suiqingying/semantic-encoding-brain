# 组内说明文档

本文档用于组内统一协作与运行标准，确保成员可直接运行并回传结果。

## 标准格式
- 目录结构：`data/`、`docs/`、`notebooks/`、`src/`、`results/`
- 输出目录：所有运行结果统一写入 `results/`
- 日志格式：每个任务目录下统一使用 `log.txt`，格式为
  - `layer=<层号>, 多被试结果:`
  - `平均值: <mean> ± <std>`
  - `范围: [<min>, <max>]`
  - `中位数: <median>`
- 特征保存：统一命名 `*_layer{layer}_features.npy`

## 使用方法
按以下步骤执行（不需要改代码）：

### 1) 激活环境（CPU-only）
```bash
cd /home/suiqingying/bio
. .venv/bin/activate
```

### 2) 文本模型（多模型/多层，满足“≥3模型 + 多层”）
```bash
python -m src.run_text_models --models gpt2 --layers 1 3 6 9 12 --ctx-words 200
python -m src.run_text_models --models bert-base-uncased --layers 1 3 6 9 12 --ctx-words 200
python -m src.run_text_models --models qwen2-0.5b --layers 1 3 6 9 12 --ctx-words 200
```

### 3) 音频模型（多模型/多TR/多层，满足“≥3模型 + 多层”）
```bash
python -m src.run_audio_models --models facebook/wav2vec2-base-960h --tr-win 1 2 3 6 9 --layers 1 3 6 9 12
python -m src.run_audio_models --models microsoft/wavlm-base-plus --tr-win 1 2 3 6 9 --layers 1 3 6 9 12
python -m src.run_audio_models --models openai/whisper-small --tr-win 1 2 3 6 9 --layers 1 3 6 9 12
```

### 4) 多模态融合（文本+音频）
```bash
python -m src.run_multimodal_fusion \
  --text-model gpt2 \
  --audio-model microsoft/wavlm-base-plus \
  --text-layer 6 \
  --audio-layer 6 \
  --ctx-words 200 \
  --tr-win 2
```

### 4.1) 多模态模型对比（CLAP、Whisper 等）
```bash
python -m src.run_audio_models --models laion/clap-htsat-unfused --tr-win 1 2 3 --layers 1 3 6 9 12
python -m src.run_audio_models --models laion/clap-htsat-fused --tr-win 1 2 3 --layers 1 3 6 9 12
python -m src.run_audio_models --models openai/whisper-small --tr-win 1 2 3 --layers 1 3 6 9 12
```

### 5) 非线性模型（Kernel Ridge）
先保存对齐特征，再运行非线性模型：
```bash
python -m src.run_text_models --models gpt2 --layers 6 --ctx-words 200 --save-aligned
python -m src.run_nonlinear_model --aligned-features results/text/gpt2/win200/aligned_layer6.npy
```

### 6) 汇总日志
```bash
python -m src.run_summary --out results/summary.csv
```

## 模型与层级说明

### 文本模型（示例默认）
- `gpt2`
- `bert-base-uncased`
- `qwen2-0.5b`

### 音频模型（示例默认）
- `facebook/wav2vec2-base-960h`
- `microsoft/wavlm-base-plus`
- `openai/whisper-small`

### 多模态模型（CLAP、Whisper 等）
- `laion/clap-htsat-unfused`
- `laion/clap-htsat-fused`
- `openai/whisper-small`

### 层级说明
- `--layers` 表示要提取的隐藏层索引（从 0 开始计数，0 为 embedding 层）。
- 示例层列表：`1 3 6 9 12`（统一用于文本/音频，便于对比）。
- `--audio-layer` / `--text-layer` 表示用于建模与统计的单一层。

## 存放位置
- 文本结果：`results/text/<model>/win<ctx>/`
- 音频结果：`results/audio/<model>/<TR>TR/`
- 融合结果：`results/fusion/<text>__<audio>/`
- 非线性结果：`results/nonlinear/`
- 汇总表：`results/summary.csv`

## 已完成的工作
- 已实现文本/音频/融合/非线性/汇总的可执行脚本（在 `src/` 下）。
- 已建立通用模块：配置、数据加载、特征处理、建模、可视化。
- 日志与输出目录规范统一，便于组内汇总。

## 反馈结果
请在运行结束后，将以下文件打包回传：
- 对应任务目录的 `log.txt`
- 主要可视化结果（如 `corr_layer*.png`）
- `results/summary.csv`（若已生成）
