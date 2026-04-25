/**
 * PinballGame.tsx — v1.5.0
 * Pinball Reveal 游戏主组件
 *
 * 独立球数系统（Q4），不消耗桃心命数
 * 模式结束后调用 endGame() 统一处理胜负
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { PinballEngine, type FloatingSpirit } from '../game/PinballEngine';
import { getPinballLevelConfig } from '../data/pinball-levels';
import { useGame } from '../hooks/useGame';

interface PinballGameProps {
    onBack: () => void;
}

export function PinballGame({ onBack }: PinballGameProps) {
    const { currentLevel, currentLevelId, endGame } = useGame();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<PinballEngine | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [ballsLeft, setBallsLeft] = useState(3);
    const [timeLeft, setTimeLeft] = useState(120);
    const [revealPercent, setRevealPercent] = useState(0);
    const [gameOver, setGameOver] = useState<'won' | 'lost' | null>(null);
    const [canvasSize, setCanvasSize] = useState({ w: 390, h: 720 });
    const [paddleFlash, setPaddleFlash] = useState(false);
    const [showCountdown, setShowCountdown] = useState(true);
    const [countdown, setCountdown] = useState(3);
    const [activePowerUps, setActivePowerUps] = useState<string[]>([]);
    const [liveSpirits, setLiveSpirits] = useState<FloatingSpirit[]>([]);

    const gameEndedRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hapticsShown = useRef(false);

    // ─── 获取关卡配置 ───────────────────────────────────────

    const levelCfg = getPinballLevelConfig(currentLevelId);

    // ─── Canvas 尺寸 ────────────────────────────────────────

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setCanvasSize({ w: Math.floor(rect.width), h: Math.floor(rect.height) });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // ─── 倒计时启动 ─────────────────────────────────────────

    useEffect(() => {
        let c = 3;
        setCountdown(c);
        setShowCountdown(true);
        const t = setInterval(() => {
            c--;
            if (c <= 0) {
                clearInterval(t);
                setShowCountdown(false);
                startEngine();
            } else {
                setCountdown(c);
            }
        }, 1000);
        return () => clearInterval(t);
    }, []);  // 仅挂载时执行一次

    // ─── 引擎初始化 ─────────────────────────────────────────

    const startEngine = useCallback(() => {
        if (!canvasRef.current) return;

        const engine = new PinballEngine({
            canvasW: canvasSize.w,
            canvasH: canvasSize.h,
            levelId: currentLevelId,
            bgImageSrc: currentLevel.bgImage,
            initialBalls: levelCfg.initialBalls,
            timeLimit: levelCfg.timeLimit,
            unlockThreshold: levelCfg.unlockThreshold,
            perfectThreshold: levelCfg.perfectThreshold,
            initialSpeed: levelCfg.initialSpeed,
            spiritGuardRatio: levelCfg.spiritGuardRatio,

            onBallLost: () => {
                if (gameEndedRef.current) return;
                setBallsLeft(prev => {
                    const next = prev - 1;
                    return next;
                });
            },

            onRevealUpdate: (pct) => {
                setRevealPercent(pct);
            },

            onGameWon: (percent, time) => {
                if (gameEndedRef.current) return;
                gameEndedRef.current = true;
                setGameOver('won');
                endGame(true, percent, time);
            },

            onGameLost: () => {
                if (gameEndedRef.current) return;
                gameEndedRef.current = true;
                setGameOver('lost');
                endGame(false, engine.currentRevealedPercent, engine.currentTimeElapsed);
            },

            onSpiritReleased: (spirit) => {
                setLiveSpirits(prev => [...prev, spirit]);
            },
        });

        engine.init(canvasRef);
        engineRef.current = engine;
        setBallsLeft(levelCfg.initialBalls);
        setTimeLeft(levelCfg.timeLimit);

        // 等背景图加载完成（最多等 2s）后启动
        const tryStart = () => {
            if (engine.allBricks.length > 0 || Date.now() - startTs > 2000) {
                engine.start();
                startTimer();
            } else {
                setTimeout(tryStart, 100);
            }
        };
        const startTs = Date.now();
        setTimeout(tryStart, 200);

    }, [canvasSize, currentLevelId, currentLevel, levelCfg]);

    // ─── 倒计时 HUD ──────────────────────────────────────────

    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        let remaining = levelCfg.timeLimit;
        timerRef.current = setInterval(() => {
            remaining -= 1;
            setTimeLeft(remaining);
            if (remaining <= 0) {
                clearInterval(timerRef.current!);
            }
        }, 1000);
    }, [levelCfg.timeLimit]);

    useEffect(() => {
        return () => {
            engineRef.current?.destroy();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // ─── 同步 Spirit 状态 ────────────────────────────────────

    useEffect(() => {
        const interval = setInterval(() => {
            if (engineRef.current) {
                setLiveSpirits(engineRef.current.liveSpirits);
                setActivePowerUps(engineRef.current.activePowerUpList.map(p => p.type));
            }
        }, 500);
        return () => clearInterval(interval);
    }, []);

    // ─── 触摸控制 ────────────────────────────────────────────

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!engineRef.current) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        engineRef.current.movePaddle(x * (canvasSize.w / rect.width));
    }, [canvasSize.w]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!engineRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvasSize.w / rect.width);
        engineRef.current.movePaddle(x);
    }, [canvasSize.w]);

    // ─── HUD 辅助 ─────────────────────────────────────────────

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
    const isWarning = timeLeft <= 10;
    const pct = Math.round(revealPercent * 100);

    // ─── 渲染 ─────────────────────────────────────────────────

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative bg-slate-950 overflow-hidden select-none"
            style={{ touchAction: 'none' }}
        >
            {/* 游戏 Canvas */}
            <canvas
                ref={canvasRef}
                width={canvasSize.w}
                height={canvasSize.h}
                className="absolute inset-0 w-full h-full"
                onTouchMove={handleTouchMove}
                onMouseMove={handleMouseMove}
                style={{ touchAction: 'none', userSelect: 'none' }}
            />

            {/* HUD 顶部 */}
            {!gameOver && !showCountdown && (
                <div className="absolute top-0 left-0 right-0 z-20 pt-safe px-4 pt-3 pb-2 bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-none">
                    <div className="flex items-center justify-between">
                        {/* 球数 */}
                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: levelCfg.initialBalls }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-3.5 h-3.5 rounded-full transition-all ${
                                        i < ballsLeft
                                            ? 'bg-yellow-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                                            : 'bg-slate-700'
                                    }`}
                                />
                            ))}
                            <span className="text-slate-400 text-xs ml-1">BALLS</span>
                        </div>

                        {/* 时间 */}
                        <div className={`font-black text-lg tracking-widest transition-colors ${
                            isWarning ? 'text-red-400 animate-pulse' : 'text-white'
                        }`}>
                            {formatTime(timeLeft)}
                        </div>

                        {/* 解锁进度 */}
                        <div className="text-right">
                            <span className="text-yellow-400 font-black text-sm">{pct}%</span>
                            <span className="text-slate-500 text-xs ml-1">REVEAL</span>
                        </div>
                    </div>

                    {/* 进度条 */}
                    <div className="mt-1.5 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-300"
                            style={{ width: `${pct}%` }}
                        />
                    </div>

                    {/* 通关阈值指示 */}
                    <div
                        className="absolute top-[52px] h-1.5 w-0.5 bg-white/40"
                        style={{ left: `${levelCfg.unlockThreshold * 100}%`, marginLeft: '1rem' }}
                    />
                </div>
            )}

            {/* 道具状态 */}
            {activePowerUps.length > 0 && !gameOver && (
                <div className="absolute top-16 left-4 z-20 flex flex-col gap-1 pointer-events-none">
                    {activePowerUps.includes('slow_motion') && (
                        <div className="bg-purple-500/80 rounded-full px-2 py-0.5 text-white text-[10px] font-bold">
                            🐢 SLOW MO
                        </div>
                    )}
                    {activePowerUps.includes('wide_paddle') && (
                        <div className="bg-blue-500/80 rounded-full px-2 py-0.5 text-white text-[10px] font-bold">
                            ↔ WIDE
                        </div>
                    )}
                </div>
            )}

            {/* 精灵提示 */}
            {liveSpirits.length > 0 && !gameOver && (
                <div className="absolute top-16 right-4 z-20 pointer-events-none">
                    <div className="bg-orange-500/80 rounded-full px-2 py-0.5 text-white text-[10px] font-bold animate-pulse">
                        ✨ SPIRIT ×{liveSpirits.length}
                    </div>
                </div>
            )}

            {/* 返回按钮 */}
            {!gameOver && !showCountdown && (
                <button
                    onClick={onBack}
                    className="absolute top-safe-3 left-4 z-30 mt-2 w-9 h-9 flex items-center justify-center bg-slate-800/70 rounded-full active:scale-90 transition-transform pointer-events-auto"
                    style={{ top: '3.5rem' }}
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            )}

            {/* 倒计时覆盖层 */}
            {showCountdown && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/80">
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4">
                        PINBALL REVEAL
                    </p>
                    <div className="text-8xl font-black text-yellow-400 tabular-nums drop-shadow-[0_0_40px_rgba(251,191,36,0.6)]">
                        {countdown}
                    </div>
                    <p className="text-slate-500 text-xs mt-6 uppercase tracking-widest">
                        Break Blocks. Uncover Beauty.
                    </p>
                </div>
            )}

            {/* 底部模式标签 */}
            {!gameOver && !showCountdown && (
                <div className="absolute bottom-safe-4 left-0 right-0 z-20 flex justify-center pointer-events-none" style={{ bottom: '1rem' }}>
                    <div className="bg-slate-900/60 backdrop-blur-sm rounded-full px-4 py-1.5 border border-slate-700/50">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            PINBALL REVEAL · Lv {currentLevelId}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
