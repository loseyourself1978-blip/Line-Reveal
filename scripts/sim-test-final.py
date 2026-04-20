#!/usr/bin/env python3
"""v1.3.3 模拟器实机测试 - 使用 cliclick dd/dm/du 拖拽"""
import subprocess
import time
import os

WIN_X, WIN_Y = 1099, 36

def run(cmd, verbose=True):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if verbose and result.stdout.strip():
        for line in result.stdout.strip().split('\n'):
            if line.strip():
                print(f"  {line}")
    if result.returncode != 0:
        err = result.stderr.strip().split('\n')[-1] if result.stderr.strip() else ""
        if err and "Wrote" not in result.stdout:
            print(f"  [WARN] exit {result.returncode}: {err[:80]}")
    return result

def screenshot(name):
    path = f"/Users/hj/Downloads/Line Reveal/v1.3.3-final-{name}.png"
    run(f'xcrun simctl io booted screenshot "{path}"')
    return path

def click_win(rx, ry):
    sx, sy = WIN_X + rx, WIN_Y + ry
    print(f"  [CLICK] screen({sx},{sy})")
    run(f"cliclick c:{sx},{sy}", verbose=False)

def drag_win(rx1, ry1, rx2, ry2):
    """cliclick 拖拽: dd → dm → du"""
    sx1, sy1 = WIN_X + rx1, WIN_Y + ry1
    sx2, sy2 = WIN_X + rx2, WIN_Y + ry2
    print(f"  [DRAG] ({sx1},{sy1}) → ({sx2},{sy2})")
    # 拆分为多段模拟平滑拖动
    steps = 10
    run(f"cliclick dd:{sx1},{sy1}", verbose=False)
    time.sleep(0.02)
    for i in range(1, steps):
        t = i / steps
        mx = int(sx1 + (sx2 - sx1) * t)
        my = int(sy1 + (sy2 - sy1) * t)
        run(f"cliclick dm:{mx},{my}", verbose=False)
        time.sleep(0.015)
    run(f"cliclick du:{sx2},{sy2}", verbose=False)

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
print("\n[2] 点击进入游戏 (PLAY)")
click_win(202, 435)
time.sleep(2)
screenshot("01-tapped")

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

# 5. Bug#B 测试: 3次划线验证累计百分比
print("\n[5] Bug#B 测试: 3次大范围划线（验证累计解锁）")
print("  划线1: 左上→右下")
drag_win(50, 200, 350, 700)
time.sleep(1.5)
screenshot("05-draw1")

print("  划线2: 右上→左下")
drag_win(350, 200, 50, 700)
time.sleep(1.5)
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
print("测试完成!")
print("=" * 50)
shots = sorted([f for f in os.listdir("/Users/hj/Downloads/Line Reveal") 
                if f.startswith("v1.3.3-final-") and f.endswith(".png")])
for s in shots:
    path = f"/Users/hj/Downloads/Line Reveal/{s}"
    size = os.path.getsize(path)
    print(f"  {s}  ({size//1024} KB)")

print("\n关键截图说明:")
print("  03-level1.png  → 游戏加载，精灵是否正常移动（无NaN飞走）")
print("  05-draw1.png   → 第1次划线后，百分比是否正确更新")
print("  07-draw3.png   → 第3次划线后（累计应≥70%，触发胜利）")
print("  08-final.png   → 最终状态：Win界面 = Bug#B修复成功")
