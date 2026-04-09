import { useEffect, useRef } from 'react';
import { GameEngine } from './engine';
import { useGame } from '../hooks/useGame';

export function GameCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const { currentLevel, setUnlockedPercent, endGame, saveData } = useGame();

    useEffect(() => {
        if (!canvasRef.current) return;

        // Initialize engine
        const engine = new GameEngine(canvasRef);

        // Lives inversely proportional to speed
        const speed = saveData.settings.spiritSpeed || 2;
        const lives = speed === 1 ? 5 : speed === 2 ? 3 : 1;

        engine.init({
            spirits: currentLevel.spirits,
            bgImage: currentLevel.bgImage,
            spiritSpeed: speed,
            fogDensity: saveData.settings.fogDensity || 2,
            lives: lives,
            haptic: saveData.settings.haptic
        });

        // Set level data
        // TODO: Pass spirit config to engine

        // Sync loop for UI
        const syncInterval = setInterval(() => {
            if (engine.lastUnlockPercent > 0) {
                setUnlockedPercent(engine.lastUnlockPercent);
            }
            // Check for Win state from Engine (e.g. if engine has a 'won' flag or callback)
            // For now, let's just use the percent
            if (engine.lastUnlockPercent >= currentLevel.unlockThreshold && !engine.isWon) {
                engine.isWon = true;
                setUnlockedPercent(engine.lastUnlockPercent);
                setTimeout(() => {
                    endGame(true, engine.lastUnlockPercent, engine.levelTimeElapsed, engine.lives === engine.initialLives);
                }, 1500); // Allow some time for the 'expansion' animation before showing ResultScreen
            }
        }, 500);

        engineRef.current = engine;

        return () => {
            engine.stop();
            clearInterval(syncInterval);
        };
    }, [currentLevel]);

    return (
        <canvas
            ref={canvasRef}
            className="block w-full h-full touch-none"
        />
    );
}
