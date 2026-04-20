import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { LivesDisplay } from './LivesDisplay';

export function HUD() {
    const { status, currentLevel, unlockedPercent, setStatus } = useGame();
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    if (status !== 'playing') return null;

    return (
        <div className="absolute top-0 left-0 w-full pt-16 px-4 pointer-events-none flex flex-col items-center">
            {/* Top Row: Exit + Lives */}
            <div className="absolute top-12 left-4 right-4 flex justify-between items-center pointer-events-auto">
                {/* Exit Button */}
                <button
                    onClick={() => setShowExitConfirm(true)}
                    className="px-3 py-1 bg-black/40 hover:bg-red-500/60 text-white rounded-full border border-white/10 transition-colors text-xs uppercase tracking-widest"
                >
                    Exit
                </button>

                {/* 右侧：命数显示（右上角） */}
                <LivesDisplay />
            </div>

            {/* Exit Confirmation Dialog */}
            {showExitConfirm && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6 text-white pointer-events-auto">
                    <div className="bg-slate-900 border border-white/20 p-8 rounded-[40px] shadow-2xl max-w-sm w-full text-center">
                        <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter text-white">Exit Game?</h2>
                        <p className="text-slate-400 mb-8 font-bold">Are you sure to exit the game?</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowExitConfirm(false);
                                    setStatus('welcome');
                                }}
                                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black transition-transform active:scale-95 shadow-xl uppercase"
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setShowExitConfirm(false)}
                                className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black transition-transform active:scale-95 uppercase"
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Centered Title below Dynamic Island */}
            <div className="bg-slate-900/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-white shadow-2xl animate-fade-in flex flex-col items-center min-w-[200px]">
                <h2 className="text-xl font-bold text-white tracking-tight uppercase">{currentLevel.title}</h2>
                <div className="flex items-center gap-3 mt-2 w-full">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(100, unlockedPercent * 100)}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-mono text-blue-400 font-bold">{(unlockedPercent * 100).toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
}
