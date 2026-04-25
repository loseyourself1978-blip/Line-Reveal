# 划线解锁神图 - 产品规格文档 v1.3.4

## 版本信息
- **VERSION**: v1.3.4
- **Bundle ID**: com.linereveal.game
- **Market**: 1.0.1 (Build 12)
- **基于**: v1.3.3
- **日期**: 2026-04-21

---

## 🔧 Bug 修复记录

### Bug#C：通关后背景图未全屏展示（底部黑边）
**文件**: `src/game/engine.ts` + `src/index.css` + `capacitor.config.ts`

**问题描述**:
通关后（isWon=true，迷雾消散）背景图片没有填满整个屏幕，屏幕底部有明显黑边（约 10-25% 屏幕高度）。

**用户截图**: iPhone 17 Pro 模拟器，1-2: Twin Spirits 关卡，通关后仍可见底部黑色区域。

**根因分析**:
在 iOS Capacitor WKWebView 中，`window.innerHeight` 不包含 Home Indicator（底部 safe area，约 34pt）的高度。
- `engine.ts` 的 `resize()` 使用 `window.innerHeight` 设置 `canvas.height`
- canvas 高度比实际可见区域小约 34pt
- canvas 内背景图虽然填满了 canvas，但 canvas 下方有 `bg-slate-900` 黑色 div 露出

**三重修复**:

#### 修复1：engine.ts `resize()` — 改用 canvas 实际渲染尺寸
```typescript
// ❌ 之前（使用 window.innerHeight，不含 safe area）
const width = window.innerWidth;
const height = window.innerHeight;

// ✅ 修复后（使用 canvas 元素的 getBoundingClientRect 精确尺寸）
const rect = this.canvasRef.current.getBoundingClientRect();
const cssWidth = rect.width > 0 ? rect.width : (this.canvasRef.current.offsetWidth || window.innerWidth);
const cssHeight = rect.height > 0 ? rect.height : (this.canvasRef.current.offsetHeight || window.innerHeight);
const width = Math.round(cssWidth);
const height = Math.round(cssHeight);
```

#### 修复2：index.css — 使用 100dvh 动态视口高度
```css
/* ❌ 之前（100% 对 html 元素等于静态视口高度，不含 safe area） */
html, body, #root { height: 100%; }

/* ✅ 修复后（html 使用 100dvh 动态视口高度，包含 safe area） */
html { height: 100dvh; width: 100dvw; }
body, #root { height: 100%; width: 100%; }
```

#### 修复3：capacitor.config.ts — 禁止 contentInset 自动收缩
```typescript
// ✅ 添加 ios.contentInset: 'never'
ios: {
  contentInset: 'never'  // 禁止 WKWebView 自动添加 safe area 内边距
}
```

**预期效果**: 通关后迷雾消散，背景图完整填满整个屏幕，无黑边。

---

## 📋 继承自 v1.3.3 的功能（不变）

### 核心游戏机制
- 划线解锁迷雾（Classic 模式）
- 精灵系统：BigSpirit（中心精灵）+ SmallSpirit（butterfly/scorpion/spider/teleport）
- 胜利条件：`cumulativeUnlockedPercent >= unlockThreshold`（累计解锁面积）
- 失败条件：`lives = 0`（精灵碰撞扣命）

### Bug#A 修复（v1.3.3）
精灵反弹逻辑 `s.velocity.x *= -1.1` / `s.velocity.y *= -1.1`（修复 vx/vy typo）

### Bug#B 修复（v1.3.3）
累计解锁百分比 `cumulativeUnlockedPercent`（修复只记录单次解锁的 lastUnlockPercent）

### 生命系统
- 初始5条命（SVG 桃心图标）
- 精灵碰撞 → 扣1命 → `lives == 0` → 游戏失败

### 胜利流程
1. `cumulativeUnlockedPercent >= unlockThreshold` → `engine.isWon = true`
2. 迷雾消散，背景图完整显示
3. "TAP ANYWHERE TO CONTINUE" 闪烁提示（`height - 100`）
4. 用户点击 → `onWonClick` → `setStatus('won')` → ResultScreen

### 失败流程
1. `lives = 0` → `onLivesZero` → `endGame(false, ...)` → `setStatus('lost')` → ResultScreen

---

## 📁 修改文件清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `src/game/engine.ts` | Bug修复 | `resize()` 改用 `getBoundingClientRect()` 获取精确高度 |
| `src/index.css` | Bug修复 | html 元素改用 `100dvh` 动态视口高度 |
| `capacitor.config.ts` | Bug修复 | `ios.contentInset: 'never'` 禁止 safe area 收缩 |

---

## 🔙 版本回滚说明

如需回滚到 v1.3.3：
- 还原 `engine.ts` `resize()` 方法：改回 `window.innerWidth/innerHeight`
- 还原 `index.css`：`html,body,#root { height: 100%; }`
- 还原 `capacitor.config.ts`：删除 `ios.contentInset`
- 使用 git commit `b553b5d`（或 v1.3.3 对应 commit）

---

## 🧪 验收测试

测试文件：`tests/auto-test-v1.3.4.html`

**测试用例**：
1. ✅ 首页正常加载
2. ✅ 进入关卡，canvas 尺寸与屏幕一致
3. ✅ canvas.height 等于容器实际渲染高度（不含 safe area 误差）
4. ✅ 胜利时背景图全屏（无黑边）
5. ✅ Bug#A/B 修复保留完整（engine.ts 源码检查）
