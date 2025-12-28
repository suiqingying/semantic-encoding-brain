# 语义解码与大脑编码模型演示系统 (Semantic Encoding Brain Presentation)

这是一个基于 **React + Vite + Tauri** 构建的高性能交互式演示系统，专为展示“多模态预训练模型的全脑语义映射”研究成果而设计。

本项目摒弃了传统的静态 PPT 模式，采用代码生成的动态可视化组件，提供沉浸式的演示体验。

## 核心特性 (已完成页面)

### Slide 01: 沉浸式封面
*   **粒子大脑系统**: 由 5000+ 个动态粒子构成的 3D 大脑轮廓。
*   **交互物理**: 全局鼠标追踪与局部排斥力场，赋予封面生命感。

### Slide 02: 建模框架
*   **实时波形渲染**: 基于直接 DOM 操作的高性能波形动画，模拟 fMRI 信号分解过程。

### Slide 03: 理论基础
*   **核心概念梳理**: 梳理语义编码与脑区表征的关键假设与推导。

### Slide 04: 深度数据集介绍
*   **The 21st Year**: 展示 Narratives 数据集的来源、刺激详情及 fMRI 参数。
*   **交互可视化**: 包含镜像柱状声波图和可滑动的长文本叙述区域。

### Slide 05: 特征提取器
*   **极简主义设计**: 采用无容器开放式布局，配合 Nord 风格分割线，展示跨模态模型库（GPT-2, Wav2Vec, Whisper 等）。

### Slide 06: 语义特征工程
*   **时间轴叙事**: Typing / Lock-on / Extraction / Deposition 四阶段动态演示语义窗口处理流程。
*   **过程可视化**: 打字输入、窗口锁定、粒子提取、特征沉积完整闭环。

### Slide 07: 声学特征提取
*   **扫描与生成动画**: 展示“滑动窗口”扫过声波并实时生成特征矩阵的完整动态过程。
*   **模式切换**: 支持快捷键 (`1`, `2`, `3`, `V`) 实时切换演示、环境声或麦克风信号。

### Slide 08: 文本预测结果
*   **文本回归对比**: 展示语义特征在皮层预测中的表现与误差分布。

### Slide 09: 声音预测结果
*   **音频回归对比**: 展示声学特征对脑响应的解释力与区域差异。

### Slide 10: 层级分析
*   **层级贡献**: 分析不同层级表征的拟合贡献与最优层。

### Slide 11: 功能偏好
*   **偏好对比**: 对比语义/声学特征在不同脑区的功能偏好。

### Slide 12: 语义地图
*   **空间映射**: 以投影方式展示语义特征在皮层上的空间分布。

### Slide 13: 声学地图
*   **空间映射**: 以投影方式展示声学特征在皮层上的空间分布。

### Slide 18: 总结
*   **结论回顾**: 汇总贡献、结论与后续方向。

### Slide 19: 融合展望
*   **多模态融合**: 汇聚语义与声学的融合思路与应用方向。

### Slide 15: 终极致谢 (Digital Life)
*   **液态粒子交互**: “THANK YOU”由 20,000 个粒子物理构成，支持鼠标实时“拨弄”，产生液态涟漪与颜色偏移。
*   **丰富视觉背景**: 包含动态几何巨构、流动的数据字符流、以及电影级的虚化光斑（Bokeh），彻底解决背景空洞问题。
*   **极致清晰度**: 采用边缘优先采样算法，确保致谢信息在全屏下依然锐利清晰。

---

## 快速开始

### 开发环境
```bash
npm install
npm run dev
```

### 桌面应用 (Tauri)
```bash
npm run tauri:dev
npm run tauri:build
```

## 演示控制
*   **切换幻灯片**: `→` / `Space` / `Enter` 下一页；`←` 上一页。
*   **全屏/退出**: `F11` / `Esc`
*   **关闭应用**: `Ctrl + Q` 或 `Alt + F4`

## 目录结构 (精简版)

```
src/
├── slides/                      # 幻灯片组件
│   ├── Slide01Cover.jsx         # 封面
│   ├── Slide02Methodology.jsx   # 建模框架
│   ├── Slide03Theory.jsx        # 理论基础
│   ├── Slide04Dataset.jsx       # 数据集
│   ├── Slide05FeatureIntro.jsx  # 特征库
│   ├── Slide06SemanticFeature.jsx # 语义特征工程
│   ├── Slide07AcousticFeature.jsx # 声学提取动画
│   ├── Slide08TextResults.jsx   # 文本结果
│   ├── Slide09AudioResults.jsx  # 音频结果
│   ├── Slide10LayerAnalysis.jsx # 层级分析
│   ├── Slide11FunctionalPreference.jsx # 功能偏好
│   ├── Slide12SemanticMap.jsx   # 语义地图
│   ├── Slide13AcousticMap.jsx   # 声学地图
│   ├── Slide18Summary.jsx       # 总结
│   ├── Slide19Fusion.jsx        # 融合展望
│   └── Slide15Thanks.jsx        # 终极致谢页
├── styles.css                   # 全局样式
└── App.jsx                      # 核心控制器
```

## 技术栈
*   **Visuals**: Canvas API (Slide 1, 4, 15), SVG Direct Manipulation (Slide 2)
*   **Framework**: React 18, Vite, Tauri 2.0
*   **Theme**: Nord Color Palette
