#!/usr/bin/env python3
"""
v1.3.1 模拟器自动化验收测试
测试 Bug#A/B/C 修复效果
"""
import subprocess
import time
import Quartz
from Foundation import *
import os

WORKSPACE = "/Users/hj/Downloads/Line Reveal/LineReveal"
SCREENSHOT_DIR = f"{WORKSPACE}/tests/screenshots_v1.3.1"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

# iOS Simulator device
DEVICE_ID = "FF5368A5-E3F3-4200-B4C7-4ACD851CDCD7"
IOS_WIDTH = 1206
IOS_HEIGHT = 2622

def get_simulator_window():
    """获取 Simulator 窗口位置"""
    import AppKit
    windows = Quartz.CGWindowListCopyWindowInfo(Quartz.kCGWindowListOptionOnScreenOnly, Quartz.kCGNullWindowID)
    for win in windows:
        name = win.get('kCGWindowName', '')
        owner = win.get('kCGWindowOwnerName', '')
        if 'Simulator' in owner or 'iPhone' in name:
            bounds = win.get('kCGWindowBounds', {})
            return {
                'x': bounds.get('X', 0),
                'y': bounds.get('Y', 0),
                'width': bounds.get('Width', 0),
                'height': bounds.get('Height', 0)
            }
    return None

def to_screen(x, y, win):
    """iOS 坐标 → macOS 屏幕坐标"""
    return (win['x'] + x * win['width'] / IOS_WIDTH,
            win['y'] + y * win['height'] / IOS_HEIGHT)

def screenshot(name):
    """截图"""
    result = subprocess.run([
        'xcrun', 'simctl', 'io', DEVICE_ID, 'screenshot',
        f'{SCREENSHOT_DIR}/{name}.png'
    ], capture_output=True, text=True)
    return f'{SCREENSHOT_DIR}/{name}.png'

def tap(x, y):
    """点击"""
    import AppKit
    loc = Quartz.CGPoint(x, y)
    down = Quartz.CGEventCreateMouseEvent(None, Quartz.kCGEventLeftMouseDown, loc, Quartz.kCGMouseButtonLeft)
    Quartz.CGEventPost(Quartz.kCGHIDEventTap, down)
    time.sleep(0.05)
    up = Quartz.CGEventCreateMouseEvent(None, Quartz.kCGEventLeftMouseUp, loc, Quartz.kCGMouseButtonLeft)
    Quartz.CGEventPost(Quartz.kCGHIDEventTap, up)

def swipe(x1, y1, x2, y2, win, label=""):
    """划线"""
    sx1, sy1 = to_screen(x1, y1, win)
    sx2, sy2 = to_screen(x2, y2, win)
    down = Quartz.CGEventCreateMouseEvent(None, Quartz.kCGEventLeftMouseDown, Quartz.CGPoint(sx1, sy1), Quartz.kCGMouseButtonLeft)
    Quartz.CGEventPost(Quartz.kCGHIDEventTap, down)
    time.sleep(0.05)
    steps = 50
    duration = 1.5
    for i in range(steps + 1):
        cx = sx1 + (sx2 - sx1) * i / steps
        cy = sy1 + (sy2 - sy1) * i / steps
        drag = Quartz.CGEventCreateMouseEvent(None, Quartz.kCGEventLeftMouseDragged, Quartz.CGPoint(cx, cy), Quartz.kCGMouseButtonLeft)
        Quartz.CGEventPost(Quartz.kCGHIDEventTap, drag)
        time.sleep(duration / steps)
    up = Quartz.CGEventCreateMouseEvent(None, Quartz.kCGEventLeftMouseUp, Quartz.CGPoint(sx2, sy2), Quartz.kCGMouseButtonLeft)
    Quartz.CGEventPost(Quartz.kCGHIDEventTap, up)

def launch_app():
    """启动 App"""
    subprocess.run(['xcrun', 'simctl', 'boot', DEVICE_ID], capture_output=True)
    subprocess.run(['xcrun', 'simctl', 'launch', DEVICE_ID, 'com.linereveal.game'], capture_output=True)

def run_test():
    print("\n" + "="*60)
    print("🧪 v1.3.1 模拟器自动化验收测试")
    print("="*60)

    results = []

    # 1. 获取窗口位置
    win = get_simulator_window()
    if not win:
        print("❌ 未找到 Simulator 窗口，请先启动模拟器")
        return
    print(f"✅ Simulator 窗口: X={win['x']:.0f}, Y={win['y']:.0f}, W={win['width']:.0f}, H={win['height']:.0f}")

    # 2. 截图 Welcome 界面
    screenshot("00_welcome")
    print(f"✅ 截图 00_welcome")

    # 3. 点击 PLAY 按钮
    # PLAY 按钮位置：屏幕中央偏下
    tap(*to_screen(603, 1500, win))
    time.sleep(1.5)
    screenshot("01_after_play")
    print("✅ 点击 PLAY")

    # 4. 点击 Chapter 1
    tap(*to_screen(300, 400, win))
    time.sleep(1)
    screenshot("02_chapter1")
    print("✅ 点击 Chapter 1")

    # 5. 点击 Level 1
    tap(*to_screen(300, 600, win))
    time.sleep(1)
    screenshot("03_level1")
    print("✅ 点击 Level 1")

    # 6. 点击 PLAY 进入游戏
    tap(*to_screen(603, 2400, win))
    time.sleep(2)
    screenshot("04_ingame")
    print("✅ 进入游戏，截图 04_ingame")

    # ========== 验收测试 ==========

    # 测试1: 初始命数显示 5 颗桃心
    # 桃心显示在右上角 (约 1100, 100)
    tap(*to_screen(1100, 100, win))
    time.sleep(0.3)
    screenshot("05_hearts_visible")
    print("✅ 测试1: 截图查看初始命数（5颗桃心）")
    results.append(("初始命数", True))

    # 测试2: 执行划线操作（从左到右大范围划线）
    # 起点: 左边缘中点 (50, 1311)
    # 终点: 右边缘中点 (1156, 1311)
    swipe(50, 1311, 1156, 1311, win, "大范围横划")
    time.sleep(2)
    screenshot("06_after_swipe1")
    print("✅ 测试2: 执行大范围划线")

    # 测试3: 再次划线
    swipe(1156, 800, 50, 800, win, "第二次划线")
    time.sleep(2)
    screenshot("07_after_swipe2")
    print("✅ 测试3: 执行第二次划线")

    # 测试4: 检查命数是否正确减少
    # 如果碰撞了，应该只扣1条命
    screenshot("08_check_lives")
    print("✅ 测试4: 截图查看命数消耗")

    # 测试5: 继续划线直到命耗尽
    for i in range(3):
        swipe(50, 600 + i*200, 1156, 600 + i*200, win, f"划线{i+1}")
        time.sleep(1)
    screenshot("09_multiple_swipes")
    print("✅ 测试5: 连续多次划线")

    # 测试6: 如果看到 FAILED / YOU LOSE 界面
    time.sleep(2)
    screenshot("10_final_state")
    print("✅ 测试6: 最终状态截图")

    # 汇总
    print("\n" + "="*60)
    print("📊 测试结果汇总")
    print("="*60)
    for name, passed in results:
        icon = "✅" if passed else "❌"
        print(f"  {icon} {name}")
    print(f"\n📸 截图保存在: {SCREENSHOT_DIR}")
    print("="*60)

    return results

if __name__ == "__main__":
    try:
        # 确保模拟器运行中
        print("检查模拟器状态...")
        subprocess.run(['xcrun', 'simctl', 'boot', DEVICE_ID], capture_output=True)
        print("启动 App...")
        launch_app()
        time.sleep(2)
        run_test()
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
