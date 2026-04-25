# Line Reveal 产品规格文档 v1.3.2

## 版本信息
- **文档版本**: 1.3.2
- **代码版本**: v1.3.2 (BUILD: 10)
- ** MARKETING_VERSION**: 1.0.1
- ** CURRENT_PROJECT_VERSION**: 10
- **发布日期**: 2026-04-17
- **状态**: 开发完成，等待验收测试

---

## 一、版本迭代记录

### v1.3.2 (2026-04-17)
**目标**: 修复 v1.3.1 验收测试中的 3 个 Bug

#### Bug 修复详情

**Bug#1 - 小范围划线不能解锁**
- **现象**: 划线解锁小范围不生效
- **根因**: `finishDrawing` 中小范围检测分支执行了 `this.lastUnlockPercent = 0`，导致累计进度被重置
- **修复位置**: `src/game/engine.ts` - `finishDrawing` 方法
- **修复方案**: 移除小范围检测分支中的 `this.lastUnlockPercent = 0`，保留已累计进度
- **代码变更**:
  ```typescript
  // v1.3.2 Bug#1 修复：不重置 lastUnlockPercent，保留已累计进度
  if (percent < this.MIN_UNLOCK_RATIO) {
      if (this.originalActivePolygon) {
          this.activePolygon = this.originalActivePolygon;
      }
      this.isDrawing = false;
      this.drawPath = [];
      this.drawStart = null;
      audioManager.stopDrawSFX();
      return;  // 不再设置 this.lastUnlockPercent = 0
  }
  ```

**Bug#2 - 命数异常消耗（多条命情况下直接清零）**
- **现象**: 5→4→3→2→1→0 有时不行，比如没有-1，或者多条命情况下直接清零
- **根因**: `cancelDraw` 命耗尽时未立即停止引擎 loop，导致碰撞链触发多次 `cancelDraw`
- **修复位置**: `src/game/engine.ts` - `cancelDraw` 方法
- **修复方案**:
  1. 添加 `cancelDrawInProgress` 防重入标志
  2. 命耗尽时立即设置 `this.isRunning = false` 并 `cancelAnimationFrame`
  3. 确保 `onLivesZero` 回调只执行一次
- **代码变更**:
  ```typescript
  private cancelDraw() {
      if (this.cancelDrawInProgress) return;  // 防重入
      this.cancelDrawInProgress = true;
      this.lives--;
      if (this.lives > 0) {
          // v1.3.2 防御：确保 drawPath 不为空再恢复位置
          if (this.drawPath.length > 0) {
              this.playerPos = { ...this.drawPath[0] };
          } else if (this.drawStart) {
              this.playerPos = { ...this.drawStart.point };
          }
          // ... 恢复绘制状态
          this.cancelDrawInProgress = false;
          return;
      }
      // Bug#2/3 修复：命耗尽时立即停止引擎 loop
      this.isRunning = false;
      cancelAnimationFrame(this.animationId);
      this.isDrawing = false;
      this.drawPath = [];
      this.drawStart = null;
      audioManager.stopDrawSFX();
      audioManager.triggerHaptic();
      if (this.onLivesZero) {
          this.onLivesZero();
      }
      this.cancelDrawInProgress = false;
  }
  ```

**Bug#3 - 失败界面不显示**
- **现象**: 没看到 YOU LOSE 界面
- **根因**: `cancelDraw` 命耗尽时未调用 `onLivesZero` 回调，导致 React 状态未更新
- **修复位置**: `src/game/GameCanvas.tsx` - `onLivesZero` 回调
- **修复方案**: 在 `onLivesZero` 中添加 `setEngineLives(0)` 确保失败时 LivesDisplay 显示正确
- **代码变更**:
  ```typescript
  onLivesZero: () => {
      if (gameEndedRef.current) return;
      gameEndedRef.current = true;
      engine.stop();  // 幂等，engine 内部已停止
      setEngineLives(0);  // Bug#3 修复：确保同步最终命数
      endGame(false, engine.lastUnlockPercent, engine.levelTimeElapsed, false);
  }
  ```

**附加修复 - checkCollisions 冗余重置**
- **位置**: `src/game/engine.ts` - `checkCollisions` 方法
- **修复**: 移除对 `this.drawStart` 的冗余重置，确保 player 位置保持正确

---

## 二、构建信息

### 构建命令
```bash
cd /Users/hj/Downloads/Line Reveal/LineReveal
npm run build                          # Vite 构建 (292.17 KB)
npx cap copy ios                      # 同步到 iOS
cd ios/App
xcodebuild -project App.xcodeproj -scheme "Line Reveal" \
    -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
```

### Bundle 信息
- **JS Bundle**: `dist/assets/index-*.js` (292.17 KB gzip: 87.31 KB)
- **CSS**: `dist/assets/web-*.css` (63.89 KB gzip: 9.63 KB)
- **Xcode DerivedData**: `/Users/hj/Library/Developer/Xcode/DerivedData/App-*/Build/Products/Debug-iphonesimulator/Line Reveal.app`

### 模拟器信息
- **simB UDID**: `FF5368A5-E3F3-4200-B4C7-4ACD851CDCD7`
- **设备**: iPhone 17 Pro (iOS 26.4)
- **App Bundle ID**: `com.linereveal.game`
- **App PID**: 每次启动不同

---

## 三、测试信息

### 自动化测试
- **静态代码检查**: `tests/auto-test-v1.3.2.html` - 20/20 通过
- **模拟器自动化**: 遇到 macOS 辅助功能权限限制

### 模拟器测试受阻
**问题**: macOS 辅助功能权限限制
- 所有触摸模拟工具失败（cliclick、CGEvent、AppleScript）
- 错误码: -25211 "osascript" 不允许辅助访问
- App 可以正常启动和截图，但无法触发触摸事件

**解决方向**:
1. 用户需在 系统设置 → 隐私与安全性 → 辅助功能 中授权
2. 或使用 Xcode Instruments UIAutomation
3. 或手动测试

### 手动测试步骤
1. 安装 v1.3.2 App 到模拟器
2. 启动 App，进入 Chapter 1-1
3. 执行小范围划线（<5%画布），验证是否保留进度
4. 执行大范围划线触发碰撞，验证命数逐减
5. 命耗尽后验证 YOU LOSE 界面显示
6. 点击 Try Again 验证返回选关

---

## 四、验收标准

### Bug#1 验收
- [ ] 执行小范围划线（<5%画布）
- [ ] 再次执行小范围划线，进度累加而非重置
- [ ] 执行大范围划线，正常解锁

### Bug#2 验收
- [ ] 第一次碰撞：命数从5减到4
- [ ] 第二次碰撞：命数从4减到3
- [ ] ...依次递减
- [ ] 最后一次碰撞：命数从1减到0，显示 YOU LOSE

### Bug#3 验收
- [ ] 命耗尽后显示 YOU LOSE 界面
- [ ] YOU LOSE 界面包含 "YOU LOSE" 文字
- [ ] 显示 Try Again 按钮
- [ ] 点击 Try Again 返回章节选择

### 回归检查
- [ ] Victory 界面仍然正常显示
- [ ] 划线功能正常
- [ ] 初始命数显示 5 颗桃心

---

## 五、关键文件

| 文件 | 说明 |
|------|------|
| `src/game/engine.ts` | 游戏引擎（Bug#1/2/3 修复） |
| `src/game/GameCanvas.tsx` | Canvas 组件（Bug#3 修复） |
| `src/hooks/useGame.tsx` | 游戏状态管理 |
| `src/components/LivesDisplay.tsx` | 命数显示组件 |
| `src/components/ResultScreen.tsx` | 结果界面 |
| `ios/App/build/` | Xcode 构建产物 |
| `tests/auto-test-v1.3.2.html` | 静态测试报告 |

---

## 六、文档版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.3.1 | 2026-04-16 | 基于 v1.2.9 重建，命系统精简版 |
| 1.3.2 | 2026-04-17 | Bug#1/2/3 修复，代码和文档同步 |

---

*本文档与代码版本一一对应，用于后续查询和回滚*
