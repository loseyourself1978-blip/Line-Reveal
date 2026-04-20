import { useEffect, useRef } from 'react';
import { GameEngine } from './engine';
import { useGame } from '../hooks/useGame';
import { LEVELS } from '../data/levels';

/**
 * GameCanvas（v1.3.0）
 *
 * 关键修复：
 * - Bug#1: useEffect 依赖 currentLevelId，确保 Try Again 重试同一关时重新初始化
 * - 固定 5 条命（不受速度影响）
 * - syncInterval：同步解锁百分比、命数、触发胜利
 * - 命耗尽 → onLivesZero → endGame(false)
 *
 * v1.4.0 Bug#1 修复：
 * - 胜利时不要 stop() engine，让 winAnimProgress 动画继续播放 2.5 秒
 * - engine 在 GameCanvas 卸载时自动停止（useEffect cleanup）
 */
export function GameCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const gameEndedRef = useRef(false);
    const { currentLevel, currentLevelId, setUnlockedPercent, endGame, saveData, setEngineLives } = useGame();

    useEffect(() => {
        if (!canvasRef.current) return;

        gameEndedRef.current = false;
        const lives = 5;
        setEngineLives(lives);

        const levelConfig = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];
        const engine = new GameEngine(canvasRef);
        engineRef.current = engine;

        engine.init({
            spirits: levelConfig.spirits,
            bgImage: currentLevel.bgImage,
            spiritSpeed: saveData.settings.spiritSpeed || 2,
            fogDensity: saveData.settings.fogDensity || 2,
            lives: lives,
            haptic: saveData.settings.haptic,
            onLivesZero: () => {
                if (gameEndedRef.current) return;
                gameEndedRef.current = true;
                engine.stop();
                setEngineLives(0);
                endGame(false, engine.cumulativeUnlockedPercent, engine.levelTimeElapsed, false);
            }
        });

        const syncInterval = setInterval(() => {
            if (!engineRef.current) return;
            const eng = engineRef.current;

            if (eng.lives !== undefined) {
                setEngineLives(eng.lives);
            }

            if (eng.cumulativeUnlockedPercent > 0) {
                setUnlockedPercent(eng.cumulativeUnlockedPercent);
            }

            // v1.4.0 Bug#1 修复：胜利时不要 stop() engine，让动画继续播放
            if (eng.cumulativeUnlockedPercent >= levelConfig.unlockThreshold && !eng.isWon && !gameEndedRef.current) {
                eng.isWon = true;
                gameEndedRef.current = true;
                setUnlockedPercent(eng.cumulativeUnlockedPercent);
                setEngineLives(eng.lives);
                // 注意：不调用 engine.stop()，让 winAnimProgress 动画播放 2.5 秒
                // engine 会在 GameCanvas 卸载时自动停止（见 cleanup）
                endGame(true, eng.cumulativeUnlockedPercent, eng.levelTimeElapsed, eng.lives === eng.initialLives);
            }
        }, 500);

        return () => {
            engine.stop();
            clearInterval(syncInterval);
        };
    }, [currentLevelId, currentLevel.bgImage, saveData.settings.spiritSpeed, saveData.settings.fogDensity, saveData.settings.haptic]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full touch-none z-0"
        />
    );
}
