'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import dynamic from 'next/dynamic';
import ObjectBringGame, { DETECTABLE_ITEMS } from '@/components/ObjectBringGame';
import RockPaperScissorsGame from '@/components/RockPaperScissorsGame';
import VideoChat from '@/components/VideoChat';
import ChatBox from '@/components/ChatBox';
import { MouseMoveEffect } from '@/components/MouseMoveEffect';

// Dynamic imports for games using MediaPipe (client-side only)

const TableTennisGame = dynamic(() => import('@/components/TableTennisGame'), {
  ssr: false,
  loading: () => <div className="text-center p-8">Loading Table Tennis...</div>
});

const TennisGame = dynamic(() => import('@/components/TennisGame'), {
  ssr: false,
  loading: () => <div className="text-center p-8">Loading Tennis...</div>
});

const GAME_MODES = [
  {
    id: 'object-hunt',
    name: 'Object Hunt',
    description: 'Race to find and show items to your camera',
    icon: '🔍',
    difficulty: 'Easy',
    rules: [
      'A random object will be selected',
      'Find the object as fast as possible',
      'Show it clearly to your camera',
      'First player to show the object wins!',
      'Good lighting helps detection'
    ]
  },
  {
    id: 'rock-paper-scissors',
    name: 'Rock Paper Scissors',
    description: 'Classic game with hand gesture detection',
    icon: '✊',
    difficulty: 'Medium',
    rules: [
      '✊ Rock beats Scissors',
      '✋ Paper beats Rock',
      '✌️ Scissors beats Paper',
      'Show your gesture clearly',
      'First to lock in wins ties'
    ]
  },
  {
    id: 'table-tennis',
    name: 'Table Tennis',
    description: 'Control paddle with hand movement, hit the ball!',
    icon: '🏓',
    difficulty: 'Medium',
    rules: [
      'Move hand left/right to control paddle',
      'Hit the ball back to opponent',
      'Ball speeds up with each hit',
      'First to 5 points wins',
      'Missing the ball gives opponent a point'
    ]
  },
  {
    id: 'tennis',
    name: 'Tennis',
    description: 'Swing your hand to hit tennis balls',
    icon: '🎾',
    difficulty: 'Hard',
    rules: [
      'Move hand to position racket',
      'Swing down fast for power hits',
      'Ball has gravity and bounce',
      'First to 3 points wins',
      'Let ball bounce once before hitting'
    ]
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
  const [gameState, setGameState] = useState<'waiting' | 'ready_room' | 'rules_preview' | 'playing' | 'finished'>('waiting');
  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [targetItem, setTargetItem] = useState('');
  const [roundNumber, setRoundNumber] = useState(1);
  const [selectedGameMode, setSelectedGameMode] = useState('object-hunt');
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [opponentRulesAccepted, setOpponentRulesAccepted] = useState(false);
  const [setupCountdown, setSetupCountdown] = useState<number | null>(null);

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
      // Keep it in ready_room so the start button is visible
      // setGameState('ready');
    });

    newSocket.on('game-mode-selected', (data) => {
      console.log('Game mode selected:', data.gameMode);
      setSelectedGameMode(data.gameMode);
    });

    newSocket.on('show-rules-screen', (data) => {
      console.log('📋 RULES SCREEN EVENT RECEIVED');
      console.log('Game mode:', data.gameMode);
      console.log('Setting state to rules_preview for:', username);
      
      if (data.gameMode) {
        setSelectedGameMode(data.gameMode);
      }
      setGameState('rules_preview');
      
      console.log('✅ Rules screen should now be visible');
    });

    newSocket.on('opponent-rules-accepted', (data) => {
      console.log('✅ Opponent accepted rules:', data.username);
      setOpponentRulesAccepted(true);
    });

    newSocket.on('countdown-started', () => {
      console.log('⏱️ Countdown started');
      setSetupCountdown(5);
    });

    newSocket.on('game-started', (data) => {
      console.log('🎮 GAME STARTED EVENT RECEIVED:', data);
      console.log('Target item:', data.targetItem);
      console.log('Game mode:', data.gameMode);
      
      setTargetItem(data.targetItem);
      if (data.gameMode) {
        setSelectedGameMode(data.gameMode);
      }
      setGameStarted(true);
      setGameState('playing');
      
      console.log('✅ State updated - should render game now');
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
    console.log('🚀 START GAME CLICKED - Moving to rules preview');
    console.log('Socket connected?', socket?.connected);
    console.log('Room code:', roomCode);
    console.log('Game mode:', selectedGameMode);
    console.log('Is ready?', isReady);
    console.log('Opponent ready?', opponentReady);
    
    if (!socket || !isReady || !opponentReady) {
      console.log('❌ Cannot start - conditions not met');
      return;
    }
    
    if (!socket.connected) {
      console.log('❌ Socket is not connected!');
      return;
    }
    
    // Emit to server - server will broadcast to BOTH players (including host)
    console.log('✅ Emitting show-rules to server...');
    socket.emit('show-rules', { roomCode, gameMode: selectedGameMode });
    console.log('✅ Emitted show-rules event');
  };

  const handleAcceptRules = () => {
    if (!socket) return;
    setRulesAccepted(true);
    socket.emit('rules-accepted', { roomCode, username });
  };

  const handleStartActualGame = () => {
    if (!socket || !rulesAccepted || !opponentRulesAccepted) return;
    
    console.log('✅ Both players accepted rules - Starting countdown');
    
    // Start 5-second countdown for camera setup
    setSetupCountdown(5);
    socket.emit('start-countdown', { roomCode });
  };

  // Countdown effect for camera setup
  useEffect(() => {
    if (setupCountdown === null) return;
    
    if (setupCountdown > 0) {
      const timer = setTimeout(() => {
        setSetupCountdown(setupCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished, start the game
      if (socket) {
        const randomItem = DETECTABLE_ITEMS[Math.floor(Math.random() * DETECTABLE_ITEMS.length)];
        console.log('🎮 Countdown complete - Starting game now');
        socket.emit('start-game', { roomCode, targetItem: randomItem, gameMode: selectedGameMode });
      }
      setSetupCountdown(null);
    }
  }, [setupCountdown, socket, roomCode, selectedGameMode]);

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
              <span className="font-semibold text-lg">Orbit</span>
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

        {/* Rules Preview & Consent Screen */}
        {gameState === 'rules_preview' && (
          <div className="max-w-4xl mx-auto py-8">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 border-2 border-blue-500 shadow-2xl">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">
                  {GAME_MODES.find(m => m.id === selectedGameMode)?.icon}
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text mb-2">
                  {GAME_MODES.find(m => m.id === selectedGameMode)?.name}
                </h2>
                <p className="text-slate-400 text-lg">
                  {GAME_MODES.find(m => m.id === selectedGameMode)?.description}
                </p>
              </div>

              {/* Game Rules */}
              <div className="bg-slate-900/50 rounded-2xl p-6 mb-8 border border-slate-700">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-yellow-400">📋</span>
                  Game Rules
                </h3>
                <ul className="space-y-3">
                  {GAME_MODES.find(m => m.id === selectedGameMode)?.rules?.map((rule, index) => (
                    <li key={index} className="flex items-start gap-3 text-lg">
                      <span className="text-green-400 font-bold mt-1">{index + 1}.</span>
                      <span className="text-slate-200">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Wager Info */}
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-yellow-500/80 mb-1">Total Pot</div>
                    <div className="text-3xl font-bold text-yellow-400">{wagerAmount * 2} SOL</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-400 mb-1">Your Wager</div>
                    <div className="text-xl font-semibold text-white">{wagerAmount} SOL</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-400 mb-1">Winner Gets</div>
                    <div className="text-xl font-semibold text-green-400">{wagerAmount * 2} SOL</div>
                  </div>
                </div>
              </div>

              {/* Players Status */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className={`p-4 rounded-xl border-2 transition ${
                  rulesAccepted 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-slate-700 bg-slate-800/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">{username}</div>
                      <div className="text-sm text-slate-400">You</div>
                    </div>
                    {rulesAccepted ? (
                      <div className="text-2xl">✅</div>
                    ) : (
                      <div className="text-2xl">⏳</div>
                    )}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border-2 transition ${
                  opponentRulesAccepted 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-slate-700 bg-slate-800/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">{opponent}</div>
                      <div className="text-sm text-slate-400">Opponent</div>
                    </div>
                    {opponentRulesAccepted ? (
                      <div className="text-2xl">✅</div>
                    ) : (
                      <div className="text-2xl">⏳</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Consent & Start Button */}
              {!rulesAccepted ? (
                <div className="text-center">
                  <button
                    onClick={handleAcceptRules}
                    className="px-12 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl font-bold text-xl transition transform hover:scale-105 shadow-lg"
                  >
                    ✅ I Accept the Rules & Wager
                  </button>
                  <p className="text-sm text-slate-400 mt-3">
                    By accepting, you agree to wager {wagerAmount} SOL
                  </p>
                </div>
              ) : !opponentRulesAccepted ? (
                <div className="text-center">
                  <div className="text-green-400 text-lg font-semibold mb-2">✅ You're ready!</div>
                  <div className="text-slate-400">Waiting for {opponent} to accept...</div>
                </div>
              ) : setupCountdown !== null ? (
                <div className="text-center">
                  <div className="text-8xl font-bold mb-4 animate-pulse">
                    {setupCountdown > 0 ? setupCountdown : '🎮'}
                  </div>
                  <div className="text-2xl font-semibold mb-2">
                    {setupCountdown > 0 ? 'Get Ready!' : 'Starting...'}
                  </div>
                  <div className="text-slate-400">
                    {setupCountdown > 0 ? 'Position your camera and prepare!' : 'Game is starting now!'}
                  </div>
                </div>
              ) : isHost ? (
                <div className="text-center">
                  <button
                    onClick={handleStartActualGame}
                    className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-bold text-xl transition transform hover:scale-105 shadow-lg animate-pulse"
                  >
                    🎮 START GAME NOW!
                  </button>
                  <p className="text-sm text-green-400 mt-3">
                    Both players ready - Click to start!
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-green-400 text-lg font-semibold mb-2">✅ Both players ready!</div>
                  <div className="text-slate-400">Waiting for host to start the game...</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="fixed top-4 right-4 bg-black/80 p-4 rounded text-xs z-50">
          <div>Game State: <span className="text-yellow-400">{gameState}</span></div>
          <div>Game Started: <span className="text-yellow-400">{gameStarted ? 'Yes' : 'No'}</span></div>
          <div>Socket: <span className="text-yellow-400">{socket ? 'Connected' : 'No'}</span></div>
          <div>Selected Mode: <span className="text-yellow-400">{selectedGameMode}</span></div>
        </div>

        {/* Playing - Clean 3-Column Layout */}
        {gameState === 'playing' && gameStarted && socket && (
          <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
            {/* Top: Score Bar */}
            <div className="w-full mb-4 flex justify-between items-center bg-black/50 rounded-xl p-4 backdrop-blur max-w-7xl mx-auto">
              <div className="text-center flex-1">
                <div className="text-sm text-green-400">YOU</div>
                <div className="text-4xl font-bold text-white">{playerScore}</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-2xl font-bold text-yellow-400">
                  {GAME_MODES.find(m => m.id === selectedGameMode)?.icon} {GAME_MODES.find(m => m.id === selectedGameMode)?.name}
                </div>
                <div className="text-sm text-slate-300">First to win!</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-sm text-red-400">OPPONENT</div>
                <div className="text-4xl font-bold text-white">{opponentScore}</div>
              </div>
            </div>

            {/* Middle: 3-Column Layout (Video | Game | Video) */}
            <div className="grid grid-cols-12 gap-4 max-w-7xl mx-auto mb-4">
              {/* Left: Your Video */}
              <div className="col-span-2">
                <div className="bg-slate-900/80 rounded-xl overflow-hidden border-2 border-green-500 h-full">
                  <div className="bg-green-600 text-white text-center py-2 text-sm font-semibold">
                    YOU
                  </div>
                  <VideoChat roomCode={roomCode} username={username} showOnlyLocal={true} />
                </div>
              </div>

              {/* Center: Game Screen (BIGGER) */}
              <div className="col-span-8 flex items-center justify-center">
                <div className="w-full h-full bg-black/30 rounded-xl border-2 border-white/20 overflow-hidden">
                  {selectedGameMode === 'object-hunt' && targetItem && (
                    <ObjectBringGame
                      onGameEnd={handleGameEnd}
                      isActive={gameStarted}
                      targetItem={targetItem}
                      socket={socket}
                      roomCode={roomCode}
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
                  
                  {selectedGameMode === 'table-tennis' && (
                    <TableTennisGame
                      onGameEnd={handleGameEnd}
                      isActive={gameStarted}
                      socket={socket}
                      roomCode={roomCode}
                      playerName={username}
                      opponentName={opponent || 'Opponent'}
                    />
                  )}
                  
                  {selectedGameMode === 'tennis' && (
                    <TennisGame
                      onGameEnd={handleGameEnd}
                      isActive={gameStarted}
                      socket={socket}
                      roomCode={roomCode}
                    />
                  )}
                </div>
              </div>

              {/* Right: Opponent Video */}
              <div className="col-span-2">
                <div className="bg-slate-900/80 rounded-xl overflow-hidden border-2 border-red-500 h-full">
                  <div className="bg-red-600 text-white text-center py-2 text-sm font-semibold">
                    {opponent || 'OPPONENT'}
                  </div>
                  <VideoChat roomCode={roomCode} username={username} showOnlyRemote={true} />
                </div>
              </div>
            </div>

            {/* Bottom: Chat */}
            <div className="max-w-7xl mx-auto">
              <ChatBox socket={socket} roomCode={roomCode} username={username} />
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
