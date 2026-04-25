# Line Reveal v1.5.0 迭代计划

**创建时间**: 2026-04-22
**版本**: v1.4.2 (当前稳定版)
**GitHub**: loseyourself1978-blip/Line-Reveal

---

## 当前版本状态 (v1.4.2)

### 已完成功能
- ✅ 蜘蛛精灵可见性修复（#1a1a2e）
- ✅ Chapter 1-4 共 30 关完整关卡
- ✅ 3 种游戏模式（Classic / Jigsaw / Match-3）
- ✅ 5 种精灵系统
- ✅ 命系统 + 递增冷却
- ✅ 命系统 + 递增冷却
- ✅ 胜利迷雾消散动画（3秒）
- ✅ wow 胜利音效
- ✅ App Icon 更新

### 技术栈
- React 19 + TypeScript + Vite
- Capacitor 8.0.2 (iOS)
- TailwindCSS 4.1

### 已知问题
- [ ] 无 Android 构建（暂不开发）
- [ ] 无 sfx_wow.mp3 专用语音文件（使用 sfx_victory.mp3）
- [ ] App Icon 仅更新 iOS，Android 未更新

---

## v1.5.0 候选功能

### P0 - 紧急
1. **App Store 准备**
   - [ ] 年龄评级材料
   - [ ] 隐私政策页面
   - [ ] 应用描述优化
   - [ ] 截图准备

2. **Bug 修复**
   - [ ] 检查是否有遗留问题

### P1 - 重要
1. **新关卡扩展**
   - [ ] Chapter 5+ 设计
   - [ ] 难度平衡调整

2. **精灵美术**
   - [ ] 蝴蝶精灵图片
   - [ ] 蝎子精灵图片
   - [ ] 蜘蛛精灵图片

3. **音效优化**
   - [ ] 添加 sfx_wow.mp3 专用语音
   - [ ] 更多游戏音效

### P2 - 增强
1. **社交功能**
   - [ ] 通关图片分享
   - [ ] 排行榜系统

2. **每日挑战**
   - [ ] 每日特殊关卡
   - [ ] 奖励系统

3. **性能优化**
   - [ ] WebGL 渲染（如需要）
   - [ ] 关卡预加载

---

## 开发流程

### 标准流程
1. 所有改动记录在 PRD.md
2. 代码版本与文档版本一一对应
3. Git 提交格式：`vX.Y.Z: 功能描述`
4. 自动化测试用例同步更新
5. 推送 GitHub

### 测试流程
1. `npm run build` - Web 构建
2. `npx cap sync ios` - iOS 同步
3. `xcodebuild` - Xcode 构建
4. `simctl launch` - 模拟器验证

---

## GitHub 仓库

**仓库**: https://github.com/loseyourself1978-blip/Line-Reveal
**Token**: 已配置 (ghp_***)

---

## 下一步行动

### 立即执行
1. [ ] 在模拟器验证 App Icon
2. [ ] App Store Connect 注册
3. [ ] 准备审核材料

### 计划中
1. [ ] 设计新关卡
2. [ ] 制作精灵图片资源
3. [ ] 添加专用 wow 语音