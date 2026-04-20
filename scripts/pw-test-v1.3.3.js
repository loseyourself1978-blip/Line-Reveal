const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
    
    console.log('=== v1.3.3 Playwright 自动化测试 ===\n');
    
    // 1. 加载 app
    console.log('[1] 加载 app...');
    await page.goto('http://localhost:5177/', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/Users/hj/Downloads/Line Reveal/v1.3.3-pw-01-home.png', fullPage: true });
    
    // 2. 检查 welcome 界面
    const welcomeText = await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        return Array.from(btns).map(b => b.textContent?.trim()).filter(t => t);
    });
    console.log('[2] 按钮列表:', welcomeText);
    
    // 3. 点击 Play Line Reveal 按钮
    console.log('\n[2] 点击 Play Line Reveal...');
    const playBtn = page.getByText('Play Line Reveal', { exact: false });
    if (await playBtn.count() > 0) {
        await playBtn.first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/Users/hj/Downloads/Line Reveal/v1.3.3-pw-02-chapters.png', fullPage: true });
        console.log('  ✅ 点击成功');
    } else {
        console.log('  ❌ 未找到 Play 按钮');
    }
    
    // 4. 选择 Chapter 1
    console.log('\n[3] 选择 Chapter 1...');
    const ch1Btn = page.getByText('Chapter 1', { exact: false }).first();
    if (await ch1Btn.count() > 0) {
        await ch1Btn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/Users/hj/Downloads/Line Reveal/v1.3.3-pw-03-levels.png', fullPage: true });
        console.log('  ✅ 进入章节');
    } else {
        console.log('  ❌ 未找到 Chapter 1');
    }
    
    // 5. 开始 Level 1
    console.log('\n[4] 开始 Level 1...');
    const levelBtns = await page.locator('button').all();
    console.log(`  找到 ${levelBtns.length} 个按钮`);
    // 点击第一个可用的关卡按钮
    if (levelBtns.length > 0) {
        await levelBtns[0].click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: '/Users/hj/Downloads/Line Reveal/v1.3.3-pw-04-game.png', fullPage: true });
        console.log('  ✅ 进入关卡');
    }
    
    // 6. Bug#B 测试：多次划线
    console.log('\n[5] Bug#B 测试：3次大范围划线');
    
    // 检查 engine 状态
    const engineInfo = await page.evaluate(() => {
        // 尝试从 window 对象获取 engine 实例
        const keys = Object.keys(window).filter(k => k.includes('engine') || k.includes('Engine'));
        return keys;
    });
    console.log('  Window engine keys:', engineInfo);
    
    // 执行3次划线
    for (let i = 1; i <= 3; i++) {
        console.log(`  划线${i}...`);
        const w = 393, h = 852;
        
        if (i === 1) {
            await page.mouse.move(50, 200);
            await page.mouse.down();
            for (let t = 0; t <= 10; t++) {
                await page.mouse.move(50 + t * 30, 200 + t * 50);
                await page.waitForTimeout(10);
            }
        } else if (i === 2) {
            await page.mouse.move(350, 200);
            await page.mouse.down();
            for (let t = 0; t <= 10; t++) {
                await page.mouse.move(350 - t * 30, 200 + t * 50);
                await page.waitForTimeout(10);
            }
        } else {
            await page.mouse.move(200, 100);
            await page.mouse.down();
            for (let t = 0; t <= 10; t++) {
                await page.mouse.move(200, 100 + t * 65);
                await page.waitForTimeout(10);
            }
        }
        await page.mouse.up();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `/Users/hj/Downloads/Line Reveal/v1.3.3-pw-0${4+i}-draw${i}.png`, fullPage: true });
    }
    
    // 7. 检查最终状态
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/Users/hj/Downloads/Line Reveal/v1.3.3-pw-08-final.png', fullPage: true });
    
    // 8. 检查是否通关（查找 Win/Victory 文字或按钮）
    const finalBtns = await page.locator('button').all();
    const finalTexts = await Promise.all(finalBtns.map(b => b.textContent().catch(() => '')));
    const victoryKeywords = ['Next', 'next', 'Victory', 'YOU WIN', 'Congratulations', 'Replay'];
    const hasVictory = finalTexts.some(t => victoryKeywords.some(k => t.includes(k)));
    
    console.log('\n[6] 最终状态分析:');
    console.log('  按钮列表:', finalTexts.filter(t => t.trim()));
    console.log(`  ${hasVictory ? '✅ 发现胜利界面!' : '❌ 未发现胜利界面'}`);
    
    // 9. 检查控制台错误
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForTimeout(1000);
    
    console.log('\n  控制台错误:', errors.length > 0 ? errors : '无');
    console.log('\n=== 测试完成 ===');
    
    await browser.close();
})().catch(err => {
    console.error('测试失败:', err.message);
    process.exit(1);
});
