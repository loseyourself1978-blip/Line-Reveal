#!/usr/bin/env python3
"""v1.3.3 模拟器实机测试 - 使用 CGEvent 模拟真实触摸"""
import subprocess
import time
import os
from Quartz import CGEventCreateMouseEvent, CGEventCreateKeyboardEvent, kCGHIDEventTap
from Quartz import kCGEventLeftMouseDown, kCGEventLeftMouseUp, kCGEventMouseMoved

WIN_X, WIN_Y = 1099, 36

def run(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    out = result.stdout.strip()
    if out:
        print(f"  {out}")
    return result

def screenshot(name):
    path = f"/Users/hj/Downloads/Line Reveal/v1.3.3-cg-{name}.png"
    run(f'xcrun simctl io booted screenshot "{path}"')
    return path

def cg_click(sx, sy):
    """使用 CGEvent 模拟点击"""
    print(f"  [CG-CLICK] ({sx},{sy})")
    # Mouse down
    down = CGEventCreateMouseEvent(None, kCGEventLeftMouseDown, (sx, sy))
    CGEventPost(kCGHIDEventTap, down)
    time.sleep(0.05)
    # Mouse up
    up = CGEventCreateMouseEvent(None, kCGEventLeftMouseUp, (sx, sy))
    CGEventPost(kCGHIDEventTap, up)

def cg_drag(sx1, sy1, sx2, sy2):
    """使用 CGEvent 模拟拖拽"""
    print(f"  [CG-DRAG] ({sx1},{sy1}) → ({sx2},{sy2})")
    # Mouse down at start
    down = CGEventCreateMouseEvent(None, kCGEventLeftMouseDown, (sx1, sy1))
    CGEventPost(kCGHIDEventTap, down)
    time.sleep(0.05)
    # Move to end (holding)
    for i in range(5):
        t = (i + 1) / 5.0
        mx = int(sx1 + (sx2 - sx1) * t)
        my = int(sy1 + (sy2 - sy1) * t)
        move = CGEventCreateMouseEvent(None, kCGEventMouseMoved, (mx, my))
        CGEventPost(kCGHIDEventTap, move)
        time.sleep(0.02)
    time.sleep(0.05)
    # Mouse up at end
    up = CGEventCreateMouseEvent(None, kCGEventLeftMouseUp, (sx2, sy2))
    CGEventPost(kCGHIDEventTap, up)

def click_win(rx, ry):
    cg_click(WIN_X + rx, WIN_Y + ry)

def drag_win(rx1, ry1, rx2, ry2):
    cg_drag(WIN_X + rx1, WIN_Y + ry1, WIN_X + rx2, WIN_Y + ry2)

print("=" * 50)
print("v1.3.3 模拟器实机测试 (CGEvent)")
print("=" * 50)

# 1. 重启 app
print("\n[1] 重启 app")
run("xcrun simctl terminate booted com.linereveal.game 2>/dev/null || true")
time.sleep(1)
run("xcrun simctl launch booted com.linereveal.game 2>&1")
time.sleep(3)
screenshot("00-home")

# 2. 进入游戏 - 尝试点击窗口中心偏下
print("\n[2] 点击进入游戏 (PLAY)")
click_win(202, 500)  # 稍微偏下一点
time.sleep(2)
screenshot("01-play")

# 3. 选择 Chapter 1
print("\n[3] 选择 Chapter 1")
click_win(202, 300)
time.sleep(2)
screenshot("02-chapter1")

# 4. 开始 Level 1
print("\n[4] 开始 Level 1")
click_win(202, 400)
time.sleep(3)
screenshot("03-level1")

# 5. Bug#B 测试: 多次划线
print("\n[5] Bug#B 测试: 3次大范围划线")
print("  划线1: 左上→右下")
drag_win(50, 200, 350, 700)
time.sleep(1)
screenshot("05-draw1")

print("  划线2: 右上→左下")
drag_win(350, 200, 50, 700)
time.sleep(1)
screenshot("06-draw2")

print("  划线3: 上→下")
drag_win(202, 100, 202, 750)
time.sleep(3)
screenshot("07-draw3")

# 6. 最终状态
print("\n[6] 最终状态")
time.sleep(3)
screenshot("08-final")

# 列出截图
print("\n" + "=" * 50)
print("测试完成! 截图列表:")
print("=" * 50)
shots = sorted([f for f in os.listdir("/Users/hj/Downloads/Line Reveal") 
                if f.startswith("v1.3.3-cg-") and f.endswith(".png")])
for s in shots:
    path = f"/Users/hj/Downloads/Line Reveal/{s}"
    size = os.path.getsize(path)
    print(f"  {s}  ({size//1024} KB)")
