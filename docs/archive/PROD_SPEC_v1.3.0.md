# Line Reveal v1.3.0 产品需求文档

> 版本号: BUILD: 10
> 日期: 2026-04-16
> 状态: ✅ 代码修复完成 + 自动化测试通过 + 模拟器验证通过

## 变更历史

| 版本 | 日期 | 状态 | 验证方式 |
|------|------|------|----------|
| v1.3.0 | 2026-04-16 | ✅ 完成 | 代码检查 + 模拟器运行 + 截图确认 |
| v1.2.9 | 2026-04-16 | ⚠️ 废弃 | 推倒重建 |
| v1.2.8 | 2026-04-16 | ⚠️ 废弃 | 白屏问题 |
| v1.1.3 | 2026-04-13 | ⚠️ 废弃 | Bug 遗留 |

## 核心问题修复

### Bug #1: Try Again 跳到下一关（已修复 ✅）
**根因**: `GameCanvas` 的 `useEffect` 只依赖 `currentLevel` 对象，但同一关重试时对象引用不变化，导致 effect 不重新运行。

**修复方案**:
- `useEffect` 依赖 `currentLevelId`（数字，永远唯一变化）而非对象引用
- 从 `LEVELS` 数组直接获取关卡配置（通过 `currentLevelId`），避免 stale closure
- 依赖数组：`[currentLevelId, currentLevel.bgImage, saveData.settings.spiritSpeed, saveData.settings.fogDensity, saveData.settings.haptic]`

**涉及文件**:
- `src/game/GameCanvas.tsx` - useEffect 依赖改为 currentLevelId

### Bug #2: 初始 3 条命而非 5 条（已修复 ✅）
**根因**: 命数根据 `spiritSpeed` 动态计算（速度1→5命，速度2→3命，速度3→1命），不符合 PRD 要求。

**修复方案**:
- 固定初始命数为 5 条（不受速度影响）
- `useGame.tsx`: `engineLives` 默认值改为 5
- `useGame.tsx`: `startGame()` 中重置为 5
- `GameCanvas.tsx`: lives 硬编码为 5

**涉及文件**:
- `src/hooks/useGame.tsx` - engineLives 默认值和 startGame 重置
- `src/game/GameCanvas.tsx` - lives 硬编码为 5
- `src/components/LivesDisplay.tsx` - 显示 5 个桃心

### Bug #3: 小范围划线解锁不工作（同方向往返）（已修复 ✅）
**根因**: `splitPolygon` 中 start/end 在同一 segment 时，周长遍历为空，产生退化多边形（面积为 0）。

**修复方案**:
- 同边检测：比较路径长度 vs 沿边距离
- 如果 `pathLen > rimDist * 1.3` → 有效分割（玩家"绕进去"了）
- 否则 → 返回原多边形，不分割

**涉及文件**:
- `src/game/polygon.ts` - `splitPolygon` 新增同边处理逻辑

### Bug #4: 大范围划线解锁成功率低（已修复 ✅）
**根因**: spirit 位置检测不够精确（4点采样→8点采样），且 spirit 在两区域都有/都没有时 fallback 逻辑不合理。

**修复方案**:
- 增强 spirit 检测：8点采样（4px 半径，8个方向）
- 新增路径检测：spirit 在划线路径附近 → 不在 polygon 内
- Big Spirit fallback 逻辑优化：面积比 < 2 时使用面积判断，>= 2 时保留较大区域

**涉及文件**:
- `src/game/engine.ts` - `finishDrawing` 中 `checkSpiritIn` 增强

### Bug #5: 小圈解锁（< 5%）（已修复 ✅）
**根因**: 缺少最小解锁阈值检查，小范围划线被误判为有效。

**修复方案**:
- `MIN_UNLOCK_RATIO = 0.05`（5%）
- `startDrawing()` 中保存 `originalActivePolygon`
- `finishDrawing()` 中计算 `percent = 1 - (keepArea / totalArea)`
- 如果 `percent < 0.05` → 保留原多边形，不分割

**涉及文件**:
- `src/game/engine.ts` - `MIN_UNLOCK_RATIO` 常量 + 阈值检查

## 技术架构

### 游戏引擎流程
```
点击屏幕 → getClosestPointOnPolygon → startDrawing()
拖动手指 → movePlayer() → drawPath 记录轨迹
碰撞检测 → checkCollisions() → cancelDraw() → 扣命
回到边缘 → finishDrawing() → splitPolygon() → 区域分割 → spirit 清理
```

### 核心算法
1. **多边形分割**: Ray-casting + Shoelace 公式
2. **边缘检测**: Sobel 算子
3. **碰撞检测**: 圆-线段相交
4. **spirit 位置**: 8点采样 ray-casting

### 关键常量
- `MIN_UNLOCK_RATIO`: 0.05（5%）
- `DRAW_SPEED`: 300 px/s
- `SPEED`: 250 px/s
- `INITIAL_LIVES`: 5

## 验收标准

| 项目 | 标准 | 状态 | 验证方式 |
|------|------|------|----------|
| Try Again | 点击后重试当前关卡（不是下一关） | ✅ 通过 | 代码检查 + 自动化测试 |
| 初始命数 | 显示 5 个实心桃心 | ✅ 通过 | 代码检查 + 模拟器真实操作 |
| 小范围划线 | 同边小圈（> 1.3倍沿边距离）可解锁 | ✅ 通过 | 代码检查 + 自动化测试 |
| 大范围划线 | 左右横跨解锁成功率 > 80% | ✅ 通过 | 代码检查 + 自动化测试 |
| 小圈防护 | < 5% 区域不解锁 | ✅ 通过 | 代码检查 + 自动化测试 |
| Xcodebuild | BUILD SUCCEEDED | ✅ 通过 | 命令行执行 |
| 模拟器运行 | 应用成功启动并显示界面 | ✅ 通过 | Python + Quartz真实操作 |
| Bundle大小 | 约 290-300 KB | ✅ 通过 | 291.95 KB |
| **真实UI测试** | 模拟器中点击PLAY、选关、5颗心显示 | ✅ 通过 | Python + Quartz自动化测试 |

**测试文件**:
- `tests/test-core-logic.cjs`: 23/23 核心逻辑测试通过
- `tests/auto-test-v1.3.0.html`: 25/25 代码检查通过
- `tests/验收报告_v1.3.0_真实划线测试.html`: 真实划线测试报告
- `tests/run-e2e-test.cjs`: 7/7 E2E测试通过
