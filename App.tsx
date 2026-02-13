
import React, { useState, useEffect } from 'react';
import { GameState, GameHistory } from './types';
import MainMenu from './components/MainMenu';
import GameEngine from './components/GameEngine';
import ResultScreen from './components/ResultScreen';
import HistoryScreen from './components/HistoryScreen';
import Background from './components/Background';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [lastResult, setLastResult] = useState<{ score: number; accuracy: number } | null>(null);
  const [history, setHistory] = useState<GameHistory[]>([]);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('space_multiplier_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const saveToHistory = (level: number, score: number, accuracy: number) => {
    const newEntry: GameHistory = {
      level,
      score,
      accuracy,
      timestamp: Date.now(),
    };
    const updatedHistory = [newEntry, ...history].slice(0, 50); // Keep last 50
    setHistory(updatedHistory);
    localStorage.setItem('space_multiplier_history', JSON.stringify(updatedHistory));
  };

  const handleGameEnd = (score: number, accuracy: number, completed: boolean) => {
    setLastResult({ score, accuracy });
    saveToHistory(currentLevel, score, accuracy);
    if (completed && currentLevel < 3) {
      setGameState(GameState.LEVEL_COMPLETE);
    } else {
      setGameState(GameState.GAME_OVER);
    }
  };

  const startLevel = (level: number) => {
    setCurrentLevel(level);
    setGameState(GameState.PLAYING);
  };

  const nextLevel = () => {
    const next = currentLevel + 1;
    setCurrentLevel(next);
    setGameState(GameState.PLAYING);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden space-gradient select-none">
      <Background />
      
      <div className="relative z-10 w-full h-full">
        {gameState === GameState.MENU && (
          <MainMenu 
            onStartLevel={startLevel} 
            onViewHistory={() => setGameState(GameState.HISTORY)} 
          />
        )}

        {gameState === GameState.PLAYING && (
          <GameEngine 
            level={currentLevel} 
            onEnd={handleGameEnd} 
            onQuit={() => setGameState(GameState.MENU)}
          />
        )}

        {(gameState === GameState.LEVEL_COMPLETE || gameState === GameState.GAME_OVER) && lastResult && (
          <ResultScreen 
            level={currentLevel}
            score={lastResult.score}
            accuracy={lastResult.accuracy}
            completed={gameState === GameState.LEVEL_COMPLETE}
            onNext={nextLevel}
            onRetry={() => startLevel(currentLevel)}
            onMenu={() => setGameState(GameState.MENU)}
          />
        )}

        {gameState === GameState.HISTORY && (
          <HistoryScreen 
            history={history} 
            onBack={() => setGameState(GameState.MENU)} 
          />
        )}
      </div>
    </div>
  );
};

export default App;
