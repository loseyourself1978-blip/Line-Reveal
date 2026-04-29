# 版本迭代历史

> 所有改动必须记录于此，代码和文档版本一一对应。

---

## v1.5.1 — 2026-04-29

**版本号**: MARKETING_VERSION: 1.1.0 / BUILD: 14
**Git commit**: (待提交)
**基于**: v1.5.0

**背景**
修复 Pinball Reveal 模式的 3 个视觉和交互 bug。

**Bugfix**
1. **砖块不透明** (`src/game/PinballEngine.ts`)
   - 所有砖块 fillStyle 从 0.18-0.35 透明度提升到 0.85-0.9
   - 紫色 standard / 蓝色 tough / 橙色 spirit_guard / 红色 explosive / 灰色 shield / 金色 bonus
   - 边框颜色同步加深，提升可视性

2. **背景图片比例** (`src/game/PinballEngine.ts`)
   - 从 `drawImage(5参数)` 改为 9 参数版本
   - 实现 letterbox 黑边模式，保持原始宽高比
   - 图片宽高比 > 画布：左右黑边
   - 图片宽高比 < 画布：上下黑边

3. **生命系统集成** (`src/components/PinballGame.tsx`)
   - 接入全局 `engineLives` 系统（与其他模式一致）
   - 右上角显示 `LivesDisplay` 组件
   - 球耗尽时减少全局生命
   - 生命耗尽时触发 `endGame(false)`
   - 通关时增加生命（上限 5 命）

**修改文件**
- `src/game/PinballEngine.ts`: 砖块透明度 + 背景比例
- `src/components/PinballGame.tsx`: 生命系统集成
- `PROCESS.md`: 新增标准化工作流程文档

**构建命令**
```bash
npx vite build && npx cap sync ios
```

---

## v1.5.0 — 2026-04-25

**版本号**: MARKETING_VERSION: 1.1.0 / BUILD: 13
**Git commit**: ae6b896
**基于**: v1.4.2 / PROD_SPEC_v1.5.0.md

**背景**
新增 Pinball Reveal（弹球解锁）模式，完整的街机弹球+艺术解锁体验。

**决策记录（Q1-Q5）**
- Q1: 精灵守护者在教学关（1-5关）**完全不出现**（spiritGuardRatio=0）
- Q2: 多球全部落底才扣1球（减少挫败感）
- Q3: Shield 砖块从**第6关**开始出现
- Q4: **独立球数系统**，不消耗桃心命数
- Q5: 砖块布局分辨率 **20×30**（细节更丰富）

**新增文件**
- `src/game/PinballEngine.ts` — 弹球物理引擎（Ball/Paddle/Brick/Spirit）
- `src/game/BrickLayout.ts` — Sobel 轮廓砖块布局生成器（20×30）
- `src/components/PinballGame.tsx` — Pinball Reveal React 主组件
- `src/data/pinball-levels.ts` — 30关 + 挑战关动态配置
- `tests/auto-test-v1.5.0.html` — 52个自动化测试用例
- `patches/0001-feat-v1.5.0-Pinball-Reveal-mode.patch` — 完整 diff

**修改文件**
- `src/hooks/useGame.tsx`: PlayMode 类型添加 `'pinball'`，endGame 添加 pinball 分支
- `src/App.tsx`: **Bugfix** — 新增 `import { PinballGame }` 和 `playMode === 'pinball'` 渲染分支（此前缺失导致 pinball 模式 fallback 到 Classic）
- `src/components/WelcomeScreen.tsx`: 新增 Pinball Reveal 模式卡片（橙色+NEW标识）
- `src/game/AudioManager.ts`: 新增 `playPinballSFX()` + `playPinballBGM()`
- `docs/PROD_SPEC_v1.5.0.md`: 状态改为"开发中"，决策 Q1-Q5 已写入文档
- `docs/APPLE_STORE_COMPLIANCE.md`: 年龄评级从 17+ 更新为 9+
- `docs/APP_STORE_PREP.md`: 版本更新为 v1.5.0，应用描述增加 Pinball 模式说明

**构建**
- `npx vite build` ✅ 303.62 KB
- `npx cap sync ios` ✅
- `xcodebuild DEBUG` ✅ BUILD SUCCEEDED
- `git push origin main` ✅ ae6b896

**回滚方法**
```bash
git revert ae6b896
# 或还原至 v1.4.2 tag
git checkout v1.4.2
```

---



**版本号**: MARKETING_VERSION: 1.0.1 / BUILD: 12 → 13

**背景**
v1.2.7 重构不彻底，App.tsx 的 won/lost 状态 GameCanvas 未卸载导致白屏，且测试用例不够严格。

**根因**
1. `App.tsx` won/lost 状态仍在走 `return (...<GameCanvas /><ResultScreen />)` 的主分支
2. `ResultScreen` 是 overlay 叠在 GameCanvas 上面，Canvas 一直跑着 → 白屏
3. engine.ts 有残留 `this.lives`/`this.initialLives` 字段与 canvas LIVES 文字
4. `handleRelease` 调 `cancelDraw()` 而非 `abortDraw()` → 手指抬起也扣命

**改动**
- `src/App.tsx`：won/lost 状态在 dancing 之前拦截，直接 `return <ResultScreen />`，GameCanvas 完全卸载
- `src/game/engine.ts`：确认无 `this.lives`/`this.initialLives`，`abortDraw`/`cancelDraw` 语义分离
- `src/game/GameCanvas.tsx`：`triggerEndGame` + `gameEndedRef` + `wonFiredRef` 三重防护
- `src/hooks/usePersistence.ts`：完整命系统（LivesData + livesRef 防闭包）
- `src/hooks/useGame.tsx`：注入命系统，移除自动章节跳转 setTimeout
- `src/components/LivesDisplay.tsx`：新增，右上角 SVG 桃心
- `src/components/HUD.tsx`：右上角挂载 LivesDisplay（right-4）

**构建**
- `npm run build` ✅ 336KB
- `npx cap sync ios` ✅
- Bundle hash: `index-_Q1u7_KS.js`（335.99KB）

**自动化测试**
- 27/27 自动测试通过（源码级验证）
- 9 项手动测试（需模拟器）

| 测试项 | 状态 | 说明 |
|--------|------|------|
| LV-01~08 | ✅ | 命系统 LivesData 完整 |
| ENG-01~07 | ✅ | engine 无内部命系统，碰撞走 hitCount |
| WS-01~03,05 | ✅ | 白屏防护：App.tsx won/lost 卸载 Canvas |
| UI-01~04 | ✅ | LivesDisplay 右上角 SVG 桃心 |
| PERSIST-02~05 | ✅ | 命系统持久化正确 |
| WS-04 | ⏭ 手动 | 不自动章节跳转 |
| FLOW-01~07 | ⏭ 手动 | 游戏流程（需真机） |

**关键代码变更**
```typescript
// App.tsx 关键修复
if (status === 'won' || status === 'lost') {
  return (
    <div className="w-full h-full relative">
      <ResultScreen />  // GameCanvas 完全卸载，白屏修复
    </div>
  );
}
```

---

## v1.2.7 — 2026-04-16 (回退重构)

**版本号**: BUILD: 11

**背景**
用户报告"动不动就 FAILED"且命显示在左边，要求回退到 b553b5d 彻底重构。

**回退**
```bash
git checkout b553b5d -- src/game/GameCanvas.tsx src/game/engine.ts \
    src/hooks/useGame.tsx src/hooks/usePersistence.ts
```

**重构内容**
- engine.ts：移除内部命系统，新增 hitCount/collisionCooldown
- GameCanvas.tsx：triggerEndGame 三重防护
- usePersistence.ts：完整命系统（LivesData + livesRef）
- LivesDisplay.tsx：右上角 SVG 桃心

**构建**
- `npm run build` ✅ 336KB
- `xcodebuild BUILD SUCCEEDED` ✅

---

## v1.2.1 — 2026-04-13

**版本号**: BUILD: 10

**功能**
完整命系统实现：
- 命数 ≤ 5：显示 5 个 SVG 桃心
- 命耗尽：进入冷却（5/15/30/60/120/240/480 分钟递增）
- 通关奖励 +1 命（最多 20）
- 冷却结束自动恢复 5 命

**冷却机制**
```typescript
const COOLDOWN_DURATIONS = [5, 15, 30, 60, 120, 240, 480]; // 分钟
const idx = Math.min(lives.consecutiveLosses, COOLDOWN_DURATIONS.length - 1);
```

---

## v1.2.0 — 2026-04-13

**版本号**: BUILD: 9

**功能**
- 120s 倒计时 UI（双进度条 + TimeWarning 警告）
- 超时扣 1 命
- Teleport 精灵（Chapter 3-4）
- 帧动画热舞（4 种卡通人物）

---

## v1.1.3 — 2026-04-13

**版本号**: BUILD: 8

**修复**
- Bug1: spendLife() 异步返回值 Bug
- Bug2: 小圈解锁 → MIN_UNLOCK_RATIO=0.05
- Bug3~6: ResultScreen 所有按钮命数检查
- Gallery 上滑触发返回 Home → 增加 Y 轴手势区分

---

## v1.0.1 — 初始版本

**版本号**: MARKETING_VERSION: 1.0.1 / BUILD: 1

**功能**
- 30 关完整关卡（Chapter 1-4）
- Gallery 收藏馆
- 隐私政策弹窗
- 帧动画热舞
- 撤回功能
- localStorage 持久化

---

## 核心文件版本映射

| 文件 | v1.2.8 功能 |
|------|------------|
| `src/App.tsx` | won/lost 卸载 GameCanvas |
| `src/game/engine.ts` | 无内部命，hitCount+collisionCooldown |
| `src/game/GameCanvas.tsx` | triggerEndGame 三重防护 |
| `src/hooks/usePersistence.ts` | 命系统 + livesRef |
| `src/hooks/useGame.tsx` | 注入命系统，无自动跳关 |
| `src/components/LivesDisplay.tsx` | 右上角桃心 |
| `src/components/HUD.tsx` | 挂载 LivesDisplay |
