### v1.4.0（2026-04-20）- 当前版本

#### Bug 修复：胜利动画完整播放

**背景**：v1.3.3 修复了累计解锁百分比和精灵反弹 NaN 问题，但通关时缺少背景图片渐显动画（winAnimProgress），直接跳到 ResultScreen。

**根因**：
- engine.ts 的 render() 有胜利动画逻辑（winAnimProgress 从 0→1，约 2 秒）
- 但 useGame.tsx 检测到胜利后**立即**调用 setStatus('won')
- App.tsx 中 status === 'won' 时直接返回 `<ResultScreen />`，GameCanvas 被卸载
- 动画只播放了第 1 帧就被打断

**修复**：
- useGame.tsx endGame(won=true) 中增加 2.5 秒延迟后再 setStatus('won')
- 期间 engine 继续播放动画（engine.isWon=true 但 GameCanvas 仍挂载）
- 2.5 秒后显示 ResultScreen，用户看到完整的背景渐显效果

**改动文件**：
| 文件 | 改动 |
|------|------|
| `src/hooks/useGame.tsx` | endGame() 胜利分支增加 setTimeout 延迟 2.5 秒 |

**Bug#2 确认**：
- 检查 Git 历史（commit 9cc497f, af52c3a）发现舞蹈功能曾在 v1.2.7 之前存在
- 当前代码库已无 VictoryDanceScreen 组件，舞蹈功能已移除
- 无需额外修复

**自动化测试**：`tests/auto-test-v1.4.0.html`（Web 实时报告 + Xcode 模拟器集成）

---

# 《划线解锁神图》产品需求文档（PRD）

> 版本管理：每次功能迭代在 CHANGELOG 新增版本条目，保持与代码同步。

---

## 目录
1. [产品概述](#产品概述)
2. [核心游戏机制](#核心游戏机制)
3. [命系统（Lives System）](#命系统)
4. [Classic Mode](#classic-mode)
5. [Jigsaw Mode](#jigsaw-mode)
6. [Match-3 Mode](#match-3-mode)
7. [精灵系统](#精灵系统)
8. [关卡数据](#关卡数据)
9. [CHANGELOG](#changelog)

---

## 产品概述

- **游戏名称**：划线解锁神图（Line Reveal）
- **平台**：iOS（Capacitor 混合应用）
- **技术栈**：React 19 + TypeScript + Vite + Capacitor + TailwindCSS
- **App ID**：`com.linereveal.game`
- **核心玩法**：玩家在黑色迷雾覆盖的画布上划线，把大精灵隔离在越来越小的区域里，解锁底层神秘图片。

---

## 核心游戏机制

### 解锁百分比
- 玩家每次划线完成封闭区域，系统计算：`解锁% = 1 - (活跃多边形面积 / 总画布面积)`
- 当解锁百分比 ≥ `unlockThreshold`（关卡配置，一般 0.7~0.9）时触发胜利

### 划线规则（Classic）
- 玩家从多边形边界的某点出发，途径多边形内部，回到边界另一点
- 途中若被精灵碰到：扣一条命，返回起点（视觉重置，游戏继续）
- 划线将多边形分成两个区域：包含大精灵的区域（继续遮盖）+ 不含大精灵的区域（解锁）

---

## 命系统

### 初始状态
- 每个玩家初始拥有 **5 条命**
- 右上角显示 **红桃心 SVG**：`LivesDisplay` React 组件，≤5颗显示实心/空心桃心，>5显示 `❤️ ×数字`
- 当命数 > 10 时，改为显示：`❤️ ×数字`

### 扣命触发条件
| 模式 | 触发条件 |
:|------|---------|
| Classic | 划线途中被任意精灵（大/小）碰到 → React 层 `hitBySpirit()` → `spendLife()` → 剩余=0则 gameover |
| Jigsaw | 倒计时 120s 内未完成拼图 |
| Match-3 | 倒计时归零时未完成所有消除 |

### 扣命技术细节（v1.1.2 核心修复）
- **Engine 层职责**：仅维护 `hitCount++`（碰撞计数器递增），不维护本地 lives 状态，不在 Canvas 上渲染任何 LIVES 文字
- **React 层职责**：`GameCanvas.tsx` 每 500ms 轮询 `engine.hitCount` 增量，调用 `hitBySpirit()` → `spendLife()` → React 层 `setStatus('lost')`
- **冷却中碰撞处理**：`spendLife()` 返回 `-1`，`hitBySpirit()` 仅判断 `remaining === 0` 才 gameover（移除了错误的 `|| remaining === -1` 判断）

### 加命触发条件
- **任意模式**通关后：+1 条命（`earnLife()` 同时取消当前冷却等待）

### 命数耗尽冷却机制（递增冷却）
| 耗尽次数 | 冷却时间 | 恢复后命数 |
|---------|---------|----------|
| 第 1 次 | 5 分钟 | 5 条命 |
| 第 2 次 | 15 分钟 | 5 条命 |
| 第 3 次 | 30 分钟 | 5 条命 |
| 第 4 次 | 60 分钟 | 5 条命 |
| 第 5 次 | 120 分钟 | 5 条命 |
| 第 6 次 | 240 分钟 | 5 条命 |
| 第 7 次及以上 | 480 分钟 | 5 条命 |

### UI 规则
- 命数 ≤ 5：显示 5 个 SVG 红桃心（实心=有命，空心=无命）
- 命数 > 5 且 ≤ 10：显示 5 个实心红桃心 + `×{count}` 数字
- 命数 > 10：显示 `❤️ ×数字`
- 冷却中右上角：显示 `💔 + 倒计时`（MM:SS 或 HH:MM:SS）
- 无命禁止进入游戏（WelcomeScreen 三按钮均有 `hasLives()` 检测）
- 无命弹窗（WelcomeScreen）：弹出 `💔 No Lives Left` 模态框，显示冷却阶段名称（`Recovery ×N`）+ 实时倒计时，倒计时归零自动关闭弹窗
- 位置：屏幕右上角（React `LivesDisplay` 组件，与 Canvas 游戏层分离渲染）

---

## Classic Mode

### 精灵类型
| 类型 | 颜色 | 行为 | 动画 |
|------|------|------|------|
| BigSpirit（大精灵）| 橙红色 | 缓慢弹跳，玩家必须把它圈在越来越小的区域 | 脉冲伸缩 |
| butterfly（蝴蝶）| 紫蓝色渐变 | 飘忽移动 | 扇翅动画（翅膀上下翻转） |
| scorpion（蝎子）| 深橙/棕红 | 快速直线移动 | 尾巴摆动 |
| spider（蜘蛛）| 深灰/深绿 | 爬行，方向多变 | 腿部交替摆动 |
| teleport（传送）| 青绿色 | 定期瞬移 | 电光菱形闪烁 |

> **修复项**：所有精灵禁止使用纯黑色（`#000000`），最暗不超过深灰 `#333333`，确保在黑色背景上可见

### 碰撞逻辑
- 划线途中：玩家路径与任意精灵圆形碰撞检测
- 碰到即：`engine.hitCount++` + 玩家重置到路径起点 + haptic 反馈
- React 层每 500ms 检测到 `hitCount` 增量 → `hitBySpirit()` → `spendLife()` → `remaining === 0` 时 gameover

### 撤回（Undo）
- 每关可撤回 1 次，恢复上一次划线前的状态

### 时间限制
- 每关有 `timeLimit`（秒），HUD 显示双进度条倒计时
- 超时：触发失败，扣1命

---

## Jigsaw Mode

### 核心规则
- 玩家点击交换拼图碎片，还原完整图片
- 网格难度随关卡递增：3×3 → 4×3 → 5×3 → 6×3

### 时间限制（v1.1.0）
- 每局固定 **120 秒** 倒计时
- HUD 顶部显示倒计时进度条（橙色）
- 剩余 < 30s：进度条变红，闪烁提示
- 超时：显示失败弹窗，扣1命

### 通关奖励
- 完成拼图：+1 条命

---

## Match-3 Mode

### 核心玩法
- 点选两个相同图案，寻找可连通的路径进行消除（链接消消乐）
- 路径最多转弯 2 次，且路径不能穿越其他棋子

### 关卡进度（v1.1.2 修复）
- Match-3 使用**独立的 `match3Level` state**（初始值=1），与 Classic/Jigsaw 的 `currentLevelId` 完全解耦
- 首次进入固定 Stage 1（4×3 棋盘，3种图案），通关后 `match3Level + 1`

### 难度配置（stages）

| Stage | 网格 | 图案种类 | 层数 | 备注 |
|-------|------|---------|------|------|
| 1 | 4×3 | 3 | 1 | **简单入门**，首次进入固定此配置 |
| 2 | 8×6 | 5 | 1 | 中等 |
| 3 | 12×6 | 8 | 1 | 较难 |
| 4 | 12×6 | 10 | 2 层 | 双层 |
| 5 | 12×6 | 12 | 2 层 | 双层难 |
| 6 | 12×6 | 16 | 3 层 | 三层最难 |

> Match-3 内部关卡 1 → Stage 1，关卡 2-3 → Stage 2，关卡 4-6 → Stage 3，关卡 7-10 → Stage 4，关卡 11-20 → Stage 5，关卡 21+ → Stage 6

### 时间限制（v1.1.2 修复）
- 初始时间：**10 秒**（v1.1.2 从 20s 改为 10s）
- 每消除一对：**+5 秒**
- 剩余时间 < 5s：进度条变红 + 闪烁动画（v1.1.2 紧急阈值从 10s 改为 5s）
- 倒计时归零：失败，扣1命

### 失败界面（v1.1.2 修复）
- 显示 **Try Again**（重置当前关卡，不二次扣命）和 **Exit**（返回主界面）两个选项
- 命耗尽时不再允许重新进入（需等待冷却或通过其他模式赢得命）

### 通关奖励
- 完成所有消除：+1 条命 + 进入下一 Match-3 关卡

---

## 精灵系统

### 卡通化动画要求（v1.1.0）

#### BigSpirit（大精灵）
- 外形：圆形橙红怪物，有眼睛
- 动画：脉冲伸缩（scale 0.9↔1.1，周期 1s）+ glow

#### 蝴蝶（butterfly）
- 外形：左右对称翅膀 + 身体
- 颜色：紫蓝色渐变（`#a78bfa` → `#60a5fa`）
- 动画：翅膀上下扇动（scaleY 0→1→0，周期 0.4s）

#### 蝎子（scorpion）
- 外形：椭圆身体 + 弯尾
- 颜色：橙棕色（`#f97316`）
- 动画：尾巴左右摆动（rotate ±20°，周期 0.3s）

#### 蜘蛛（spider）
- 外形：圆形身体 + 8条腿
- 颜色：深绿色（`#4ade80` 暗化版 `#166534`）
- 动画：4对腿交替抬起（奇数腿 up，偶数腿 down，周期 0.5s）

#### Teleport（传送）
- 外形：菱形 + 电光
- 颜色：青绿色（`#00ffcc`）
- 动画：脉冲闪烁（已有）

---

## 关卡数据

共 30 关，3 个 Chapter，详见 `src/data/levels.ts`。

---

## CHANGELOG

### v1.2.7（2026-04-16）- 当前版本

#### 彻底回退 + 重构（从 b553b5d 基线清零重写）

**背景**：v1.2.6 重构后仍存在"动不动出FAILED"和"命显示在左边"的问题，根因是在旧有问题代码上打补丁层层叠加。决定回退所有修改文件到 commit `b553b5d`，删除新增的 LivesDisplay.tsx，从干净基线重构。

**改动 1：engine.ts**
- 移除 `this.lives`、`this.initialLives` 字段（不再维护引擎内部命系统）
- 移除 `init()` 中 `lives` 参数及处理
- 移除 canvas 上 `LIVES: ❤️` 文字渲染（`ctx.fillText`）
- `cancelDraw()` 重构为：`hitCount++` + haptic + 重置玩家到路径起点（语义：精灵碰撞时调用）
- 新增 `abortDraw()`：手指抬起时调用，无惩罚，无 hitCount++
- `handleRelease()` 改为调 `abortDraw()`
- `update()` 新增每帧精灵直接碰玩家检测（不依赖 isDrawing），碰撞时调 `cancelDraw()`
- 新增 `public hitCount = 0` + `private collisionCooldown = 0`（共享冷却防卡位）
- `checkCollisions()`（路径碰精灵）也共享 collisionCooldown，防路径碰+直接碰同帧双计数

**改动 2：GameCanvas.tsx**
- `gameEndedRef` 防重入
- `triggerEndGame()` 三重防护：① `gameEndedRef=true` ② `engine.stop()` ③ `clearInterval`
- `syncInterval` 首行检查 `gameEndedRef.current`，已结束直接 return
- 每 500ms 轮询 `engine.hitCount` 增量 → 调 `spendLife()`，`remaining===0` 才 `triggerEndGame(false)`
- 移除 `engine.lives/initialLives` 完美通关判断
- 移除传给 engine 的 `lives` 参数

**改动 3：App.tsx**
- `won/lost` 状态只渲染 `<ResultScreen />`，`GameCanvas` 完全不挂载
- `dancing` 状态保留 `GameCanvas` 作静止背景（engine 已被 triggerEndGame 停止）
- `playing` 状态正常渲染 `GameCanvas + HUD`

**改动 4：usePersistence.ts**
- 新增 `LivesData` 接口 + `SaveData.livesData` 字段
- 新增 `livesRef`（避免 React 闭包陷阱）
- 新增 `spendLife()`、`earnLife()`、`hasLives()`、`checkAndRestoreLives()`、`getCooldownRemaining()`
- 向后兼容：旧存档无 livesData 时 merge DEFAULT（5命满血）

**改动 5：useGame.tsx**
- 从 `usePersistence` 解构命系统函数并注入 `GameContext`
- `endGame(won=true)` 时调 `earnLife()` 奖励 +1 命
- 移除自动章节跳转 `setTimeout(() => startGame(...), 2000)`（白屏根因）
- 图片池耗尽时循环复用（不触发 all_passed）

**改动 6：LivesDisplay.tsx（新增）**
- SVG 红桃心命数显示
- 5命以内：5个实心/空心桃心；>5且≤10：5个实心+×数字；>10：❤️×数字
- 冷却中：💔 + 倒计时（MM:SS 或 HH:MM:SS），每秒刷新

**改动 7：HUD.tsx**
- 导入并挂载 `<LivesDisplay />`，位于右上角 UNDO 按钮左侧

**自动化测试**：`tests/auto-test-v1.2.7.html`（33个用例：19自动 + 14手动）

---

### v1.2.6（2026-04-15）

#### 重构：从 b553b5d（无白屏基线）彻底重写三大模块

**背景**：v1.2.4/v1.2.5 在旧有问题代码上打补丁，越改越乱，最终在死第二次时仍出现白屏。
决定还原到 commit `b553b5d`（已验证无白屏的基线），清空所有未提交改动，从零重构。

**改动 1：白屏防护（GameCanvas.tsx）**

全新 `triggerEndGame()` 三重防护：
1. `gameEndedRef.current = true` — 入口唯一性保证
2. `clearInterval(syncIntervalRef.current)` — 立即停止轮询
3. `engine.stop()` — 立即停止 RAF，引擎彻底静止

syncInterval 回调第一行检查 `gameEndedRef.current`，已结束则直接 `return`，防止任何状态在结束后被修改。

**改动 2：App.tsx 状态隔离**

```
welcome     → WelcomeScreen
all_passed  → EndGameOverlay
dancing     → GameCanvas（静止背景）+ VictoryDanceScreen
won/lost    → 只有 ResultScreen（无 GameCanvas，无任何 interval/RAF）
playing     → GameCanvas + HUD + ResultScreen
```

`won/lost` 状态下 GameCanvas 完全不挂载，这是白屏的最终防线。

**改动 3：精灵碰玩家（engine.ts）**

在 `update()` 主循环加入每帧碰撞检测（不依赖 isDrawing）：
- 精灵与玩家距离 < `spirit.radius + PLAYER_RADIUS(8px)` → 碰撞
- `this.hitCount++`，`collisionCooldown = 0.5s` 防卡位重复触发
- syncInterval 监控 `engine.hitCount`，>0 时调用 `spendLife()`，命耗尽调 `triggerEndGame(false)`

**改动 4：命系统（usePersistence.ts + useGame.tsx）**

- `SaveData.livesData` 字段：`{count, cooldownEndsAt, consecutiveLosses}`
- `spendLife()` / `earnLife()` / `hasLives()` / `checkAndRestoreLives()` / `getCooldownRemaining()`
- 冷却档位：`[5, 15, 30, 60, 120, 240, 480]` 分钟，按 `consecutiveLosses` 递增
- 向后兼容：旧存档无 livesData 时自动 merge DEFAULT（5命满血）

**自动化测试**：`tests/auto-test-v1.2.6.html`（28个用例：23自动 + 5手动）

### v1.2.5（2026-04-14）


#### 核心 Bug 修复：精灵碰玩家不触发碰撞（P0）

**问题现象**：精灵碰到玩家时，不触发任何扣命/失败逻辑，测试 WS-07 失败。

**根因（根本性遗漏）**：`engine.ts` 只在 `isDrawing=true` 时检查"画的线段"与精灵的碰撞（`checkCollisions()`），**完全没有**"精灵直接碰到玩家"的碰撞检测。精灵会直接穿过玩家，什么都不会发生。

**修复**：新增 `checkSpiritPlayerCollision()` 方法，在 `update()` 每帧调用（不依赖 `isDrawing`）：
- 两圆相碰：`dist(spirit.position, playerPos) < spirit.radius + PLAYER_RADIUS(8px)`
- 触发时：`hitCount++` + `collisionCooldown=0.5s` + 震动/音效反馈
- `collisionCooldown` 防重复：防止同一精灵在玩家位置停留时连续触发（也防止 `cancelDraw` 与本方法在同一帧重复计数）
- 若同时在画线：`cancelDraw()` 取消画线并重置玩家到起点

**同时修复**：`cancelDraw()` 本身也加入 `collisionCooldown` 防护（防与 `checkSpiritPlayerCollision` 在同一帧重复触发）

#### 代码变更文件
| 文件 | 改动 |
|------|------|
| `src/game/engine.ts` | 新增 `collisionCooldown`、`checkSpiritPlayerCollision()`；`update()` 每帧调用碰撞检测；`cancelDraw()` 加入冷却防护 |
| `src/game/entities.ts` | `BigSpirit.radius=40`，`SmallSpirit.radius=15`（未改动，作为碰撞参数确认） |

#### 自动化测试
- `tests/auto-test-v1.2.5.html`：WS-07/WS-08 从手动改为自动；新增 COL-01/02 精灵碰撞专项（共 62 个测试）

---

### v1.2.4（2026-04-14）

#### 白屏根因彻底排查与修复（P0 紧急）

**问题现象**：精灵一碰到玩家就白屏（无论命是否耗尽）

**根因1（最严重）：endGame 在同一关被 interval 重复调用**
- `GameCanvas.tsx` 的 `setInterval`（300ms）回调检测到碰撞后调用 `endGame(false)` → `setStatus('lost')`，但 `return` 只是退出当次回调，interval 本身不停止
- 300ms 后下一轮回调继续执行，`lastHitCountRef.current` 已更新（因为第一次 `return` 前已更新），但若 engine 再次碰撞 `hitCount` 再次增加，又会触发 `endGame(false)` 第二次
- `endGame` 第二次调用 `setStatus('lost')` + `setUnlockedPercent(...)` → React re-render → GameCanvas 仍挂载（因 status=lost 时 App.tsx 仍渲染 GameCanvas）→ 白屏
- **修复**：新增 `gameEndedRef`（boolean ref），封装 `triggerEndGame()` 函数：第一次调用后立即 `gameEndedRef.current = true`，后续所有调用直接 `return`；调用后立即 `clearInterval(syncIntervalRef.current)` 停止轮询

**根因2：status=lost/won 时 GameCanvas 仍挂载，interval 继续跑**
- `App.tsx` 的 `GameShell` 返回的 JSX 中，所有非 welcome/dancing/all_passed 状态都渲染 `<GameCanvas />`，包括 `lost/won` 状态
- `lost` 状态下 engine 已 stop 但 `syncInterval` 未 clearInterval，300ms 后回调继续执行，读取到 `engine.hitCount` 可能再次增量，再次进入 endGame 逻辑
- **修复**：`App.tsx` 改为 `{status === 'playing' && <GameCanvas />}`，仅在 `playing` 状态挂载，游戏结束后 GameCanvas 被卸载，useEffect cleanup 自动 clearInterval

**根因3：同一帧多次碰撞（hitCount 一帧 +2）导致一次 interval 扣2命**
- 旧代码：`const hitDelta = currentHitCount - lastHitCountRef.current; collisionCountRef.current += hitDelta;` 会将帧内多次碰撞一次性累加扣命
- 修复：改为每次 interval 最多扣1命：`collisionCountRef.current += 1`，`lastHitCountRef.current = currentHitCount`（更新到最新，下次再变才算新的碰撞）

#### 代码变更文件
| 文件 | 改动 |
|------|------|
| `src/game/GameCanvas.tsx` | 新增 `gameEndedRef`、`syncIntervalRef`；封装 `triggerEndGame()` 防重入；改为每次碰撞最多扣1命；胜利判定后立即标记 `engine.isWon` |
| `src/App.tsx` | `GameShell` 改为 `{status === 'playing' && <GameCanvas />}`，游戏结束后卸载 GameCanvas |

#### 自动化测试
- `tests/auto-test-v1.2.4.html`：新增白屏防护专项用例（共 64 个测试）

---

### v1.2.2（2026-04-14）- 旧版本

#### Bug 修复（4项）

**Bug1：生命系统只扣一次命（无论被碰多少次，永远保持4条命）**
- 根因：`spendLife()` 函数在 `usePersistence.ts` 中直接读 `data.lives`（React state 闭包快照），而 React `setData` 是异步的——第一次碰撞后 `data.lives.count` 在旧闭包里永远是初始值，导致后续每次碰撞计算出来的 `newCount` 都是 `5-1=4`
- 修复：`usePersistence.ts` 新增 `livesRef = useRef(data.lives)` 作为"最新值哨兵"，每次 `data.lives` 更新后同步 ref；`spendLife()`/`earnLife()`/`hasLives()`/`checkAndRestoreLives()`/`getCooldownRemaining()` 全部改用 `livesRef.current` 读最新值，并在每次计算后**立即更新 ref**，使同一帧内多次调用也能正确累减

**Bug2：划线解锁不稳定（同一边小范围无法解锁 / 左划右不能每次成功）**
- 根因分析：
  1. `MIN_UNLOCK_RATIO = 0.02`（2%）阈值偏低，小范围划动可侥幸通过
  2. 完成划线触发距离 `closest.distance < 10`（10px）太窄，快速滑动帧间可能跳过
  3. 从左划到右时，若玩家位置越过边界到达多边形外部，`closest.distance` = 0 但需要 `outsideFog` 检测来确认完成
- 修复：
  1. `MIN_UNLOCK_RATIO` 从 0.02 → **0.05**（5%）
  2. 触发距离从 `< 10` → **`< 15`**；路径最小距离从 `> 30` → **`> 50`**
  3. 新增 `outsideFog` 检测：`!isPointInPolygon(nextPos, activePolygon)` 为 true 时也触发 `finishDrawing`，解决高速划线越界不触发的问题

**Bug3：通关后显示系统音乐控制（其他App音乐通知浮现）**
- 根因：`ResultScreen` 中 `handleNextLevel/handleReplay/handleTryAgain/Gallery` 按钮均调用 `audioManager.playBGM('')`（空字符串）。`playBGM('')` 内部 `if (!src) return` 直接退出，既不停止也不播放，此时系统音乐控制中心浮现显示其他App正在播放的音乐
- 修复：移除所有 `audioManager.playBGM('')` 调用，统一由 `startGame()` 内部的 `audioManager.playClassicBGM()` 管理BGM；移除 `ResultScreen` 对 `audioManager` 的依赖

**Bug4：通关后点击下一关白屏**
- 根因1：`startGame()` 内 `getAvailableBgImage()` 当图片池用尽时返回 `null` → `setStatus('all_passed')` 白屏（测试期间多次游戏可能耗尽60张图片的池子）
- 根因2：`ResultScreen` 在 `status === 'dancing'` 时没有返回 null，导致热舞期间意外渲染 FAILED UI
- 根因3：`earnedRef` 在组件 unmount/remount 时不重置，导致第二关通关不加命
- 修复：
  1. `getAvailableBgImage` 图片池耗尽时改为循环复用（随机从全池取），不再触发 `all_passed`
  2. 移除 `startGame` 中 `if (!nextBg)` 的 `all_passed` 分支
  3. `ResultScreen` 新增 `status === 'dancing'` 时 return null
  4. 新增 `useEffect` 监听 status 变化：`status !== 'won'` 时重置 `earnedRef.current = false`

#### 技术档案

| 文件 | 改动 |
|------|------|
| `src/hooks/usePersistence.ts` | 新增 `livesRef`；spendLife/earnLife/hasLives/checkAndRestoreLives/getCooldownRemaining 改用 ref |
| `src/game/engine.ts` | `MIN_UNLOCK_RATIO` 0.02→0.05；触发距离 10→15；路径门槛 30→50；新增 outsideFog 越界检测 |
| `src/components/ResultScreen.tsx` | 移除 `audioManager` 依赖；dancing 状态 return null；新增 earnedRef 重置 useEffect |
| `src/hooks/useGame.tsx` | `getAvailableBgImage` 池耗尽时循环复用；移除 startGame 中 all_passed 分支 |

---

### v1.1.5（2026-04-13）

#### Bug 修复

**Bug2（v1.1.4 残留）：边界快速小范围划动 → 解锁小区域 → 扣命**
- 根因（深度分析）：经 Safari Web Inspector 真实日志确认：
  - `ALL GUARDS PASSED` 日志出现时，area2=26426px（占画布 7.5%）> minCutArea=10540px（3%阈值）
  - Guard3(`area < 3%` = 10540px) **正确放行**了 26426px 的切割
  - 但 7.5% 对玩家来说仍然是"边界快速小范围划动"，不应解锁
  - 切割后小区域（含精灵）被移除 → 精灵死亡 → 扣命 → gameover
- 修复：`finishDrawing` 升级为五重守护：
  1. **Guard1**：累积路径总长 < 60px → 静默取消（无变化）
  2. **Guard2**：首尾直线距离 < 30px → 静默取消（无变化）
  3. **Guard3**：最小切割面积阈值 **3% → 10%**（35134px，阻止 7-9% 的边界scribble）
  4. **Guard4（新增）**：BigSpirit 安全区检查——保留的多边形若含 BigSpirit，则必须 ≥ 总面积 70%（防止把含精灵的小切片切掉）
  5. **Guard5（新增）**：路径边界框紧凑度检查——`bboxArea / cumLen² < 1.5` → 静默取消（阻止边界紧贴的来回scribble）

**Bug7（新增）：冷却中重启 App，冷却倒计时不刷新 / 不消失**
- 根因：`checkAndRestoreLives()` 仅在 `useEffect` 挂载时调用一次 + `setInterval` 每 30 秒检查一次。若 App 在冷却活跃期间被关闭再打开，需要等到下次 `checkAndRestoreLives` 触发（最多等 30 秒）才能看到正确的命数状态
- 修复：
  1. 增加 `visibilitychange` 事件监听（App 从后台切回前台时立即触发 `checkAndRestoreLives`）
  2. App 从后台切回时，若冷却已结束，`checkAndRestoreLives` 立即恢复 5 条命并关闭冷却，UI 无需等待下一个 30s 周期
  3. 若冷却未结束，`openNoLives()` 读取当前 `saveData.lives` 显示最新冷却时间（精确到秒）

**Bug8（新增）：冷却倒计时到 0 时 No Lives 弹窗不自动消失**
- 根因：`WelcomeScreen` 的冷却倒计时 `useEffect` 读取 `saveData.lives.cooldownEndsAt`，但 `checkAndRestoreLives` 改变了 `saveData` 中的 `cooldownEndsAt=null`。React 重新渲染后，`showNoLives` 仍为 `true`，模态框本应消失，但时序上可能短暂显示"0:00"
- 修复：`checkAndRestoreLives` 恢复命后，若 `showNoLives` 为 `true`，立即 `setShowNoLives(false)`（通过 `useEffect` 监听 `saveData.lives` 变化）

**Bug9（新增）：App 切换到后台，冷却不随时间流逝**
- 根因：冷却时间用 `cooldownEndsAt`（绝对时间戳）实现，App 在后台挂起时 `Date.now()` 不会更新，但切回前台时 `Date.now()` 会跳到当前真实时间，理论上 `checkAndRestoreLives` 正确恢复。但若切前台时 `checkAndRestoreLives` 未触发（无 `visibilitychange`），冷却状态不刷新
- 修复：同 Bug7，`visibilitychange` 确保每次切回前台都立即检查

#### 文档同步
- PRD.md 升级至 v1.1.5
- `tests/auto-test.html` 升级至 v1.1.5，更新 Guard 参数覆盖

---

### v1.1.4（2026-04-13）

#### Bug 修复

**Bug2（v1.1.3 残留）：小范围来回划动后手指抬起 → FAILED**
- 根因：`handleRelease`（手指抬起）调用 `cancelDraw()`，`cancelDraw()` 首行即 `hitCount++`（设计为精灵碰撞专用）。任何手指抬起事件都被 React 层误判为"被精灵打了一次"，导致扣命→gameover
- 修复：将 `cancelDraw()` 拆分为两个语义独立的函数：
  - `abortDraw()`：`handleRelease` 专用，无 `hitCount++`，无 haptic
  - `cancelDraw()`：仅在精灵碰撞时调用，`hitCount++` + haptic
- `finishDrawing` 保留原有三重保护（路径总长<60px、首尾距离<30px、切割面积<3%）

**Bug7（新增）：冷却中重启 App，冷却倒计时不刷新 / 不消失**
- 根因：`checkAndRestoreLives()` 仅在 `useEffect` 挂载时调用一次 + `setInterval` 每 30 秒检查一次。若 App 在冷却活跃期间被关闭再打开，需要等到下次 `checkAndRestoreLives` 触发（最多等 30 秒）才能看到正确的命数状态
- 修复：
  1. 增加 `visibilitychange` 事件监听（App 从后台切回前台时立即触发 `checkAndRestoreLives`）
  2. App 从后台切回时，若冷却已结束，`checkAndRestoreLives` 立即恢复 5 条命并关闭冷却，UI 无需等待下一个 30s 周期
  3. 若冷却未结束，`openNoLives()` 读取当前 `saveData.lives` 显示最新冷却时间（精确到秒）

**Bug8（新增）：冷却倒计时到 0 时 No Lives 弹窗不自动消失**
- 根因：`WelcomeScreen` 的冷却倒计时 `useEffect` 读取 `saveData.lives.cooldownEndsAt`，但 `checkAndRestoreLives` 改变了 `saveData` 中的 `cooldownEndsAt=null`。React 重新渲染后，`showNoLives` 仍为 `true`，模态框本应消失，但时序上可能短暂显示"0:00"
- 修复：`checkAndRestoreLives` 恢复命后，若 `showNoLives` 为 `true`，立即 `setShowNoLives(false)`（通过 `useEffect` 监听 `saveData.lives` 变化）

**Bug9（新增）：App 切换到后台，冷却不随时间流逝**
- 根因：冷却时间用 `cooldownEndsAt`（绝对时间戳）实现，App 在后台挂起时 `Date.now()` 不会更新，但切回前台时 `Date.now()` 会跳到当前真实时间，理论上 `checkAndRestoreLives` 正确恢复。但若切前台时 `checkAndRestoreLives` 未触发（无 `visibilitychange`），冷却状态不刷新
- 修复：同 Bug7，`visibilitychange` 确保每次切回前台都立即检查

#### 文档同步
- PRD.md 升级至 v1.1.4
- `tests/auto-test.html` 升级至 v1.1.4，新增 4 个测试用例（l17-l20）

---

### v1.2.3（2026-04-14）

#### 核心 Bug 修复（4个P0级别）
- 根因1：`endGame(true)` 内的 `setTimeout(() => startGame(nextLevelId), 2000)` 章节切换定时器没有 ref 追踪，连续通关/失败时旧定时器仍悬挂，在错误时机触发 `startGame` → `setStatus('playing')` 导致白屏
- 根因2：`endGame` 执行失败分支时无法清除上一轮悬挂的定时器
- 修复：
  1. 新增 `chapterTransitionRef`，每次调用 `endGame` 先 `clearTimeout(chapterTransitionRef.current)` 清除上一轮定时器
  2. **移除了所有自动章节切换 `setTimeout(() => startGame(...))`**，改为用户手动点击 "Next Artwork" 按钮进入下一关，彻底消除定时器竞态

**Bug2：划线不稳定，从屏幕一边划到另一边不成功**
- 根因1：`movePlayer` 的非绘制状态下，仅当 `isPointInPolygon(targetInputPos)` 为 true 时才触发画线，但当玩家手指从边界外侧触碰时（fog已被切割，触碰点在已解锁区域），判定为 false，不触发 `startDrawing()`
- 根因2：`finishDrawing` 的路径距离门槛 50px 对某些轨迹过大，且 `closest.distance < 15` 边界检测对快速滑动（每帧移动距离大）不够宽松
- 修复：
  1. `movePlayer` 非绘制状态：增加 `snap.distance <= 30` 判定，手指在边界附近 30px 以内即开始绘制（不再严格要求在 fog 内部）
  2. `finishDrawing` 触发距离：`< 15` → `< 20`，路径最短距离：`> 50` → `> 40`

**Bug3：通关后系统音乐通知浮现**
- 根因：`AudioManager.stopBGM()` 仅调用 `audio.pause()`，iOS 系统仍将暂停的 HTMLAudioElement 视为"活跃媒体会话"，导致后台系统音乐的控制中心通知浮出
- 修复：`stopBGM()` 改为 pause + `src = ''` + `load()`，彻底释放媒体资源和媒体会话焦点
- 同时移除 `endGame` 中重复的 `playWowVoice()` 调用（创建临时 Audio 对象同样抢占媒体焦点）

**Bug4：下一关白屏**
- 根因1：同 Bug1 的章节切换定时器竞态（已修）
- 根因2：`ResultScreen` 中 `nextLevelExists` 判断仅用 `LEVELS.some(l => l.id === nextLevelId)`，未检查是否已解锁（`saveData.unlockedLevels.includes`），导致 `startGame` 中 `if (!saveData.unlockedLevels.includes(levelId)) return;` 早返回，UI 停留在 won 状态但 GameCanvas 未加载
- 根因3：`window.location.reload()` 替换为 `setStatus('welcome')`（避免全量页面刷新导致状态丢失）
- 修复：`nextLevelExists = LEVELS.some(l => l.id === nextLevelId) && saveData.unlockedLevels.includes(nextLevelId)`

#### 其他改进
- `ResultScreen` 失败弹窗 "Quit to Menu" 由 `window.location.reload()` 改为 `setStatus('welcome') + setActiveTab('home')` 安全返回
- 全部通关时（`allLevelsPassed && !nextLevelExists`）展示专属完成屏（View Gallery 按钮）替代旧的 "Sector Cleared" 禁用按钮

#### 代码变更文件
- `src/hooks/useGame.tsx`：移除自动章节切换定时器，增加 `chapterTransitionRef`
- `src/components/ResultScreen.tsx`：修复 `nextLevelExists` 判断，增加全通关界面，修复 Quit 按钮
- `src/game/AudioManager.ts`：`stopBGM()` 彻底释放媒体资源，移除 `playWowVoice()` 重复调用
- `src/game/engine.ts`：`movePlayer` 扩大绘制触发范围，调整完成检测距离

#### 自动化测试
- `tests/auto-test-v1.2.3.html`：58个测试用例，含上述4个修复场景

---

### v1.2.2（2026-04-14）

#### Bug 修复
- `spendLife()` 改用 `livesRef` 修复闭包扣命仅减一次的 Bug
- `MIN_UNLOCK_RATIO = 0.05`（5%）+ `outsideFog` 越界检测
- 移除 `ResultScreen` 中的 `audioManager` 依赖
- 图片池循环复用防白屏
- `finishDrawing` 触发距离 15px，路径门槛 50px

---

### v1.2.1（2026-04-13）

#### 新功能：命系统完整实现
- `LivesDisplay` 组件：右上角桃心显示 + 冷却倒计时
- `HUD`：absolute 定位 `LivesDisplay`，每秒 `checkAndRestoreLives`
- `ChapterSelection`：选关前 `hasLives()` 检查，无命弹 `NoLivesModal`
- `ResultScreen`：所有按钮命数检查 + `earnLife()` 单次触发

---

### v1.1.3（2026-04-13）

#### 核心 Bug 修复（Classic 生命系统 + Gallery）

**Bug1：Classic Mode 命耗尽后仍可继续游戏**
- 根因：`spendLife()` 内使用 `setData(prev => {...})` 异步更新，外部 `remaining` 变量在 `setData` callback 赋值时函数早已 return，`remaining` 始终是初始值 `-1`，`remaining === 0` 永远不成立，`hitBySpirit` 永远不触发 gameover
- 修复：重构 `spendLife()` — 先从当前 `data`（同步快照）计算出新 `remaining`，再调用 `setData` 更新，最后 `return remaining`；确保返回值准确反映扣命结果

**Bug2：Classic Mode 小圈圈住极小区域立即解锁**
- 根因：`finishDrawing` 没有最小面积/最小路径长度保护，玩家在边界附近极短滑动也触发切割，切出接近0的面积片导致进度百分比突变
- 修复：`finishDrawing` 增加两道保护：
  1. 路径最短距离检查（`drawPath.length < 3 || dist < 20px` → 静默取消，不惩罚）
  2. 最小切割面积检查（任一子多边形 < 总面积1% → 静默取消，不惩罚）

**Bug3：FAILED 弹窗点 Try Again 直接进下关**
- 根因：`ResultScreen` 失败时 Try Again 直接调 `startGame(currentLevelId)`，无命检查
- 修复：Try Again / Replay / Next Artwork 所有按钮均增加 `hasLives()` 检查；无命时设置 `sessionStorage.show_no_lives=1` 并跳回 WelcomeScreen，由 WelcomeScreen 挂载后自动弹出 No Lives 弹窗

**Bug4：Classic Mode 静止期仍可玩**
- 根因：只有 WelcomeScreen Play 按钮做了命数检查，`ResultScreen` 的所有继续操作均无检查
- 修复：同 Bug3，统一所有入口检查（详见 Bug3 修复）

**Bug5：不同关卡生命管理/提示机制不一致**
- 修复：`ResultScreen`（Classic 失败/胜利）的 Try Again、Replay、Next Artwork 均增加命数检查；`Quit to Menu` 改为安全返回（`setStatus('welcome')`），移除 `window.location.reload()`
- 标准统一：所有模式（Classic/Jigsaw/Match3）无命时均显示相同 No Lives 弹窗，不允许直接进入游戏

**Bug6：Gallery 上滑触发跳转 Home**
- 根因：`handleTouchEnd` 只判断 `diffX > 20` 即触发 `onBack()`，未过滤竖向滚动时手指的微小水平偏移
- 修复：增加 Y 轴追踪（`touchStartY`），仅当 `diffX > 40 && |diffX| > |diffY| × 1.5` 才判定为横向返回手势（`isHorizontalBackSwipe`）

---

### v1.1.2（2026-04-11）

#### 核心 Bug 修复

**Bug1：Canvas 双显示 + 碰精灵不扣命**
- 根因：`engine.ts` 在 Canvas 上渲染旧的 `LIVES: ❤️❤️❤️` 文字（`ctx.fillText`），与 React `LivesDisplay` SVG 桃心并存
- 同时 `engine.cancelDraw()` 有本地 `this.lives` 逻辑，与 React 全局 `spendLife()` 双重扣命
- 修复：完全移除 engine 的 `this.lives`/`this.initialLives` 字段和 canvas LIVES 文字渲染；`cancelDraw()` 仅 `hitCount++` 和玩家视觉重置；碰撞扣命全部由 React 层 `hitBySpirit()` 统一处理

**Bug2：hitBySpirit 冷却中误触发 gameover**
- 根因：`spendLife()` 返回 `-1` 表示冷却中，`hitBySpirit()` 条件为 `remaining === 0 || remaining === -1`，导致冷却中碰精灵也 gameover
- 修复：条件改为 `remaining === 0`（仅剩0时gameover；冷却中返回-1时跳过）

**Bug3：无命仍可进入游戏**
- 修复：WelcomeScreen 三个 Play 按钮均有 `hasLives()` 检测，无命时弹出模态框

**Bug4：Match3 命耗尽退出再进仍可玩**
- 修复：失败 Overlay 重构，有命显示 Try Again（重置当前关，不二次扣命），无命显示 Exit

**Bug5：No Lives 弹窗无冷却时间**
- 修复：WelcomeScreen 添加 `useState(cooldownRemaining)` + `useEffect` 每秒计时器，实时显示 `MM:SS` 或 `HH:MM:SS` 倒计时，倒计时归零自动关闭弹窗

**Bug6：Match3 首次进入不是简单难度**
- 修复：Match3Game 引入独立 `match3Level` state（初始值=1），与 Classic/Jigsaw 的 `currentLevelId` 完全解耦

**Bug7：Match3 初始进度条 20s 改为 10s**
- `INITIAL_TIME: 20 → 10`，`URGENT_THRESHOLD: 10 → 5`

**Bug8：Exit 按钮点击不灵敏**
- 修复：HUD Exit、Jigsaw Exit、Match3 ← 箭头触控区域统一扩大至 `min-w-[60px] min-h-[36px]`

#### 文档同步
- PRD.md 更新：命系统描述改为红桃心 SVG，Match3 初始时间更正，Match3 独立关卡追踪记录
- 自动化测试：`tests/auto-test.html` 升级至 v1.1.2，覆盖全部 8 个修复点

---

### v1.1.1（2026-04-11）

#### Bug 修复
- 修复热舞界面 `dancing` 状态导致的无限闪烁问题（已回滚至 `d683f0e`）
- 修复 Gallery 解锁状态不持久化（改为 `saveData.playedBgImages`）
- 修复无效圈定 <2% 时红色闪烁逻辑
- 修复隐私政策弹窗位置（从 game overlay 移至 Settings 页）

#### 功能
- 关卡 17-30 全部完成
- 收藏馆 Gallery 页面完成

---

### v1.1.0（2026-04-11）

#### 新功能
- **命系统**：全局 Lives 系统，初始5条命，右上角圆环显示（后升级为红桃心 SVG），递增冷却机制
- **Jigsaw 倒计时**：120s 进度条，超时扣命
- **Match-3 倒计时**：20s起步（v1.1.2 改为10s），消除+5s，<10s红闪
- **Match-3 难度递增**：关卡→Stage 映射（v1.1.2 改为独立关卡追踪）
- **精灵卡通化**：蝴蝶扇翅、蝎子尾巴、蜘蛛腿部动画、大精灵脉冲
- **精灵颜色修复**：禁止黑色，所有精灵在深色背景上可见

---

### v1.0.0（2026-04-10）- 已发布

#### 功能
- ✅ Classic 模式：划线解锁，多边形分割算法
- ✅ 解锁百分比算法（Shoelace 公式）
- ✅ 撤回功能（每关1次）
- ✅ 无效圈定检测（<2% 红色闪烁）
- ✅ 120s 倒计时 UI（双进度条 + TimeWarning）
- ✅ 超时失败逻辑
- ✅ Teleport 精灵（Chapter 3-4）
- ✅ 关卡 1-30（3章）
- ✅ 收藏馆（Gallery）解锁状态
- ✅ Jigsaw 模式基础版
- ✅ Match-3 模式基础版
- ✅ 隐私政策弹窗（Settings 页）
- ✅ App Store 合规文档
