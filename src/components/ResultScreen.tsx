import { useGame } from '../hooks/useGame';
import { audioManager } from '../game/AudioManager';
import { LEVELS } from '../data/levels';

export function ResultScreen() {
    const { status, startGame, currentLevelId, saveData, unlockedPercent, setStatus, setActiveTab } = useGame();

    if (status === 'playing' || status === 'welcome') return null;

    const isWin = status === 'won';
    const levelStars = saveData.levelStars[currentLevelId] || 0;

    if (!isWin) {
        return (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center z-50 animate-in fade-in">
                <div className="bg-slate-900 border-2 border-red-500/50 p-10 rounded-[40px] shadow-2l shadow-red-500/10">
                    <h1 className="text-5xl font-black mb-4 uppercase tracking-tighter text-red-500">FAILED</h1>
                    <p className="text-slate-400 mb-8 font-bold">The spirits blocked the reveal.</p>
                    <button
                        onClick={() => {
                            audioManager.playBGM('');
                            startGame(currentLevelId);
                        }}
                        className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black transition-transform active:scale-95 shadow-xl uppercase"
                    >
                        Try Again
                    </button>
                    <button onClick={() => window.location.reload()} className="mt-4 text-slate-500 font-bold uppercase text-xs tracking-widest">Quit to Menu</button>
                </div>
            </div>
        );
    }

    const nextLevelExists = LEVELS.some(l => l.id === currentLevelId + 1);

    const handleNextLevel = () => {
        if (!nextLevelExists) return;
        audioManager.playBGM('');
        startGame(currentLevelId + 1);
    };

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/40 backdrop-blur-[2px] animate-in fade-in">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 p-8 rounded-[48px] shadow-2xl max-w-sm w-full text-center scale-up-center animate-in zoom-in-95">
                <div className="mb-6">
                    <div className="text-yellow-400 text-xs font-black uppercase tracking-[0.3em] mb-2">Victory</div>
                    <h2 className="text-5xl font-black text-white italic tracking-tighter">UNVEILED!</h2>
                </div>

                {/* Stars Display */}
                <div className="flex justify-center gap-2 mb-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`text-4xl transition-all duration-700 delay-${i * 100} ${i <= levelStars ? 'text-yellow-400 scale-125' : 'text-slate-800'}`}>
                            ★
                        </div>
                    ))}
                </div>

                {/* Stats Summary */}
                <div className="bg-slate-950/50 p-6 rounded-3xl mb-8 border border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-500 text-[10px] font-black uppercase">Area Revealed</span>
                        <span className="text-white font-black">{Math.round(unlockedPercent * 100)}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400" style={{ width: `${unlockedPercent * 100}%` }} />
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {nextLevelExists ? (
                        <button
                            onClick={handleNextLevel}
                            className="w-full py-5 bg-yellow-400 text-slate-950 rounded-[28px] font-black transition-all shadow-xl shadow-yellow-400/20 active:scale-95 text-lg uppercase tracking-tighter"
                        >
                            Next Artwork
                        </button>
                    ) : (
                        <div className="w-full py-5 bg-slate-800 text-slate-400 rounded-[28px] font-black text-lg uppercase tracking-tighter shadow-inner">
                            Sector Cleared
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => {
                                audioManager.playBGM('');
                                startGame(currentLevelId);
                            }}
                            className="py-4 bg-slate-800 text-white rounded-[24px] font-bold text-sm uppercase tracking-widest active:scale-95 transition-transform"
                        >
                            Replay
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('gallery');
                                setStatus('welcome');
                            }}
                            className="py-4 bg-slate-800 text-white rounded-[24px] font-bold text-sm uppercase tracking-widest active:scale-95 transition-transform"
                        >
                            Gallery
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
