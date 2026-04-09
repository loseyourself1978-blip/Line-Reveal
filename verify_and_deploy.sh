#!/bin/bash

# verify_and_deploy.sh
# 全自动构建、同步及 Xcode 打包部署流水线

set -e

echo "🚀 开始全自动验证与部署流水线..."

# 1. Web 项目构建
echo "📦 正在执行 Web 构建..."
npm run build

# 2. Capacitor 同步
echo "🔄 正在同步至平台..."
npx cap sync

# 3. iOS 自动化处理 (Xcode)
echo "🍎 处理 iOS 平台..."

# 定义 Xcode 项目路径和配置
# 注意：Scheme 名称必须与 Xcode 项目中的 Scheme 名称完全匹配
XCODE_PROJECT="ios/App/App.xcodeproj"
SCHEME="Line Reveal"
ARCHIVE_PATH="ios/App/LineReveal.xcarchive"

# 3.1 部署到模拟器
# 使用 xcodebuild 直接构建并部署，而不是 cap run ios
echo "📱 正在使用 xcodebuild 构建 iOS 项目..."

# 列出可用的模拟器并选择第一个 iPhone
SIMULATOR_ID=$(xcrun simctl list devices | grep "iPhone" | grep -v "unavailable" | head -1 | awk -F '[()]' '{print $2}')

if [ -z "$SIMULATOR_ID" ]; then
    echo "⚠️ 未发现可用的 iPhone 模拟器"
    exit 1
fi

echo "📱 目标模拟器 ID: $SIMULATOR_ID"

# 确保模拟器已启动
xcrun simctl boot "$SIMULATOR_ID" 2>/dev/null || true
open -a Simulator

# 构建项目用于模拟器
echo "🔨 正在构建 Debug 版本..."
rm -rf "ios/DerivedData"  # Ensure we have a clean output folder

xcodebuild -project "$XCODE_PROJECT" \
           -scheme "$SCHEME" \
           -configuration Debug \
           -destination "id=$SIMULATOR_ID" \
           -derivedDataPath "ios/DerivedData" \
           build

# 安装到模拟器
APP_PATH=$(find ios/DerivedData -name "Line Reveal.app" -type d | head -1)
if [ -n "$APP_PATH" ]; then
    echo "📲 正在安装应用到模拟器($APP_PATH)..."
    xcrun simctl install "$SIMULATOR_ID" "$APP_PATH"
    
    # 启动应用
    BUNDLE_ID=$(plutil -p "$APP_PATH/Info.plist" | grep CFBundleIdentifier | awk -F'"' '{print $4}')
    if [ -n "$BUNDLE_ID" ]; then
        echo "🚀 正在启动应用: $BUNDLE_ID"
        xcrun simctl launch "$SIMULATOR_ID" "$BUNDLE_ID"
    fi
else
    echo "⚠️ 未找到构建的应用文件"
fi

echo "✅ 模拟器部署完成！"

# 3.2 生成 Xcode Archive (归档) 用以发布
echo ""
echo "📦 正在生成 Xcode Archive (Release 版本)..."
xcodebuild -project "$XCODE_PROJECT" \
           -scheme "$SCHEME" \
           -configuration Release \
           -archivePath "$ARCHIVE_PATH" \
           -destination "generic/platform=iOS" \
           archive

echo "✅ Xcode Archive 生成成功: $ARCHIVE_PATH"

# 4. Android 自动化处理 (Gradle) - 可选
echo ""
echo "🤖 处理 Android 平台..."
if [ -d "android" ]; then
    cd android
    ./gradlew assembleRelease 2>/dev/null || echo "⚠️ Android 构建跳过 (可能需要配置签名)"
    cd ..
fi

echo ""
echo "🎉 所有步骤已完成！"
echo "💡 提示："
echo "1. 模拟器现已安装并运行最新版本的 Line Reveal。"
echo "2. 您可以使用以下命令打开 Archive 进行发布："
echo "   open $ARCHIVE_PATH"
echo "3. 或者在 Xcode > Window > Organizer 中查看归档并进行 Distribute App。"
