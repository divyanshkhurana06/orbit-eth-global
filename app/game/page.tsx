'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import ObjectBringGame, { DETECTABLE_ITEMS } from '@/components/ObjectBringGame';
import RockPaperScissorsGame from '@/components/RockPaperScissorsGame';
import ReflexGame from '@/components/ReflexGame';
import VideoChat from '@/components/VideoChat';
import GameUI from '@/components/GameUI';
import { MouseMoveEffect } from '@/components/MouseMoveEffect';

// Dynamic import for HandRaiseGame (uses MediaPipe)
const HandRaiseGame = dynamic(() => import('@/components/HandRaiseGame'), {
  ssr: false,
  loading: () => <div className="text-center p-8">Loading game...</div>
});

import dynamic from 'next/dynamic';

const GAME_MODES = [
  {
    id: 'object-hunt',
    name: 'Object Hunt',
    description: 'Race to find and show items to your camera',
    icon: '🔍',
    difficulty: 'Easy'
  },
  {
    id: 'hand-raise',
    name: 'Hand Raise',
    description: 'First to raise your hand when the signal appears',
    icon: '✋',
    difficulty: 'Easy'
  },
  {
    id: 'rock-paper-scissors',
    name: 'Rock Paper Scissors',
    description: 'Classic game with hand gesture detection',
    icon: '✊',
    difficulty: 'Medium'
  },
  {
    id: 'reflex-challenge',
    name: 'Reflex Challenge',
    description: 'React fastest when the color changes',
    icon: '⚡',
    difficulty: 'Medium'
  }
];

function GameContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('room');
  const username = searchParams.get('username');
  const isHost = searchParams.get('host') === 'true';

  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [opponentSocketId, setOpponentSocketId] = useState<string | null>(null);
  const [wagerAmount, setWagerAmount] = useState(0.1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [gameState, setGameState] = useState<'waiting' | 'ready_room' | 'ready' | 'playing' | 'finished'>('waiting');
  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [targetItem, setTargetItem] = useState('');
  const [roundNumber, setRoundNumber] = useState(1);
  const [selectedGameMode, setSelectedGameMode] = useState('object-hunt');

  // Socket.io connection
  useEffect(() => {
    if (!roomCode || !username) return;

    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Join room
    newSocket.emit('join-room', { roomCode, username, isHost });

    // Listen for events
    newSocket.on('player-joined', (data) => {
      console.log('Player joined:', data);
      if (data.totalPlayers === 2) {
        setGameState('ready_room');
        const otherPlayer = data.players.find((p: any) => p.id !== newSocket.id);
        if (otherPlayer) {
          setOpponent(otherPlayer.username);
          setOpponentSocketId(otherPlayer.id);
        }
      }
    });

    newSocket.on('player-ready', (data) => {
      console.log('Player ready event received:', data);
      // Check if it's the opponent who's ready
      if (data.socketId !== newSocket.id) {
        setOpponentReady(true);
        console.log('Opponent is ready!');
      }
    });

    newSocket.on('both-ready', (data) => {
      console.log('Both players ready');
      setGameState('ready');
    });

    newSocket.on('game-mode-selected', (data) => {
      console.log('Game mode selected:', data.gameMode);
      setSelectedGameMode(data.gameMode);
    });

    newSocket.on('game-started', (data) => {
      console.log('Game started with item:', data.targetItem);
      setTargetItem(data.targetItem);
      setGameStarted(true);
      setGameState('playing');
    });

    newSocket.on('score-update', (data) => {
      console.log('Score update:', data);
      Object.entries(data.scores).forEach(([socketId, score]) => {
        if (socketId === newSocket.id) {
          setPlayerScore(score as number);
        } else {
          setOpponentScore(score as number);
        }
      });
    });

    newSocket.on('round-complete', (data) => {
      console.log('Round complete:', data);
      setRoundNumber(data.nextRound);
      
      if (data.matchComplete) {
        setGameState('finished');
      } else {
        setTimeout(() => {
          setGameStarted(false);
          setIsReady(false);
          setOpponentReady(false);
          setGameState('ready_room');
        }, 3000);
      }
    });

    newSocket.on('player-left', (data) => {
      console.log('Player left:', data);
      setOpponent(null);
      setGameState('waiting');
      alert('Opponent left the game');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomCode, username, isHost]);

  const handleReady = () => {
    if (!socket) return;
    setIsReady(true);
    console.log('Emitting player-ready');
    socket.emit('player-ready', { roomCode, username });
  };

  const handleGameModeSelect = (modeId: string) => {
    if (!socket || !isHost) return;
    setSelectedGameMode(modeId);
    socket.emit('select-game-mode', { roomCode, gameMode: modeId });
  };

  const handleStartGame = () => {
    if (!socket || !isReady || !opponentReady) return;
    
    const randomItem = DETECTABLE_ITEMS[Math.floor(Math.random() * DETECTABLE_ITEMS.length)];
    
    socket.emit('start-game', { roomCode, targetItem: randomItem, gameMode: selectedGameMode });
  };

  const handleGameEnd = (winner: 'player' | 'opponent', myTime: number, opponentTime: number) => {
    if (!socket) return;

    const winnerId = winner === 'player' ? socket.id : null;
    
    socket.emit('round-winner', { 
      roomCode, 
      winnerId,
      times: {
        [socket.id!]: myTime,
        opponent: opponentTime
      }
    });
  };

  if (!roomCode || !username) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Invalid Room</h2>
          <a href="/" className="text-blue-400 hover:text-blue-300">
            Return to Lobby
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative">
      <MouseMoveEffect />
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg">
                SD
              </div>
              <span className="font-semibold text-lg">SkillDuels</span>
            </a>
            <div className="h-6 w-px bg-slate-700"></div>
            <div>
              <div className="text-sm text-slate-400">Room</div>
              <div className="font-mono font-semibold">{roomCode}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 px-4 py-2 bg-slate-800/50 rounded-lg">
              <div className="text-center">
                <div className="text-xs text-slate-400">Round</div>
                <div className="text-lg font-bold">{roundNumber}/3</div>
              </div>
              <div className="h-8 w-px bg-slate-700"></div>
              <div className="text-center">
                <div className="text-xs text-slate-400">You</div>
                <div className="text-lg font-bold text-green-400">{playerScore}</div>
              </div>
              <div className="text-slate-500">—</div>
              <div className="text-center">
                <div className="text-xs text-slate-400">Opponent</div>
                <div className="text-lg font-bold text-red-400">{opponentScore}</div>
              </div>
            </div>

            <div className="px-4 py-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg">
              <div className="text-xs text-yellow-500/80">Wager</div>
              <div className="font-semibold text-yellow-500">{wagerAmount} SOL</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Waiting for Opponent */}
        {gameState === 'waiting' && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <h2 className="text-3xl font-bold mb-4">Waiting for opponent...</h2>
            <p className="text-slate-400 mb-8">Share this room code with your opponent</p>
            <div className="inline-block px-8 py-4 bg-slate-800 border border-slate-700 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Room Code</div>
              <div className="text-3xl font-mono font-bold tracking-wider">{roomCode}</div>
            </div>
          </div>
        )}

        {/* Ready Room */}
        {gameState === 'ready_room' && (
          <div className="max-w-5xl mx-auto py-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Match Found</h2>
              <p className="text-slate-400">Prepare for battle against <span className="text-white font-semibold">{opponent}</span></p>
            </div>

            {/* Game Mode Selection (Host Only) */}
            {isHost && (
              <div className="mb-8 p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
                <h3 className="text-xl font-bold mb-4">Select Game Mode</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {GAME_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => handleGameModeSelect(mode.id)}
                      className={`p-4 rounded-lg border-2 transition text-left ${
                        selectedGameMode === mode.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-3xl mb-2">{mode.icon}</div>
                      <div className="font-bold mb-1">{mode.name}</div>
                      <div className="text-xs text-slate-400 mb-2">{mode.description}</div>
                      <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                        mode.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                        mode.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {mode.difficulty}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Game Mode Display (Non-host) */}
            {!isHost && (
              <div className="mb-8 p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
                <h3 className="text-xl font-bold mb-4">Selected Game Mode</h3>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {GAME_MODES.find(m => m.id === selectedGameMode)?.icon}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{GAME_MODES.find(m => m.id === selectedGameMode)?.name}</div>
                    <div className="text-sm text-slate-400">{GAME_MODES.find(m => m.id === selectedGameMode)?.description}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Wager Settings */}
            {!isReady && (
              <div className="mb-8 p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
                <h3 className="text-xl font-bold mb-4">Set Wager</h3>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={wagerAmount}
                    onChange={(e) => setWagerAmount(parseFloat(e.target.value))}
                    className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg outline-none focus:border-blue-500 transition"
                  />
                  <button
                    onClick={handleReady}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-bold transition"
                  >
                    Ready
                  </button>
                </div>
              </div>
            )}

            {/* Player Status */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className={`p-6 rounded-xl border-2 transition ${
                isReady 
                  ? 'border-green-500 bg-green-500/10' 
                  : 'border-slate-700 bg-slate-800/30'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-bold text-lg">{username}</div>
                    <div className="text-sm text-slate-400">{isHost ? 'Host' : 'Player'}</div>
                  </div>
                  {isReady ? (
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                      <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className={`text-sm font-semibold ${isReady ? 'text-green-400' : 'text-slate-500'}`}>
                  {isReady ? 'Ready to play' : 'Waiting...'}
                </div>
              </div>

              <div className={`p-6 rounded-xl border-2 transition ${
                opponentReady 
                  ? 'border-green-500 bg-green-500/10' 
                  : 'border-slate-700 bg-slate-800/30'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-bold text-lg">{opponent}</div>
                    <div className="text-sm text-slate-400">Opponent</div>
                  </div>
                  {opponentReady ? (
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                      <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className={`text-sm font-semibold ${opponentReady ? 'text-green-400' : 'text-slate-500'}`}>
                  {opponentReady ? 'Ready to play' : 'Waiting...'}
                </div>
              </div>
            </div>

            {/* Start Button */}
            {isHost && isReady && opponentReady && (
              <div className="mt-8 text-center">
                {selectedGameMode === 'object-hunt' && !targetItem ? (
                  <div className="text-slate-400">Please select a target item to start</div>
                ) : (
                  <button
                    onClick={handleStartGame}
                    className="px-12 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-bold text-lg transition transform hover:scale-105"
                  >
                    Start {GAME_MODES.find(m => m.id === selectedGameMode)?.name || 'Game'}
                  </button>
                )}
              </div>
            )}

            {!isHost && isReady && opponentReady && (
              <div className="mt-8 text-center">
                <div className="text-slate-400">Waiting for host to start the game...</div>
              </div>
            )}
          </div>
        )}

        {/* Playing */}
        {gameState === 'playing' && gameStarted && socket && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              {selectedGameMode === 'object-hunt' && targetItem && (
                <ObjectBringGame
                  onGameEnd={handleGameEnd}
                  isActive={gameStarted}
                  targetItem={targetItem}
                  socket={socket}
                  roomCode={roomCode}
                />
              )}
              
              {selectedGameMode === 'hand-raise' && (
                <HandRaiseGame
                  onGameEnd={(winner) => handleGameEnd(winner, 0, 0)}
                  isActive={gameStarted}
                />
              )}
              
              {selectedGameMode === 'rock-paper-scissors' && (
                <RockPaperScissorsGame
                  onGameEnd={(winner, playerChoice, opponentChoice) => {
                    console.log(`RPS Result: ${winner}, Player: ${playerChoice}, Opponent: ${opponentChoice}`);
                    handleGameEnd(winner === 'tie' ? 'player' : winner, 0, 0);
                  }}
                  isActive={gameStarted}
                  socket={socket}
                  roomCode={roomCode}
                />
              )}
              
              {selectedGameMode === 'reflex-challenge' && (
                <ReflexGame
                  onGameEnd={handleGameEnd}
                  isActive={gameStarted}
                  socket={socket}
                  roomCode={roomCode}
                />
              )}
            </div>
            <div className="space-y-6">
              <VideoChat roomCode={roomCode} username={username} />
              <GameUI socket={socket} roomCode={roomCode} />
            </div>
          </div>
        )}

        {/* Finished */}
        {gameState === 'finished' && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">
              {playerScore > opponentScore ? '🏆' : '💔'}
            </div>
            <h2 className="text-4xl font-bold mb-4">
              {playerScore > opponentScore ? 'Victory!' : 'Defeat'}
            </h2>
            <p className="text-xl text-slate-400 mb-8">
              Final Score: <span className="text-white font-bold">{playerScore} - {opponentScore}</span>
            </p>
            <div className="mb-8 p-8 bg-slate-800 border border-slate-700 rounded-xl inline-block">
              <p className="text-lg mb-2 text-slate-400">
                {playerScore > opponentScore ? 'Prize Won' : 'Prize Lost'}
              </p>
              <p className={`text-4xl font-bold ${playerScore > opponentScore ? 'text-green-400' : 'text-red-400'}`}>
                {playerScore > opponentScore ? '+' : '-'}{wagerAmount * 2} SOL
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-bold transition"
              >
                Play Again
              </button>
              <a
                href="/"
                className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold transition inline-block"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    }>
      <GameContent />
    </Suspense>
  );
}
