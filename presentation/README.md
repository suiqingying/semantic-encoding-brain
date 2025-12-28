# 脑表面演示（Slides）

该目录是一个可运行的 PPT 风格演示工程（React + Vite）。每一页 slide 独立成文件，便于维护。

## 启动

```bash
cd presentation
npm install
npm run dev
```

## 打包为桌面应用（Tauri）

说明：Tauri 是“桌面壳 + 系统 WebView”的方案，不会依赖外部浏览器（但仍使用系统自带 WebView 引擎）。
默认以无边框全屏模式启动。

快捷键：
- `F11`：全屏 / 窗口切换
- `Esc`：退出全屏（回到窗口模式）
- `Alt+F4`：退出应用（Windows）
- `Ctrl+Q`：退出应用

```bash
cd presentation
npm install
npm run tauri:dev
```

打包：

```bash
cd presentation
npm run tauri:build
```

Windows 备注：需要安装 WebView2 Runtime（大多数系统已自带）。

## 目录结构
- `src/slides/`：每一页一个文件
- `src/slides/Slide15SemanticMap.jsx`：语义地图（可点击 ROI）
- `src/slides/Slide16AcousticMap.jsx`：声学地图（可点击 ROI）
- `public/atlas/`：演示用的表面文件（从仓库 `data/atlas/atlases/fsaverage/` 拷贝）
