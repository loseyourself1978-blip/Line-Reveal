import { useGame } from '../hooks/useGame';
import { GALLERY_ITEMS } from '../data/gallery';

export function CollectionPage() {
    const { saveData, unlockGalleryItem, spendFragments, setStatus } = useGame();
    const { unlockedGalleryItems, fragments } = saveData;

    const handleUnlock = (item: typeof GALLERY_ITEMS[0]) => {
        if (fragments >= item.requiredFragments) {
            spendFragments(item.requiredFragments);
            unlockGalleryItem(item.id);
        }
    };

    return (
        <div className="w-full h-full bg-slate-900 text-white p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setStatus('welcome')}
                            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors border border-slate-700"
                        >
                            ← Back
                        </button>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                            Collection
                        </h1>
                    </div>

                    <div className="bg-slate-800 px-6 py-3 rounded-full border border-blue-500/30 flex items-center gap-2">
                        <span className="text-blue-400 font-bold text-xl">{fragments}</span>
                        <span className="text-sm text-slate-400 uppercase tracking-wider">Fragments</span>
                    </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {GALLERY_ITEMS.map(item => {
                        const isUnlocked = unlockedGalleryItems.includes(item.id);
                        const canAfford = fragments >= item.requiredFragments;

                        return (
                            <div
                                key={item.id}
                                className={`
                                    relative group rounded-xl overflow-hidden border transition-all duration-300
                                    ${isUnlocked
                                        ? 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                                        : 'border-slate-800 bg-slate-800/50'
                                    }
                                `}
                            >
                                <div className="aspect-video relative overflow-hidden">
                                    {isUnlocked ? (
                                        <img
                                            src={item.src}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
                                            <div className="text-4xl mb-2">🔒</div>
                                            <div className="text-sm text-slate-500">Locked</div>
                                        </div>
                                    )}

                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-60" />
                                </div>

                                <div className="p-4 relative">
                                    <h3 className={`text-lg font-bold mb-1 ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                                        {item.title}
                                    </h3>

                                    {!isUnlocked && (
                                        <div className="mt-4">
                                            <button
                                                onClick={() => handleUnlock(item)}
                                                disabled={!canAfford}
                                                className={`
                                                    w-full py-2 px-4 rounded-lg font-bold text-sm transition-all
                                                    ${canAfford
                                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                                                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                                    }
                                                `}
                                            >
                                                Unlock for {item.requiredFragments} Fragments
                                            </button>
                                        </div>
                                    )}

                                    {isUnlocked && (
                                        <div className="mt-2 text-xs text-blue-400 font-mono">
                                            UNLOCKED
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
