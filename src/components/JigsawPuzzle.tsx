import { useState, useEffect, useMemo } from 'react';
import { useGame } from '../hooks/useGame';
import { audioManager } from '../game/AudioManager';

interface Piece {
    id: number;
    currentPos: number;
    correctPos: number;
}

export function JigsawPuzzle({ onBack }: { onBack: () => void }) {
    const { unlockAchievement, currentLevel, endGame, currentLevelId } = useGame();
    const [imageSrc, setImageSrc] = useState<string>('');
    const [pieces, setPieces] = useState<Piece[]>([]);
    const [selectedPos, setSelectedPos] = useState<number | null>(null);
    const [isWon, setIsWon] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    const gridSize = useMemo(() => {
        if (currentLevelId === 1) return { rows: 3, cols: 3 };
        if (currentLevelId <= 3) return { rows: 4, cols: 3 };
        if (currentLevelId <= 5) return { rows: 5, cols: 3 };
        return { rows: 6, cols: 3 };
    }, [currentLevelId]);

    const totalPieces = gridSize.rows * gridSize.cols;

    // Timer
    useEffect(() => {
        if (isWon) return;
        const timer = setInterval(() => setTimeElapsed(t => t + 1), 1000);
        return () => clearInterval(timer);
    }, [isWon]);

    // Initialize Puzzle
    useEffect(() => {
        setIsImageLoaded(false);
        const img = new Image();

        const handleLoad = () => {
            setImageSrc(currentLevel.bgImage);
            setIsImageLoaded(true);

            // Generate pieces and shuffle
            const initialPieces = Array.from({ length: totalPieces }).map((_, i) => ({
                id: i,
                currentPos: i,
                correctPos: i
            }));

            // Shuffle (Fisher-Yates) but ensure it's not already solved
            let shuffled = [...initialPieces];
            do {
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    const temp = shuffled[i].currentPos;
                    shuffled[i].currentPos = shuffled[j].currentPos;
                    shuffled[j].currentPos = temp;
                }
            } while (shuffled.every(p => p.currentPos === p.correctPos));

            setPieces(shuffled);
            setIsWon(false);
            setSelectedPos(null);
            setTimeElapsed(0);

            audioManager.playJigsawBGM();
        };

        img.onload = handleLoad;
        img.onerror = () => {
            console.error('Failed to load jigsaw image:', currentLevel.bgImage);
            // Fallback to allow returning, but won't be playable visually without image
            setIsImageLoaded(true);
        };
        img.src = currentLevel.bgImage;

        if (img.complete && img.naturalHeight !== 0) {
            handleLoad();
        }

        audioManager.playBGM('');
    }, [currentLevel.bgImage, totalPieces]);

    const handleCellClick = (pos: number) => {
        if (isWon) return;

        audioManager.triggerLightHaptic();

        if (selectedPos === null) {
            setSelectedPos(pos);
        } else {
            if (selectedPos === pos) {
                setSelectedPos(null); // Deselect
                return;
            }

            // Swap pieces based on currentPos
            const newPieces = [...pieces];
            const piece1Index = newPieces.findIndex(p => p.currentPos === selectedPos);
            const piece2Index = newPieces.findIndex(p => p.currentPos === pos);

            newPieces[piece1Index].currentPos = pos;
            newPieces[piece2Index].currentPos = selectedPos;

            setPieces(newPieces);
            setSelectedPos(null);

            // Check Win
            if (newPieces.every(p => p.currentPos === p.correctPos)) {
                setIsWon(true);
                audioManager.triggerHaptic();
                // audioManager.playVictorySFX(); // Removed as per instruction
                unlockAchievement('jigsaw_master');

                setTimeout(() => {
                    endGame(true, 1, timeElapsed, true);
                }, 1000);
            }
        }
    };

    const getBgPosition = (correctPos: number) => {
        const row = Math.floor(correctPos / gridSize.cols);
        const col = correctPos % gridSize.cols;
        const xPercent = (col / (gridSize.cols - 1)) * 100;
        const yPercent = (row / (gridSize.rows - 1)) * 100;
        return `${xPercent}% ${yPercent}%`;
    };

    return (
        <div className="fixed inset-0 bg-slate-950 text-white flex flex-col z-50 animate-in fade-in">
            {/* Full-screen Background Artwork */}
            <div className="absolute inset-0 z-0">
                <img src={imageSrc} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-slate-950/20" />
            </div>

            <header className="relative z-10 flex items-center gap-4 px-6 pt-16 pb-4 shrink-0">
                <button onClick={onBack} className="p-3 bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/20 shadow-xl active:scale-95 transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="text-center">
                    <div className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em]">Puzzle Solve</div>
                    <div className="text-2xl font-black text-white italic tracking-tighter drop-shadow-lg uppercase">Jigsaw Mode</div>
                </div>
            </header>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
                {isWon && (
                    <div className="mb-6 text-center animate-in Math.random().toString(36).substr(2, 9) glide-in-from-bottom-4 fade-in">
                        <h2 className="text-4xl font-black text-yellow-400 uppercase tracking-tighter italic drop-shadow-2xl">Masterpiece!</h2>
                        <p className="text-sm text-white font-bold tracking-widest uppercase opacity-80">Puzzle Completed</p>
                    </div>
                )}

                <div className="w-full flex-1 max-h-[70vh] flex items-center justify-center p-2 relative">
                    {!isImageLoaded ? (
                        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <div
                            className="w-full h-full grid gap-1 relative overflow-hidden rounded-2xl shadow-2xl"
                            style={{
                                gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
                                gridTemplateRows: `repeat(${gridSize.rows}, 1fr)`,
                                maxWidth: 'min(95vw, 450px)',
                                aspectRatio: `${gridSize.cols}/${gridSize.rows}`
                            }}
                        >
                            {Array.from({ length: totalPieces }).map((_, pos) => {
                                const piece = pieces.find(p => p.currentPos === pos);
                                const isSelected = selectedPos === pos;

                                return (
                                    <div
                                        key={pos}
                                        onClick={() => handleCellClick(pos)}
                                        className={`relative rounded-md overflow-hidden transition-all duration-300 ease-out cursor-pointer active:scale-95 ${isSelected ? 'ring-4 ring-yellow-400 z-10 scale-105 shadow-2xl brightness-110' : 'ring-1 ring-white/10 hover:ring-white/30'} ${isWon ? 'ring-0 gap-0 rounded-none cursor-default active:scale-100' : ''}`}
                                        style={{
                                            backgroundImage: piece ? `url("${imageSrc}")` : 'none',
                                            backgroundSize: `${gridSize.cols * 100}% ${gridSize.rows * 100}%`,
                                            backgroundPosition: piece ? getBgPosition(piece.correctPos) : '0 0',
                                            margin: isWon ? '-2px' : '0'
                                        }}
                                    >
                                        {!isWon && <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {isWon && (
                        <div className="absolute inset-0 ring-4 ring-yellow-400 rounded-2xl pointer-events-none animate-pulse z-20" />
                    )}
                </div>
            </div>
        </div>
    );
}
