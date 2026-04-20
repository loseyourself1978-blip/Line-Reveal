#!/bin/bash
# v1.3.3 模拟器实机测试脚本
# 使用 cliclick 模拟触摸，用 simctl screenshot 验证结果

set -e

WIN_X=1099
WIN_Y=36
WIN_W=405
WIN_H=870

SCREENSHOT_DIR="/Users/hj/Downloads/Line Reveal"
SIM_ID="FF5368A5-E3F3-4200-B4C7-4ACD851CDCD7"

# 截图函数
screenshot() {
    xcrun simctl io booted screenshot "$SCREENSHOT_DIR/v1.3.3-sim-$1.png 2>&1 | grep "Wrote"
}

# 点击窗口内坐标
click_win() {
    local rx=$1 ry=$2
    local sx=$((WIN_X + rx))
    local sy=$((WIN_Y + ry))
    echo "[CLICK] screen($sx,$sy) win($rx,$ry)"
    cliclick c:$sx,$sy
}

# 按下窗口内坐标（mousedown）
mousedown_win() {
    local rx=$1 ry=$2
    local sx=$((WIN_X + rx))
    local sy=$((WIN_Y + ry))
    cliclick m:$sx,$sy
}

# 释放（mouseup）
mouseup_win() {
    local rx=$1 ry=$2
    local sx=$((WIN_X + rx))
    local sy=$((WIN_Y + ry))
    cliclick M:$sx,$sy
}

# 拖动（从窗口坐标到窗口坐标）
drag_win() {
    local rx1=$1 ry1=$2 rx2=$3 ry2=$4
    local sx1=$((WIN_X + rx1)) sy1=$((WIN_Y + ry1))
    local sx2=$((WIN_X + rx2)) sy2=$((WIN_Y + ry2))
    echo "[DRAG] ($sx1,$sy1) → ($sx2,$sy2)"
    cliclick dc:$sx1,$sy1:$sx2,$sy2
}

echo "=========================================="
echo "v1.3.3 模拟器实机测试"
echo "=========================================="

# 1. 重新启动 app
echo ""
echo "[1/8] 重启 app..."
xcrun simctl terminate booted com.linereveal.game 2>/dev/null || true
sleep 1
xcrun simctl launch booted com.linereveal.game 2>&1 | grep -o "com.linereveal.game:.*"
sleep 3
screenshot "00-launch"

# 2. 点击进入游戏（窗口中心）
echo ""
echo "[2/8] 点击进入游戏..."
click_win 202 435
sleep 2
screenshot "01-tapped-play"

# 3. 选择 Chapter 1（假设是 Chapter 按钮）
echo ""
echo "[3/8] 选择 Chapter 1..."
click_win 202 300
sleep 2
screenshot "02-chapter1"

# 4. 开始 Level 1
echo ""
echo "[4/8] 点击开始 Level 1..."
click_win 202 400
sleep 2
screenshot "03-level1-start"

# 5. 等待游戏加载
echo ""
echo "[5/8] 等待游戏加载..."
sleep 2
screenshot "04-game-loaded"

# 6. 执行 Bug#B 测试：多次划线，验证累计百分比
#    精灵在左侧中央，从左往右划一条大线
echo ""
echo "[6/8] Bug#B 测试：累计解锁百分比"
echo "  - 第1次划线：从左上到右下"
drag_win 50 200 350 700
sleep 1
screenshot "05-draw1"
echo "  - 第2次划线：从右上到左下"
drag_win 350 200 50 700
sleep 1
screenshot "06-draw2"
echo "  - 第3次划线：从上到下"
drag_win 202 100 202 750
sleep 2
screenshot "07-draw3"

# 7. 检查是否通关
echo ""
echo "[7/8] 检查游戏状态..."
sleep 2
screenshot "08-final-state"

# 8. 输出测试结果（通过截图人工确认）
echo ""
echo "=========================================="
echo "测试完成！请检查截图："
echo "  v1.3.3-sim-03-level1-start.png  - 游戏是否正常加载"
echo "  v1.3.3-sim-04-game-loaded.png  - 精灵是否正常移动（无NaN飞走）"
echo "  v1.3.3-sim-07-draw3.png        - 累计百分比是否正确"
echo "  v1.3.3-sim-08-final-state.png  - 最终状态（通关/失败）"
echo ""
echo "截图目录: $SCREENSHOT_DIR"
ls -la "$SCREENSHOT_DIR"/v1.3.3-sim-*.png | awk '{print "  " $NF " (" $5 " bytes)"}'
echo "=========================================="
