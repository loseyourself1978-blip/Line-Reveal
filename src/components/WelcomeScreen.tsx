import { useState } from 'react';
import { ChapterSelection } from './ChapterSelection';
import { GalleryPage } from './GalleryPage';
import { SettingsPage } from './SettingsPage';
import { ProfilePage } from './ProfilePage';
import { useGame } from '../hooks/useGame';
import { ALL_BG_IMAGES } from '../data/levels';
import { audioManager } from '../game/AudioManager';

export function WelcomeScreen() {
    const { setPlayMode, activeTab, setActiveTab, setStatus } = useGame();
    const [showChapters, setShowChapters] = useState(false);

    // Inside the Home tab, we might show the main hero and chapter selection
    const renderHome = () => (
        <div className="w-full h-full relative flex flex-col pt-12 pb-24 px-6 overflow-y-auto overflow-x-hidden">
            <div className="absolute inset-0 z-0">
                <div className="grid grid-cols-2 h-full opacity-20 scale-125">
                    {ALL_BG_IMAGES.slice(0, 4).map((img, i) => (
                        <img key={i} src={img} className="w-full h-full object-cover blur-[2px]" alt="" />
                    ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/20" />
            </div>

            <div className="relative z-10 flex-col items-center justify-center text-center mt-8 mb-12">
                <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic">
                    Line<br />
                    <span className="text-yellow-400">Reveal</span>
                </h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-3">
                    Premium Art Collection
                </p>
            </div>

            <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col gap-6">
                {/* Mode: Line Reveal (Classic) */}
                <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-800 p-6">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">Classic Mode</h2>
                    <p className="text-sm text-slate-400 mb-4">Draw lines to clear the fog and reveal the hidden artworks.</p>
                    <button
                        onClick={() => {
                            audioManager.playBGM('');
                            audioManager.triggerHaptic();
                            setPlayMode('classic');
                            setShowChapters(true);
                        }}
                        className="w-full p-4 bg-yellow-400 rounded-2xl text-slate-950 shadow-xl shadow-yellow-400/20 active:scale-95 transition-transform text-center font-black uppercase tracking-tight"
                    >
                        Play Line Reveal
                    </button>
                    {/* Render ChapterSelection directly inside Home for now, or just navigate to it. Let's just render the Chapters below it later */}
                </div>

                {/* Mode: Pinball Reveal (New in v1.5.0) */}
                <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-orange-900/40 p-6 relative overflow-hidden">
                    {/* NEW badge */}
                    <div className="absolute top-3 right-3 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                        NEW
                    </div>
                    <h2 className="text-xl font-black text-orange-400 uppercase tracking-tight mb-2">Pinball Reveal</h2>
                    <p className="text-sm text-slate-400 mb-4">Break blocks. Uncover beauty. Classic arcade meets art collection.</p>
                    <button
                        onClick={() => {
                            audioManager.playBGM('');
                            audioManager.triggerHaptic();
                            setPlayMode('pinball');
                            setShowChapters(true);
                        }}
                        className="w-full p-4 bg-orange-500 rounded-2xl text-white shadow-xl shadow-orange-500/20 active:scale-95 transition-transform text-center font-black uppercase tracking-tight"
                    >
                        Play Pinball Reveal
                    </button>
                </div>

                {/* Mode: Jigsaw Puzzle */}
                <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-800 p-6">
                    <h2 className="text-xl font-black text-blue-400 uppercase tracking-tight mb-2">Jigsaw Mode</h2>
                    <p className="text-sm text-slate-400 mb-4">Piece together the artworks in a relaxing puzzle mode.</p>
                    <button
                        onClick={() => {
                            audioManager.playBGM('');
                            audioManager.triggerHaptic();
                            setPlayMode('jigsaw');
                            setShowChapters(true);
                        }}
                        className="w-full p-4 bg-blue-500 rounded-2xl text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-transform text-center font-black uppercase tracking-tight relative overflow-hidden"
                    >
                        Play Jigsaw Mode
                    </button>
                </div>

                {/* Mode: Match-3 (New) */}
                <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-800 p-6">
                    <h2 className="text-xl font-black text-emerald-400 uppercase tracking-tight mb-2">Match-3 Mode</h2>
                    <p className="text-sm text-slate-400 mb-4">Classic match-3 fun! Clear objectives to unlock exclusive art.</p>
                    <button
                        onClick={() => {
                            audioManager.playBGM('');
                            audioManager.triggerHaptic();
                            setPlayMode('match3');
                            setStatus('playing');
                            // Match-3 has its own level selection inside the component for now
                        }}
                        className="w-full p-4 bg-emerald-500 rounded-2xl text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition-transform text-center font-black uppercase tracking-tight"
                    >
                        Play Match-3
                    </button>
                </div>
            </div>
        </div>
    );

    const renderView = () => {
        if (showChapters) {
            return <ChapterSelection onBack={() => setShowChapters(false)} isEmbedded />;
        }

        switch (activeTab) {
            case 'home': return renderHome();
            case 'gallery': return <GalleryPage onBack={() => setActiveTab('home')} isEmbedded />;
            case 'settings': return <SettingsPage onBack={() => setActiveTab('home')} isEmbedded />;
            case 'my': return <ProfilePage onBack={() => setActiveTab('home')} isEmbedded />;
            default: return renderHome();
        }
    };

    return (
        <div className="w-full h-full absolute inset-0 bg-slate-950 z-50 flex flex-col overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 relative overflow-hidden">
                {renderView()}
            </div>

            {/* Persistent Bottom Tab Bar */}
            <div className="h-20 bg-slate-900 border-t border-slate-800 flex justify-around items-center px-4 pb-safe shrink-0 z-[100] relative">
                <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'home' ? 'text-yellow-400' : 'text-slate-500'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
                </button>
                <button onClick={() => setActiveTab('gallery')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'gallery' ? 'text-yellow-400' : 'text-slate-500'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Gallery</span>
                </button>
                <button onClick={() => setActiveTab('my')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'my' ? 'text-yellow-400' : 'text-slate-500'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest">My</span>
                </button>
                <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'settings' ? 'text-yellow-400' : 'text-slate-500'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Settings</span>
                </button>
            </div>
        </div>
    );
}

