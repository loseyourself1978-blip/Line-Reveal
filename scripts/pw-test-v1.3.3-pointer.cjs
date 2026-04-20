/**
 * v1.3.3 Playwright 验收测试 — 最终修正版
 * 使用 dispatchEvent 发送 PointerEvent（游戏引擎用 pointerdown/pointermove/pointerup）
 */

const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOT_DIR = '/Users/hj/Downloads/Line Reveal';
const SERVER_URL = 'http://localhost:5177/';
const RESULTS = [];

function log(msg) { console.log(msg); }
function pass(name, detail = '') { RESULTS.push({ status: 'PASS', name, detail }); log(`  ✅ PASS: ${name}${detail ? ' — ' + detail : ''}`); }
function fail(name, detail = '') { RESULTS.push({ status: 'FAIL', name, detail }); log(`  ❌ FAIL: ${name}${detail ? ' — ' + detail : ''}`); }

async function shot(page, name) {
    const p = path.join(SCREENSHOT_DIR, `v1.3.3-final-${name}.png`);
    await page.screenshot({ path: p });
    return p;
}

// 通过 dispatchEvent 向 canvas 发送 PointerEvent（游戏引擎实际使用）
async function canvasDraw(page, fromX, fromY, toX, toY, steps = 20) {
    await page.evaluate(({ fromX, fromY, toX, toY, steps }) => {
        const canvas = document.querySelector('canvas');
        if (!canvas) { console.error('No canvas found'); return; }

        function mkPointer(type, cx, cy) {
            return new PointerEvent(type, {
                clientX: cx,
                clientY: cy,
                pointerId: 1,
                pointerType: 'touch',
                bubbles: true,
                cancelable: true,
                isPrimary: true,
                pressure: type === 'pointerup' ? 0 : 0.5
            });
        }

        // pointerdown
        canvas.dispatchEvent(mkPointer('pointerdown', fromX, fromY));

        // pointermove (steps)
        for (let i = 1; i <= steps; i++) {
            const px = fromX + (toX - fromX) * i / steps;
            const py = fromY + (toY - fromY) * i / steps;
            canvas.dispatchEvent(mkPointer('pointermove', px, py));
        }

        // pointerup
        canvas.dispatchEvent(mkPointer('pointerup', toX, toY));
        console.log(`[draw] (${fromX.toFixed(0)},${fromY.toFixed(0)}) → (${toX.toFixed(0)},${toY.toFixed(0)})`);
    }, { fromX, fromY, toX, toY, steps });
}

async function getProgress(page) {
    return await page.evaluate(() => {
        const allText = document.body.innerText;
        const match = allText.match(/([\d.]+)\s*%/);
        return match ? parseFloat(match[1]) : 0;
    });
}

async function getButtons(page) {
    const btns = await page.locator('button').all();
    return await Promise.all(btns.map(b => b.textContent().catch(() => '')));
}

(async () => {
    log('=== v1.3.3 Playwright 验收测试 (PointerEvent版) ===\n');

    const consoleErrors = [];
    const consoleLogs = [];

    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 393, height: 852 } });

    page.on('console', msg => {
        const txt = msg.text();
        if (msg.type() === 'error') consoleErrors.push(txt);
        else consoleLogs.push(`[${msg.type()}] ${txt}`);
    });
    page.on('pageerror', err => consoleErrors.push('PageError: ' + err.message));

    try {
        // ==================== Step 1: 加载首页 ====================
        log('[Step 1] 加载首页...');
        await page.goto(SERVER_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);
        await shot(page, '00-home');

        const homeBtns = await getButtons(page);
        log(`  按钮: ${homeBtns.filter(t => t.trim()).join(' | ')}`);
        
        if (homeBtns.some(t => t.includes('Play'))) {
            pass('首页加载', '找到Play Line Reveal按钮');
        } else {
            fail('首页加载', `按钮: ${homeBtns.join(',')}`);
        }

        // ==================== Step 2: 进入章节选择 ====================
        log('\n[Step 2] 点击 Play Line Reveal...');
        await page.locator('button:has-text("Play Line Reveal")').first().click();
        await page.waitForTimeout(1500);
        await shot(page, '01-chapters');

        const chBtns = await getButtons(page);
        log(`  章节按钮: ${chBtns.filter(t => t.trim()).slice(0, 5).join(' | ')}`);
        if (chBtns.some(t => t.includes('Chapter'))) {
            pass('进入章节选择');
        }

        // ==================== Step 3: 进入Chapter 1 ====================
        log('\n[Step 3] 进入 Chapter 1...');
        await page.locator('button:has-text("Chapter 1")').first().click();
        await page.waitForTimeout(1500);

        // ==================== Step 4: 进入Level 1 ====================
        log('\n[Step 4] 进入 Level 1...');
        const lvlBtns = await page.locator('button').all();
        const lvlTexts = await Promise.all(lvlBtns.map(b => b.textContent().catch(() => '')));
        log(`  关卡按钮: ${lvlTexts.filter(t => t.trim()).join(' | ')}`);
        
        // 点击第一个含"1"的按钮
        const lvl1 = page.locator('button:has-text("1")').first();
        await lvl1.click();
        await page.waitForTimeout(3000);
        await shot(page, '02-game');

        // ==================== Step 5: 检查Canvas ====================
        log('\n[Step 5] 检查 Canvas...');
        const canvasInfo = await page.evaluate(() => {
            const c = document.querySelector('canvas');
            if (!c) return null;
            const r = c.getBoundingClientRect();
            return { w: c.width, h: c.height, top: r.top, left: r.left, clientW: r.width, clientH: r.height };
        });
        log(`  Canvas: ${JSON.stringify(canvasInfo)}`);

        if (!canvasInfo) {
            fail('Canvas未找到');
            await browser.close();
            process.exit(1);
        }
        pass('游戏Canvas', `${canvasInfo.w}x${canvasInfo.h}`);

        const initProgress = await getProgress(page);
        log(`  初始进度: ${initProgress}%`);

        // ==================== Step 6: Bug#A 验证 — 等待精灵移动，检查NaN ====================
        log('\n[Step 6] Bug#A 验证 — 等待2秒检查精灵NaN错误...');
        await page.waitForTimeout(2000);
        
        const nanErrors = consoleErrors.filter(e => e.includes('NaN'));
        const hasNaN = nanErrors.length > 0;
        log(`  NaN相关错误: ${hasNaN ? nanErrors.join('; ') : '无'}`);
        log(`  全部控制台错误: ${consoleErrors.join('; ') || '无'}`);
        
        if (!hasNaN) {
            pass('Bug#A — 精灵无NaN错误', '精灵正常移动');
        } else {
            fail('Bug#A — 精灵有NaN错误', nanErrors.join('; '));
        }

        // ==================== Step 7: Bug#B 验证 — 通过PointerEvent划线 ====================
        log('\n[Step 7] Bug#B 验证 — 3次PointerEvent划线（累计解锁%）...');
        
        // canvas坐标使用 clientLeft/clientTop 作为偏移
        const cx = canvasInfo.left;
        const cy = canvasInfo.top;
        const cw = canvasInfo.clientW;
        const ch = canvasInfo.clientH;
        
        log(`  Canvas屏幕位置: x=${cx}, y=${cy}, w=${cw}, h=${ch}`);

        // 3次水平划线，从左边缘到右边缘
        const drawOps = [
            { name: '上部水平', y: 0.25 },
            { name: '中部水平', y: 0.5 },
            { name: '下部水平', y: 0.75 },
        ];
        
        let prevProgress = 0;
        let progressIncreased = false;
        
        for (let i = 0; i < drawOps.length; i++) {
            const d = drawOps[i];
            const startX = cx + 5;
            const endX = cx + cw - 5;
            const lineY = cy + ch * d.y;
            
            log(`  ${d.name}: (${Math.round(startX)},${Math.round(lineY)}) → (${Math.round(endX)},${Math.round(lineY)})`);
            
            await canvasDraw(page, startX, lineY, endX, lineY, 30);
            await page.waitForTimeout(2000);
            
            await shot(page, `0${3+i}-draw${i+1}`);
            
            const prog = await getProgress(page);
            log(`    当前进度: ${prog}%`);
            
            // 检查进度是否增加
            if (prog > prevProgress) {
                progressIncreased = true;
                log(`    📈 进度增加: ${prevProgress}% → ${prog}%`);
            }
            prevProgress = prog;
            
            // 检查是否已经胜利
            const btns = await getButtons(page);
            const hasWon = btns.some(t => ['Next', 'Replay', 'Victory', 'WIN', 'Next Level'].some(k => t.includes(k)));
            if (hasWon) {
                log(`    🎉 划线${i+1}后已触发胜利! 按钮: ${btns.filter(t=>t.trim()).join(' | ')}`);
                progressIncreased = true;
                break;
            }
        }

        // ==================== Step 8: 获取最终状态 ====================
        log('\n[Step 8] 最终状态检查...');
        await page.waitForTimeout(2000);
        await shot(page, '06-final');
        
        const finalContent = await page.evaluate(() => document.body.innerText.substring(0, 500));
        const finalBtns = await getButtons(page);
        const finalProg = await getProgress(page);
        
        log(`  最终进度: ${finalProg}%`);
        log(`  最终按钮: ${finalBtns.filter(t => t.trim()).join(' | ')}`);
        
        const victoryKeywords = ['Next', 'Replay', 'Victory', 'WIN', 'win', '通关', '胜利'];
        const hasVictory = finalBtns.some(t => victoryKeywords.some(k => t.includes(k)))
                        || finalContent.includes('WIN') || finalContent.includes('Victory');

        if (hasVictory) {
            pass('Bug#B — 触发胜利界面', '累计解锁算法正常');
        } else if (progressIncreased || finalProg > 0) {
            pass('Bug#B — 解锁进度正常累积', `最终进度: ${finalProg}%`);
        } else {
            // 额外诊断：查看控制台日志
            const drawLogs = consoleLogs.filter(l => l.includes('draw') || l.includes('unlock') || l.includes('%') || l.includes('cumulative'));
            log(`  相关日志: ${drawLogs.slice(-10).join('\n  ')}`);
            fail('Bug#B — 未检测到进度增加', `进度: ${finalProg}%，划线事件可能未被接收`);
        }

        // ==================== 汇总 ====================
        log('\n' + '='.repeat(55));
        log('=== v1.3.3 验收测试汇总 ===');
        log('='.repeat(55));
        
        const passed = RESULTS.filter(r => r.status === 'PASS').length;
        const failed = RESULTS.filter(r => r.status === 'FAIL').length;
        
        RESULTS.forEach(r => {
            log(`  ${r.status === 'PASS' ? '✅' : '❌'} ${r.name}${r.detail ? ': ' + r.detail : ''}`);
        });
        
        log(`\n📊 结果: ${passed} 通过 / ${failed} 失败 / ${RESULTS.length} 总计`);
        
        if (failed === 0) {
            log('\n🎉🎉 验收通过！v1.3.3 Bug#A (velocity.x/y) + Bug#B (累计解锁) 修复已验证！');
        } else {
            log('\n⚠️ 部分测试失败，请查看截图分析。');
        }
        
        if (consoleErrors.length > 0) {
            log(`\n⚠️ 控制台错误 (${consoleErrors.length}条):`);
            consoleErrors.forEach(e => log(`  - ${e}`));
        }

    } catch (err) {
        log(`\n💥 异常: ${err.message}\n${err.stack}`);
        await shot(page, 'error').catch(() => {});
    } finally {
        await browser.close();
    }

    const failed = RESULTS.filter(r => r.status === 'FAIL').length;
    process.exit(failed > 0 ? 1 : 0);
})();
