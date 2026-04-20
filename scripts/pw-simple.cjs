const { chromium } = require('playwright');

(async () => {
    console.log('启动浏览器...');
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        console.log('浏览器已启动');
        
        const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
        console.log('页面已创建');
        
        console.log('正在访问 http://localhost:5177/ ...');
        await page.goto('http://localhost:5177/', { waitUntil: 'domcontentloaded', timeout: 20000 });
        console.log('页面已加载');
        
        const title = await page.title();
        console.log('页面标题:', title);
        
        await page.screenshot({ path: '/Users/hj/Downloads/Line Reveal/pw-simple-01.png' });
        console.log('截图保存成功');
        
        const btns = await page.locator('button').all();
        const texts = await Promise.all(btns.map(b => b.textContent().catch(() => '')));
        console.log('按钮:', texts.filter(t => t.trim()).join(' | '));
        
        await browser.close();
        console.log('✅ 基本测试完成');
    } catch (err) {
        console.error('❌ 错误:', err.message);
        if (browser) await browser.close().catch(() => {});
        process.exit(1);
    }
})();
