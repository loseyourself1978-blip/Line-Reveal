# Line Reveal 标准化工作流程

> **版本**: v1.5.1
> **创建日期**: 2026-04-29
> **最后更新**: 2026-04-29

## 概述

本文档定义了代码更新 → 构建 → 测试 → GitHub 提交的标准化流程。所有改动必须遵循此流程。

## GitHub 信息

- **账号**: loseyourself1978@gmail.com
- **仓库**: loseyourself1978-blip/Line-Reveal
- **分支策略**: 主分支 `main`，功能开发使用特性分支

---

## 标准工作流程

### 阶段 1: 代码修改

1. 在 `src/` 目录下修改代码
2. 修改完成后，记录改动内容到产品文档
3. 更新 `VERSION_HISTORY.md`（版本号、改动描述、日期）

### 阶段 2: Web 构建

```bash
cd /Users/hj/Downloads/Line\ Reveal/LineReveal

# 清理旧构建
rm -rf dist

# Web 构建
npx vite build
```

### 阶段 3: iOS 同步

```bash
# 同步到 iOS
npx cap sync ios
```

### 阶段 4: 自动化测试

```bash
# 运行 Playwright 自动化测试
cd /Users/hj/Downloads/Line\ Reveal/LineReveal/tests

# 使用 Node 运行测试
node run-auto-test.cjs
```

测试将在浏览器中打开 `auto-test-v1.5.x.html`，显示实时测试过程。

**测试检查项**:
- [ ] 模拟器启动成功
- [ ] App 启动成功
- [ ] Pinball 模式可进入
- [ ] 砖块不透明（可辨识颜色）
- [ ] 背景图片比例正常（无拉伸）
- [ ] 右上角显示生命桃心
- [ ] 无控制台错误

### 阶段 5: GitHub 提交

```bash
cd /Users/hj/Downloads/Line\ Reveal/LineReveal

# 添加所有改动
git add .

# 提交（使用 /commit 命令）
git /commit -m "feat(pinball): v1.5.1 - 修复砖块透明度、背景比例、生命系统

- Bugfix: 砖块改为不透明（rgba 0.85-0.9）
- Bugfix: 背景图片保持原始比例（letterbox）
- Bugfix: 接入全局生命系统（engineLives）
- 添加 LivesDisplay 到 Pinball 右上角
- 通关时增加生命（上限5命）
- 生命耗尽时触发失败"

# 推送到远程
git push origin main
```

### 阶段 6: 验收确认

1. 打开 GitHub 仓库确认提交成功
2. 在模拟器上运行 App 确认功能正常
3. 测试所有修复项是否生效

---

## 版本号规则

- **主版本号**: 大版本迭代（如 v1.5）
- **次版本号**: 功能更新（如 v1.5.1）
- **Build 号**: iOS 构建号，每次提交递增

### 当前版本状态

| 项目 | 值 |
|------|-----|
| MARKETING_VERSION | 1.1.0 |
| CURRENT_PROJECT_VERSION | 13 |
| Git Commit | ae6b896 |

---

## 产品文档更新要求

每次代码更新必须同步更新以下文档：

1. **VERSION_HISTORY.md** - 版本历史记录
2. **docs/PROD_SPEC_v1.5.x.md** - 产品规格说明
3. **内存文件** - `/Users/hj/Downloads/Line Reveal/.workbuddy/memory/MEMORY.md`

---

## 风险命令确认

以下命令需要用户确认后执行：

- `rm -rf dist` - 清理构建目录
- `git push --force` - 强制推送（一般不使用）
- `xcodebuild clean` - 清理 Xcode 构建缓存

---

## 自动化测试脚本

测试脚本位置: `tests/run-auto-test.cjs`

测试使用 Playwright 在浏览器中模拟用户操作：
1. 打开本地构建的 App
2. 选择 Pinball 模式
3. 验证视觉和功能正确性

---

## 回滚流程

如发现问题需要回滚：

```bash
# 查看最近提交
git log --oneline -5

# 回滚到指定提交
git revert <commit-hash>

# 或创建新提交撤销改动
git checkout <commit-hash> -- <file>
```

---

## 联系人

- **开发者**: hj
- **GitHub**: loseyourself1978@gmail.com
