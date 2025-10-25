'use client';

import { useEffect, useState, useRef } from 'react';

interface ReflexGameProps {
  onGameEnd: (winner: 'player' | 'opponent', myTime: number, opponentTime: number) => void;
  isActive: boolean;
  socket: any;
  roomCode: string;
}

export default function ReflexGame({ 
  onGameEnd, 
  isActive,
  socket,
  roomCode 
}: ReflexGameProps) {
  const [gamePhase, setGamePhase] = useState<'waiting' | 'ready' | 'go' | 'clicked' | 'result'>('waiting');
  const [countdown, setCountdown] = useState(3);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [opponentTime, setOpponentTime] = useState<number | null>(null);
  const [backgroundColor, setBackgroundColor] = useState('bg-slate-800');
  const startTimeRef = useRef<number | null>(null);

  // Countdown phase
  useEffect(() => {
    if (!isActive) return;

    if (gamePhase === 'waiting' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gamePhase === 'waiting' && countdown === 0) {
      setGamePhase('ready');
      setBackgroundColor('bg-red-600');
      
      // Random delay between 2-5 seconds before showing green
      const randomDelay = 2000 + Math.random() * 3000;
      setTimeout(() => {
        setGamePhase('go');
        setBackgroundColor('bg-green-500');
        startTimeRef.current = Date.now();
      }, randomDelay);
    }
  }, [countdown, isActive, gamePhase]);

  // Socket listener for opponent time
  useEffect(() => {
    if (!socket) return;

    socket.on('reflex-opponent-time', (data: { time: number }) => {
      setOpponentTime(data.time);
    });

    return () => {
      socket.off('reflex-opponent-time');
    };
  }, [socket]);

  // Check winner when both times are in
  useEffect(() => {
    if (reactionTime !== null && opponentTime !== null && gamePhase === 'clicked') {
      setGamePhase('result');
      
      setTimeout(() => {
        const winner = reactionTime < opponentTime ? 'player' : 'opponent';
        onGameEnd(winner, reactionTime, opponentTime);
      }, 2000);
    }
  }, [reactionTime, opponentTime, gamePhase, onGameEnd]);

  const handleClick = () => {
    if (gamePhase === 'go' && !reactionTime) {
      const endTime = Date.now();
      const time = startTimeRef.current ? endTime - startTimeRef.current : 0;
      setReactionTime(time);
      setGamePhase('clicked');
      setBackgroundColor('bg-blue-600');
      
      // Send time to opponent
      socket?.emit('reflex-time', { roomCode, time });
    } else if (gamePhase === 'ready') {
      // Clicked too early
      setGamePhase('result');
      setBackgroundColor('bg-red-800');
      setTimeout(() => {
        onGameEnd('opponent', 99999, 0);
      }, 1500);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div 
        className={`relative ${backgroundColor} rounded-2xl overflow-hidden border-4 border-slate-700 transition-all duration-200 cursor-pointer`}
        style={{ minHeight: '500px' }}
        onClick={handleClick}
      >
        <div className="absolute inset-0 flex items-center justify-center p-8">
          {/* Countdown */}
          {gamePhase === 'waiting' && countdown > 0 && (
            <div className="text-center">
              <div className="text-9xl font-bold text-white mb-4 animate-pulse">
                {countdown}
              </div>
              <p className="text-2xl text-white">Get ready...</p>
            </div>
          )}

          {/* Ready phase (red) */}
          {gamePhase === 'ready' && (
            <div className="text-center">
              <div className="text-6xl font-bold text-white mb-6">
                WAIT...
              </div>
              <p className="text-xl text-white/80">Don't click yet!</p>
              <div className="mt-8 text-7xl animate-pulse">⏱️</div>
            </div>
          )}

          {/* Go phase (green) */}
          {gamePhase === 'go' && (
            <div className="text-center">
              <div className="text-8xl font-bold text-white mb-6 animate-bounce">
                CLICK NOW!
              </div>
              <div className="text-9xl">⚡</div>
            </div>
          )}

          {/* Clicked phase */}
          {gamePhase === 'clicked' && (
            <div className="text-center">
              <div className="text-6xl font-bold text-white mb-4">
                {reactionTime}ms
              </div>
              <p className="text-2xl text-white/80 mb-4">Your reaction time</p>
              {!opponentTime && (
                <div className="flex items-center gap-3 text-xl text-white/70">
                  <div className="animate-spin">⏳</div>
                  <span>Waiting for opponent...</span>
                </div>
              )}
            </div>
          )}

          {/* Result phase */}
          {gamePhase === 'result' && reactionTime !== null && opponentTime !== null && (
            <div className="text-center">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="p-6 bg-slate-900/50 rounded-xl border-2 border-blue-400">
                  <div className="text-5xl font-bold text-blue-400 mb-2">{reactionTime}ms</div>
                  <p className="text-lg text-white">You</p>
                </div>
                <div className="p-6 bg-slate-900/50 rounded-xl border-2 border-purple-400">
                  <div className="text-5xl font-bold text-purple-400 mb-2">{opponentTime}ms</div>
                  <p className="text-lg text-white">Opponent</p>
                </div>
              </div>
              <div className="text-4xl font-bold text-white">
                {reactionTime < opponentTime ? '🎉 You Win!' : '😔 You Lose!'}
              </div>
              <div className="mt-4 text-xl text-white/70">
                Difference: {Math.abs(reactionTime - opponentTime)}ms
              </div>
            </div>
          )}

          {/* Too early */}
          {gamePhase === 'result' && reactionTime === null && (
            <div className="text-center">
              <div className="text-7xl mb-6">❌</div>
              <div className="text-4xl font-bold text-white mb-4">
                Too Early!
              </div>
              <p className="text-xl text-white/80">You clicked before green appeared</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-slate-400">
        <p className="text-sm">Wait for the screen to turn <span className="text-green-400 font-bold">GREEN</span>, then click as fast as possible!</p>
        <p className="text-xs mt-2 text-slate-500">Don't click on red or you'll lose!</p>
      </div>
    </div>
  );
}

