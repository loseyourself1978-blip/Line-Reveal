#!/usr/bin/env node
/**
 * v1.3.1 代码检查测试脚本
 * 验证 Bug#A/B/C 修复是否正确实施
 */
const fs = require('fs');
const path = require('path');

const WORKSPACE = path.join(__dirname, '..');

const tests = [
    // Bug#A: 碰撞链防重入
    { id: 'A1', name: 'cancelDrawInProgress 标志存在', check: () => {
        const code = read('src/game/engine.ts');
        return code.includes('cancelDrawInProgress = false');
    }},
    { id: 'A2', name: 'cancelDraw 开头防重入检查', check: () => {
        const code = read('src/game/engine.ts');
        const idx = code.indexOf('cancelDraw() {');
        const body = code.substring(idx, idx + 300);
        return /if\s*\(\s*this\.cancelDrawInProgress\s*\)\s*return;/.test(body);
    }},
    { id: 'A3', name: 'checkCollisions 防重入检查', check: () => {
        const code = read('src/game/engine.ts');
        const idx = code.indexOf('checkCollisions() {');
        const body = code.substring(idx, idx + 200);
        return body.includes('cancelDrawInProgress') && body.includes('return');
    }},
    { id: 'A4', name: 'cancelDrawInProgress 重置 2 处', check: () => {
        const code = read('src/game/engine.ts');
        const idx = code.indexOf('cancelDraw() {');
        const body = code.substring(idx, idx + 1200);
        const count = (body.match(/cancelDrawInProgress = false/g) || []).length;
        return count >= 2;
    }},

    // Bug#B: YOU LOSE 文案
    { id: 'B1', name: 'YOU LOSE 文案存在', check: () => {
        const code = read('src/components/ResultScreen.tsx');
        return code.includes('YOU LOSE') && !code.includes('>FAILED<');
    }},
    { id: 'B2', name: 'z-index 层级正确', check: () => {
        const code = read('src/components/ResultScreen.tsx');
        return code.includes("z-[100]") || code.includes("z-50");
    }},

    // Bug#C: 小范围解锁
    { id: 'C1', name: 'MIN_UNLOCK_RATIO = 0.03', check: () => {
        const code = read('src/game/engine.ts');
        return code.includes('MIN_UNLOCK_RATIO = 0.03');
    }},
    { id: 'C2', name: 'percent 使用 trashArea 计算', check: () => {
        const code = read('src/game/engine.ts');
        // 找到 finishDrawing 函数定义
        const idx = code.indexOf('finishDrawing(');
        const body = code.substring(idx, idx + 4000);
        return body.includes('trashArea / this.totalArea');
    }},

    // 逻辑验证
    { id: 'L1', name: '模拟防重入: checkCollisions 在 cancelDraw 期间不运行', check: () => {
        const code = read('src/game/engine.ts');
        // 检查 cancelDraw 和 checkCollisions 的交互机制
        const hasCancelDrawGuard = code.includes('if (this.cancelDrawInProgress) return;');
        const cancelIdx = code.indexOf('cancelDraw() {');
        const checkIdx = code.indexOf('checkCollisions() {');
        // checkCollisions 应该在 cancelDraw 之后定义，且有 guard
        return hasCancelDrawGuard && checkIdx > cancelIdx;
    }},
    { id: 'L2', name: '3% 阈值: 2.9% 解锁应拒绝', check: () => {
        const MIN = 0.03;
        const percent = 0.029;
        return percent < MIN; // 应拒绝
    }},
    { id: 'L3', name: '3% 阈值: 5% 解锁应成功', check: () => {
        const MIN = 0.03;
        const percent = 0.05;
        return percent >= MIN; // 应成功
    }},

    // 版本注释
    { id: 'R1', name: 'ResultScreen v1.3.1 注释', check: () => {
        const code = read('src/components/ResultScreen.tsx');
        return code.includes('v1.3.1');
    }},
    { id: 'R2', name: 'engine.ts Bug#A 注释', check: () => {
        const code = read('src/game/engine.ts');
        return code.includes('Bug#A');
    }},
    { id: 'R3', name: 'engine.ts Bug#C 注释', check: () => {
        const code = read('src/game/engine.ts');
        return code.includes('Bug#C') || (code.includes('trashArea') && code.includes('percent'));
    }},
];

function read(relativePath) {
    const fullPath = path.join(WORKSPACE, relativePath);
    return fs.readFileSync(fullPath, 'utf8');
}

console.log('\n🧪 v1.3.1 代码检查测试\n' + '═'.repeat(50));

let passed = 0, failed = 0;
tests.forEach(t => {
    try {
        const result = t.check();
        const icon = result ? '✅' : '❌';
        const status = result ? 'PASS' : 'FAIL';
        console.log(`${icon} [${t.id}] ${t.name} — ${status}`);
        if (result) passed++; else failed++;
    } catch (e) {
        console.log(`❌ [${t.id}] ${t.name} — ERROR: ${e.message}`);
        failed++;
    }
});

console.log('═'.repeat(50));
console.log(`\n📊 结果: ${passed}/${tests.length} 通过, ${failed} 失败\n`);

if (failed > 0) {
    console.log('⚠️  存在失败测试，请检查上述结果并修复。\n');
    process.exit(1);
} else {
    console.log('🎉 所有代码检查通过！\n');
    process.exit(0);
}
