# 语义解码与大脑编码模型演示系统 (Semantic Encoding Brain Presentation)

这是一个基于 **React + Vite + Tauri** 构建的高性能交互式演示系统，专为展示“多模态预训练模型的全脑语义映射”研究成果而设计。

本项目摒弃了传统的静态 PPT 模式，采用代码生成的动态可视化组件，提供沉浸式的演示体验。

## ✨ 核心特性 (已完成页面)

### Slide 01: 沉浸式封面
*   **粒子大脑系统**: 由 5000+ 个动态粒子构成的 3D 大脑轮廓。
*   **全局鼠标追踪**: 粒子云随鼠标全屏漂浮，模拟“注视”效果。
*   **物理交互**: 鼠标悬停产生局部排斥力场，粒子动态避让。
*   **高对比视觉**: 针对浅色背景优化的深午夜蓝配色与神经脉冲高亮。

### Slide 02: 动态方法论
*   **实时波形渲染**: 基于 Canvas 的高性能波形动画，模拟 fMRI 信号与噪声叠加过程。
*   **高性能架构**: 采用直接 DOM 操作 (Direct DOM Manipulation) 替代 React 状态驱动，消除渲染开销。
*   **响应式布局**: 波形图高度自适应容器，左右分栏自动对齐，完美填充屏幕。

### Slide 04: 深度数据集介绍
*   **Narratives (The 21st Year)**: 详细展示了数据集的来源、刺激详情（The Moth 播客）及 fMRI 参数。
*   **可视化声波**: 使用镜像柱状图模拟真实音频播放器的视觉效果。
*   **长文本滚动**: 提供可交互的文本区域，直观展示自然语言叙事的长上下文特性。

### Slide 05: 特征提取器
*   **极简主义布局**: 采用完全无容器的开放式设计，信息直接呈现在页面上，风格现代。
*   **视觉引导**: 使用简洁的垂直分割线对不同模态的模型进行分区。
*   **垂直居中**: 优化 Flexbox 布局，确保内容在各种屏幕比例下都能优雅地垂直居中。

---

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

## 📂 目录结构

```
src/
├── slides/                 # 幻灯片页面组件
│   ├── Slide01Cover.jsx
│   ├── Slide02Methodology.jsx
│   ├── Slide03Theory.jsx
│   ├── Slide04Dataset.jsx
│   ├── Slide05FeatureIntro.jsx
│   └── ... (共 20 页)
├── styles.css              # 全局样式与动画定义
└── App.jsx                 # 路由与键盘事件管理器
public/
├── assets/                 # 静态资源
└── atlas/                  # 3D 脑表面模型文件
```

## 🛠️ 技术栈

*   **Frontend**: React 18, Vite
*   **Desktop Shell**: Tauri 2.0 (Rust)
*   **Visuals**: Canvas API (Slide 1 & 4), SVG Direct Manipulation (Slide 2)
*   **Styling**: Inline Styles & Project-specific CSS classes