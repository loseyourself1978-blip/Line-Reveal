import { GameCanvas } from './game/GameCanvas';
import { GameProvider, useGame } from './hooks/useGame';
import { HUD } from './components/HUD';
import { ResultScreen } from './components/ResultScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EndGameOverlay } from './components/EndGameOverlay';
import { JigsawPuzzle } from './components/JigsawPuzzle';
import { Match3Game } from './components/Match3Game';

/**
 * App v1.4.0
 * 
 * 胜利流程：
 * - playing: 游戏进行中
 * - won: 用户点击后显示 ResultScreen
 */
function GameShell() {
  const { status, playMode, resetGame } = useGame();

  // 非游戏状态
  if (status === 'welcome') {
    return <WelcomeScreen />;
  }
  if (status === 'all_passed') {
    return <EndGameOverlay />;
  }

  // 结果状态：GameCanvas 完全卸载，只显示 ResultScreen
  if (status === 'won') {
    return <ResultScreen />;
  }
  if (status === 'lost') {
    return <ResultScreen />;
  }

  // playing：GameCanvas 挂载
  return (
    <div className="w-full h-full relative">
      {playMode === 'jigsaw' ? <JigsawPuzzle onBack={resetGame} /> :
        playMode === 'match3' ? <Match3Game onBack={resetGame} /> : (
          <>
            <GameCanvas />
            <HUD />
          </>
        )}
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
