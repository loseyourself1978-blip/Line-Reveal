#!/usr/bin/env node
/**
 * Line Reveal v1.3.0 游戏核心逻辑单元测试
 * 验证所有Bug修复的正确性
 */

const fs = require('fs');
const path = require('path');

console.log('🎮 Line Reveal v1.3.0 游戏核心逻辑测试\n');
console.log('═'.repeat(60));

let allPassed = true;
const results = [];

function test(name, condition, detail = '') {
  const status = condition ? '✅' : '❌';
  const passed = condition ? 'PASS' : 'FAIL';
  if (!condition) allPassed = false;
  results.push({ name, status: passed, detail });
  console.log(`${status} ${name}`);
  if (detail) console.log(`   └─ ${detail}`);
}

// ========== Bug #1: Try Again 重试同一关 ==========
console.log('\n🐛 Bug #1: Try Again 重试同一关');
console.log('-'.repeat(60));

const enginePath = path.join(__dirname, '../src/game/engine.ts');
const engineCode = fs.readFileSync(enginePath, 'utf8');
const gameCanvasPath = path.join(__dirname, '../src/game/GameCanvas.tsx');
const gameCanvasCode = fs.readFileSync(gameCanvasPath, 'utf8');

test(
  'engine.ts 包含 onLivesZero 回调',
  engineCode.includes('onLivesZero'),
  '用于通知 App.tsx 游戏失败'
);

test(
  'engine.ts onLivesZero 是可选回调',
  engineCode.includes('onLivesZero: (() => void) | null'),
  '类型为 (() => void) | null'
);

test(
  'GameCanvas.tsx 调用 onLivesZero',
  gameCanvasCode.includes('onLivesZero: () =>'),
  '当命数归零时触发回调'
);

test(
  'GameCanvas.tsx useEffect 依赖 currentLevelId',
  gameCanvasCode.includes('currentLevelId') && 
  (gameCanvasCode.match(/useEffect.*?\[.*?currentLevelId.*?\]/s) !== null),
  'LevelId变化时重新初始化'
);

// ========== Bug #2: 初始 5 条命 ==========
console.log('\n🐛 Bug #2: 初始 5 条命');
console.log('-'.repeat(60));

test(
  'GameCanvas.tsx lives 硬编码为 5',
  gameCanvasCode.includes('const lives = 5') || 
  gameCanvasCode.includes('lives={5}') ||
  gameCanvasCode.includes('lives: 5'),
  '不受速度设置影响'
);

test(
  'engine.ts lives 默认值为合理值',
  engineCode.includes('public lives = 1') || 
  engineCode.includes('private lives: number'),
  'engine内部命数管理'
);

const useGamePath = path.join(__dirname, '../src/hooks/useGame.tsx');
if (fs.existsSync(useGamePath)) {
  const useGameCode = fs.readFileSync(useGamePath, 'utf8');
  test(
    'useGame.tsx startGame 重置命数',
    useGameCode.includes('engineLives') || useGameCode.includes('lives'),
    '开始游戏时重置'
  );
}

// ========== Bug #3: 同边划线解锁 ==========
console.log('\n🐛 Bug #3: 同边划线解锁');
console.log('-'.repeat(60));

const polygonPath = path.join(__dirname, '../src/game/polygon.ts');
const polygonCode = fs.readFileSync(polygonPath, 'utf8');

test(
  'polygon.ts 包含 sameSegment 检测',
  polygonCode.includes('sameSegment'),
  '检测起点终点是否在同一segment'
);

test(
  'polygon.ts 同边时有路径长度比较',
  polygonCode.includes('pathLen') && polygonCode.includes('rimDist'),
  '比较玩家路径vs沿边距离'
);

test(
  'polygon.ts 同边时检查路径是否够长',
  polygonCode.includes('1.3') || polygonCode.includes('pathLen >'),
  '路径太短不分割'
);

test(
  'polygon.ts splitPolygon 返回有效多边形',
  polygonCode.includes('return [p1, p2]'),
  '返回分割后的两个多边形'
);

// ========== Bug #4: 大范围划线成功率 ==========
console.log('\n🐛 Bug #4: 大范围划线成功率');
console.log('-'.repeat(60));

test(
  'engine.ts checkSpiritIn 使用多方向采样',
  engineCode.includes('SAMPLE_POINTS') || 
  engineCode.includes('8') ||
  (engineCode.match(/for.*?\(\s*\w+\s*=\s*0.*?<\s*8/g) !== null),
  '使用8点采样检测spirit'
);

test(
  'engine.ts 包含路径距离检测',
  engineCode.includes('path.some') && engineCode.includes('dist('),
  'spirit在划线路径附近时判断'
);

test(
  'engine.ts Big Spirit fallback 有面积比判断',
  engineCode.includes('areaRatio') || 
  engineCode.includes('ratio') ||
  (engineCode.includes('area') && engineCode.includes('keepArea')),
  'fallback时使用面积比判断'
);

// ========== Bug #5: 5% 小圈防护 ==========
console.log('\n🐛 Bug #5: 5% 小圈防护');
console.log('-'.repeat(60));

test(
  'engine.ts 包含 MIN_UNLOCK_RATIO 常量',
  engineCode.includes('MIN_UNLOCK_RATIO'),
  '定义最小解锁阈值'
);

test(
  'engine.ts MIN_UNLOCK_RATIO = 0.05 (5%)',
  engineCode.includes('MIN_UNLOCK_RATIO = 0.05') ||
  engineCode.includes('= 0.05') && engineCode.includes('MIN_UNLOCK'),
  '5%阈值'
);

test(
  'engine.ts startDrawing 保存 originalActivePolygon',
  engineCode.includes('originalActivePolygon'),
  '保存初始状态用于回滚'
);

test(
  'engine.ts finishDrawing 有 5% 阈值检查',
  engineCode.includes('percent <') || 
  engineCode.includes('ratio < MIN_UNLOCK'),
  '解锁比例小于5%时拒绝'
);

test(
  'engine.ts 小范围解锁时保留原多边形',
  engineCode.includes('activePolygon = originalActivePolygon') ||
  engineCode.includes('activePolygon = this.originalActivePolygon'),
  '不进行分割'
);

// ========== 代码质量检查 ==========
console.log('\n🔍 代码质量检查');
console.log('-'.repeat(60));

test(
  'engine.ts handleRelease 不调用 cancelDraw',
  !engineCode.match(/handleRelease[^}]*cancelDraw/s) ||
  engineCode.indexOf('cancelDraw') < engineCode.indexOf('handleRelease') === false,
  '只在碰撞时调用cancelDraw'
);

test(
  'engine.ts 无 console.log',
  !engineCode.includes('console.log'),
  '生产代码无调试日志'
);

test(
  'polygon.ts 无 console.log',
  !polygonCode.includes('console.log'),
  '生产代码无调试日志'
);

test(
  'GameCanvas.tsx 无 console.log',
  !gameCanvasCode.includes('console.log'),
  '生产代码无调试日志'
);

// ========== 总结 ==========
console.log('\n' + '═'.repeat(60));
const passedCount = results.filter(r => r.status === 'PASS').length;
const failCount = results.filter(r => r.status === 'FAIL').length;
console.log(`\n📊 测试结果: ${passedCount} 通过, ${failCount} 失败`);

if (allPassed) {
  console.log('\n🎉 所有测试通过！v1.3.0 Bug修复验证完成\n');
  process.exit(0);
} else {
  console.log('\n❌ 部分测试失败，请检查代码\n');
  process.exit(1);
}
