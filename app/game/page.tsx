'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import HandRaiseGame from '@/components/HandRaiseGame';
import VideoChat from '@/components/VideoChat';
import GameUI from '@/components/GameUI';

function GameContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('room');
  const username = searchParams.get('username');
  const isHost = searchParams.get('host') === 'true';

  const [gameStarted, setGameStarted] = useState(false);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [wagerAmount, setWagerAmount] = useState(0.1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [gameState, setGameState] = useState<'waiting' | 'ready' | 'playing' | 'finished'>('waiting');

  useEffect(() => {
    // Simulate opponent joining after a delay (for demo)
    const timer = setTimeout(() => {
      setOpponent('Player2');
      setGameState('ready');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleStartGame = () => {
    setGameStarted(true);
    setGameState('playing');
  };

  const handleGameEnd = (winner: 'player' | 'opponent') => {
    if (winner === 'player') {
      setPlayerScore(playerScore + 1);
    } else {
      setOpponentScore(opponentScore + 1);
    }
    
    // Check for match winner (best of 3)
    if (playerScore + 1 >= 2 || opponentScore + 1 >= 2) {
      setGameState('finished');
    } else {
      // Next round
      setTimeout(() => {
        setGameStarted(false);
        setTimeout(() => {
          setGameStarted(true);
        }, 2000);
      }, 3000);
    }
  };

  if (!roomCode || !username) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Invalid Room</h2>
          <a href="/" className="text-purple-400 hover:text-purple-300">
            Return to Lobby
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      {/* Header */}
      <header className="p-4 border-b border-purple-500/30 bg-black/20 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-2xl">🕹️</a>
            <div>
              <h1 className="text-xl font-bold">Room: {roomCode}</h1>
              <p className="text-sm text-gray-400">{username} {isHost && '(Host)'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{playerScore}</div>
              <div className="text-xs text-gray-400">You</div>
            </div>
            <div className="text-xl">-</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{opponentScore}</div>
              <div className="text-xs text-gray-400">Opponent</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-400">Wager</div>
              <div className="text-lg font-bold text-yellow-400">💰 {wagerAmount} SOL</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {gameState === 'waiting' && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 animate-bounce">⏳</div>
            <h2 className="text-3xl font-bold mb-4">Waiting for opponent...</h2>
            <p className="text-gray-400 mb-8">Share room code: <span className="text-purple-400 font-mono text-2xl">{roomCode}</span></p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse delay-100"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-200"></div>
            </div>
          </div>
        )}

        {gameState === 'ready' && !gameStarted && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-3xl font-bold mb-4">Opponent Found!</h2>
            <p className="text-xl text-gray-400 mb-8">{opponent} has joined</p>
            <div className="mb-8">
              <label className="block text-sm text-gray-400 mb-2">Set Wager Amount (SOL)</label>
              <input
                type="number"
                step="0.1"
                value={wagerAmount}
                onChange={(e) => setWagerAmount(parseFloat(e.target.value))}
                className="px-4 py-2 rounded-lg bg-black/30 border border-purple-500/30 focus:border-purple-500 outline-none text-center text-xl"
              />
            </div>
            <button
              onClick={handleStartGame}
              className="px-8 py-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold text-xl transition transform hover:scale-105"
            >
              Start Game 🎮
            </button>
          </div>
        )}

        {gameState === 'playing' && gameStarted && (
          <div className="grid lg:grid-cols-2 gap-6">
            <HandRaiseGame
              onGameEnd={handleGameEnd}
              isActive={gameStarted}
            />
            <div className="space-y-6">
              <VideoChat roomCode={roomCode} username={username} />
              <GameUI />
            </div>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="text-center py-20">
            <div className="text-8xl mb-4">
              {playerScore > opponentScore ? '🏆' : '😢'}
            </div>
            <h2 className="text-4xl font-bold mb-4">
              {playerScore > opponentScore ? 'You Win!' : 'You Lose!'}
            </h2>
            <p className="text-2xl text-gray-400 mb-8">
              Final Score: {playerScore} - {opponentScore}
            </p>
            <div className="mb-8 p-6 bg-green-900/30 border border-green-500/30 rounded-lg inline-block">
              <p className="text-xl mb-2">
                {playerScore > opponentScore ? 'You won' : 'You lost'}
              </p>
              <p className="text-3xl font-bold text-yellow-400">
                {playerScore > opponentScore ? '+' : '-'}{wagerAmount * 2} SOL
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 font-bold transition"
              >
                Play Again
              </button>
              <a
                href="/"
                className="px-6 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 font-bold transition inline-block"
              >
                Back to Lobby
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    }>
      <GameContent />
    </Suspense>
  );
}

