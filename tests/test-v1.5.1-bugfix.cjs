/**
 * Line Reveal v1.5.1 Bugfix 验证测试
 * 验证 3 个 Bug 的修复
 *
 * 运行方式：node tests/test-v1.5.1-bugfix.cjs
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const PINBALL_ENGINE_FILE = path.join(PROJECT_ROOT, 'src', 'game', 'PinballEngine.ts');
const PINBALL_GAME_FILE = path.join(PROJECT_ROOT, 'src', 'components', 'PinballGame.tsx');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (e) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${e.message}`);
        failed++;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

function assertContains(content, substring, message) {
    if (!content.includes(substring)) {
        throw new Error(message || `Expected content to contain: ${substring}`);
    }
}

function assertNotContains(content, substring, message) {
    if (content.includes(substring)) {
        throw new Error(message || `Expected content NOT to contain: ${substring}`);
    }
}

function readFile(relPath) {
    return fs.readFileSync(relPath, 'utf8');
}

console.log('\n========================================');
console.log('Line Reveal v1.5.1 Bugfix 验证');
console.log('========================================\n');

// ============================================================
// Bug 1: 生命系统集成
// ============================================================
console.log('【Bug 1: 生命系统集成】');

const pinballGameContent = readFile(PINBALL_GAME_FILE);

test('Bug 1: PinballGame.tsx 导入 LivesDisplay', () => {
    assertContains(pinballGameContent, "import { LivesDisplay }",
        '应导入 LivesDisplay 组件');
});

test('Bug 1: PinballGame.tsx 使用 engineLives', () => {
    assertContains(pinballGameContent, 'engineLives',
        '应使用全局 engineLives');
});

test('Bug 1: PinballGame.tsx 使用 setEngineLives', () => {
    assertContains(pinballGameContent, 'setEngineLives',
        '应使用 setEngineLives 修改生命');
});

test('Bug 1: onBallLost 减少全局生命', () => {
    assertContains(pinballGameContent, 'engineLives - 1',
        'onBallLost 应减少全局生命');
});

test('Bug 1: onBallLost 检查生命耗尽', () => {
    assertContains(pinballGameContent, 'newLives <= 0',
        '应检查生命是否耗尽');
});

test('Bug 1: onGameWon 增加生命', () => {
    assertContains(pinballGameContent, 'Math.min(prev + 1, 5)',
        '通关时应增加生命（上限5命）');
});

test('Bug 1: LivesDisplay 在 HUD 中渲染', () => {
    assertContains(pinballGameContent, '<LivesDisplay />',
        'HUD 应渲染 LivesDisplay 组件');
});

// ============================================================
// Bug 2: 砖块不透明
// ============================================================
console.log('\n【Bug 2: 砖块不透明】');

const pinballEngineContent = readFile(PINBALL_ENGINE_FILE);

test('Bug 2: Standard 砖块透明度 >= 0.85', () => {
    const match = pinballEngineContent.match(/case 'standard':\s*[\s\S]*?ctx\.fillStyle\s*=\s*'([^']+)'/);
    assert(match, '找不到 standard 砖块 fillStyle');
    const alpha = match[1].match(/rgba\([^,]+,[^,]+,[^,]+,([^)]+)\)/)?.[1];
    assert(alpha && parseFloat(alpha) >= 0.85, `Standard 透明度应 >= 0.85，当前: ${alpha}`);
});

test('Bug 2: Tough 砖块透明度 >= 0.85', () => {
    const match = pinballEngineContent.match(/case 'tough':\s*[\s\S]*?ctx\.fillStyle\s*=\s*'([^']+)'/);
    assert(match, '找不到 tough 砖块 fillStyle');
    const alpha = match[1].match(/rgba\([^,]+,[^,]+,[^,]+,([^)]+)\)/)?.[1];
    assert(alpha && parseFloat(alpha) >= 0.85, `Tough 透明度应 >= 0.85，当前: ${alpha}`);
});

test('Bug 2: Spirit Guard 砖块透明度 >= 0.85', () => {
    const match = pinballEngineContent.match(/case 'spirit_guard':\s*[\s\S]*?ctx\.fillStyle\s*=\s*'([^']+)'/);
    assert(match, '找不到 spirit_guard 砖块 fillStyle');
    const alpha = match[1].match(/rgba\([^,]+,[^,]+,[^,]+,([^)]+)\)/)?.[1];
    assert(alpha && parseFloat(alpha) >= 0.85, `Spirit Guard 透明度应 >= 0.85，当前: ${alpha}`);
});

test('Bug 2: Explosive 砖块透明度 >= 0.85', () => {
    const match = pinballEngineContent.match(/case 'explosive':\s*[\s\S]*?ctx\.fillStyle\s*=\s*'([^']+)'/);
    assert(match, '找不到 explosive 砖块 fillStyle');
    const alpha = match[1].match(/rgba\([^,]+,[^,]+,[^,]+,([^)]+)\)/)?.[1];
    assert(alpha && parseFloat(alpha) >= 0.85, `Explosive 透明度应 >= 0.85，当前: ${alpha}`);
});

test('Bug 2: Bonus 砖块透明度 >= 0.85', () => {
    const match = pinballEngineContent.match(/case 'bonus':\s*[\s\S]*?ctx\.fillStyle\s*=\s*'([^']+)'/);
    assert(match, '找不到 bonus 砖块 fillStyle');
    const alpha = match[1].match(/rgba\([^,]+,[^,]+,[^,]+,([^)]+)\)/)?.[1];
    assert(alpha && parseFloat(alpha) >= 0.85, `Bonus 透明度应 >= 0.85，当前: ${alpha}`);
});

// ============================================================
// Bug 3: 背景图片比例
// ============================================================
console.log('\n【Bug 3: 背景图片比例】');

test('Bug 3: 使用 9 参数 drawImage', () => {
    // 9参数版本: drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    assertContains(pinballEngineContent, 'ctx.drawImage(this.bgImage, 0, 0, imgW, imgH, drawX, drawY, drawW, drawH)',
        '应使用 9 参数 drawImage');
});

test('Bug 3: 计算 canvasRatio', () => {
    assertContains(pinballEngineContent, 'const canvasRatio = W / H',
        '应计算画布宽高比');
});

test('Bug 3: 计算 imgRatio', () => {
    assertContains(pinballEngineContent, 'const imgRatio = imgW / imgH',
        '应计算图片宽高比');
});

test('Bug 3: 实现 letterbox 黑边', () => {
    assertContains(pinballEngineContent, "ctx.fillStyle = '#0f172a'",
        '应填充黑边背景');
});

test('Bug 3: 按宽度填充时计算 drawH', () => {
    const match = pinballEngineContent.match(/imgRatio > canvasRatio[\s\S]*?drawH = ([^;]+);/);
    assert(match, '应计算按宽度填充时的 drawH');
});

test('Bug 3: 按高度填充时计算 drawW', () => {
    const match = pinballEngineContent.match(/drawW\s*=\s*H\s*\*\s*imgRatio/);
    assert(match, '应计算 drawW = H * imgRatio');
});

// ============================================================
// 版本检查
// ============================================================
console.log('\n【版本检查】');

test('PinballGame.tsx 版本号更新为 v1.5.1', () => {
    assertContains(pinballGameContent, 'v1.5.1',
        '版本号应为 v1.5.1');
});

test('PinballEngine.ts 版本号更新为 v1.5.1', () => {
    const match = pinballEngineContent.match(/v1\.5\.1/);
    assert(match, '版本号应为 v1.5.1');
});

// ============================================================
// 总结
// ============================================================
console.log('\n========================================');
console.log(`测试结果: ${passed} 通过, ${failed} 失败`);
console.log('========================================');

if (failed > 0) {
    console.log('\n❌ 部分测试失败，请检查修复是否正确');
    process.exit(1);
} else {
    console.log('\n🎉 所有 v1.5.1 Bugfix 测试通过！');
    process.exit(0);
}
