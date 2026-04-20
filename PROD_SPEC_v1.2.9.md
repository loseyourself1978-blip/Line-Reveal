# 《划线解锁神图》v1.2.9 产品需求文档

## 版本信息
- **版本号**: v1.2.9
- **Bundle 版本**: BUILD: 9
- **基于**: d683f0e (2026-04-09 快照)
- **日期**: 2026-04-16

## 变更日志
| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v1.2.9 | 2026-04-16 | 推倒重建：新增命系统(SVG桃心)、修复白屏根因、精简功能 |
| v1.2.8 | 2026-04-16 | 自动测试修复（回滚） |
| v1.2.7 | 2026-04-16 | 三重防护白屏修复 |
| v1.2.6 | 2026-04-15 | VictoryDanceScreen 修复 |
| v1.2.5 | 2026-04-15 | 热舞屏幕 |
| v1.2.1 | 2026-04-13 | 命系统完整实现 |
| v1.1.3 | 2026-04-13 | 小圈解锁修复、命系统异步修复 |
| d683f0e | 2026-04-09 | VictoryDance 之前快照（基础版本） |

---

## 核心功能规格

### 1. 命系统（Lives System）

#### 规则
- 命数由速度难度决定：速度1=5命，速度2=3命，速度3=1命
- 玩家划线碰精灵 → 命-1，玩家回到划线起点
- 命=0 → 游戏失败（lost 状态）
- **不包含**：冷却机制、UnDo按钮、120s倒计时

#### 命数显示（右上角）
- **位置**：HUD 右上角，`top-12 right-4`，绝对定位
- **≤5命**：5个 SVG 红桃心（实心=有命，空心=无命）
- **>5且≤10命**：5个实心红桃心 + `×{count}`
- **>10命**：`❤️ ×{count}`
- **冷却中**（不使用）：无此功能

#### SVG 桃心规格
- 宽度14px，高度14px
- 实心填充：`#ef4444`（红色）
- 描边：`#ef4444`，宽度2px
- 路径：`M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z`

### 2. 白屏根因修复

#### 问题描述
`App.tsx` 中 `ResultScreen` 是 overlay，`won/lost` 状态时 `GameCanvas` 仍在后台运行（未卸载），导致白屏。

#### 修复方案
```tsx
// App.tsx GameShell 逻辑
if (status === 'welcome') return <WelcomeScreen />;
if (status === 'all_passed') return <EndGameOverlay />;
// won/lost 在 playing 之前拦截，直接返回 ResultScreen（GameCanvas 不渲染）
if (status === 'won' || status === 'lost') return <ResultScreen />;

// 只有 playing 时才挂载 GameCanvas
return (
  <div className="w-full h-full relative">
    {playMode === 'jigsaw' ? <JigsawPuzzle onBack={resetGame} /> :
      playMode === 'match3' ? <Match3Game onBack={resetGame} /> : (
        <>
          <GameCanvas />
          <HUD />
        </>
      )}
    {/* ResultScreen 只在 playing 时作为透明占位，实际内容由上面的条件分支接管 */}
  </div>
);
```

### 3. HUD 布局

#### 布局规范
- `top-12 left-4`：Exit 按钮（左上）
- `top-12 right-4`：命数显示（右上方，紧贴边缘）
- 中间：`currentLevel.title` + 解锁进度条
- **无**：Undo按钮、120s倒计时进度条

### 4. 音频管理

#### 规则
- `endGame()` → `audioManager.stopBGM()` 立即停止背景音乐
- `ResultScreen` 按钮点击 → `audioManager.playBGM('')` 清空音乐
- 无热舞音乐（VictoryDanceScreen 已删除）

### 5. 删除的功能
- ❌ VictoryDanceScreen.tsx
- ❌ DanceAnimationFrames.tsx
- ❌ PrivacyPolicyModal.tsx（过早弹窗）
- ❌ Undo 按钮（HUD）
- ❌ 120s 倒计时进度条（HUD）
- ❌ 冷却倒计时💔（LivesDisplay）
- ❌ `collisionCooldown` 机制

---

## 自动化测试用例（27项）

### 引擎层测试（ENG-*）
| ID | 测试项 | 验证点 |
|----|--------|--------|
| ENG-01 | engine.ts 无命内部逻辑 | `lives--` 写在 engine，外部不处理 |
| ENG-02 | 碰撞扣命 | `cancelDraw()` 中 `this.lives--` |
| ENG-03 | 命耗尽触发失败 | engine 提供 `onLivesZero` 回调 |
| ENG-04 | 划线中碰精灵只扣1次 | cancelDraw 后本轮不再检测 |
| ENG-05 | 手指抬起命不变 | `handleRelease` 不调用碰撞检测 |
| ENG-06 | finishDrawing 不扣命 | `finishDrawing` 无 `lives--` |
| ENG-07 | 解锁百分比更新 | `lastUnlockPercent` 正确计算 |

### 界面层测试（UI-*）
| ID | 测试项 | 验证点 |
|----|--------|--------|
| UI-01 | LivesDisplay 右上角 | `top-12 right-4` class |
| UI-02 | SVG 桃心渲染 | 存在 `HeartIcon` 组件，`fill="#ef4444"` |
| UI-03 | ≤5命实心/空心 | `filled={i <= count}` |
| UI-04 | >5命显示×数字 | `×{count}` 文字显示 |

### 白屏防护测试（WS-*）
| ID | 测试项 | 验证点 |
|----|--------|--------|
| WS-01 | won 状态不渲染 GameCanvas | `status === 'won'` 在 `GameCanvas` 之前 return |
| WS-02 | lost 状态不渲染 GameCanvas | `status === 'lost'` 在 `GameCanvas` 之前 return |
| WS-03 | welcome 状态不渲染 GameCanvas | `status === 'welcome'` return WelcomeScreen |
| WS-04 | all_passed 不渲染 GameCanvas | `status === 'all_passed'` return EndGameOverlay |
| WS-05 | ResultScreen 卸载 GameCanvas | won/lost 直接 return ResultScreen |

### 持久化测试（PERSIST-*）
| ID | 测试项 | 验证点 |
|----|--------|--------|
| PERSIST-01 | SaveData 接口完整 | 包含 levelStars, stats, settings |
| PERSIST-02 | localStorage 持久化 | `usePersistence` 写入 localStorage |
| PERSIST-03 | 关卡解锁 | `unlockLevel` 更新 unlockedLevels |
| PERSIST-04 | 星星记录 | `setLevelStars` 记录 levelStars |
| PERSIST-05 | 统计更新 | `updateStats` 累加 totalAreaUnlocked |

### 音频测试（AUDIO-*）
| ID | 测试项 | 验证点 |
|----|--------|--------|
| AUDIO-01 | endGame 停止BGM | `audioManager.stopBGM()` 调用 |
| AUDIO-02 | ResultScreen 按钮清空音乐 | `playBGM('')` 调用 |

### 构建测试（BUILD-*）
| ID | 测试项 | 验证点 |
|----|--------|--------|
| BUILD-01 | npm run build 成功 | 退出码0 |
| BUILD-02 | Bundle 大小 <500KB | 实际 336KB |
| BUILD-03 | 无 VictoryDanceScreen | 源码中不存在该文件 |
| BUILD-04 | 无 LivesDisplay 冷却显示 | 无 `💔` emoji，无 `cooldownEndsAt` |
| BUILD-05 | 无 Undo 按钮 | HUD 无 Undo 按钮代码 |

---

## 技术实现

### 文件变更清单
| 操作 | 文件 | 说明 |
|------|------|------|
| 新增 | `src/components/LivesDisplay.tsx` | SVG桃心命数显示 |
| 修改 | `src/components/HUD.tsx` | 集成 LivesDisplay，移除 Undo/倒计时 |
| 修改 | `src/App.tsx` | 修复白屏根因 |
| 修改 | `src/game/engine.ts` | 添加 onLivesZero 回调 |
| 修改 | `src/game/GameCanvas.tsx` | 监听 livesZero 事件 |
| 删除 | `src/components/VictoryDanceScreen.tsx` | 推倒删除 |
| 删除 | `src/components/DanceAnimationFrames.tsx` | 推倒删除 |
| 删除 | `src/components/PrivacyPolicyModal.tsx` | 推倒删除 |

### engine.ts 关键接口
```typescript
interface EngineConfig {
  spirits: any[];
  bgImage: string;
  spiritSpeed?: 1 | 2 | 3;
  fogDensity?: 1 | 2 | 3;
  lives?: number;
  haptic?: boolean;
  onLivesZero?: () => void; // 新增：命耗尽回调
}

interface GameEngine {
  // ... 现有接口
  lives: number;
  initialLives: number;
  lastUnlockPercent: number;
  isWon: boolean;
  // 新增
  onLivesZero: (() => void) | null;
}
```

---

## 验收标准
1. ✅ 自动化测试 27/27 通过
2. ✅ `npm run build` 成功，Bundle <500KB
3. ✅ 模拟器运行无白屏
4. ✅ 命数显示为 SVG 桃心（非💔emoji）
5. ✅ 右上角显示，无 Undo，无倒计时
6. ✅ 通关/失败后音乐停止
7. ✅ ResultScreen 覆盖 GameCanvas（不白屏）
