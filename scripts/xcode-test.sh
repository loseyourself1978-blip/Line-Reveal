#!/bin/bash
# Line Reveal v1.4.0 - Xcode 模拟器自动化测试脚本
# 用法：./scripts/xcode-test.sh

set -e

PROJECT_DIR="/Users/hj/Downloads/Line Reveal/LineReveal"
IOS_DIR="$PROJECT_DIR/ios"
SIMULATOR_NAME="iPhone 15 Pro"

echo "======================================"
echo "Line Reveal v1.4.0 Xcode 模拟器测试"
echo "======================================"
echo ""

# Step 1: 构建 Web 产物
echo "[1/5] 构建 Web 产物..."
cd "$PROJECT_DIR"
npm run build
echo "✓ Web 构建完成"
echo ""

# Step 2: 同步到 iOS
echo "[2/5] 同步到 iOS 项目..."
npx cap sync ios
echo "✓ Cap 同步完成"
echo ""

# Step 3: 构建 iOS 项目
echo "[3/5] 构建 iOS 项目..."
cd "$IOS_DIR/App"
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -destination "platform=iOS Simulator,name=$SIMULATOR_NAME" \
  clean build
echo "✓ iOS 构建完成"
echo ""

# Step 4: 启动模拟器
echo "[4/5] 启动 iOS 模拟器..."
xcrun simctl boot "$SIMULATOR_NAME" 2>/dev/null || echo "模拟器已在运行"
open -a Simulator
echo "✓ 模拟器已启动"
echo ""

# Step 5: 安装并运行 App
echo "[5/5] 安装 App 到模拟器..."
APP_PATH="$IOS_DIR/App/build/Build/Products/Debug-iphonesimulator/App.app"
xcrun simctl install booted "$APP_PATH"
xcrun simctl launch booted com.linereveal.game
echo "✓ App 已启动"
echo ""

echo "======================================"
echo "测试完成！请在模拟器中手动验证："
echo "1. 完成关卡 1-1"
echo "2. 观察通关时背景渐显动画（2.5 秒）"
echo "3. 确认 ResultScreen 延迟显示"
echo "======================================"
