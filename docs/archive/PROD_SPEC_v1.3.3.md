# 划线解锁神图 - 产品规格文档 v1.3.3

## 版本信息
- **VERSION**: v1.3.3
- **Bundle ID**: com.linereveal.game
- **Market**: 1.0.1 (Build 11)
- **Bundle Hash**: index-CNhTmWrH.js (290.31KB)
- **日期**: 2026-04-17

---

## 🔧 Bug 修复记录

### Bug#A：精灵反弹逻辑导致 NaN（致命）
**文件**: `src/game/engine.ts` 第 374-377 行
**问题**: 反弹逻辑错误引用 `s.velocity` 的拼写错误属性 `(s as any).vx/vy`，而 Spirit.velocity 的字段是 `x/y`。
导致 `NaN` 值传播，精灵位置和速度失控，在屏幕外乱飞，玩家完全无法躲避。

**根因**:
```typescript
// ❌ 错误代码
(s as any).vx *= -1.1; // NaN * -1.1 = NaN
(s as any).vy *= -1.1; // NaN * -1.1 = NaN
```

**修复**:
```typescript
// ✅ 正确代码
s.velocity.x *= -1.1;
s.velocity.y *= -1.1;
```

**影响**: 所有关卡的精灵在碰到边界时失控，玩家路径被完全封死，任何划线操作都会撞上乱飞的精灵。这是"解锁了绝大部分区域都无法通关"的根本原因。

---

### Bug#B：通关百分比计算错误（致命）
**文件**: `src/game/engine.ts` + `src/game/GameCanvas.tsx`
**问题**: `lastUnlockPercent` 只记录**最近一次**划线解锁的面积，从不累加。
玩家划线 3 次，每次解锁 30%：累计 90%，但 `lastUnlockPercent` 始终只有 0.3（30%），无法达到 70% 胜利阈值。

**根因**:
```typescript
// engine.ts - finishDrawing()
this.lastUnlockPercent = percent;  // ❌ 覆盖，不累加
```

**修复**:
```typescript
// engine.ts - 新增字段
public cumulativeUnlockedPercent = 0;

// engine.ts - init() 重置
this.cumulativeUnlockedPercent = 0;

// engine.ts - finishDrawing() 累加
this.cumulativeUnlockedPercent = Math.min(1, this.cumulativeUnlockedPercent + percent);

// GameCanvas.tsx - 胜利检测改用累计值
if (eng.cumulativeUnlockedPercent >= levelConfig.unlockThreshold ...)
```

**影响**: 玩家需要一次性解锁 >= 70% 才能通关，无法通过多轮划线累加。这是第二个"解锁了绝大部分区域都无法通关"的根本原因。

---

## 📋 v1.3.3 完整改动清单

### engine.ts
1. 新增 `cumulativeUnlockedPercent` 字段（累计解锁百分比）
2. `init()` 中重置 `cumulativeUnlockedPercent = 0`
3. `finishDrawing()` 中累加 `cumulativeUnlockedPercent`
4. 修复 `vx/vy` → `velocity.x/y`

### GameCanvas.tsx
1. `syncInterval` 中同步 `cumulativeUnlockedPercent`
2. 胜利检测改用 `cumulativeUnlockedPercent`
3. 失败回调改用 `cumulativeUnlockedPercent`

---

## 📋 历史版本

### v1.3.2 (2026-04-17)
- 修复 cancelDraw 防重入机制
- 修复小范围解锁提示

### v1.3.1 (2026-04-13)
- 修复同边划线检测算法
- MIN_UNLOCK_RATIO: 5% → 3%

### v1.3.0 (2026-04-16)
- 基础版本重构，简化生命系统

---

## ✅ 验证清单

- [ ] iOS 构建成功 (BUILD SUCCEEDED)
- [ ] 精灵在边界反弹后速度恢复正常（不再是 NaN）
- [ ] 划线解锁百分比正确累加
- [ ] 累计解锁达到 70% 时正确触发胜利
- [ ] 自动化测试全部通过

---

## 🚀 自动化测试
- 自动化测试用例：`tests/auto-test-v1.3.3.html`
- 执行命令：`node tests/run-auto-test.cjs`
