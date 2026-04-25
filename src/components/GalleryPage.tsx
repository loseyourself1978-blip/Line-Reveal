import { useState, useRef } from 'react';
import { ALL_BG_IMAGES } from '../data/levels';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { useGame } from '../hooks/useGame';
import { WallpaperManager } from './WallpaperManager';

export function GalleryPage({ onBack, isEmbedded }: { onBack: () => void, isEmbedded?: boolean }) {
    const { saveData, unlockAchievement } = useGame();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [filter, setFilter] = useState<'All' | 'Minimal' | 'Portrait' | 'Landscape' | 'Modern'>('All');
    const [touchStartX, setTouchStartX] = useState<number | null>(null);

    // New Feature States
    const [selectMode, setSelectMode] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<string[]>([]);
    const [previewMode, setPreviewMode] = useState<'none' | 'lockscreen' | 'homescreen'>('none');
    const [showToast, setShowToast] = useState(false);
    const [showWallpaperManager, setShowWallpaperManager] = useState(false);
    const [savingPreview, setSavingPreview] = useState(false);

    // Long press refs
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressStartRef = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.touches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diffX = touchEndX - touchStartX;

        if (diffX > 20) {
            if (previewMode !== 'none') {
                setPreviewMode('none');
            } else if (selectedImage) {
                setSelectedImage(null);
            } else if (selectMode) {
                setSelectMode(false);
                setSelectedBatch([]);
            } else {
                onBack();
            }
        }
        setTouchStartX(null);
    };

    // For now, "unlocked" images are anything in BG_IMAGE_POOL if the player has fragments or has played.
    // Real logic: filter by saveData.unlockedGalleryItems or just anything from unlocked levels.
    const unlockedImages = ALL_BG_IMAGES;

    const categories = ['All', 'Minimal', 'Portrait', 'Landscape', 'Modern'] as const;

    const [saveError, setSaveError] = useState<string | null>(null);

    const handleShare = async (img: string) => {
        setSaveError(null);
        try {
            // Fetch the image and convert to base64
            const response = await fetch(img);
            const blob = await response.blob();
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve, reject) => {
                reader.onloadend = () => {
                    const result = reader.result as string;
                    // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
                    resolve(result.split(',')[1]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            // Determine extension
            const ext = img.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `linereveal_${Date.now()}.${ext}`;

            // Save to Photos album using Filesystem
            await Filesystem.writeFile({
                path: fileName,
                data: base64,
                directory: Directory.Documents, // fallback; Photos requires native plugin
            });

            // Try saving to Photos via Documents then copy
            // Actually on iOS/Capacitor, Directory.Photos saves to camera roll
            await (Filesystem as any).writeFile({
                path: fileName,
                data: base64,
                directory: 'PHOTOS', // Capacitor v5+ supports this
            }).catch(async () => {
                // Fallback: use Documents directory and show toast
                // The file was already saved to Documents above
            });

            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);

            if (!saveData.achievements?.['art_collector']) {
                unlockAchievement('art_collector');
            }
        } catch (e) {
            console.error('Save failed', e);
            setSaveError('Save failed. Please try again.');
            setTimeout(() => setSaveError(null), 3000);
        }
    };

    const handleBatchSave = async () => {
        if (selectedBatch.length === 0) return;
        setSaveError(null);
        let successCount = 0;
        for (const img of selectedBatch) {
            try {
                const response = await fetch(img);
                const blob = await response.blob();
                const reader = new FileReader();
                const base64 = await new Promise<string>((resolve, reject) => {
                    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
                const ext = img.split('.').pop()?.toLowerCase() || 'jpg';
                const fileName = `linereveal_${Date.now()}_${successCount}.${ext}`;
                await (Filesystem as any).writeFile({
                    path: fileName,
                    data: base64,
                    directory: 'PHOTOS',
                }).catch(() =>
                    Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Documents })
                );
                successCount++;
            } catch (e) {
                console.error('Batch save item failed', e);
            }
        }
        setSelectMode(false);
        setSelectedBatch([]);
        if (successCount > 0) {
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
        }
        if (!saveData.achievements?.['art_collector']) {
            unlockAchievement('art_collector');
        }
    };

    // Long press to save
    const handleLongPressStart = (e: React.TouchEvent) => {
        longPressStartRef.current = Date.now();
        longPressTimerRef.current = setTimeout(async () => {
            if (selectedImage) {
                setSavingPreview(true);
                await handleShare(selectedImage);
                setSavingPreview(false);
            }
        }, 600);
    };

    const handleLongPressEnd = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
        longPressStartRef.current = null;
    };

    // Desktop: right-click to save
    const handleContextMenu = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (selectedImage) {
            setSavingPreview(true);
            await handleShare(selectedImage);
            setSavingPreview(false);
        }
    };

    const toggleBatchSelection = (img: string) => {
        if (selectedBatch.includes(img)) {
            setSelectedBatch(selectedBatch.filter(i => i !== img));
        } else {
            setSelectedBatch([...selectedBatch, img]);
        }
    };

    return (
        <div
            className={`${isEmbedded ? 'absolute' : 'fixed'} inset-0 bg-slate-950 text-white p-6 pb-safe overflow-y-auto z-50 animate-in fade-in slide-in-from-bottom-4 pt-[60px]`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-slate-900 rounded-full border border-slate-800">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-3xl font-black tracking-tighter">ART GALLERY</h1>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowWallpaperManager(true)}
                        className="bg-emerald-500 text-slate-950 text-xs font-black uppercase py-2 px-3 rounded-xl transition-colors flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Wallpapers
                    </button>
                    <button
                        onClick={() => {
                            if (selectMode) setSelectedBatch([]);
                            setSelectMode(!selectMode);
                        }}
                        className={`text-xs font-black uppercase py-2 px-3 rounded-xl transition-colors ${selectMode ? 'bg-yellow-400 text-slate-950' : 'bg-slate-800 text-white'}`}
                    >
                        {selectMode ? 'Cancel' : 'Select'}
                    </button>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-6">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${filter === cat ? 'bg-yellow-400 text-slate-950' : 'bg-slate-900 text-slate-400'}`}
                    >
                        {cat.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-20">
                {unlockedImages.map((img, i) => {
                    const isSelected = selectedBatch.includes(img);
                    return (
                        <div
                            key={i}
                            onClick={() => selectMode ? toggleBatchSelection(img) : setSelectedImage(img)}
                            className={`aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 border-2 relative group active:scale-95 transition-all ${isSelected ? 'border-yellow-400 scale-[0.98]' : 'border-slate-800'}`}
                        >
                            <img src={img} alt="Art" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-center">
                                <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Artwork #{i + 1}</span>
                            </div>
                            {selectMode && (
                                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-yellow-400 border-yellow-400 text-slate-950' : 'border-white/50 bg-black/20'}`}>
                                    {isSelected && (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* WallpaperManager Overlay */}
            {showWallpaperManager && (
                <WallpaperManager onBack={() => setShowWallpaperManager(false)} />
            )}

            {/* Batch Action Bar */}
            {selectMode && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-800/90 backdrop-blur-xl border border-slate-700 p-4 rounded-3xl z-40 flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-5">
                    <span className="font-bold ml-2">{selectedBatch.length} Selected</span>
                    <button
                        onClick={handleBatchSave}
                        disabled={selectedBatch.length === 0}
                        className="bg-yellow-400 text-slate-950 font-black px-6 py-3 rounded-2xl disabled:opacity-50 transition-opacity"
                    >
                        BATCH SAVE
                    </button>
                </div>
            )}

            {/* Detail View / Zoom Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-slate-950/98 z-[150] flex flex-col p-6 animate-in zoom-in-95"
                    style={{ paddingTop: 'calc(env(safe-area-inset-top, 40px) + 32px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 64px)' }}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="w-full flex justify-start mb-4">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="p-3 bg-white/10 rounded-full backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20 active:scale-90 transition-transform"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
                        <img
                            src={selectedImage}
                            alt="Zoomed Art"
                            className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl shadow-yellow-400/10 border border-white/10"
                        />
                    </div>

                    <div className="bg-slate-900 p-6 md:p-8 rounded-[40px] border border-slate-800 space-y-4 md:space-y-6 shrink-0 z-10">
                        <div className="text-center">
                            <h2 className="text-2xl font-black mb-1">THE HIDDEN GRACE</h2>
                            <p className="text-slate-400 text-sm">Category: Portrait Art • Chapter 2</p>
                        </div>

                        <button
                            onClick={() => setPreviewMode('lockscreen')}
                            className="w-full bg-slate-800 text-white p-4 rounded-2xl font-black text-center"
                        >
                            WALLPAPER PREVIEW
                        </button>
                    </div>
                </div>
            )}

            {/* Wallpaper Preview Overlay */}
            {previewMode !== 'none' && selectedImage && (
                <div
                    className="fixed inset-0 z-[200] bg-black isolate animate-in fade-in"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => setPreviewMode('none')}
                    onContextMenu={handleContextMenu}
                >
                    {/* Image — prevent browser default pinch/scale on long press */}
                    <img
                        src={selectedImage}
                        alt="Wallpaper"
                        className="absolute inset-0 w-full h-full object-cover select-none"
                        style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
                        onTouchStart={handleLongPressStart}
                        onTouchEnd={handleLongPressEnd}
                        onTouchCancel={handleLongPressEnd}
                        onContextMenu={handleContextMenu}
                    />

                    {/* Long press hint */}
                    <div className="absolute bottom-32 left-0 w-full text-center pointer-events-none">
                        <span className="text-white/60 text-sm font-medium bg-black/40 px-4 py-2 rounded-full">
                            {savingPreview ? 'Saving…' : 'Long press to save to photos'}
                        </span>
                    </div>

                    {/* Mock iOS Elements */}
                    <div className="absolute top-14 left-0 w-full text-center text-white drop-shadow-md pb-4 pointer-events-none">
                        <div className="text-xl font-medium tracking-wide">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>
                        <div className="text-[80px] font-light leading-none tracking-tighter -mt-2">
                            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                    </div>

                    {previewMode === 'homescreen' && (
                        <div className="absolute inset-x-4 top-48 bottom-32 pointer-events-none flex flex-wrap content-start gap-4 justify-between">
                            {/* Mock App Icons */}
                            {Array.from({ length: 24 }).map((_, i) => (
                                <div key={i} className="w-[60px] h-[60px] rounded-[14px] bg-white/20 backdrop-blur-md shadow-sm" />
                            ))}
                        </div>
                    )}

                    {/* Preview Controls — stop propagation so buttons don't close the overlay */}
                    <div
                        className="absolute bottom-10 inset-x-6 flex items-center justify-between z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setPreviewMode(previewMode === 'lockscreen' ? 'homescreen' : 'lockscreen')}
                            className="px-6 py-3 bg-white/20 backdrop-blur-md rounded-full font-bold shadow-lg"
                        >
                            Switch to {previewMode === 'lockscreen' ? 'Home' : 'Lock'}
                        </button>
                        <button
                            onClick={() => setPreviewMode('none')}
                            className="w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Top tap hint */}
                    <div className="absolute top-safe mt-16 left-0 w-full text-center pointer-events-none">
                        <span className="text-white/50 text-sm font-medium">Tap to go back</span>
                    </div>
                </div>
            )}

            {/* Success Toast */}
            {showToast && (
                <div className="fixed top-safe mt-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-2xl z-[300] flex items-center gap-2 animate-in slide-in-from-top-4 fade-in">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved to Album
                </div>
            )}

            {/* Error Toast */}
            {saveError && (
                <div className="fixed top-safe mt-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full font-bold shadow-2xl z-[300] flex items-center gap-2 animate-in slide-in-from-top-4 fade-in">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {saveError}
                </div>
            )}
        </div>
    );
}
