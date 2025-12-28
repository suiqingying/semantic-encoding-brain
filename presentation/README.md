# 语义解码与大脑编码模型演示系统 (Semantic Encoding Brain Presentation)

这是一个基于 **React + Vite + Tauri** 构建的高性能交互式演示系统，专为展示“多模态预训练模型的全脑语义映射”研究成果而设计。

本项目摒弃了传统的静态 PPT 模式，采用代码生成的动态可视化组件，提供沉浸式的演示体验。

## ✨ 核心特性

*   **沉浸式封面 (Slide 1)**:
    *   **粒子大脑系统**: 由 5000+ 个动态粒子构成的 3D 大脑轮廓。
    *   **全局鼠标追踪**: 粒子云随鼠标全屏漂浮，模拟“注视”效果。
    *   **物理交互**: 鼠标悬停产生局部排斥力场，粒子动态避让。
    *   **高对比视觉**: 针对浅色背景优化的深午夜蓝配色与神经脉冲高亮。

*   **动态方法论展示 (Slide 2)**:
    *   **实时波形渲染**: 基于 Canvas 的高性能波形动画，模拟 fMRI 信号与噪声叠加过程。
    *   **高性能架构**: 采用直接 DOM 操作 (Direct DOM Manipulation) 替代 React 状态驱动，消除渲染开销，确保在任何配置下流畅运行。
    *   **响应式布局**: 波形图高度自适应容器，左右分栏自动对齐，完美填充屏幕。

*   **深度数据集介绍 (Slide 4)**:
    *   **Narratives (The 21st Year)**: 详细展示了数据集的来源、刺激详情（The Moth 播客）及 fMRI 参数。
    *   **可视化声波**: 使用镜像柱状图模拟真实音频播放器的视觉效果。
    *   **长文本滚动**: 提供可交互的文本区域，直观展示自然语言叙事的长上下文特性。

*   **全屏自适应设计**:
    *   摒弃固定比例画布，采用 **流式布局 (Fluid Layout)**。
    *   无论是在宽屏显示器还是投影仪上，内容均自动铺满屏幕，无黑色/白色边框。
    *   智能滚动支持：在超小分辨率下自动启用滚动条，防止内容截断。

*   **Nord 设计语言**: 全局统一采用 Nord 极地配色方案，提供专业、冷静且舒适的科研视觉风格。

## 🚀 快速开始

### 开发环境

```bash
# 安装依赖
npm install

# 启动网页预览 (浏览器模式)
npm run dev
```

### 桌面应用 (Tauri)

本项目集成了 Tauri，可打包为独立的本地可执行文件 (.exe)，性能更佳且无浏览器地址栏干扰。

```bash
# 启动桌面开发模式
npm run tauri:dev

# 打包生产环境版本
npm run tauri:build
```

## 🎮 演示控制

*   **切换幻灯片**: `→` (右键) / `Space` (空格) / `Enter` (回车) 下一页；`←` (左键) 上一页。
*   **全屏切换**: `F11`
*   **退出全屏**: `Esc`
*   **关闭应用**: `Ctrl + Q` 或 `Alt + F4`

## 📂 目录结构 (已完成页面)

```
src/
├── slides/                 # 幻灯片页面组件
│   ├── Slide01Cover.jsx        # [完成] 封面（粒子大脑）
│   ├── Slide02Methodology.jsx  # [完成] 建模框架与流程（动态波形）
│   ├── Slide03Theory.jsx       # [待优化] 理论背景
│   ├── Slide04Dataset.jsx      # [完成] 数据集详情（Narratives）
│   ├── Slide05SemanticFeature.jsx # 语义特征提取
│   ├── Slide06AcousticFeature.jsx # 声学特征提取
│   ├── Slide07TextResults.jsx     # 文本模型结果
│   ├── Slide08AudioResults.jsx    # 音频模型结果
│   ├── Slide09LayerAnalysis.jsx   # 层级分析
│   ├── Slide10Windowing.jsx       # 时间窗分析
│   ├── Slide11FunctionalPreference.jsx # 功能偏好
│   ├── Slide12SemanticMap.jsx     # 语义地图可视化
│   ├── Slide13AcousticMap.jsx     # 声学地图可视化
│   ├── Slide14SemanticModel.jsx   # 语义模型详情
│   ├── Slide15AcousticModel.jsx   # 声学模型详情
│   ├── Slide16LayerBest.jsx       # 最佳层级分析
│   ├── Slide17AcousticZoom.jsx    # 声学细节放大
│   ├── Slide18Summary.jsx         # 总结
│   ├── Slide19Fusion.jsx          # 多模态融合展望
│   └── _nord.jsx               # Nord 主题 UI 组件库
├── styles.css              # 全局样式与动画定义
└── App.jsx                 # 路由与键盘事件管理器
public/
├── assets/                 # 静态资源（图标、大脑轮廓图等）
└── atlas/                  # 3D 脑表面模型文件
```

## 🛠️ 技术栈

*   **Frontend**: React 18, Vite
*   **Desktop Shell**: Tauri 2.0 (Rust)
*   **Visuals**: Canvas API (Slide 1 & 4), SVG Direct Manipulation (Slide 2)
