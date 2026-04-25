/**
 * pinball-levels.ts — v1.5.0
 * 
 * Pinball Reveal 模式专属关卡配置
 * 复用 Classic 的关卡 ID 体系，参数独立
 *
 * 决策记录（2026-04-25）：
 * - Q1: 1-5关 Spirit Guard 比例 = 0%（完全不出现）
 * - Q3: 1-5关无 Shield
 * - Q4: 独立球数系统，不消耗桃心命数
 */

export interface PinballLevelConfig {
    levelId: number;
    brickCount: [number, number];     // [min, max]
    initialBalls: number;             // Q4: 独立球数
    timeLimit: number;                // 秒
    unlockThreshold: number;          // 通关阈值
    perfectThreshold: number;         // 完美通关阈值
    spiritGuardRatio: number;         // Q1: 1-5关=0
    shieldEnabled: boolean;           // Q3: 1-5关=false
    toughEnabled: boolean;
    initialSpeed?: number;            // 初始球速 px/s（不传则用引擎默认）
}

export const PINBALL_LEVELS: PinballLevelConfig[] = [
    // ─── Lv 1-5 教学关 ────────────────────────────────────
    { levelId: 1,  brickCount: [60, 70],   initialBalls: 3, timeLimit: 120, unlockThreshold: 0.60, perfectThreshold: 0.80, spiritGuardRatio: 0,    shieldEnabled: false, toughEnabled: false, initialSpeed: 320 },
    { levelId: 2,  brickCount: [65, 75],   initialBalls: 3, timeLimit: 120, unlockThreshold: 0.60, perfectThreshold: 0.80, spiritGuardRatio: 0,    shieldEnabled: false, toughEnabled: false, initialSpeed: 340 },
    { levelId: 3,  brickCount: [68, 78],   initialBalls: 3, timeLimit: 120, unlockThreshold: 0.62, perfectThreshold: 0.82, spiritGuardRatio: 0,    shieldEnabled: false, toughEnabled: false, initialSpeed: 360 },
    { levelId: 4,  brickCount: [70, 80],   initialBalls: 3, timeLimit: 120, unlockThreshold: 0.62, perfectThreshold: 0.82, spiritGuardRatio: 0,    shieldEnabled: false, toughEnabled: false, initialSpeed: 370 },
    { levelId: 5,  brickCount: [75, 80],   initialBalls: 3, timeLimit: 120, unlockThreshold: 0.65, perfectThreshold: 0.85, spiritGuardRatio: 0,    shieldEnabled: false, toughEnabled: false, initialSpeed: 380 },

    // ─── Lv 6-15 中级 ──────────────────────────────────────
    { levelId: 6,  brickCount: [90, 100],  initialBalls: 3, timeLimit: 120, unlockThreshold: 0.68, perfectThreshold: 0.88, spiritGuardRatio: 0.08, shieldEnabled: true, toughEnabled: true, initialSpeed: 390 },
    { levelId: 7,  brickCount: [95, 110],  initialBalls: 3, timeLimit: 120, unlockThreshold: 0.68, perfectThreshold: 0.88, spiritGuardRatio: 0.08, shieldEnabled: true, toughEnabled: true, initialSpeed: 395 },
    { levelId: 8,  brickCount: [100, 115], initialBalls: 3, timeLimit: 120, unlockThreshold: 0.70, perfectThreshold: 0.88, spiritGuardRatio: 0.10, shieldEnabled: true, toughEnabled: true, initialSpeed: 400 },
    { levelId: 9,  brickCount: [105, 120], initialBalls: 3, timeLimit: 120, unlockThreshold: 0.70, perfectThreshold: 0.88, spiritGuardRatio: 0.10, shieldEnabled: true, toughEnabled: true, initialSpeed: 400 },
    { levelId: 10, brickCount: [110, 125], initialBalls: 3, timeLimit: 120, unlockThreshold: 0.70, perfectThreshold: 0.90, spiritGuardRatio: 0.10, shieldEnabled: true, toughEnabled: true, initialSpeed: 405 },
    { levelId: 11, brickCount: [115, 130], initialBalls: 3, timeLimit: 120, unlockThreshold: 0.70, perfectThreshold: 0.90, spiritGuardRatio: 0.10, shieldEnabled: true, toughEnabled: true, initialSpeed: 408 },
    { levelId: 12, brickCount: [118, 132], initialBalls: 3, timeLimit: 120, unlockThreshold: 0.70, perfectThreshold: 0.90, spiritGuardRatio: 0.11, shieldEnabled: true, toughEnabled: true, initialSpeed: 412 },
    { levelId: 13, brickCount: [120, 130], initialBalls: 3, timeLimit: 120, unlockThreshold: 0.70, perfectThreshold: 0.90, spiritGuardRatio: 0.11, shieldEnabled: true, toughEnabled: true, initialSpeed: 415 },
    { levelId: 14, brickCount: [122, 132], initialBalls: 3, timeLimit: 120, unlockThreshold: 0.72, perfectThreshold: 0.90, spiritGuardRatio: 0.12, shieldEnabled: true, toughEnabled: true, initialSpeed: 418 },
    { levelId: 15, brickCount: [125, 130], initialBalls: 3, timeLimit: 120, unlockThreshold: 0.72, perfectThreshold: 0.90, spiritGuardRatio: 0.12, shieldEnabled: true, toughEnabled: true, initialSpeed: 420 },

    // ─── Lv 16-23 高级 ─────────────────────────────────────
    { levelId: 16, brickCount: [140, 155], initialBalls: 3, timeLimit: 150, unlockThreshold: 0.75, perfectThreshold: 0.92, spiritGuardRatio: 0.12, shieldEnabled: true, toughEnabled: true, initialSpeed: 430 },
    { levelId: 17, brickCount: [145, 160], initialBalls: 3, timeLimit: 150, unlockThreshold: 0.75, perfectThreshold: 0.92, spiritGuardRatio: 0.13, shieldEnabled: true, toughEnabled: true, initialSpeed: 432 },
    { levelId: 18, brickCount: [150, 165], initialBalls: 3, timeLimit: 150, unlockThreshold: 0.75, perfectThreshold: 0.92, spiritGuardRatio: 0.13, shieldEnabled: true, toughEnabled: true, initialSpeed: 435 },
    { levelId: 19, brickCount: [155, 168], initialBalls: 3, timeLimit: 150, unlockThreshold: 0.75, perfectThreshold: 0.93, spiritGuardRatio: 0.14, shieldEnabled: true, toughEnabled: true, initialSpeed: 438 },
    { levelId: 20, brickCount: [158, 172], initialBalls: 3, timeLimit: 150, unlockThreshold: 0.75, perfectThreshold: 0.93, spiritGuardRatio: 0.14, shieldEnabled: true, toughEnabled: true, initialSpeed: 440 },
    { levelId: 21, brickCount: [160, 175], initialBalls: 3, timeLimit: 150, unlockThreshold: 0.75, perfectThreshold: 0.93, spiritGuardRatio: 0.15, shieldEnabled: true, toughEnabled: true, initialSpeed: 445 },
    { levelId: 22, brickCount: [165, 178], initialBalls: 3, timeLimit: 150, unlockThreshold: 0.75, perfectThreshold: 0.93, spiritGuardRatio: 0.16, shieldEnabled: true, toughEnabled: true, initialSpeed: 448 },
    { levelId: 23, brickCount: [168, 180], initialBalls: 3, timeLimit: 150, unlockThreshold: 0.75, perfectThreshold: 0.94, spiritGuardRatio: 0.18, shieldEnabled: true, toughEnabled: true, initialSpeed: 450 },

    // ─── Lv 24-30 专家 ─────────────────────────────────────
    { levelId: 24, brickCount: [190, 210], initialBalls: 3, timeLimit: 180, unlockThreshold: 0.80, perfectThreshold: 0.95, spiritGuardRatio: 0.15, shieldEnabled: true, toughEnabled: true, initialSpeed: 460 },
    { levelId: 25, brickCount: [195, 215], initialBalls: 3, timeLimit: 180, unlockThreshold: 0.80, perfectThreshold: 0.95, spiritGuardRatio: 0.16, shieldEnabled: true, toughEnabled: true, initialSpeed: 462 },
    { levelId: 26, brickCount: [200, 220], initialBalls: 3, timeLimit: 180, unlockThreshold: 0.80, perfectThreshold: 0.95, spiritGuardRatio: 0.17, shieldEnabled: true, toughEnabled: true, initialSpeed: 465 },
    { levelId: 27, brickCount: [205, 225], initialBalls: 3, timeLimit: 180, unlockThreshold: 0.80, perfectThreshold: 0.95, spiritGuardRatio: 0.18, shieldEnabled: true, toughEnabled: true, initialSpeed: 468 },
    { levelId: 28, brickCount: [210, 230], initialBalls: 3, timeLimit: 180, unlockThreshold: 0.80, perfectThreshold: 0.96, spiritGuardRatio: 0.19, shieldEnabled: true, toughEnabled: true, initialSpeed: 470 },
    { levelId: 29, brickCount: [215, 235], initialBalls: 3, timeLimit: 180, unlockThreshold: 0.80, perfectThreshold: 0.96, spiritGuardRatio: 0.20, shieldEnabled: true, toughEnabled: true, initialSpeed: 473 },
    { levelId: 30, brickCount: [220, 240], initialBalls: 3, timeLimit: 180, unlockThreshold: 0.80, perfectThreshold: 0.96, spiritGuardRatio: 0.22, shieldEnabled: true, toughEnabled: true, initialSpeed: 476 },
];

/** 获取指定关卡的 Pinball 配置，无配置时使用默认值 */
export function getPinballLevelConfig(levelId: number): PinballLevelConfig {
    const found = PINBALL_LEVELS.find(l => l.levelId === levelId);
    if (found) return found;

    // Lv 31+ 挑战关：动态生成
    const chapter = Math.floor((levelId - 1) / 5);
    return {
        levelId,
        brickCount: [250 + chapter * 20, 280 + chapter * 20],
        initialBalls: 2,
        timeLimit: 120,
        unlockThreshold: 0.85,
        perfectThreshold: 0.97,
        spiritGuardRatio: Math.min(0.30, 0.20 + chapter * 0.01),
        shieldEnabled: true,
        toughEnabled: true,
        initialSpeed: 480 + chapter * 5,
    };
}
