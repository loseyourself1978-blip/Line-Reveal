import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { CHAPTERS, LEVELS } from '../data/levels';
import { audioManager } from '../game/AudioManager';

export function ChapterSelection({ onBack, isEmbedded }: { onBack: () => void, isEmbedded?: boolean }) {
    const { saveData, startGame } = useGame();
    const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.touches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diffX = touchEndX - touchStartX;
        if (diffX > 25) {
            if (selectedChapterId !== null) {
                setSelectedChapterId(null);
            } else {
                onBack();
            }
        }
        setTouchStartX(null);
    };

    const handleLevelClick = (levelId: number) => {
        if (!saveData.unlockedLevels.includes(levelId)) {
            audioManager.triggerHaptic(); // Feedback for locked
            return;
        }
        startGame(levelId);
    };

    // If no chapter selected, show the Chapter List
    if (selectedChapterId === null) {
        return (
            <div
                className={`${isEmbedded ? 'absolute' : 'fixed'} inset-0 bg-slate-950 text-white p-6 overflow-y-auto z-50 animate-in fade-in slide-in-from-bottom-4 pt-[60px] pb-32`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <header className="flex items-center gap-4 mb-10">
                    <button onClick={onBack} className="p-2 bg-slate-900 rounded-full border border-slate-800">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-3xl font-black tracking-tighter uppercase">Art Chapters</h1>
                </header>

                <div className="space-y-6 max-w-lg mx-auto pb-12">
                    {CHAPTERS.map(ch => {
                        const chapterLevels = LEVELS.filter(l => l.chapterId === ch.id);
                        const unlockedInChapter = chapterLevels.filter(l => saveData.unlockedLevels.includes(l.id)).length;
                        const isUnlocked = ch.id === 1 || unlockedInChapter > 0;

                        return (
                            <button
                                key={ch.id}
                                onClick={() => isUnlocked && setSelectedChapterId(ch.id)}
                                className={`w-full group relative aspect-[16/9] rounded-[32px] overflow-hidden border-2 transition-all ${isUnlocked ? 'border-slate-800 hover:border-yellow-400' : 'border-slate-900 opacity-60 grayscale'
                                    }`}
                            >
                                <img src={ch.icon} alt={ch.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                                <div className="absolute inset-x-0 bottom-0 p-6 text-left">
                                    <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-[0.2em] mb-1 block">Chapter {ch.id}</span>
                                    <h2 className="text-2xl font-black leading-none mb-2">{ch.title}</h2>
                                    <div className="flex items-center justify-between">
                                        <p className="text-slate-400 text-xs">{ch.description}</p>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Progress</span>
                                            <span className="text-sm font-black">{unlockedInChapter}/{chapterLevels.length}</span>
                                        </div>
                                    </div>
                                </div>

                                {!isUnlocked && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                        <svg className="w-12 h-12 text-white/50" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Level selector for the chosen chapter
    const currentChapter = CHAPTERS.find(ch => ch.id === selectedChapterId)!;
    const chapterLevels = LEVELS.filter(l => l.chapterId === selectedChapterId);

    return (
        <div
            className={`${isEmbedded ? 'absolute' : 'fixed'} inset-0 bg-slate-950 text-white p-6 overflow-y-auto z-50 animate-in fade-in pt-[60px] pb-32`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedChapterId(null)} className="p-2 bg-slate-900 rounded-full border border-slate-800">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter uppercase">{currentChapter.title}</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Select Artwork</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto pb-12">
                {chapterLevels.map(lvl => {
                    const isUnlocked = saveData.unlockedLevels.includes(lvl.id);
                    const stars = saveData.levelStars[lvl.id] || 0;

                    return (
                        <button
                            key={lvl.id}
                            onClick={() => handleLevelClick(lvl.id)}
                            className={`relative aspect-[4/5] rounded-3xl overflow-hidden border-2 transition-all active:scale-95 ${isUnlocked ? 'border-slate-800 bg-slate-900' : 'border-slate-900 bg-slate-950 opacity-50'
                                }`}
                        >
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                <span className={`text-4xl font-black mb-2 ${isUnlocked ? 'text-white' : 'text-slate-800'}`}>
                                    {lvl.id}
                                </span>

                                {isUnlocked && (
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map(i => (
                                            <span key={i} className={`text-sm ${i <= stars ? 'text-yellow-400' : 'text-slate-700'}`}>
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {!isUnlocked && (
                                    <svg className="w-6 h-6 text-slate-800" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>

                            {isUnlocked && (
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-800">
                                    <div className="h-full bg-yellow-400/50" style={{ width: `${(stars / 3) * 100}%` }} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
