# 版本迭代历史

> 所有改动必须记录于此，代码和文档版本一一对应。

---

## v1.2.8 — 2026-04-16

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
