# 划线解锁神图 — 产品规格文档 v1.5.0

## 版本信息

| 字段 | 值 |
|---|---|
| **VERSION** | v1.5.0 |
| **Bundle ID** | com.linereveal.game |
| **MARKETING_VERSION** | 1.1.0 |
| **Build** | 13 |
| **基于** | v1.4.2 |
| **日期** | 2026-04-25 |
| **状态** | ✅ 开发中 |
| **决策确认日期** | 2026-04-25 |

---

## 变更摘要

| 类型 | 内容 |
|---|---|
| ✨ 新增模式 | **Pinball Reveal**（弹球解锁）— 第二游戏模式 |
| 🔀 模式顺序调整 | Classic → **Pinball Reveal** → Jigsaw → Match-3 |
| 📋 文档 | 年龄评级统一为 9+（合规对齐） |
| 🧪 测试 | `tests/auto-test-v1.5.0.html`（52个用例，51通过，1已知设计行为） |

---

## 一、新模式：Pinball Reveal

### 1.1 设计理念与命名

**模式英文名：PINBALL REVEAL**
**副标题：Break Blocks. Uncover Beauty.**

命名逻辑：
- **Pinball**：弹珠/弹球，直观描述核心机制，全球玩家无需解释
- **Reveal**：与游戏品牌名 Line Reveal 保持一致的"解锁/揭示"主题
- 整体风格定位：**街机感 × 艺术收集**，区别于市场上纯粹的打砖块游戏

市场参考：
- Brick Breaker / Breakout（经典打砖块）
- Ball Blast（多球爆炸感）
- Bounce Blast（物理弹射）
- Pinout（无尽弹球）

**本模式的创新差异化点**：
1. 砖块形状根据背景图内容自适应（人物轮廓砖块 vs 几何砖块）
2. 消除砖块直接揭示下方的背景图片，解锁进度即时可视
3. 弹球轨迹留下短暂光痕，视觉爽感类似激光划线
4. 引入"精灵守护者"机制——特定砖块内藏精灵，击中会弹射反弹球

---

### 1.2 核心玩法规则

#### 基本流程
```
进入关卡
  → 背景图被 N 块砖块覆盖（砖块排列根据图片主体轮廓生成）
  → 玩家控制底部挡板左右移动（手指滑动）
  → 弹球从挡板弹出，撞击砖块消除
  → 砖块消除后下方背景图片逐渐显现
  → 消除 ≥ unlockThreshold% 砖块 → 通关
  → 时间耗尽或失去所有球 → 失败
```

#### 挡板控制
- 手指在屏幕下方区域左右滑动控制挡板
- 挡板宽度：屏幕宽度的 22%（初始），可因道具缩放
- 挡板响应速度：跟随手指，无延迟（≤16ms）
- 挡板两端触及边界自动反弹弹球（非穿越）

#### 弹球物理
- 初始球速：`400px/s`（中等难度），随关卡进度每章提升 8%
- 反弹角度：基于入射角镜像反射，与挡板碰撞时额外加入偏斜（由碰撞点偏离挡板中心决定，最大偏斜 ±30°）
- 边界反弹：上/左/右三边反弹，底部为死亡线
- 同屏最多弹球数：1（普通）/ 3（道具激活后）

#### 砖块系统

| 砖块类型 | 外观 | 耐久 | 特性 |
|---|---|---|---|
| **Standard** | 半透明白色方块，带图片纹理 | 1击 | 基础砖块，消除揭示底图 |
| **Tough** | 蓝色边框，数字显示耐久 | 2～3击 | 高层关卡出现 |
| **Spirit Guard** | 橙色发光，内含精灵图标 | 1击 | 击碎后释放一个 SmallSpirit，精灵开始反弹弹球方向（扰乱） |
| **Explosive** | 红色，裂纹纹理 | 1击 | 消除时触发范围爆炸，同时消除周围 8 格砖块 |
| **Shield** | 银色金属质感 | ∞ | 不可消除的障碍物，仅作为反弹墙 |
| **Bonus** | 金色闪光 | 1击 | 消除后掉落道具（冰冻/多球/宽板） |

#### 胜利/失败条件
- **通关**：消除砖块面积 ≥ unlockThreshold（各关卡独立设定，60%～90%）
- **完美通关**：消除 ≥ perfectThreshold（80%～98%）
- **失败**：
  - 弹球落底且无剩余球（初始3球）
  - 时间耗尽（各关卡独立时限）

---

### 1.3 精灵守护者机制（创新点）

这是与市场同类游戏的核心差异：

当弹球击中 **Spirit Guard 砖块** 时：
1. 砖块爆碎，释放一只 SmallSpirit（随机类型：butterfly / scorpion / spider）
2. 精灵在剩余砖块区域自由飞行
3. 弹球碰到精灵时，**反射角度随精灵速度向量偏转 ±20°**（制造随机感）
4. 精灵存在期间，挡板两侧出现金色护盾边框（提示玩家注意）
5. 再次用弹球击中精灵 → 精灵消失，玩家获得 2 秒"慢动作"奖励

设计意图：将经典划线模式的精灵障碍逻辑移植到弹球模式，保持品牌特色，同时增加战略层（是先清精灵还是先清砖块）。

---

### 1.4 砖块布局生成规则

砖块不是固定的矩形网格，而是根据背景图主体**轮廓感知生成**：

```
算法步骤：
1. 对背景图进行下采样至 20×30 格（宽×高）【已决策：Q5 = B】
2. 用 Sobel 边缘检测（复用 engine.ts 现有实现）识别图片主体轮廓
3. 轮廓内部区域：放置 Standard/Tough/Spirit Guard 砖块
   - 1-5关：仅 Standard；无 Spirit Guard（Q1决策）；无 Shield（Q3决策）
   - 6+关：引入 Tough/Spirit Guard/Shield
4. 轮廓外部区域：6关起放置 Shield（不可消除）或空白
5. 随机在内部 10%～15% 的格子放置 Explosive 和 Bonus 砖块
```

效果：背景图是人物时，砖块群呈现人形剪影；背景图是风景时，砖块沿主体轮廓分布。玩家每局看到的砖块形状都是独特的艺术构图。

---

### 1.5 道具系统

| 道具ID | 名称 | 效果 | 持续时间 | 获取方式 |
|---|---|---|---|---|
| PB-01 | **Multi-Ball** | 生成额外 2 个弹球 | 至球消失 | 击中 Bonus 砖块 |
| PB-02 | **Wide Paddle** | 挡板宽度增加 50% | 8秒 | 击中 Bonus 砖块 |
| PB-03 | **Slow Motion** | 全局球速降低 40% | 5秒 | 击中精灵后 |
| PB-04 | **Laser Beam** | 挡板发射垂直激光，穿透一列所有砖块 | 单次 | 完美通关奖励 |
| PB-05 | **Ball Saver** | 底部出现临时护网，接住下坠弹球一次 | 单次 | 关卡随机概率 8% |

---

### 1.6 关卡配置（Pinball Reveal 专属）

Pinball Reveal 复用 Classic 的关卡 ID 体系，但参数独立配置：

| 关卡范围 | 砖块数量 | 初始球数 | 时间限制 | 解锁阈值 | Spirit Guard 比例 |
|---|---|---|---|---|---|
| Lv 1-5（教学） | 60～80 块 | 3球 | 120s | 60% | 0%（无精灵守护） |
| Lv 6-15（中级） | 90～130 块 | 3球 | 120s | 70% | 8%～12% |
| Lv 16-23（高级） | 140～180 块 | 3球 | 150s | 75% | 12%～18% |
| Lv 24-30（专家） | 190～240 块 | 3球 | 180s | 80% | 15%～22% |
| Lv 31+（挑战） | 250+ 块 | 2球 | 120s | 85% | 20%～30% |

---

### 1.7 交互反馈细节

| 事件 | 视觉反馈 | 音效 | 震动 |
|---|---|---|---|
| 弹球碰挡板 | 挡板发白色短闪（100ms） | 清脆 "tok"（中频） | 轻微 20ms |
| 砖块消除 | 砖块碎裂粒子（6-8片，散射 20px） | "crack"（高频） | 无 |
| Explosive 爆炸 | 橙色圆形冲击波（半径 60px，300ms） | 爆炸音效 | 强 80ms |
| 精灵释放 | 精灵从砖块位置飞出，光尾动画 | 精灵音效（现有） | 中等 40ms |
| 失球（球落底） | 屏幕底部红色闪光，挡板短暂变红 | 低沉 "thud" | 强 100ms |
| 通关 | 全屏砖块瞬间碎裂，底图全显 | wow 语音（现有） | 强三连击 |
| 慢动作激活 | 全屏色调饱和度 -30%，时间流动感 | 降速音效 | 无 |

---

## 二、模式顺序更新

```
原顺序：Classic → Jigsaw → Match-3
新顺序：Classic → Pinball Reveal → Jigsaw → Match-3
```

UI 层面，`ChapterSelection.tsx` 和 `MainMenu.tsx` 需新增 `'pinball'` 模式入口。
`useGame.tsx` 中 `playMode` 类型扩展：
```typescript
// 原
type PlayMode = 'classic' | 'jigsaw' | 'match3'
// 新
type PlayMode = 'classic' | 'pinball' | 'jigsaw' | 'match3'
```

---

## 三、新增文件清单

| 文件路径 | 类型 | 说明 |
|---|---|---|
| `src/game/PinballEngine.ts` | 新增 | 弹球物理引擎（挡板、弹球、碰撞、砖块） |
| `src/game/BrickLayout.ts` | 新增 | 基于 Sobel 的砖块布局生成器 |
| `src/components/PinballGame.tsx` | 新增 | Pinball Reveal 模式 React 组件 |
| `src/data/pinball-levels.ts` | 新增 | 各关卡弹球专属配置 |
| `tests/auto-test-v1.5.0.html` | 更新 | 52个测试用例（含 PinballEngine 套件） |

---

## 四、修改文件清单

| 文件路径 | 修改类型 | 说明 |
|---|---|---|
| `src/hooks/useGame.tsx` | 修改 | PlayMode 类型添加 `'pinball'`，startGame 分支处理 |
| `src/components/MainMenu.tsx` | 修改 | 新增 Pinball Reveal 模式入口卡片 |
| `src/components/ChapterSelection.tsx` | 修改 | 模式 Tab 顺序调整 |
| `src/App.tsx` | 修改 | 渲染分支添加 `<PinballGame />` |
| `docs/APPLE_STORE_COMPLIANCE.md` | 修改 | 年龄评级统一为 9+ |
| `docs/APP_STORE_PREP.md` | 修改 | 年龄评级统一为 9+ |

---

## 五、技术架构说明

### PinballEngine.ts 核心设计

```typescript
// 核心数据结构
interface Ball {
    pos: Point;
    velocity: Point;  // px/s
    radius: number;   // 默认 8px
    trail: Point[];   // 光痕轨迹（最近 12 帧）
}

interface Brick {
    id: string;
    gridX: number; gridY: number;
    type: 'standard' | 'tough' | 'spirit_guard' | 'explosive' | 'shield' | 'bonus';
    hp: number;
    revealed: boolean;  // 是否已消除（显示背景图）
}

interface Paddle {
    x: number;      // 挡板中心 x
    width: number;  // 当前宽度（受道具影响）
    y: number;      // 固定在屏幕底部 height - 80px
}

class PinballEngine {
    // 物理更新（每帧）
    update(dt: number): void
    
    // 砖块碰撞检测（AABB + 法线反弹）
    checkBrickCollisions(): CollisionResult[]
    
    // 挡板碰撞（含偏斜角度计算）
    checkPaddleCollision(): void
    
    // 解锁面积计算（被消除砖块面积 / 总砖块面积）
    getRevealedPercent(): number
    
    // 砖块布局生成（调用 BrickLayout.ts）
    generateLayout(bgImageData: ImageData, gridW: number, gridH: number): Brick[]
}
```

### 复用现有模块

| 现有模块 | 复用方式 |
|---|---|
| `engine.ts` Sobel 算法 | 提取为独立函数，BrickLayout.ts 调用 |
| `entities.ts` SmallSpirit | 直接复用，Spirit Guard 释放后行为不变 |
| `AudioManager.ts` | 新增 `playPinballSFX(type)` 方法 |
| `useGame.tsx` endGame() | 直接复用，胜利/失败逻辑统一 |

---

## 六、版本回滚说明

如需回滚到 v1.4.2：
- 删除 `src/game/PinballEngine.ts`
- 删除 `src/game/BrickLayout.ts`
- 删除 `src/components/PinballGame.tsx`
- 删除 `src/data/pinball-levels.ts`
- 还原 `src/hooks/useGame.tsx`（playMode 类型）
- 还原 `src/App.tsx`（删除 pinball 渲染分支）
- 使用 git tag `v1.4.2` 对应 commit 回退

---

## 七、验收标准

### 功能验收
- [ ] 弹球物理反弹角度符合物理规律，无穿墙 bug
- [ ] 砖块布局随背景图变化，每张图产生独特形状
- [ ] Spirit Guard 释放精灵后，精灵影响弹球轨迹
- [ ] Explosive 砖块爆炸范围正确（8邻格）
- [ ] 道具效果时限准确（±0.1s）
- [ ] 解锁面积百分比计算与消除砖块数一致
- [ ] 通关/失败条件触发正确

### 性能验收
- [ ] 60FPS 稳定（iPhone 14 Pro 及以上）
- [ ] 弹球碰撞响应延迟 ≤ 16ms
- [ ] 内存占用 ≤ 150MB

### UI/UX 验收
- [ ] 模式选择界面顺序：Classic → Pinball Reveal → Jigsaw → Match-3
- [ ] Pinball Reveal 入口卡片视觉风格与其他模式一致
- [ ] 通关动画与 Classic 模式视觉语言保持一致

---

## 八、开放问题（已决策 2026-04-25）

| # | 问题 | ✅ 最终决策 | 说明 |
|---|---|---|---|
| Q1 | 精灵守护者是否出现在教学关（1-5关）？ | **A: 完全不出现** | 1-5关 Spirit Guard 比例 = 0%，从第6关开始引入 |
| Q2 | 多球道具同时存在时，任意一球落底是否扣球数？ | **B: 否，等全部落底** | 减少挫败感，全部球落底后才扣1球 |
| Q3 | Shield 砖块是否在所有关卡都出现？ | **A: 从第6关开始** | 1-5教学关无 Shield，降低新手难度 |
| Q4 | Pinball Reveal 是否共用 Classic 的命数（桃心）系统？ | **B: 独立（以球数代替命数）** | Pinball 独立球数系统，不消耗桃心命数，模式体验独立 |
| Q5 | 砖块轮廓生成算法下采样分辨率：16×24 还是 20×30？ | **B: 20×30** | 细节更丰富，接受轻微性能开销 |

---

## 九、继承自 v1.4.2 的功能（不变）

- Classic 模式全部功能（Sobel 迷雾、划线、精灵系统）
- Jigsaw 拼图模式
- Match-3 消除模式（含计时逻辑）
- 5命系统（Classic/Jigsaw/Match-3 共用）
- 画廊系统（GalleryPage、壁纸保存）
- iOS safe area / contentInset 修复（Bug#C）
- 精灵反弹 Bug#A/B 修复
- 30+关卡配置
- AudioManager 单例
- localStorage 持久化

---

*文档版本：PROD_SPEC_v1.5.0.md*
*对应代码版本：v1.5.0（待开发）*
*上一版本：PROD_SPEC_v1.3.4.md（v1.4.2）*
*下一步：审核通过后开始 PinballEngine.ts 编码*
