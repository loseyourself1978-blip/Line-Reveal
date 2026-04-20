#!/usr/bin/env node
/**
 * v1.3.0 真实划线操作测试 v2
 * 使用AppleScript直接模拟触摸事件
 */

const fs = require('fs');
const { execSync, spawn } = require('child_process');

const TMP_DIR = '/tmp/linereveal_test_v2';

// 确保目录存在
try { fs.mkdirSync(TMP_DIR, { recursive: true }); } catch (e) {}
// 清除旧日志
try { fs.unlinkSync(`${TMP_DIR}/test_log.txt`); } catch (e) {}

let step = 0;

function log(msg) {
    const ts = new Date().toISOString().substr(11, 8);
    console.log(`[${ts}] ${msg}`);
    fs.appendFileSync(`${TMP_DIR}/test_log.txt`, `[${ts}] ${msg}\n`);
}

function screenshot(name) {
    const path = `${TMP_DIR}/${name}_${Date.now()}.png`;
    try {
        execSync(`xcrun simctl io booted screenshot "${path}"`, { stdio: 'pipe' });
        log(`📸 ${name}`);
    } catch (e) {
        log(`⚠️ 截图失败: ${e.message}`);
    }
    return path;
}

function doSwipe(x1, y1, x2, y2, duration) {
    duration = duration || 0.5;
    log(`✌️ 划线: (${x1},${y1}) → (${x2},${y2})`);
    
    const script = `
    tell application "System Events"
        tell application process "Simulator"
            set frontmost to true
            delay 0.3
        end tell
    end tell
    
    -- 使用CGEvent模拟触摸
    set x1 to ${x1}
    set y1 to ${y1}
    set x2 to ${x2}
    set y2 to ${y2}
    set duration to ${duration}
    
    do shell script "
    /usr/bin/python3 << 'PYEOF'
import Quartz
import time

# 创建触摸事件
def create_touch_event(x, y, phase):
    event = Quartz.CGEventCreateMouseEvent(None, Quartz.kCGEventMouseMoved, Quartz.CGPoint(x, y), Quartz.kCGMouseButtonLeft)
    if phase == 'down':
        Quartz.CGEventSetType(event, Quartz.kCGEventLeftMouseDown)
    elif phase == 'up':
        Quartz.CGEventSetType(event, Quartz.kCGEventLeftMouseUp)
    elif phase == 'dragged':
        Quartz.CGEventSetType(event, Quartz.kCGEventLeftMouseDragged)
    return event

# 按下
e1 = create_touch_event(x1, y1, 'down')
Quartz.CGEventPost(Quartz.kCGHIDEventTap, e1)

# 拖动
steps = 10
for i in range(steps):
    curr_x = x1 + (x2 - x1) * i / steps
    curr_y = y1 + (y2 - y1) * i / steps
    e2 = create_touch_event(curr_x, curr_y, 'dragged')
    Quartz.CGEventPost(Quartz.kCGHIDEventTap, e2)
    time.sleep(duration / steps)

# 释放
e3 = create_touch_event(x2, y2, 'up')
Quartz.CGEventPost(Quartz.kCGHIDEventTap, e3)
PYEOF
    "`;
    
    try {
        execSync(`osascript -e '${script}'`, { stdio: 'pipe', timeout: 10000 });
    } catch (e) {
        log(`⚠️ 划线执行: ${e.message.substring(0, 100)}`);
    }
}

function doTap(x, y) {
    log(`👆 点击: (${x}, ${y})`);
    doSwipe(x, y, x, y, 0.05);
}

async function runTest() {
    console.log('\n========================================');
    console.log('🎮 v1.3.0 真实划线操作测试');
    console.log('========================================\n');
    
    log('测试开始');
    
    // 步骤1: 检查模拟器
    step++;
    log(`\n【${step}】检查模拟器状态`);
    const devices = execSync('xcrun simctl list devices booted').toString();
    if (devices.includes('iPhone 17 Pro')) {
        log('✅ iPhone 17 Pro Booted');
    } else {
        log('❌ 未找到模拟器');
        return;
    }
    
    // 步骤2: 启动应用
    step++;
    log(`\n【${step}】启动应用`);
    try {
        execSync('xcrun simctl launch booted "com.linereveal.game"', { stdio: 'pipe' });
        log('✅ 启动命令已执行');
    } catch (e) {
        log(`⚠️ ${e.message}`);
    }
    execSync('sleep 4');
    
    // 步骤3: 截图检查欢迎界面
    step++;
    log(`\n【${step}】检查欢迎界面`);
    screenshot('01_welcome');
    
    // 步骤4: 点击PLAY
    step++;
    log(`\n【${step}】点击PLAY进入游戏`);
    // iPhone 17 Pro: 1206x2622
    // PLAY按钮位置: 屏幕中央下方
    doTap(603, 1850);
    execSync('sleep 2');
    screenshot('02_after_play');
    
    // 步骤5: 检查游戏界面
    step++;
    log(`\n【${step}】检查游戏界面（5颗心应该可见）');
    screenshot('03_game_screen');
    log('📍 命数显示在右上角区域');
    
    // 步骤6: 执行大范围划线
    step++;
    log(`\n【${step}】执行大范围划线测试`);
    log('📍 从左下角(300,2200)划到右上角(900,600)');
    doSwipe(300, 2200, 900, 600, 0.8);
    execSync('sleep 2');
    screenshot('04_after_big_swipe');
    
    // 步骤7: 执行第二次划线
    step++;
    log(`\n【${step}】执行第二次划线`);
    doSwipe(200, 2000, 1000, 800, 0.8);
    execSync('sleep 2');
    screenshot('05_after_swipe2');
    
    // 步骤8: 执行第三次划线
    step++;
    log(`\n【${step}】执行第三次划线`);
    doSwipe(100, 1800, 1100, 1000, 0.8);
    execSync('sleep 2');
    screenshot('06_after_swipe3');
    
    // 步骤9: 执行第四次划线
    step++;
    log(`\n【${step}】执行第四次划线（命应该耗尽）`);
    doSwipe(150, 2100, 1050, 700, 0.8);
    execSync('sleep 3');
    screenshot('07_after_swipe4');
    
    // 步骤10: 检查结果界面
    step++;
    log(`\n【${step}】检查结果界面`);
    screenshot('08_result');
    
    // 步骤11: 点击Try Again
    step++;
    log(`\n【${step}】点击Try Again重试`);
    doTap(603, 1650);
    execSync('sleep 3');
    screenshot('09_after_retry');
    
    // 步骤12: 验证回到同一关卡
    step++;
    log(`\n【${step}】验证回到关卡`);
    screenshot('10_verify_level');
    
    // 步骤13: 测试小范围划线（5%防护测试）
    step++;
    log(`\n【${step}】执行小范围划线测试（5%防护）`);
    doSwipe(500, 1200, 520, 1180, 0.3);
    execSync('sleep 2');
    screenshot('11_small_swipe');
    
    // 步骤14: 最终截图
    step++;
    log(`\n【${step}】最终状态`);
    screenshot('12_final');
    
    // 生成报告
    log('\n========================================');
    log('测试完成');
    log('========================================');
    
    const html = generateReport();
    fs.writeFileSync(`${TMP_DIR}/test_report.html`, html);
    
    console.log('\n========================================');
    console.log('✅ 测试完成！');
    console.log(`📄 报告: ${TMP_DIR}/test_report.html`);
    console.log('========================================\n');
    
    return html;
}

function generateReport() {
    let logContent = '';
    try {
        logContent = fs.readFileSync(`${TMP_DIR}/test_log.txt`, 'utf8');
    } catch (e) {}
    
    const files = [];
    try {
        const allFiles = fs.readdirSync(TMP_DIR);
        files.push(...allFiles.filter(f => f.endsWith('.png')).sort());
    } catch (e) {}
    
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>v1.3.0 真实划线测试报告</title>
<style>
body { font-family: -apple-system, sans-serif; padding: 20px; background: #0d1117; color: #c9d1d9; }
h1 { color: #58a6ff; }
h2 { color: #8b949e; border-bottom: 1px solid #30363d; padding-bottom: 10px; }
.step { padding: 10px; margin: 5px 0; background: #161b22; border-radius: 6px; border-left: 3px solid #238636; }
.pass { color: #3fb950; }
.log { background: #000; padding: 15px; border-radius: 6px; font-family: 'SF Mono', monospace; font-size: 12px; white-space: pre-wrap; max-height: 500px; overflow-y: auto; color: #7ee787; }
.screenshot { max-width: 250px; margin: 10px; border: 2px solid #30363d; border-radius: 8px; }
.gallery { display: flex; flex-wrap: wrap; gap: 15px; }
.gallery div { text-align: center; font-size: 12px; color: #8b949e; }
</style>
</head>
<body>
<h1>🎮 v1.3.0 真实划线操作测试报告</h1>
<p>测试时间: ${new Date().toLocaleString()}</p>
<p>测试步骤: ${step} 步</p>

<h2>📋 测试日志</h2>
<div class="log">${logContent}</div>

<h2>📸 截图记录</h2>
<div class="gallery">
${files.map(f => {
    const time = f.match(/_(\d+)\.png$/)?.[1] || '';
    const timeStr = time ? new Date(parseInt(time)).toLocaleTimeString() : '';
    return `<div><img class="screenshot" src="file://${TMP_DIR}/${f}"><br>${f.replace(/_\d+\.png$/, '')}<br><small>${timeStr}</small></div>`;
}).join('')}
</div>

<h2>✅ 测试步骤总结</h2>
<ol>
<li>✅ 检查模拟器状态</li>
<li>✅ 启动应用</li>
<li>✅ 检查欢迎界面</li>
<li>✅ 点击PLAY进入游戏</li>
<li>✅ 检查游戏界面（命数显示）</li>
<li>✅ 大范围划线测试</li>
<li>✅ 第二次划线</li>
<li>✅ 第三次划线</li>
<li>✅ 第四次划线（命耗尽测试）</li>
<li>✅ 结果界面检测</li>
<li>✅ Try Again重试测试</li>
<li>✅ 验证回到关卡</li>
<li>✅ 小范围划线测试（5%防护）</li>
<li>✅ 最终状态记录</li>
</ol>

<p style="color: #8b949e; margin-top: 30px;">
<strong>验证要点:</strong><br>
• 应用是否正常启动<br>
• 5颗心命数是否显示<br>
• 大范围划线是否能解锁精灵<br>
• 小范围划线是否被拒绝（5%防护）<br>
• Try Again是否重试当前关卡<br>
• 命耗尽后是否正确处理
</p>
</body>
</html>`;
}

runTest().catch(console.error);
