import { GameCanvas } from './game/GameCanvas';
import { GameProvider, useGame } from './hooks/useGame';
import { HUD } from './components/HUD';
import { ResultScreen } from './components/ResultScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EndGameOverlay } from './components/EndGameOverlay';
import { JigsawPuzzle } from './components/JigsawPuzzle';
import { Match3Game } from './components/Match3Game';
import { PinballGame } from './components/PinballGame';

/**
 * App v1.5.0
 *
 * 游戏模式路由：
 * - classic  → GameCanvas + HUD（划线解锁）
 * - pinball  → PinballGame（弹球解锁）
 * - jigsaw   → JigsawPuzzle（拼图）
 * - match3   → Match3Game（消消乐）
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

  // 结果状态：游戏组件完全卸载，只显示 ResultScreen
  if (status === 'won') {
    return <ResultScreen />;
  }
  if (status === 'lost') {
    return <ResultScreen />;
  }

  // playing：根据 playMode 挂载对应游戏组件
  return (
    <div className="w-full h-full relative">
      {playMode === 'pinball' ? <PinballGame onBack={resetGame} /> :
        playMode === 'jigsaw' ? <JigsawPuzzle onBack={resetGame} /> :
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
