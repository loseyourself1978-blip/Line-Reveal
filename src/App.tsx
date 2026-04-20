import { GameCanvas } from './game/GameCanvas';
import { GameProvider, useGame } from './hooks/useGame';
import { HUD } from './components/HUD';
import { ResultScreen } from './components/ResultScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EndGameOverlay } from './components/EndGameOverlay';
import { JigsawPuzzle } from './components/JigsawPuzzle';
import { Match3Game } from './components/Match3Game';

/**
 * 白屏根因修复（v1.2.9）：
 * won/lost 状态在 playing 之前拦截，直接 return ResultScreen。
 * GameCanvas 只在 playing 时挂载，彻底解决 ResultScreen 覆盖但 Canvas 仍在跑的问题。
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
