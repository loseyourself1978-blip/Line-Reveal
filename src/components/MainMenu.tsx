import { useGame } from '../hooks/useGame';
import { LEVELS } from '../data/levels';

export function MainMenu() {
    const { startGame, setStatus, setActiveTab, saveData } = useGame();
    const { unlockedLevels } = saveData;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl opacity-30 animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl opacity-30 animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
                <h1 className="text-5xl md:text-7xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500 drop-shadow-2xl tracking-tight">
                    Line Reveal
                </h1>

                <div className="flex gap-4 mb-12">
                    <button
                        onClick={() => {
                            setActiveTab('gallery');
                            setStatus('welcome');
                        }}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 border border-white/10"
                    >
                        View Collection
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    {LEVELS.map(level => {
                        const isUnlocked = unlockedLevels.includes(level.id);
                        return (
                            <button
                                key={level.id}
                                onClick={() => isUnlocked && startGame(level.id)}
                                disabled={!isUnlocked}
                                className={`
                                    relative p-6 rounded-2xl transition-all duration-300 border text-left group
                                    ${isUnlocked
                                        ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 hover:border-blue-500 cursor-pointer'
                                        : 'bg-slate-900/50 border-slate-800 opacity-60 cursor-not-allowed'
                                    }
                                `}
                            >
                                <div className="absolute top-4 right-4">
                                    {isUnlocked ? (
                                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                    ) : (
                                        <span className="text-xl">🔒</span>
                                    )}
                                </div>

                                <h3 className={`text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors`}>
                                    {level.title}
                                </h3>
                                <p className="text-sm text-slate-400 mb-4">{level.description}</p>

                                {isUnlocked && (
                                    <div className="flex justify-between text-xs text-slate-500 font-mono">
                                        <span className="bg-slate-900/50 px-2 py-1 rounded">{level.timeLimit}s</span>
                                        <span className="bg-slate-900/50 px-2 py-1 rounded">{level.spirits.length} Spirits</span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
