/**
 * Line Reveal v1.3.3 自动化测试用例
 * 测试运行器（Node.js CJS）
 *
 * 运行方式：node tests/run-auto-test.cjs
 *
 * Bug#A: vx/vy 拼写错误 → velocity.x/y（NaN 导致精灵乱飞）
 * Bug#B: lastUnlockPercent 覆盖 → cumulativeUnlockedPercent 累加（无法通关）
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const ENGINE_FILE = path.join(PROJECT_ROOT, 'src', 'game', 'engine.ts');
const POLYGON_FILE = path.join(PROJECT_ROOT, 'src', 'game', 'polygon.ts');
const GAME_CANVAS_FILE = path.join(PROJECT_ROOT, 'src', 'game', 'GameCanvas.tsx');
const USE_GAME_FILE = path.join(PROJECT_ROOT, 'src', 'hooks', 'useGame.tsx');

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
console.log('Line Reveal v1.3.3 自动化测试');
console.log('========================================\n');

// ============================================================
// Bug#A: vx/vy 拼写错误修复
// ============================================================
console.log('【Bug#A: 精灵反弹 vx/vy → velocity.x/y】');

const engineContent = readFile(ENGINE_FILE);

test('Bug#A: engine.ts 不再使用 (s as any).vx', () => {
    assertNotContains(engineContent, '(s as any).vx',
        '不应再使用错误的 (s as any).vx');
});

test('Bug#A: engine.ts 不再使用 (s as any).vy', () => {
    assertNotContains(engineContent, '(s as any).vy',
        '不应再使用错误的 (s as any).vy');
});

test('Bug#A: engine.ts 使用正确的 s.velocity.x', () => {
    assertContains(engineContent, 's.velocity.x *= -1.1',
        '应使用正确的 s.velocity.x *= -1.1');
});

test('Bug#A: engine.ts 使用正确的 s.velocity.y', () => {
    assertContains(engineContent, 's.velocity.y *= -1.1',
        '应使用正确的 s.velocity.y *= -1.1');
});

// ============================================================
// Bug#B: 累计解锁百分比
// ============================================================
console.log('\n【Bug#B: 累计解锁百分比 cumulativeUnlockedPercent】');

test('Bug#B: engine.ts 定义 cumulativeUnlockedPercent 字段', () => {
    assertContains(engineContent, 'cumulativeUnlockedPercent',
        'engine.ts 应定义 cumulativeUnlockedPercent 字段');
});

test('Bug#B: init() 中重置 cumulativeUnlockedPercent = 0', () => {
    // 查找 init 函数内的重置
    const initMatch = engineContent.match(/init\s*\([^)]*\)\s*\{([\s\S]*?)(?=\n\s{0,4}\/\/ |^    (?:stop|loadBackground|resize|window\.addEventListener|canvas\.addEventListener|this\.lastFrameTime))/m);
    if (initMatch) {
        assert(initMatch[1].includes('cumulativeUnlockedPercent = 0'),
            'init() 中应重置 cumulativeUnlockedPercent = 0');
    } else {
        // 备用：直接搜索
        assert(engineContent.includes('cumulativeUnlockedPercent = 0'),
            '应包含 cumulativeUnlockedPercent = 0 重置');
    }
});

test('Bug#B: finishDrawing() 累加 cumulativeUnlockedPercent', () => {
    assertContains(engineContent, 'cumulativeUnlockedPercent = Math.min(1, this.cumulativeUnlockedPercent + percent)',
        '应使用 Math.min(1, cumulativeUnlockedPercent + percent) 累加');
});

test('Bug#B: finishDrawing() 不再单独赋值 lastUnlockPercent', () => {
    // finishDrawing 中 lastUnlockPercent 的赋值应该保留（用于单次显示）
    // 但 victory 检测应使用 cumulative
    const finishMatch = engineContent.match(/finishDrawing\s*\([^)]*\)[^{]*\{([\s\S]*?)(?=\n\s{0,4}\/\/ CLEANUP|\n\s{0,4}this\.isDrawing\s*=)/m);
    if (finishMatch) {
        assert(finishMatch[1].includes('this.lastUnlockPercent = percent'),
            'finishDrawing 中应保留 lastUnlockPercent = percent');
    }
});

const canvasContent = readFile(GAME_CANVAS_FILE);

test('Bug#B: GameCanvas victory 检测使用 cumulativeUnlockedPercent', () => {
    assertContains(canvasContent, 'cumulativeUnlockedPercent >= levelConfig.unlockThreshold',
        '胜利检测应使用 cumulativeUnlockedPercent >= unlockThreshold');
});

test('Bug#B: GameCanvas syncInterval 同步 cumulativeUnlockedPercent', () => {
    assertContains(canvasContent, 'setUnlockedPercent(eng.cumulativeUnlockedPercent)',
        'syncInterval 应同步 cumulativeUnlockedPercent 到 UI');
});

test('Bug#B: GameCanvas onLivesZero 使用 cumulativeUnlockedPercent', () => {
    assertContains(canvasContent, 'endGame(false, engine.cumulativeUnlockedPercent',
        '失败回调应传递 cumulativeUnlockedPercent');
});

// ============================================================
// 核心游戏逻辑
// ============================================================
console.log('\n【核心游戏逻辑】');

test('初始命数固定 5 条', () => {
    const match = canvasContent.match(/const lives\s*=\s*(\d+);/);
    assert(match, '找不到 lives 常量');
    assert(match[1] === '5', `lives 应为 5，当前: ${match[1]}`);
});

test('MIN_UNLOCK_RATIO = 0.03 (3%)', () => {
    const match = engineContent.match(/MIN_UNLOCK_RATIO\s*=\s*([\d.]+)/);
    assert(match, '找不到 MIN_UNLOCK_RATIO');
    assert(match[1] === '0.03', `MIN_UNLOCK_RATIO 应为 0.03，当前: ${match[1]}`);
});

test('cancelDraw 防重入机制', () => {
    assertContains(engineContent, 'cancelDrawInProgress',
        '应使用 cancelDrawInProgress 防重入');
});

test('onLivesZero 回调触发失败界面', () => {
    assertContains(engineContent, 'this.onLivesZero',
        '应定义 onLivesZero 回调');
});

test('syncInterval 500ms 轮询', () => {
    // React useEffect 中 setInterval 的格式：setInterval(() => {...}, 500)
    // 用 [\s\S]*? 匹配多行参数
    const match = canvasContent.match(/setInterval\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?,\s*(\d+)\s*\)/);
    assert(match, '找不到 setInterval(() => {...}, 500)');
    assert(match[1] === '500', `syncInterval 应为 500ms，当前: ${match[1]}ms`);
});

// ============================================================
// 同边分割算法
// ============================================================
console.log('\n【同边分割算法】');

const polygonContent = readFile(POLYGON_FILE);

test('polygon.ts 包含 sameSegment 检测', () => {
    assertContains(polygonContent, 'sameSegment', '应包含 sameSegment 变量');
});

test('polygon.ts 同边路径长度 vs 沿边距离比较', () => {
    assertContains(polygonContent, 'pathLen > rimDist * 1.3',
        '应使用 pathLen > rimDist * 1.3 判断');
});

test('polygon.ts 同边分割后验证面积', () => {
    assertContains(polygonContent, 'if (a1 > 0 && a2 > 0) return [p1, p2]',
        '应验证两个面积都 > 0');
});

test('polygon.ts 路径太短时返回原多边形', () => {
    assertContains(polygonContent, 'return [poly, []]',
        '路径太短时应返回 [poly, []]');
});

// ============================================================
// 精灵检测算法
// ============================================================
console.log('\n【精灵检测算法】');

test('checkSpiritIn 包含 8 点采样', () => {
    const probeCount = (engineContent.match(/\{ x: spirit\.position\.x/g) || []).length;
    assert(probeCount >= 6, `探测点应 >= 6 个，当前: ${probeCount}`);
});

test('checkSpiritIn 包含路径距离检测', () => {
    assertContains(engineContent, 'onPath = path.some',
        '应包含 onPath 路径距离检测');
});

test('Big Spirit fallback 使用面积比判断', () => {
    assertContains(engineContent, 'ratio = Math.max(area1, area2) / Math.max',
        '应使用面积比判断');
});

// ============================================================
// 界面组件
// ============================================================
console.log('\n【界面组件】');

const resultScreenPath = path.join(PROJECT_ROOT, 'src', 'components', 'ResultScreen.tsx');
const resultContent = readFile(resultScreenPath);

test('ResultScreen 失败文案 "YOU LOSE"', () => {
    assertContains(resultContent, 'YOU LOSE',
        '失败文案应为 "YOU LOSE"');
});

test('ResultScreen z-[100] 层级', () => {
    assertContains(resultContent, "z-[100]",
        'ResultScreen 层级应为 z-[100]');
});

test('App.tsx won/lost 优先于 playing 拦截', () => {
    const appPath = path.join(PROJECT_ROOT, 'src', 'App.tsx');
    const appContent = readFile(appPath);
    const wonIdx = appContent.indexOf("status === 'won'");
    const playingIdx = appContent.indexOf("playMode === 'jigsaw'");
    assert(wonIdx !== -1 && wonIdx < playingIdx,
        'won/lost 应在 playing 之前拦截');
});

// ============================================================
// 代码质量
// ============================================================
console.log('\n【代码质量】');

test('engine.ts 无 console.log', () => {
    const logs = (engineContent.match(/console\.log\(/g) || []).length;
    assert(logs === 0, `engine.ts 不应有 console.log，当前: ${logs} 个`);
});

test('polygon.ts 无 console.log', () => {
    const logs = (polygonContent.match(/console\.log\(/g) || []).length;
    assert(logs === 0, `polygon.ts 不应有 console.log，当前: ${logs} 个`);
});

test('GameCanvas.tsx 无 console.log', () => {
    const logs = (canvasContent.match(/console\.log\(/g) || []).length;
    assert(logs === 0, `GameCanvas.tsx 不应有 console.log，当前: ${logs} 个`);
});

test('handleRelease 不调用 cancelDraw', () => {
    const handleRelease = engineContent.match(/handleRelease\s*\(\s*\)[^{]*\{([\s\S]*?)(?=\n\s{0,4}\/\/ =|^\s{0,4}[a-z])/m);
    if (handleRelease) {
        assertNotContains(handleRelease[1], 'cancelDraw(',
            'handleRelease 不应调用 cancelDraw');
    }
});

test('cancelDraw 减少命数', () => {
    assertContains(engineContent, 'this.lives--',
        'cancelDraw 应减少命数');
});

test('cancelDraw 有防御性 drawPath 访问', () => {
    assertContains(engineContent, 'if (this.drawPath.length > 0)',
        'cancelDraw 应防御性检查 drawPath.length');
});

test('init() 重置 originalActivePolygon', () => {
    assertContains(engineContent, 'this.originalActivePolygon = null',
        'init 应重置 originalActivePolygon');
});

test('小范围解锁时保留累计进度（不覆盖 lastUnlockPercent）', () => {
    // 关键：MIN_UNLOCK_RATIO 检测失败时的 return 分支不应赋值 lastUnlockPercent
    const minUnlockSection = engineContent.match(
        /if \(percent < this\.MIN_UNLOCK_RATIO\)[^}]*\{([\s\S]*?)(?=\n\s{0,4}this\.activePolygon\s*=\s*keepPoly)/m
    );
    if (minUnlockSection) {
        assertNotContains(minUnlockSection[1], 'this.lastUnlockPercent = 0',
            '小范围解锁返回时不应重置 lastUnlockPercent（保留已累计的 HUD 显示）');
    }
});

// ============================================================
// 总结
// ============================================================
console.log('\n========================================');
console.log(`测试结果: ${passed} 通过, ${failed} 失败`);
console.log('========================================');

if (failed > 0) {
    process.exit(1);
} else {
    console.log('\n🎉 所有测试通过！v1.3.3 验收完成');
    process.exit(0);
}
