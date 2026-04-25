# 《划线解锁神图》— 项目文件架构

> 最后更新：2026-04-25  
> 当前版本：v1.0.2（MARKETING_VERSION） / Build 12  
> 技术栈：React 19 + TypeScript + Vite 7 + Capacitor 8 + TailwindCSS 4

---

## 目录总览

```
Line Reveal/
└── LineReveal/                   ← 主项目目录（Git 仓库根）
    ├── src/                      ← 源代码
    ├── assets/                   ← 游戏图片资源（精灵图、背景图）
    ├── public/                   ← 静态资源（手机壁纸等）
    ├── ios/                      ← iOS 原生项目（Capacitor）
    ├── android/                  ← Android 原生项目（Capacitor）
    ├── docs/                     ← 产品文档与归档
    ├── tests/                    ← 自动化测试
    ├── scripts/                  ← 构建辅助脚本
    ├── PRD.md                    ← 版本更新记录（主 PRD）
    ├── VERSION_HISTORY.md        ← 详细版本历史
    ├── README.md                 ← 项目说明
    └── PROJECT_STRUCTURE.md     ← 本文件（项目架构说明）
```

---

## 源代码结构 `src/`

```
src/
├── App.tsx                       ← 根组件，状态路由（welcome/playing/won/lost/...）
├── main.tsx                      ← 入口文件
├── index.css                     ← 全局样式（TailwindCSS + 自定义）
│
├── game/                         ← 游戏引擎核心
│   ├── engine.ts                 ← Canvas 游戏引擎（~700行）
│   │                               Sobel 边缘检测迷雾、划线检测、精灵移动
│   ├── entities.ts               ← 精灵实体（BigSpirit、SmallSpirit、clone()）
│   ├── GameCanvas.tsx            ← Classic 模式 Canvas 组件
│   ├── Match3Engine.ts           ← Match-3 消除引擎
│   ├── AudioManager.ts           ← 单例音效管理器
│   ├── polygon.ts                ← 多边形分割（Ray-casting + Shoelace）
│   ├── math.ts                   ← 数学工具函数
│   └── __tests__/
│       └── Match3Engine.test.ts  ← Match-3 单元测试
│
├── hooks/                        ← React Hooks
│   ├── useGame.tsx               ← 核心游戏状态（关卡/成就/命数/模式切换）
│   └── usePersistence.ts         ← localStorage 持久化（SaveData、命数、统计）
│
├── components/                   ← UI 组件
│   ├── WelcomeScreen.tsx         ← 欢迎首页
│   ├── ChapterSelection.tsx      ← 章节/关卡选择
│   ├── HUD.tsx                   ← 游戏内抬头显示（命数、倒计时、撤回）
│   ├── LivesDisplay.tsx          ← 右上角桃心命数显示（SVG）
│   ├── ResultScreen.tsx          ← 通关/失败结果页
│   ├── GalleryPage.tsx           ← 艺术画廊（解锁图片、壁纸预览、长按保存）
│   ├── WallpaperManager.tsx      ← 壁纸管理器
│   ├── JigsawPuzzle.tsx          ← 拼图模式组件
│   ├── Match3Game.tsx            ← 消除模式组件（倒计时：初始10s，每消+5s）
│   ├── MainMenu.tsx              ← 主菜单（导航）
│   ├── SettingsPage.tsx          ← 设置页（精灵速度、音效、隐私政策）
│   ├── ProfilePage.tsx           ← 个人档案/成就
│   ├── CollectionPage.tsx        ← 收藏页
│   └── EndGameOverlay.tsx        ← 游戏结束遮罩
│
├── data/                         ← 静态数据
│   ├── levels.ts                 ← 30 关关卡定义 + ALL_BG_IMAGES
│   └── gallery.ts                ← 画廊图片配置
│
├── context/                      ← React Context（待扩展）
└── utils/                        ← 工具函数
```

---

## 游戏资源 `assets/`

```
assets/
├── 11.png ~ 39.png               ← 手机壁纸图（Gallery 解锁图片）
├── bg_model_*.jpg                ← 背景模型参考图
├── bg_model_v9_*.jpg             ← 最新版背景参考图
├── 生成二次元美少女图片*.png       ← AI 生成二次元插画（游戏背景素材）
├── 《划线解锁神图》app介绍*.png   ← App 介绍截图素材
└── art/                          ← （预留）高质量艺术品目录
```

---

## 文档目录 `docs/`

```
docs/
├── PROD_SPEC_v1.3.4.md           ← 【当前最新产品规格】v1.3.4
├── APP_STORE_PREP.md             ← App Store 上架准备清单
├── APPLE_STORE_COMPLIANCE.md     ← App Store 合规要求
├── ITERATION_PLAN.md             ← 迭代计划
├── 《划线解锁神图》简化版PRD.docx ← 原始 PRD 文档（Word）
├── 《划线解锁神图》简化版PRD.pdf  ← 原始 PRD 文档（PDF）
├── 《划线解锁神图》简化版PRD.txt  ← 原始 PRD 文档（纯文本）
└── archive/                      ← 已归档旧版本文档
    ├── PROD_SPEC_v1.2.9.md
    ├── PROD_SPEC_v1.3.0.md
    ├── PROD_SPEC_v1.3.1.md
    ├── PROD_SPEC_v1.3.2.md
    ├── PROD_SPEC_v1.3.3.md
    └── ACCEPTANCE_REPORT_v1.4.0.md
```

---

## 测试目录 `tests/`

```
tests/
├── auto-test-v1.4.2.html         ← 【最新】自动化测试报告（HTML，浏览器打开）
└── run-auto-test.cjs             ← 自动化测试脚本（Node.js 源码静态分析）
```

---

## iOS 原生项目 `ios/`

```
ios/App/
├── App.xcodeproj/                ← Xcode 项目
│   └── project.pbxproj           ← 版本号（MARKETING_VERSION=1.0.2, BUILD=12）
├── App/
│   ├── Info.plist                ← iOS 权限配置（相册读写权限）
│   └── capacitor.config.json    ← Capacitor 配置
└── CapApp-SPM/
    └── Package.swift             ← Swift Package 依赖
        包含：CapacitorFilesystem / CapacitorHaptics / CapacitorShare
```

---

## 核心依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| react | 19.2 | UI 框架 |
| vite | 7.x | 构建工具 |
| @capacitor/core | 8.0.2 | 混合应用桥接 |
| @capacitor/ios | 8.0.2 | iOS 原生桥 |
| @capacitor/filesystem | 8.1.2 | 保存图片到相册 |
| @capacitor/haptics | 8.0.0 | 震动反馈 |
| @capacitor/share | 8.0.0 | 系统分享 |
| tailwindcss | 4.x | CSS 框架 |

---

## 游戏状态流转（App.tsx）

```
welcome
  └─→ playing (Classic/Jigsaw/Match3)
        ├─→ dancing (Classic 通关动画)
        │     └─→ won → ResultScreen
        ├─→ won (Jigsaw/Match3 直接跳转) → ResultScreen
        └─→ lost → ResultScreen
              └─→ (Next/Retry/Home) → playing / welcome
```

---

## 三种游戏模式

| 模式 | 组件 | 核心逻辑 |
|------|------|----------|
| **Classic** | `GameCanvas.tsx` + `engine.ts` | Canvas 划线解锁迷雾，Sobel 边缘检测 |
| **Jigsaw** | `JigsawPuzzle.tsx` | 拼图碎片还原，完成后 endGame(true) |
| **Match-3** | `Match3Game.tsx` + `Match3Engine.ts` | 倒计时（初始10s，消一对+5s）消除 |

---

## 构建命令

```bash
# Web 构建
cd LineReveal && npx vite build

# 同步 iOS
npx cap sync ios

# iOS 模拟器构建
cd ios/App && xcodebuild \
  -project App.xcodeproj \
  -scheme "Line Reveal" \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  -clonedSourcePackagesDirPath "./build/SourcePackages" \
  build

# iOS 发布构建（用于 Archive）
xcodebuild -configuration Release -destination 'generic/platform=iOS' ...
```
