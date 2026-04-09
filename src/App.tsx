import { GameCanvas } from './game/GameCanvas';
import { GameProvider, useGame } from './hooks/useGame';
import { HUD } from './components/HUD';
import { ResultScreen } from './components/ResultScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EndGameOverlay } from './components/EndGameOverlay';
import { JigsawPuzzle } from './components/JigsawPuzzle';
import { Match3Game } from './components/Match3Game';

function GameShell() {
  const { status, playMode, resetGame } = useGame();

  if (status === 'welcome') {
    return <WelcomeScreen />;
  }

  if (status === 'all_passed') {
    return <EndGameOverlay />;
  }

  return (
    <div className="w-full h-full relative">
      {playMode === 'jigsaw' ? <JigsawPuzzle onBack={resetGame} /> :
        playMode === 'match3' ? <Match3Game onBack={resetGame} /> : (
          <>
            <GameCanvas />
            <HUD />
          </>
        )}
      <ResultScreen />
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <div className="w-full h-full bg-slate-900">
        <GameShell />
      </div>
    </GameProvider>
  )
}

export default App
