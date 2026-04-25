import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Match3Engine, STAGES_CONFIG } from '../game/Match3Engine';
import { audioManager } from '../game/AudioManager';
import { useGame } from '../hooks/useGame';
import { ALL_BG_IMAGES } from '../data/levels';

interface Match3GameProps {
    onBack: () => void;
}

// PRD v1.1.2: 初始 10 秒，消一对 +5 秒，< 5s 进度条变红闪烁
const INITIAL_TIME = 10;
const TIME_PER_MATCH = 5;
const WARNING_TIME = 5;

export function Match3Game({ onBack }: Match3GameProps) {
    const { saveData, updateStats, endGame, currentLevelId } = useGame();
    const [engine, setEngine] = useState<Match3Engine | null>(null);
    const [board, setBoard] = useState<(any | null)[][]>([]);
    const [selected, setSelected] = useState<{ r: number, c: number } | null>(null);
    const [path, setPath] = useState<{ r: number, c: number }[] | null>(null);
    const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
    const [revealedPercent, setRevealedPercent] = useState(0);
    const [eliminating, setEliminating] = useState<{ r: number, c: number }[]>([]);
    const [isFailed, setIsFailed] = useState(false);
    const [gridDimensions, setGridDimensions] = useState({ width: 0, height: 0, cellSize: 0 });

    const touchStartX = useRef<number | null>(null);
    const isAnimating = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isWonRef = useRef(false);

    const bgImage = useMemo(() => {
        return ALL_BG_IMAGES[currentLevelId % ALL_BG_IMAGES.length];
    }, [currentLevelId]);

    const getItemIcon = useCallback((type: number) => {
        const icons = [
            '',
            '/assets/puzzle/bear.png',
            '/assets/puzzle/bunny.png',
            '/assets/puzzle/apple.png',
            '/assets/puzzle/strawberry.png',
            '/assets/puzzle/star.png',
            '/assets/puzzle/heart.png',
            '/assets/puzzle/cat.png',
            '/assets/puzzle/dog.png',
            '/assets/puzzle/panda.png',
            '/assets/puzzle/fox.png',
            '/assets/puzzle/frog.png',
            '/assets/puzzle/grape.png',
            '/assets/puzzle/orange.png',
            '/assets/puzzle/sun.png',
            '/assets/puzzle/cloud.png',
            '/assets/puzzle/banana.png'
        ];
        return icons[type] || icons[1];
    }, []);

    // Reactive Grid Sizing
    useEffect(() => {
        if (!engine) return;
        const updateSize = () => {
            if (!containerRef.current) return;
            const containerWidth = containerRef.current.clientWidth;
            const containerHeight = containerRef.current.clientHeight;

            const cellW = (containerWidth - 20) / engine.cols;
            const cellH = (containerHeight - 20) / engine.rows;
            const cellSize = Math.floor(Math.min(cellW, cellH));

            setGridDimensions({
                width: cellSize * engine.cols,
                height: cellSize * engine.rows,
                cellSize
            });
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [engine]);

    // PRD 倒计时：每秒 -1，归零失败
    useEffect(() => {
        if (isFailed || isWonRef.current) return;
        if (timeLeft <= 0) {
            setIsFailed(true);
            return;
        }
        const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft, isFailed]);

    // Initialize level
    useEffect(() => {
        isWonRef.current = false;
        let stage = 1;
        if (currentLevelId === 1) stage = 1;
        else if (currentLevelId === 2) stage = 2;
        else if (currentLevelId === 3) stage = 3;
        else if (currentLevelId === 4) stage = 4;
        else if (currentLevelId === 5) stage = 5;
        else if (currentLevelId >= 6) stage = 6;

        const currentConfig = STAGES_CONFIG[stage];
        const newEngine = new Match3Engine(currentConfig);
        newEngine.generateBoard(currentConfig.itemTypesCount);

        setTimeLeft(INITIAL_TIME);
        setSelected(null);
        setPath(null);
        setRevealedPercent(0);
        setEliminating([]);
        setEngine(newEngine);
        setBoard([...newEngine.board.map(row => [...row])]);
        setIsFailed(false);

        audioManager.playMatch3BGM();
    }, [currentLevelId]);

    const handleCellClick = (r: number, c: number) => {
        if (!engine || !board[r] || !board[r][c] || isAnimating.current || isFailed || isWonRef.current) return;

        if (!selected) {
            setSelected({ r, c });
            audioManager.triggerLightHaptic();
        } else {
            if (selected.r === r && selected.c === c) {
                setSelected(null);
                return;
            }

            const connectPath = engine.canConnect(selected.r, selected.c, r, c);
            if (connectPath) {
                isAnimating.current = true;
                setPath(connectPath);
                setEliminating([selected, { r, c }]);

                audioManager.playMatchSuccessSFX();
                audioManager.triggerHaptic();

                // PRD: 每消除一对 +5 秒
                setTimeLeft(prev => prev + TIME_PER_MATCH);

                const sel = selected;
                setTimeout(() => {
                    setPath(null);
                    setTimeout(() => {
                        engine.eliminatePair(sel.r, sel.c, r, c);
                        setBoard([...engine.board.map(row => [...row])]);
                        setSelected(null);
                        setEliminating([]);
                        isAnimating.current = false;

                        // Calculate progress
                        const total = engine.rows * engine.cols;
                        let cleared = 0;
                        for (let i = 1; i <= engine.rows; i++) {
                            for (let j = 1; j <= engine.cols; j++) {
                                if (!engine.board[i][j]) cleared++;
                            }
                        }
                        setRevealedPercent(Math.floor((cleared / total) * 100));

                        if (engine.isBoardClear()) {
                            if (engine.hasNextLayer()) {
                                engine.nextLayer();
                                setBoard([...engine.board.map(row => [...row])]);
                                setRevealedPercent(0);
                            } else {
                                // PRD: 通关 +1 命，进入下一关
                                isWonRef.current = true;
                                updateStats({ match3Wins: (saveData.stats.match3Wins || 0) + 1 });
                                setTimeout(() => endGame(true, 1, 0, true), 300);
                            }
                        } else {
                            // Deadlock check
                            let localEngine = engine;
                            let attempts = 0;
                            while (!localEngine.hasAvailableMoves() && attempts < 10) {
                                localEngine.shuffleBoard();
                                attempts++;
                            }
                            if (!localEngine.hasAvailableMoves()) setIsFailed(true);
                            setBoard([...localEngine.board.map(row => [...row])]);
                        }
                    }, 250);
                }, 250);
            } else {
                setSelected({ r, c });
                audioManager.playMatchFailSFX();
                audioManager.triggerHaptic();
            }
        }
    };

    const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current !== null) {
            const touchEndX = e.changedTouches[0].clientX;
            if (touchEndX - touchStartX.current > 100) onBack();
            touchStartX.current = null;
        }
    };

    if (!engine) return null;

    // 进度条颜色：< WARNING_TIME 变红闪烁
    const isWarning = timeLeft < WARNING_TIME;
    const timePercent = Math.min(100, (timeLeft / (INITIAL_TIME + TIME_PER_MATCH * 5)) * 100);

    return (
        <div 
            className="fixed inset-0 bg-black flex flex-col z-50 overflow-hidden select-none"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <img src={bgImage} className="w-full h-full object-cover opacity-80" alt="" />
                <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* UI Layer */}
            <div className="relative z-10 flex flex-col h-full pt-safe-top pb-safe-bottom px-4 pt-12">
                <header className="flex justify-between items-center mb-3">
                    <button onClick={onBack} className="p-3 bg-white/10 rounded-full text-white backdrop-blur-md active:scale-95 transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="text-center">
                        <div className="text-[10px] text-white/60 font-black uppercase tracking-widest">Level {currentLevelId} {engine.totalLayers > 1 ? `(Layer ${engine.currentLayerIndex + 1}/${engine.totalLayers})` : ''}</div>
                        <h2 className="text-xl font-black text-white italic tracking-tighter">CONNECT TWO</h2>
                    </div>
                    {/* PRD: 倒计时显示 */}
                    <div className={`px-4 py-2 rounded-2xl border shrink-0 backdrop-blur-md transition-colors ${isWarning ? 'bg-red-500/30 border-red-400/50' : 'bg-white/10 border-white/10'}`}>
                        <span className={`text-sm font-black ${isWarning ? 'text-red-300 animate-pulse' : 'text-white'}`}>{timeLeft}s</span>
                    </div>
                </header>

                {/* PRD 倒计时进度条（橙色，<5s 变红闪烁）*/}
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isWarning ? 'bg-red-500 animate-pulse' : 'bg-orange-400'}`}
                        style={{ width: `${Math.max(0, (timeLeft / Math.max(timeLeft, INITIAL_TIME)) * 100)}%` }}
                    />
                </div>

                {/* Precise Grid Area */}
                <div ref={containerRef} className="flex-1 w-full relative overflow-hidden flex items-center justify-center">
                    <div 
                        className="relative"
                        style={{ width: gridDimensions.width, height: gridDimensions.height }}
                    >
                        {/* THE GRID: Absolute Positioned Cells */}
                        {Array.from({ length: engine.rows }).map((_, i) => {
                            const r = i + 1;
                            return Array.from({ length: engine.cols }).map((__, j) => {
                                const c = j + 1;
                                const item = board[r][c];
                                if (!item) return null;

                                const isSelected = selected?.r === r && selected?.c === c;
                                const isEliminating = eliminating.some(p => p.r === r && p.c === c);

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleCellClick(r, c)}
                                        className={`absolute flex items-center justify-center transition-all duration-200 cursor-pointer rounded-lg p-1 ${
                                            isSelected || isEliminating 
                                                ? 'z-20 bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)] scale-110' 
                                                : 'z-10 bg-white/15 border border-white/10'
                                        }`}
                                        style={{
                                            width: gridDimensions.cellSize - 2,
                                            height: gridDimensions.cellSize - 2,
                                            left: (c - 1) * gridDimensions.cellSize,
                                            top: (r - 1) * gridDimensions.cellSize,
                                            opacity: isEliminating && !path ? 0 : 1,
                                            transform: isEliminating && !path ? 'scale(0.2)' : ''
                                        }}
                                    >
                                        <img 
                                            src={getItemIcon(item.type)} 
                                            className="w-[85%] h-[85%] object-contain pointer-events-none"
                                            alt=""
                                        />
                                        {isSelected && <div className="absolute inset-0 border-2 border-white rounded-lg animate-pulse" />}
                                    </div>
                                );
                            });
                        })}

                        {/* Connection Line SVG */}
                        {path && (
                            <svg 
                                className="absolute inset-0 pointer-events-none z-30 w-full h-full"
                                style={{ pointerEvents: 'none' }}
                            >
                                {(() => {
                                    const points = path.map(p => ({
                                        x: (p.c - 1 + 0.5) * gridDimensions.cellSize,
                                        y: (p.r - 1 + 0.5) * gridDimensions.cellSize
                                    }));
                                    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
                                    return (
                                        <>
                                            <polyline points={pointsStr} fill="none" stroke="#facc15" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="animate-path-dash" />
                                            <polyline points={pointsStr} fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </>
                                    );
                                })()}
                            </svg>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <footer className="mt-4 flex flex-col items-center gap-2 pb-8">
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)] transition-all duration-300"
                            style={{ width: `${revealedPercent}%` }}
                        />
                    </div>
                    <div className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">
                        {revealedPercent}% Artwork Revealed
                    </div>
                </footer>

                {/* Deadlock / Timeout Overlay */}
                {isFailed && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg px-8 animate-in fade-in">
                        <div className="bg-slate-900 border border-white/10 p-10 rounded-[48px] text-center w-full max-w-sm shadow-2xl">
                            <h2 className="text-4xl font-black text-white italic mb-2 tracking-tighter">GAME OVER</h2>
                            <p className="text-white/50 text-sm mb-10 font-bold uppercase tracking-widest leading-relaxed">
                                {timeLeft <= 0 ? 'Time\'s up!' : 'No moves left.'}
                            </p>
                            <button 
                                onClick={() => window.location.reload()}
                                className="w-full py-5 bg-yellow-400 text-black rounded-3xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes path-dash {
                    0% { stroke-dashoffset: 100; }
                    100% { stroke-dashoffset: 0; }
                }
                .animate-path-dash {
                    stroke-dasharray: 20;
                    animation: path-dash 0.5s linear infinite;
                }
                .pt-safe-top { padding-top: env(safe-area-inset-top); }
                .pb-safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
            `}</style>
        </div>
    );
}
