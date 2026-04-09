import { useGame } from '../hooks/useGame';

export function EndGameOverlay() {
    const { restartGame } = useGame();

    return (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[100] text-white p-8 animate-in fade-in duration-500">
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 p-12 rounded-3xl border border-white/20 shadow-2xl text-center max-w-lg">
                <div className="text-8xl mb-8">🎉</div>
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text">
                    Congrats!
                </h1>
                <p className="text-2xl font-light mb-12 text-slate-300">
                    You passed all levels!
                </p>

                <div className="space-y-6">
                    <p className="text-lg text-slate-400">Restart from Chapter 1?</p>
                    <button
                        onClick={restartGame}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 text-xl"
                    >
                        YES
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl transition-colors font-bold uppercase"
                    >
                        NO (Return to Home)
                    </button>
                </div>
            </div>
        </div>
    );
}
