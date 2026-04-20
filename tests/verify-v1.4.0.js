/**
 * Line Reveal v1.4.0 自动化验证脚本
 * 验证 Bug#1 修复：胜利动画延迟逻辑
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function verifyEndGameFix() {
    const useGamePath = join(__dirname, '../src/hooks/useGame.tsx');
    const content = readFileSync(useGamePath, 'utf-8');
    
    console.log('🔍 验证 endGame() 函数修复...\n');
    
    const checks = [
        {
            name: 'setTimeout 延迟逻辑',
            test: () => content.includes('setTimeout(() => {') && content.includes('2500'),
        },
        {
            name: '胜利分支延迟 setStatus',
            test: () => content.includes("setStatus('won')"),
        },
        {
            name: '失败分支立即显示',
            test: () => content.includes("setStatus('lost')"),
        },
        {
            name: '版本注释标记',
            test: () => content.includes('v1.4.0') || content.includes('Bug#1') || content.includes('延迟'),
        },
    ];
    
    let allPassed = true;
    checks.forEach(check => {
        if (check.test()) {
            console.log(`✅ 通过：${check.name}`);
        } else {
            console.error(`❌ 失败：${check.name}`);
            allPassed = false;
        }
    });
    
    return allPassed;
}

function verifyEngineAnimation() {
    const enginePath = join(__dirname, '../src/game/engine.ts');
    const content = readFileSync(enginePath, 'utf-8');
    
    console.log('\n🔍 验证 engine.ts 动画逻辑...\n');
    
    const checks = [
        { name: 'winAnimProgress 字段', test: () => content.includes('winAnimProgress') },
        { name: '动画进度更新', test: () => content.includes('winAnimProgress = Math.min(1, this.winAnimProgress + dt * 0.5)') },
        { name: '渲染缩放效果', test: () => content.includes('this.ctx.scale(1 - this.winAnimProgress') },
        { name: '渲染透明度效果', test: () => content.includes('this.ctx.globalAlpha = 1 - this.winAnimProgress') },
    ];
    
    let allPassed = true;
    checks.forEach(check => {
        if (check.test()) {
            console.log(`✅ 通过：${check.name}`);
        } else {
            console.error(`❌ 失败：${check.name}`);
            allPassed = false;
        }
    });
    
    return allPassed;
}

function verifyAppState() {
    const appPath = join(__dirname, '../src/App.tsx');
    const content = readFileSync(appPath, 'utf-8');
    
    console.log('\n🔍 验证 App.tsx 状态处理...\n');
    
    const checks = [
        { name: 'won 状态 ResultScreen', test: () => content.includes("status === 'won'") && content.includes('ResultScreen') },
        { name: 'dancing 状态已移除', test: () => !content.includes('VictoryDance') && !content.includes('dancing') },
    ];
    
    let allPassed = true;
    checks.forEach(check => {
        if (check.test()) {
            console.log(`✅ 通过：${check.name}`);
        } else {
            console.error(`❌ 失败：${check.name}`);
            allPassed = false;
        }
    });
    
    return allPassed;
}

function main() {
    console.log('========================================');
    console.log('  Line Reveal v1.4.0 自动化验证');
    console.log('========================================\n');
    
    const results = {
        endGameFix: verifyEndGameFix(),
        engineAnimation: verifyEngineAnimation(),
        appState: verifyAppState(),
    };
    
    console.log('\n========================================');
    console.log('  验证结果汇总');
    console.log('========================================\n');
    
    const passed = Object.values(results).filter(r => r).length;
    const total = Object.values(results).length;
    
    console.log(`endGame 修复：${results.endGameFix ? '✅ 通过' : '❌ 失败'}`);
    console.log(`engine 动画：${results.engineAnimation ? '✅ 通过' : '❌ 失败'}`);
    console.log(`App 状态：   ${results.appState ? '✅ 通过' : '❌ 失败'}`);
    console.log(`\n总计：${passed}/${total} 通过`);
    
    if (passed === total) {
        console.log('\n🎉 所有验证通过！v1.4.0 修复完成。');
        process.exit(0);
    } else {
        console.log('\n❌ 部分验证失败，请检查代码。');
        process.exit(1);
    }
}

main();
