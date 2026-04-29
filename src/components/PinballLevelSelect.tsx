/**
 * PinballLevelSelect.tsx — v1.5.0
 * Pinball Reveal 专属关卡选择器
 *
 * 独立于 Classic ChapterSelection，读取 PINBALL_LEVELS
 */

import { useState } from 'react';
import { PINBALL_LEVELS } from '../data/pinball-levels';
import { useGame } from '../hooks/useGame';
import { BG_IMAGE_POOL } from '../data/levels';
import { audioManager } from '../game/AudioManager';

interface PinballLevelSelectProps {
    onBack: () => void;
}

export function PinballLevelSelect({ onBack }: PinballLevelSelectProps) {
    const { startPinballGame, currentPinballLevelId, setStatus } = useGame();
    const [touchStartX, setTouchStartX] = useState<number | null>(null);

    // 背景图轮换：Pinball 关卡1-30 对应 BG_IMAGE_POOL 1-30
    const getBgForLevel = (levelId: number): string => {
        const index = (levelId - 1) % BG_IMAGE_POOL.length;
        return BG_IMAGE_POOL[index];
    };

    const handleLevelClick = (levelId: number) => {
        audioManager.triggerHaptic();
        startPinballGame(levelId);
        // startPinballGame 已经调用了 setStatus('playing')，游戏会立即启动
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.touches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX === null) return;
        const diffX = e.changedTouches[0].clientX - touchStartX;
        if (diffX > 50) onBack(); // 右滑返回
        setTouchStartX(null);
    };

    // 难度颜色
    const difficultyColor = (levelId: number): string => {
        if (levelId <= 5) return 'text-emerald-400';
        if (levelId <= 15) return 'text-yellow-400';
        if (levelId <= 23) return 'text-orange-400';
        return 'text-red-400';
    };

    const difficultyLabel = (levelId: number): string => {
        if (levelId <= 5) return 'EASY';
        if (levelId <= 15) return 'MEDIUM';
        if (levelId <= 23) return 'HARD';
        return 'EXPERT';
    };

    return (
        <div
            className="absolute inset-0 bg-slate-950 text-white z-[9999] animate-in fade-in slide-in-from-bottom-4"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* 头部 */}
            <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 pt-[60px] pb-4">
                <div className="flex items-center gap-4 mb-3">
                    <button
                        onClick={onBack}
                        className="p-2 bg-slate-900 rounded-full border border-slate-800 active:scale-90 transition-transform"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter uppercase text-orange-400">
                            Pinball Reveal
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            Select Level
                        </p>
                    </div>
                </div>

                {/* 难度图例 */}
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-emerald-400">● EASY</span>
                    <span className="text-yellow-400">● MEDIUM</span>
                    <span className="text-orange-400">● HARD</span>
                    <span className="text-red-400">● EXPERT</span>
                </div>
            </div>

            {/* 关卡网格 */}
            <div className="px-4 py-6 grid grid-cols-3 gap-3 max-w-md mx-auto">
                {PINBALL_LEVELS.map(lvl => (
                    <button
                        key={lvl.levelId}
                        onClick={() => handleLevelClick(lvl.levelId)}
                        className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-800 active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
                        style={{
                            borderColor: lvl.levelId <= 5 ? '#22C55E' :
                                lvl.levelId <= 15 ? '#EAB308' :
                                    lvl.levelId <= 23 ? '#F97316' : '#EF4444',
                            borderWidth: '2px'
                        }}
                    >
                        {/* 背景缩略图 */}
                        <img
                            src={getBgForLevel(lvl.levelId)}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover opacity-30"
                        />
                        <div className="absolute inset-0 bg-slate-950/60" />

                        {/* 关卡号 */}
                        <span className={`relative z-10 text-3xl font-black ${difficultyColor(lvl.levelId)}`}>
                            {lvl.levelId}
                        </span>

                        {/* 难度标签 */}
                        <span className={`relative z-10 text-[8px] font-black uppercase tracking-widest ${difficultyColor(lvl.levelId)} opacity-70`}>
                            {difficultyLabel(lvl.levelId)}
                        </span>

                        {/* 球数图标 */}
                        <div className="relative z-10 flex gap-0.5 mt-0.5">
                            {Array.from({ length: lvl.initialBalls }).map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full bg-yellow-400"
                                />
                            ))}
                        </div>
                    </button>
                ))}
            </div>

            {/* 底部提示 */}
            <div className="text-center pb-8 px-4">
                <p className="text-slate-600 text-xs">
                    Swipe right to go back
                </p>
            </div>
        </div>
    );
}
