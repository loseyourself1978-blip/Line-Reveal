'use strict';
/**
 * auto-test-v1.3.4.cjs
 * v1.3.4 自动化验收测试
 * 
 * 测试重点：
 * - Bug#C 修复：canvas 高度等于屏幕实际高度（不含 safe area 误差）
 * - engine.ts: resize() 使用 getBoundingClientRect
 * - index.css: html 使用 100dvh
 * - capacitor.config.ts: ios.contentInset = 'never'
 * - Bug#A/B 修复保留完整
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DEV_URL = 'http://localhost:5177';
const SCREENSHOT_DIR = '/Users/hj/Downloads/Line Reveal';
const RESULTS = [];

function log(msg) {
    const ts = new Date().toISOString().substring(11, 23);
    console.log(`[${ts}] ${msg}`);
}

function pass(name, detail = '') {
    RESULTS.push({ name, status: 'PASS', detail });
    log(`✅ PASS: ${name}${detail ? ' — ' + detail : ''}`);
}

function fail(name, detail = '') {
    RESULTS.push({ name, status: 'FAIL', detail });
    log(`❌ FAIL: ${name}${detail ? ' — ' + detail : ''}`);
}

async function runTests() {
    log('=== v1.3.4 自动化验收测试开始 ===');
    log(`目标: ${DEV_URL}`);

    // ======================================================
    // 阶段1: 源码检查（不需要浏览器）
    // ======================================================
    log('\n--- 阶段1: 源码静态检查 ---');

    // Test 1: Bug#A 修复确认（velocity.x/y，无 vx/vy typo）
    const engineContent = fs.readFileSync('/Users/hj/Downloads/Line Reveal/LineReveal/src/game/engine.ts', 'utf8');
    const hasVelocityFix = engineContent.includes('s.velocity.x *= -1.1') && engineContent.includes('s.velocity.y *= -1.1');
    const hasVxBug = /\(s as any\)\.(vx|vy)\s*\*=/.test(engineContent);
    if (hasVelocityFix && !hasVxBug) {
        pass('Bug#A velocity.x/y 修复', 'vx/vy typo 已消除');
    } else {
        fail('Bug#A velocity.x/y 修复', `velocity fix=${hasVelocityFix}, vxBug=${hasVxBug}`);
    }

    // Test 2: Bug#B 修复确认（cumulativeUnlockedPercent）
    const cumCount = (engineContent.match(/cumulativeUnlockedPercent/g) || []).length;
    const hasCumAdd = engineContent.includes('cumulativeUnlockedPercent + percent') || 
                      engineContent.includes('cumulativeUnlockedPercent =');
    if (cumCount >= 3 && hasCumAdd) {
        pass('Bug#B cumulativeUnlockedPercent', `出现 ${cumCount} 次，累加逻辑存在`);
    } else {
        fail('Bug#B cumulativeUnlockedPercent', `出现 ${cumCount} 次，累加=${hasCumAdd}`);
    }

    // Test 3: Bug#C 修复 — engine.ts resize() 使用 getBoundingClientRect
    const hasBoundingRect = engineContent.includes('getBoundingClientRect()');
    const hasWindowInner = /const\s+(width|height)\s*=\s*window\.inner(Width|Height)/.test(engineContent);
    // 允许 fallback 用 window.innerWidth/Height，但主路径要用 getBoundingClientRect
    const resizeSection = engineContent.match(/resize\(\)\s*\{[\s\S]{0,1000}/);
    const resizeHasBCR = resizeSection ? resizeSection[0].includes('getBoundingClientRect') : false;
    if (hasBoundingRect && resizeHasBCR) {
        pass('Bug#C engine.ts resize() 使用 getBoundingClientRect', 'canvas 尺寸从实际渲染获取');
    } else {
        fail('Bug#C engine.ts resize() 使用 getBoundingClientRect', `hasBCR=${hasBoundingRect}, inResize=${resizeHasBCR}`);
    }

    // Test 4: Bug#C 修复 — index.css 使用 100dvh
    const cssContent = fs.readFileSync('/Users/hj/Downloads/Line Reveal/LineReveal/src/index.css', 'utf8');
    const has100dvh = cssContent.includes('100dvh');
    if (has100dvh) {
        pass('Bug#C index.css 100dvh', 'html 使用动态视口高度');
    } else {
        fail('Bug#C index.css 100dvh', '未找到 100dvh，可能还是 100%');
    }

    // Test 5: Bug#C 修复 — capacitor.config.ts contentInset: 'never'
    const capacitorContent = fs.readFileSync('/Users/hj/Downloads/Line Reveal/LineReveal/capacitor.config.ts', 'utf8');
    const hasContentInsetNever = capacitorContent.includes("contentInset: 'never'") || 
                                  capacitorContent.includes('contentInset: "never"');
    if (hasContentInsetNever) {
        pass('Bug#C capacitor.config.ts contentInset never', 'iOS safe area 不收缩 WebView');
    } else {
        fail('Bug#C capacitor.config.ts contentInset never', '未找到 contentInset: never');
    }

    // Test 6: 产品文档 v1.3.4 存在
    const docExists = fs.existsSync('/Users/hj/Downloads/Line Reveal/LineReveal/PROD_SPEC_v1.3.4.md');
    if (docExists) {
        pass('产品文档 PROD_SPEC_v1.3.4.md 已创建');
    } else {
        fail('产品文档 PROD_SPEC_v1.3.4.md 未创建');
    }

    // ======================================================
    // 阶段2: 浏览器运行时测试
    // ======================================================
    log('\n--- 阶段2: 浏览器运行时测试 ---');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 393, height: 852 } });

    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    try {
        // Test 7: 首页加载
        await page.goto(DEV_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(1500);
        const title = await page.title();
        if (title || (await page.locator('button').count()) > 0) {
            pass('首页加载成功', `title="${title}"`);
        } else {
            fail('首页加载失败', '无标题或按钮');
        }

        // Test 8: 进入游戏关卡
        await page.locator('button:has-text("Play Line Reveal")').first().click();
        await page.waitForTimeout(800);
        await page.locator('button:has-text("Chapter 1")').first().click();
        await page.waitForTimeout(800);
        await page.locator('button:has-text("1")').first().click();
        await page.waitForTimeout(2000);

        const canvas = await page.$('canvas');
        if (canvas) {
            const canvasInfo = await page.evaluate(() => {
                const c = document.querySelector('canvas');
                if (!c) return null;
                const rect = c.getBoundingClientRect();
                return {
                    cssWidth: rect.width,
                    cssHeight: rect.height,
                    attrWidth: c.width,
                    attrHeight: c.height,
                    windowInnerHeight: window.innerHeight,
                    documentClientHeight: document.documentElement.clientHeight,
                };
            });

            if (canvasInfo) {
                log(`  Canvas: CSS ${canvasInfo.cssWidth}x${canvasInfo.cssHeight}, attr ${canvasInfo.attrWidth}x${canvasInfo.attrHeight}`);
                log(`  window.innerHeight=${canvasInfo.windowInnerHeight}, documentClientHeight=${canvasInfo.documentClientHeight}`);

                // Test 8a: canvas 加载
                pass('游戏 Canvas 加载', `CSS ${canvasInfo.cssWidth}x${canvasInfo.cssHeight}`);

                // Test 8b: canvas attr 尺寸 = CSS 渲染尺寸（验证 getBoundingClientRect 修复）
                const widthMatch = Math.abs(canvasInfo.attrWidth - canvasInfo.cssWidth) <= 1;
                const heightMatch = Math.abs(canvasInfo.attrHeight - canvasInfo.cssHeight) <= 1;
                if (widthMatch && heightMatch) {
                    pass('Bug#C canvas.attr 尺寸 ≈ CSS 渲染尺寸', `attr=${canvasInfo.attrWidth}x${canvasInfo.attrHeight}, CSS=${canvasInfo.cssWidth}x${canvasInfo.cssHeight}`);
                } else {
                    fail('Bug#C canvas.attr 尺寸与 CSS 渲染尺寸不匹配', 
                         `attr=${canvasInfo.attrWidth}x${canvasInfo.attrHeight}, CSS=${canvasInfo.cssWidth}x${canvasInfo.cssHeight}`);
                }

                // Test 8c: CSS 高度 = 视口高度（验证 100dvh 修复）
                const vhMatch = Math.abs(canvasInfo.cssHeight - 852) <= 2;
                if (vhMatch) {
                    pass('Bug#C canvas CSS高度 = 视口高度', `${canvasInfo.cssHeight} ≈ 852`);
                } else {
                    fail('Bug#C canvas CSS高度 ≠ 视口高度', `${canvasInfo.cssHeight} vs 852`);
                }

                // Test 8d: 截图验证
                await page.screenshot({ path: `${SCREENSHOT_DIR}/v1.3.4-test-01-game.png` });
                pass('截图保存', `${SCREENSHOT_DIR}/v1.3.4-test-01-game.png`);
            } else {
                fail('Canvas 信息获取失败');
            }
        } else {
            fail('Canvas 未找到');
        }

        // Test 9: 无 NaN 错误（运行2秒）
        const nanBefore = consoleErrors.filter(e => e.includes('NaN')).length;
        await page.waitForTimeout(2000);
        const nanAfter = consoleErrors.filter(e => e.includes('NaN')).length;
        if (nanAfter === nanBefore) {
            pass('Bug#A 运行时无 NaN 错误', '2秒内无新 NaN');
        } else {
            fail('Bug#A 运行时出现 NaN 错误', `新增 ${nanAfter - nanBefore} 个`);
        }

        // Test 10: 无致命错误
        const fatalErrors = consoleErrors.filter(e => 
            e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
        );
        if (fatalErrors.length === 0) {
            pass('无致命 JS 错误', '无 TypeError/ReferenceError');
        } else {
            fail('存在致命 JS 错误', fatalErrors.slice(0, 2).join('; '));
        }

    } catch (e) {
        fail('浏览器测试异常', e.message);
    } finally {
        await browser.close();
    }

    // ======================================================
    // 汇总
    // ======================================================
    log('\n=== 测试汇总 ===');
    const passed = RESULTS.filter(r => r.status === 'PASS').length;
    const failed = RESULTS.filter(r => r.status === 'FAIL').length;
    RESULTS.forEach(r => {
        log(`  ${r.status === 'PASS' ? '✅' : '❌'} [${r.status}] ${r.name}${r.detail ? ': ' + r.detail : ''}`);
    });
    log(`\n总计: ${passed}✅ / ${failed}❌ (共${RESULTS.length}项)`);

    // 生成 HTML 报告
    const html = `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>v1.3.4 验收报告</title>
<style>
body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; background: #0f172a; color: #e2e8f0; }
h1 { color: #60a5fa; }
.summary { font-size: 1.3em; margin: 20px 0; padding: 16px; background: ${failed === 0 ? '#166534' : '#7f1d1d'}; border-radius: 8px; }
table { width: 100%; border-collapse: collapse; }
th { background: #1e293b; padding: 10px; text-align: left; }
td { padding: 10px; border-bottom: 1px solid #334155; }
.pass { color: #86efac; }
.fail { color: #fca5a5; }
.detail { color: #94a3b8; font-size: 0.85em; }
</style>
</head>
<body>
<h1>划线解锁神图 v1.3.4 验收报告</h1>
<div class="summary">
  ${failed === 0 ? '🎉 全部通过' : '⚠️ 有失败项'}: ${passed}✅ / ${failed}❌ (共${RESULTS.length}项)<br>
  <small>生成时间: ${new Date().toLocaleString('zh-CN')}</small>
</div>
<table>
<tr><th>#</th><th>测试项</th><th>状态</th><th>说明</th></tr>
${RESULTS.map((r, i) => `
<tr>
  <td>${i + 1}</td>
  <td>${r.name}</td>
  <td class="${r.status.toLowerCase()}">${r.status === 'PASS' ? '✅ 通过' : '❌ 失败'}</td>
  <td class="detail">${r.detail || '-'}</td>
</tr>`).join('')}
</table>
<h2>v1.3.4 修复内容</h2>
<ul>
  <li><strong>Bug#C</strong>: 通关后背景图未全屏（底部黑边）</li>
  <li>engine.ts resize() 改用 getBoundingClientRect() 获取精确高度</li>
  <li>index.css html 改用 100dvh 动态视口高度</li>
  <li>capacitor.config.ts 设置 ios.contentInset: 'never'</li>
</ul>
</body>
</html>`;
    fs.writeFileSync('/Users/hj/Downloads/Line Reveal/LineReveal/tests/auto-test-v1.3.4.html', html);
    log('\n📄 报告已保存: tests/auto-test-v1.3.4.html');

    return failed === 0;
}

// 先确认 dev server 在运行
const http = require('http');
http.get(DEV_URL, () => {
    runTests().then(ok => {
        process.exit(ok ? 0 : 1);
    }).catch(e => {
        console.error('测试异常:', e);
        process.exit(1);
    });
}).on('error', () => {
    console.error(`Dev server 未运行，请先启动: npx vite --port 5177`);
    process.exit(1);
});
