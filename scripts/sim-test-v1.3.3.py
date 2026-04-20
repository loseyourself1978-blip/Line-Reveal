#!/usr/bin/env python3
"""v1.3.3 模拟器实机测试"""
import subprocess
import time
import os

WIN_X, WIN_Y = 1099, 36

def run(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout.strip())
    if result.returncode != 0 and "Wrote" not in result.stdout:
        print(f"  [WARN] exit {result.returncode}", result.stderr.strip()[:100])
    return result

def screenshot(name):
    path = f"/Users/hj/Downloads/Line Reveal/v1.3.3-py-{name}.png"
    run(f'xcrun simctl io booted screenshot "{path}"')
    return path

def click_win(rx, ry):
    sx, sy = WIN_X + rx, WIN_Y + ry
    print(f"  [CLICK] screen({sx},{sy})")
    run(f"cliclick c:{sx},{sy}")

def drag_win(rx1, ry1, rx2, ry2):
    sx1, sy1 = WIN_X + rx1, WIN_Y + ry1
    sx2, sy2 = WIN_X + rx2, WIN_Y + ry2
    print(f"  [DRAG] ({sx1},{sy1}) → ({sx2},{sy2})")
    # Use mousedown + move + mouseup instead of dd
    run(f"cliclick m:{sx1},{sy1}")
    time.sleep(0.05)
    run(f"cliclick {sx2},{sy2}")
    time.sleep(0.05)
    run(f"cliclick M:{sx2},{sy2}")

print("=" * 50)
print("v1.3.3 模拟器实机测试")
print("=" * 50)

# 1. 重启 app
print("\n[1] 重启 app")
run("xcrun simctl terminate booted com.linereveal.game 2>/dev/null || true")
time.sleep(1)
run("xcrun simctl launch booted com.linereveal.game 2>&1")
time.sleep(3)
screenshot("00-home")

# 2. 进入游戏
print("\n[2] 点击进入游戏 (Play)")
click_win(202, 435)
time.sleep(2)
screenshot("01-play")

# 3. 选 Chapter 1
print("\n[3] 选择 Chapter 1")
click_win(202, 300)
time.sleep(2)
screenshot("02-chapter1")

# 4. 开始 Level 1
print("\n[4] 开始 Level 1")
click_win(202, 400)
time.sleep(3)
screenshot("03-level1")

# 5. Bug#B 测试: 多次划线验证累计百分比
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
print("\n[6] 等待并截图最终状态")
time.sleep(3)
screenshot("08-final")

# 列出截图
print("\n" + "=" * 50)
print("测试完成! 截图列表:")
print("=" * 50)
shots = sorted([f for f in os.listdir("/Users/hj/Downloads/Line Reveal") 
                if f.startswith("v1.3.3-py-") and f.endswith(".png")])
for s in shots:
    path = f"/Users/hj/Downloads/Line Reveal/{s}"
    size = os.path.getsize(path)
    print(f"  {s}  ({size//1024} KB)")

print("\n关键截图说明:")
print("  v1.3.3-py-03-level1.png  - 游戏加载，精灵是否正常移动（无NaN飞走）")
print("  v1.3.3-py-05-draw1.png   - 第一次划线后")
print("  v1.3.3-py-07-draw3.png   - 第三次划线后，验证累计百分比")
print("  v1.3.3-py-08-final.png  - 最终状态（通关/Win界面 或 失败/Lost界面）")
