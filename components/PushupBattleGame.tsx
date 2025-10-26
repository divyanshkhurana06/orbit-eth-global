'use client';

import { useEffect, useRef, useState } from 'react';

interface PushupBattleGameProps {
  onGameEnd: (winner: 'player' | 'opponent', playerScore: number, opponentScore: number) => void;
  isActive: boolean;
  socket: any;
  roomCode: string;
  playerName?: string;
  opponentName?: string;
}

export default function PushupBattleGame({
  onGameEnd,
  isActive,
  socket,
  roomCode,
  playerName = 'Player',
  opponentName = 'Opponent'
}: PushupBattleGameProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game states
  const [gamePhase, setGamePhase] = useState<'number-selection' | 'countdown' | 'playing' | 'finished'>('number-selection');
  const [playerNumber, setPlayerNumber] = useState<number | null>(null);
  const [opponentNumber, setOpponentNumber] = useState<number | null>(null);
  const [pushupGoal, setPushupGoal] = useState<number>(0);
  const [countdown, setCountdown] = useState(5);
  
  // Pushup counters
  const [playerCount, setPlayerCount] = useState(0);
  const [opponentCount, setOpponentCount] = useState(0);
  
  // Pushup detection state
  const upPosRef = useRef<string | null>(null);
  const downPosRef = useRef<string | null>(null);
  const playerCountRef = useRef(0);
  
  // MediaPipe
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  
  // Calculate angle between three points
  const calculateAngle = (a: number[], b: number[], c: number[]): number => {
    const radians = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(a[1] - b[1], a[0] - b[0]);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  };
  
  // Handle number selection
  const handleNumberSelect = (num: number) => {
    setPlayerNumber(num);
    socket?.emit('pushup-number-selected', { roomCode, number: num, player: playerName });
  };
  
  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    
    const handleOpponentNumber = (data: { number: number }) => {
      console.log('Opponent selected:', data.number);
      setOpponentNumber(data.number);
    };
    
    const handleOpponentPushup = (data: { count: number }) => {
      setOpponentCount(data.count);
    };
    
    socket.on('opponent-pushup-number', handleOpponentNumber);
    socket.on('opponent-pushup-count', handleOpponentPushup);
    
    return () => {
      socket.off('opponent-pushup-number');
      socket.off('opponent-pushup-count');
    };
  }, [socket]);
  
  // When both players select numbers, calculate goal
  useEffect(() => {
    if (playerNumber !== null && opponentNumber !== null && pushupGoal === 0) {
      const goal = Math.round((playerNumber + opponentNumber) / 2);
      setPushupGoal(goal);
      console.log(`Goal set to ${goal} (average of ${playerNumber} and ${opponentNumber})`);
      setTimeout(() => setGamePhase('countdown'), 1000);
    }
  }, [playerNumber, opponentNumber, pushupGoal]);
  
  // Countdown before game starts
  useEffect(() => {
    if (gamePhase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gamePhase === 'countdown' && countdown === 0) {
      setGamePhase('playing');
    }
  }, [gamePhase, countdown]);
  
  // Initialize MediaPipe Pose
  useEffect(() => {
    if (!isActive || gamePhase !== 'playing' || !videoRef.current || !canvasRef.current) return;
    
    let mounted = true;
    
    const initMediaPipe = async () => {
      try {
        const { Pose, POSE_CONNECTIONS } = await import('@mediapipe/pose');
        const { Camera } = await import('@mediapipe/camera_utils');
        const { drawConnectors, drawLandmarks } = await import('@mediapipe/drawing_utils');
        
        const pose = new Pose({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });
        
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        
        pose.onResults((results: any) => {
          if (!mounted || !canvasRef.current) return;
          
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          // Draw video frame
          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
          
          if (results.poseLandmarks) {
            const landmarks = results.poseLandmarks;
            
            // Draw pose
            drawConnectors(ctx, landmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
            drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 2 });
            
            // Calculate pushup
            try {
              const shoulder = [landmarks[11].x, landmarks[11].y]; // LEFT_SHOULDER
              const elbow = [landmarks[13].x, landmarks[13].y]; // LEFT_ELBOW
              const wrist = [landmarks[15].x, landmarks[15].y]; // LEFT_WRIST
              
              const leftArmAngle = calculateAngle(shoulder, elbow, wrist);
              
              // Pushup detection logic (from Python code)
              if (leftArmAngle > 160) {
                upPosRef.current = 'Up';
              }
              
              if (leftArmAngle < 110 && upPosRef.current === 'Up') {
                downPosRef.current = 'Down';
              }
              
              if (leftArmAngle > 160 && downPosRef.current === 'Down') {
                // Complete pushup!
                playerCountRef.current += 1;
                setPlayerCount(playerCountRef.current);
                socket?.emit('pushup-count', { roomCode, count: playerCountRef.current });
                
                upPosRef.current = null;
                downPosRef.current = null;
                
                console.log(`Pushup completed! Count: ${playerCountRef.current}`);
                
                // Check if player won
                if (playerCountRef.current >= pushupGoal) {
                  setGamePhase('finished');
                  setTimeout(() => onGameEnd('player', playerCountRef.current, opponentCount), 2000);
                }
              }
              
              // Display angle
              ctx.fillStyle = '#FFFFFF';
              ctx.font = 'bold 24px Arial';
              ctx.fillText(`Elbow Angle: ${Math.round(leftArmAngle)}°`, 10, 30);
              ctx.fillText(`Position: ${upPosRef.current || downPosRef.current || 'Ready'}`, 10, 60);
            } catch (error) {
              console.error('Error calculating pushup:', error);
            }
          }
          
          ctx.restore();
        });
        
        poseRef.current = pose;
        
        if (videoRef.current && mounted) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (mounted && videoRef.current && poseRef.current) {
                await poseRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });
          cameraRef.current = camera;
          camera.start();
          console.log('✅ MediaPipe Pose started!');
        }
      } catch (error) {
        console.error('❌ MediaPipe error:', error);
      }
    };
    
    initMediaPipe();
    
    return () => {
      mounted = false;
      cameraRef.current?.stop();
    };
  }, [isActive, gamePhase, socket, roomCode, pushupGoal, opponentCount, onGameEnd]);
  
  // Check if opponent won
  useEffect(() => {
    if (opponentCount >= pushupGoal && pushupGoal > 0 && gamePhase === 'playing') {
      setGamePhase('finished');
      setTimeout(() => onGameEnd('opponent', playerCount, opponentCount), 2000);
    }
  }, [opponentCount, pushupGoal, gamePhase, playerCount, onGameEnd]);
  
  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 rounded-2xl">
      {/* Number Selection Phase */}
      {gamePhase === 'number-selection' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">💪</div>
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-500 text-transparent bg-clip-text">
              PUSHUP BATTLE
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Select your pushup goal (10-100)
            </p>
          </div>
          
          {playerNumber === null ? (
            <div className="grid grid-cols-5 gap-4 max-w-4xl">
              {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberSelect(num)}
                  className="px-8 py-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-xl font-bold text-3xl transition transform hover:scale-110 shadow-lg"
                >
                  {num}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-6 text-green-400">
                ✅ You selected: <span className="font-bold text-6xl">{playerNumber}</span>
              </div>
              {opponentNumber === null ? (
                <div className="text-2xl text-yellow-400 animate-pulse">
                  Waiting for {opponentName} to select...
                </div>
              ) : (
                <div className="text-4xl text-green-400">
                  ✅ {opponentName} selected: <span className="font-bold text-6xl">{opponentNumber}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Countdown Phase */}
      {gamePhase === 'countdown' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="text-8xl mb-8 text-yellow-400">💪</div>
            <h3 className="text-5xl font-bold mb-6">
              Goal: <span className="text-yellow-400">{pushupGoal}</span> pushups!
            </h3>
            <div className="text-9xl font-bold animate-pulse">
              {countdown}
            </div>
            <p className="text-3xl mt-8 text-slate-300">
              Get ready to do pushups!
            </p>
          </div>
        </div>
      )}
      
      {/* Playing Phase */}
      {gamePhase === 'playing' && (
        <>
          {/* Score Bar */}
          <div className="w-full mb-4 flex justify-between items-center bg-black/50 rounded-xl p-4 backdrop-blur">
            <div className="text-center flex-1">
              <div className="text-sm text-cyan-400">{playerName}</div>
              <div className="text-5xl font-bold text-cyan-400">{playerCount}</div>
              <div className="text-xs text-slate-400">/ {pushupGoal}</div>
              <div className="w-full bg-slate-700 rounded-full h-3 mt-2">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((playerCount / pushupGoal) * 100, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="text-center flex-1 mx-8">
              <div className="text-3xl font-bold text-yellow-400">💪 PUSHUP BATTLE</div>
              <div className="text-lg text-slate-300">First to {pushupGoal} wins!</div>
            </div>
            
            <div className="text-center flex-1">
              <div className="text-sm text-orange-400">{opponentName}</div>
              <div className="text-5xl font-bold text-orange-400">{opponentCount}</div>
              <div className="text-xs text-slate-400">/ {pushupGoal}</div>
              <div className="w-full bg-slate-700 rounded-full h-3 mt-2">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((opponentCount / pushupGoal) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Camera Feed */}
          <div className="flex-1 relative">
            <video ref={videoRef} autoPlay playsInline muted className="hidden" />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="w-full h-full object-cover rounded-xl border-4 border-cyan-500"
            />
            
            {/* Instructions Overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 rounded-xl px-6 py-3">
              <p className="text-xl font-bold text-white text-center">
                💪 Do proper pushups! Arms straight (160°) → Down (110°) → Up (160°)
              </p>
            </div>
          </div>
        </>
      )}
      
      {/* Finished Phase */}
      {gamePhase === 'finished' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="text-9xl mb-6 animate-bounce">🏆</div>
            <h2 className="text-7xl font-bold mb-6 animate-pulse">
              {playerCount >= pushupGoal ? (
                <span className="text-cyan-400">{playerName} WINS!</span>
              ) : (
                <span className="text-orange-400">{opponentName} WINS!</span>
              )}
            </h2>
            <div className="text-5xl font-bold mb-4">
              <span className="text-cyan-400">{playerCount}</span>
              {' vs '}
              <span className="text-orange-400">{opponentCount}</span>
            </div>
            <p className="text-3xl text-slate-300">
              Goal was {pushupGoal} pushups
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

