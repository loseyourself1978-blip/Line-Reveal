import { useEffect, useRef } from 'react';
import { GameEngine } from './engine';
import { useGame } from '../hooks/useGame';
import { LEVELS } from '../data/levels';

/**
 * GameCanvas v1.4.0
 * 
 * 胜利动画流程：
 * 1. 通关时迷雾从中心逐渐消散（2.5 秒）
 * 2. 背景图片完整显示
 * 3. 闪动提示 "TAP ANYWHERE TO CONTINUE"
 * 4. 用户点击后显示 ResultScreen
 */
export function GameCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const gameEndedRef = useRef(false);
    const { currentLevel, currentLevelId, setUnlockedPercent, endGame, saveData, setEngineLives, setStatus} = useGame();

    // v1.4.0: 胜利后用户点击回调
    const handleWinClick = useRef(() => {
        if (!gameEndedRef.current) return;
        gameEndedRef.current = false;
        setStatus('won');
    }).current;

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
            },
            onWonClick: handleWinClick // v1.4.0: 胜利后点击回调
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

            // v1.4.0: 胜利检测
            if (eng.cumulativeUnlockedPercent >= levelConfig.unlockThreshold && !eng.isWon && !gameEndedRef.current) {
                eng.isWon = true;
                gameEndedRef.current = true;
                setUnlockedPercent(eng.cumulativeUnlockedPercent);
                setEngineLives(eng.lives);
                // 不调用 engine.stop()，让动画继续播放
                // 用户点击后由 onWonClick 回调处理
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
