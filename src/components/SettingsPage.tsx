import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { audioManager } from '../game/AudioManager';

export function SettingsPage({ onBack, isEmbedded }: { onBack: () => void, isEmbedded?: boolean }) {
    const { saveData, updateSettings } = useGame();
    const { settings } = saveData;
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

    const handleToggle = (key: keyof typeof settings) => {
        const newValue = !settings[key];
        updateSettings({ [key]: newValue });
        if (key === 'audio' && !newValue) audioManager.stopBGM();
        audioManager.triggerHaptic();
    };

    return (
        <div
            className={`${isEmbedded ? 'absolute' : 'fixed'} inset-0 bg-slate-900 text-white p-6 overflow-y-auto z-50 animate-in fade-in slide-in-from-bottom-4 pt-[60px] pb-32`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <header className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-2 bg-slate-800 rounded-full">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-3xl font-black tracking-tighter uppercase italic">Settings</h1>
            </header>

            <div className="space-y-10 max-w-lg mx-auto">
                {/* Audio & Haptics */}
                <div className="space-y-4">
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">Audio & Feedback</h2>
                    <div className="bg-slate-800/50 rounded-[32px] border border-slate-700/50 p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="font-bold">Background Music</span>
                            <button
                                onClick={() => handleToggle('audio')}
                                className={`w-14 h-8 rounded-full transition-colors relative ${settings.audio ? 'bg-yellow-400' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${settings.audio ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-bold">Match-3 Sound</span>
                            <button
                                onClick={() => handleToggle('match3Audio')}
                                className={`w-14 h-8 rounded-full transition-colors relative ${settings.match3Audio ? 'bg-emerald-400' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${settings.match3Audio ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-bold">Haptic Feedback</span>
                            <button
                                onClick={() => handleToggle('haptic')}
                                className={`w-14 h-8 rounded-full transition-colors relative ${settings.haptic ? 'bg-blue-400' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${settings.haptic ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Game Mechanics */}
                <div className="space-y-4">
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">Game Mechanics (Classic)</h2>
                    <div className="bg-slate-800/50 rounded-[32px] border border-slate-700/50 p-8 space-y-10">
                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <label className="text-sm font-bold text-white uppercase tracking-tight">Spirit Speed</label>
                                <span className="text-xs font-black text-yellow-400">LEVEL {settings.spiritSpeed}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3].map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => updateSettings({ spiritSpeed: v as any })}
                                        className={`py-3 rounded-2xl font-black text-xs transition-all ${settings.spiritSpeed === v ? 'bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-400/20' : 'bg-slate-900 text-slate-500'}`}
                                    >
                                        {v === 1 ? 'SLOW' : v === 2 ? 'NORMAL' : 'FAST'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <label className="text-sm font-bold text-white uppercase tracking-tight">Fog Density</label>
                                <span className="text-xs font-black text-blue-400">LEVEL {settings.fogDensity}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3].map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => updateSettings({ fogDensity: v as any })}
                                        className={`py-3 rounded-2xl font-black text-xs transition-all ${settings.fogDensity === v ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900 text-slate-500'}`}
                                    >
                                        {v === 1 ? 'LOW' : v === 2 ? 'MID' : 'HIGH'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Visuals */}
                <div className="space-y-4">
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">Visuals</h2>
                    <div className="bg-slate-800/50 rounded-[32px] border border-slate-700/50 p-8 space-y-10">
                        <div>
                            <span className="block text-sm font-bold mb-4 uppercase tracking-tight">Line Color</span>
                            <div className="flex gap-4">
                                {['#facc15', '#f87171', '#60a5fa', '#4ade80', '#ffffff'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => updateSettings({ lineColor: c })}
                                        className={`w-12 h-12 rounded-full border-4 ${settings.lineColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-40'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <span className="block text-sm font-bold mb-4 uppercase tracking-tight">Thickness: {settings.lineWeight}px</span>
                            <input
                                type="range" min="2" max="12" step="1"
                                value={settings.lineWeight}
                                onChange={(e) => updateSettings({ lineWeight: Number(e.target.value) })}
                                className="w-full h-2 bg-slate-900 rounded-full appearance-none cursor-pointer accent-yellow-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Reset */}
                <div className="pt-10">
                    <button
                        onClick={() => {
                            if (confirm('Permanently reset all game data?')) {
                                localStorage.clear();
                                window.location.reload();
                            }
                        }}
                        className="w-full p-5 rounded-[28px] border-2 border-red-500/20 bg-red-500/5 text-red-500 font-black text-sm uppercase tracking-widest active:scale-95 transition-transform"
                    >
                        Reset All Progress
                    </button>
                    <p className="text-center text-slate-600 text-[10px] mt-10 uppercase font-bold tracking-widest">
                        Line Reveal Premium Edition v1.1.0
                    </p>
                </div>
            </div>
        </div>
    );
}
