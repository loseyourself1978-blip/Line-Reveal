import { useGame } from '../hooks/useGame';
import { LEVELS } from '../data/levels';

import { useState } from 'react';

export function ProfilePage({ onBack, isEmbedded }: { onBack: () => void, isEmbedded?: boolean }) {
    const { saveData } = useGame();
    const { stats, levelStars, unlockedLevels, achievements } = saveData;
    const [touchStartX, setTouchStartX] = useState<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.touches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diffX = touchEndX - touchStartX;
        if (diffX > 25) {
            onBack();
        }
        setTouchStartX(null);
    };

    const ACHIEVEMENTS = [
        { id: 'first_blood', name: 'Art Novice', desc: 'Reveal your first artwork', icon: '🎨' },
        { id: 'perfect_10', name: 'Perfectionist', desc: '10 perfect clears', icon: '✨' },
        { id: 'speed_30', name: 'Speed Demon', desc: 'Clear in under 30s', icon: '⚡' },
        { id: 'match3_5_wins', name: 'Puzzle Hero', desc: 'Win 5 Match-3 levels', icon: '🧩' },
        { id: 'match3_combo_10', name: 'Combo King', desc: 'Single match of 10+ items', icon: '🔥' },
        { id: 'match3_all_cleared', name: 'Grandmaster', desc: 'Complete Match-3 story', icon: '👑' },
        { id: 'collector_10', name: 'Curator', desc: 'Collect 10 art pieces', icon: '🖼️' },
        { id: 'untouchable', name: 'Untouchable', desc: 'Lvl 3 Speed + Perfect life', icon: '🛡️' },
    ];

    const totalStars = Object.values(levelStars).reduce((a, b) => a + b, 0);
    const maxStars = LEVELS.length * 3;
    const completionRate = Math.round((unlockedLevels.length / LEVELS.length) * 100);

    const statCards = [
        { label: 'Total Stars', value: totalStars, sub: `out of ${maxStars}`, color: 'bg-yellow-400/20 text-yellow-500' },
        { label: 'Match-3 Wins', value: stats.match3Wins || 0, sub: 'Puzzle mode', color: 'bg-emerald-400/20 text-emerald-500' },
        { label: 'Max Combo', value: stats.maxCombo || 0, sub: 'Match-3 chains', color: 'bg-blue-400/20 text-blue-500' },
        { label: 'Longest Streak', value: stats.longestStreak || 0, sub: 'Days active', color: 'bg-purple-400/20 text-purple-500' },
    ];

    return (
        <div
            className={`${isEmbedded ? 'absolute' : 'fixed'} inset-0 bg-slate-900 text-white p-6 overflow-y-auto z-50 animate-in fade-in slide-in-from-bottom-4 pt-[60px] pb-32`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <header className="flex items-center gap-4 mb-10">
                <button onClick={onBack} className="p-2 bg-slate-800 rounded-full">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-3xl font-black tracking-tighter uppercase">Player Profile</h1>
            </header>

            <div className="max-w-md mx-auto space-y-8">
                {/* Progress Overview */}
                <div className="bg-slate-800 p-8 rounded-[32px] border border-slate-700 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Global Progress</h2>
                                <p className="text-4xl font-black">{completionRate}%</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold bg-yellow-400 text-slate-950 px-2 py-1 rounded">LVL {unlockedLevels.length}</span>
                            </div>
                        </div>
                        <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                            <div
                                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-1000"
                                style={{ width: `${completionRate}%` }}
                            />
                        </div>
                    </div>
                    {/* Decorative Background Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 blur-[60px]" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {statCards.map((s, i) => (
                        <div key={i} className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50">
                            <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${s.color}`}>
                                <span className="text-lg font-bold">#</span>
                            </div>
                            <p className="text-2xl font-black leading-none mb-1">{s.value}</p>
                            <p className="text-slate-200 text-xs font-bold uppercase tracking-wide">{s.label}</p>
                            <p className="text-slate-500 text-[10px] mt-1">{s.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Achievements List */}
                <div className="bg-slate-800/30 p-6 rounded-3xl border border-dashed border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold">Achievements</h3>
                        <span className="text-emerald-400 text-sm font-black">{Object.keys(achievements || {}).length} / 8 🏆</span>
                    </div>
                    <div className="space-y-3">
                        {ACHIEVEMENTS.map(ach => {
                            const isUnlocked = achievements && achievements[ach.id];
                            return (
                                <div key={ach.id} className={`flex items-center gap-4 p-3 rounded-2xl border ${isUnlocked ? 'bg-slate-800 border-slate-700 shadow-md' : 'bg-slate-900 border-slate-800 opacity-60'}`}>
                                    <div className={`w-12 h-12 flex items-center justify-center text-2xl rounded-xl ${isUnlocked ? 'bg-yellow-400/20' : 'bg-slate-800 grayscale'}`}>
                                        {ach.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`font-bold ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>{ach.name}</h4>
                                        <p className="text-xs text-slate-500">{ach.desc}</p>
                                    </div>
                                    {isUnlocked && (
                                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-8 text-center bg-gradient-to-t from-slate-900 to-transparent">
                    <p className="text-slate-500 text-xs italic">"Art is not what you see, but what you make others see."</p>
                </div>
            </div>
        </div>
    );
}
