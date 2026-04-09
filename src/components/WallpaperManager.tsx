import { useState, useMemo } from 'react';
import { useGame } from '../hooks/useGame';
import { CHAPTERS, BG_IMAGE_POOL } from '../data/levels';
import { Share } from '@capacitor/share';

interface WallpaperManagerProps {
    onBack: () => void;
}

export function WallpaperManager({ onBack }: WallpaperManagerProps) {
    const { saveData, toggleFavorite } = useGame();
    const { favoriteImages, unlockedLevels } = saveData;
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<'lock' | 'home'>('lock');

    // Filter images that are "unlocked"
    // For simplicity, we assume BG_IMAGE_POOL maps roughly to unlocked levels if played
    const unlockedArt = useMemo(() => {
        return BG_IMAGE_POOL.filter((_, idx) => {
            // Simplified: first 30 images correspond to the first 30 levels
            const levelId = idx + 1;
            return unlockedLevels.includes(levelId);
        });
    }, [unlockedLevels]);

    const filteredArt = useMemo(() => {
        if (selectedCategory === 'All') return unlockedArt;
        if (selectedCategory === 'Favorites') return unlockedArt.filter(img => favoriteImages.includes(img));
        return unlockedArt; // Could add more category filtering based on CHAPTERS mapping
    }, [unlockedArt, selectedCategory, favoriteImages]);

    const handleSave = async (img: string) => {
        try {
            await Share.share({
                title: 'Save Wallpaper',
                url: img,
                dialogTitle: 'Save to Gallery'
            });
        } catch (e) {
            alert('Save failed or not supported in this environment');
        }
    };

    const handleBatchSave = async () => {
        if (favoriteImages.length === 0) return;
        alert('Batch saving favorites...');
        for (const img of favoriteImages) {
            await handleSave(img);
        }
    };

    const renderPreviewOverlay = () => {
        if (!previewImage) return null;

        return (
            <div className="fixed inset-0 z-[100] bg-black animate-in fade-in">
                <img src={previewImage} className="w-full h-full object-cover" alt="" />

                {previewType === 'lock' ? (
                    <div className="absolute inset-0 flex flex-col items-center pt-20 text-white pointer-events-none">
                        <div className="text-8xl font-thin tracking-tight">14:16</div>
                        <div className="text-xl font-medium mt-1">Friday, February 27</div>
                        <div className="mt-auto mb-20 flex gap-12">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" /></svg>
                            </div>
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" /></svg>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 grid grid-cols-4 grid-rows-6 gap-4 p-8 pointer-events-none">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="aspect-square bg-white/20 backdrop-blur-sm rounded-2xl" />
                        ))}
                    </div>
                )}

                <div className="absolute bottom-10 left-0 right-0 px-6 flex justify-between items-center bg-gradient-to-t from-black/80 to-transparent py-8 h-32">
                    <button onClick={() => setPreviewType(previewType === 'lock' ? 'home' : 'lock')} className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white font-bold text-sm uppercase">
                        Switch to {previewType === 'lock' ? 'Home' : 'Lock'} Screen
                    </button>
                    <button onClick={() => setPreviewImage(null)} className="p-4 bg-white text-black rounded-2xl font-black uppercase text-sm">
                        Close
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-950 text-white z-50 flex flex-col animate-in slide-in-from-right pt-safe">
            <header className="px-6 py-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-slate-900 rounded-xl">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="text-2xl font-black tracking-tighter uppercase italic">Wallpapers</h1>
                </div>
                <button onClick={handleBatchSave} className="px-4 py-2 bg-yellow-400 text-slate-950 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-transform">
                    Batch Save
                </button>
            </header>

            {/* Categories */}
            <div className="px-6 py-4 flex gap-3 overflow-x-auto no-scrollbar shrink-0">
                {['All', 'Favorites', ...CHAPTERS.map(c => c.category)].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-white text-black border-white' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-12">
                <div className="grid grid-cols-2 gap-4">
                    {filteredArt.map((img, i) => (
                        <div key={i} className="relative group overflow-hidden rounded-[28px] border border-white/5 shadow-2xl aspect-[9/16]">
                            <img src={img} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500 cursor-pointer" alt="" onClick={() => setPreviewImage(img)} />

                            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleFavorite(img); }}
                                    className={`p-3 rounded-2xl backdrop-blur-md border ${favoriteImages.includes(img) ? 'bg-red-500 border-red-400 text-white' : 'bg-black/50 border-white/20 text-white'}`}
                                >
                                    <svg className="w-5 h-5" fill={favoriteImages.includes(img) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleSave(img); }}
                                    className="p-3 bg-black/50 backdrop-blur-md border border-white/20 rounded-2xl text-white"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                </button>
                            </div>

                            <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10">
                                <div className="text-[10px] font-black uppercase text-white/60 tracking-widest mb-0.5">Artwork #{i + 1}</div>
                                <div className="text-xs font-bold text-white truncate">Premium Collection</div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredArt.length === 0 && (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-600">
                        <div className="text-4xl mb-4">🖼️</div>
                        <p className="font-bold uppercase tracking-widest text-xs">No artworks revealed yet</p>
                    </div>
                )}
            </div>

            {renderPreviewOverlay()}
        </div>
    );
}
