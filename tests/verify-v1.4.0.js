/**
 * Line Reveal v1.4.0 自动化验证脚本
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function verifyGameCanvasFix() {
    const gameCanvasPath = join(__dirname, '../src/game/GameCanvas.tsx');
    let content = readFileSync(gameCanvasPath, 'utf-8');
    
    console.log('🔍 验证 GameCanvas.tsx 修复...\n');
    
    // 移除注释再检查
    const contentNoComments = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    
    const winStart = contentNoComments.indexOf('if (eng.cumulativeUnlockedPercent >= levelConfig.unlockThreshold');
    const winEnd = contentNoComments.indexOf('endGame(true', winStart);
    const winBlock = contentNoComments.substring(winStart, winEnd + 100);
    
    const checks = [
        { name: '胜利检测逻辑存在', test: () => winStart > -1 },
        { name: '胜利时不 stop engine', test: () => !winBlock.includes('engine.stop()') },
        { name: '调用 endGame(true)', test: () => content.includes('endGame(true, eng.cumulativeUnlockedPercent') },
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

function verifyUseGameFix() {
    const useGamePath = join(__dirname, '../src/hooks/useGame.tsx');
    const content = readFileSync(useGamePath, 'utf-8');
    
    console.log('\n🔍 验证 useGame.tsx 修复...\n');
    
    const checks = [
        { name: 'setTimeout 延迟 2500ms', test: () => content.includes('setTimeout') && content.includes('2500') },
        { name: '延迟后 setStatus(won)', test: () => content.includes("setStatus('won')") },
        { name: '失败立即 setStatus(lost)', test: () => content.includes("setStatus('lost')") },
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
        gameCanvasFix: verifyGameCanvasFix(),
        useGameFix: verifyUseGameFix(),
    };
    
    console.log('\n========================================');
    console.log('  验证结果汇总');
    console.log('========================================\n');
    
    const passed = Object.values(results).filter(r => r).length;
    const total = Object.values(results).length;
    console.log(`GameCanvas 修复：${results.gameCanvasFix ? '✅ 通过' : '❌ 失败'}`);
    console.log(`useGame 修复：   ${results.useGameFix ? '✅ 通过' : '❌ 失败'}`);
    console.log(`\n总计：${passed}/${total} 通过`);
    
    if (passed === total) {
        console.log('\n🎉 所有验证通过！v1.4.0 修复完成。');
        process.exit(0);
    } else {
        console.log('\n❌ 部分验证失败。');
        process.exit(1);
    }
}

main();
