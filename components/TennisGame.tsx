'use client';

import { useEffect, useRef, useState } from 'react';

interface TennisGameProps {
  onGameEnd: (winner: 'player' | 'opponent', playerScore: number, opponentScore: number) => void;
  isActive: boolean;
  socket: any;
  roomCode: string;
}

interface Ball {
  x: number;
  y: number;
  z: number; // depth
  vx: number;
  vy: number;
  vz: number;
  radius: number;
}

export default function TennisGame({ 
  onGameEnd, 
  isActive,
  socket,
  roomCode 
}: TennisGameProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [gamePhase, setGamePhase] = useState<'countdown' | 'serving' | 'playing' | 'scored' | 'finished'>('countdown');
  const [isPlayerServing, setIsPlayerServing] = useState(true);
  
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [handPosition, setHandPosition] = useState({ x: 0, y: 0 });
  const [isSwinging, setIsSwinging] = useState(false);
  const lastHandYRef = useRef(0);
  
  // Game state
  const ballRef = useRef<Ball>({
    x: 400,
    y: 300,
    z: 0.5, // 0 = far, 1 = near
    vx: 0,
    vy: 0,
    vz: 0.02,
    radius: 15
  });

  const CANVAS_WIDTH = 1400;
  const CANVAS_HEIGHT = 900;
  const MAX_SCORE = 3;

  // Countdown
  useEffect(() => {
    if (!isActive || gamePhase !== 'countdown') return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setGamePhase('serving');
      serveBall();
    }
  }, [countdown, isActive, gamePhase]);

  // Initialize MediaPipe
  useEffect(() => {
    if (!isActive || !videoRef.current || !canvasRef.current) return;

    let mounted = true;

    const initializeMediaPipe = async () => {
      try {
        const { Hands } = await import('@mediapipe/hands');
        const { Camera } = await import('@mediapipe/camera_utils');

        const hands = new Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7
        });

        hands.onResults((results: any) => {
          if (!mounted || !canvasRef.current) return;

          const canvasCtx = canvasRef.current.getContext('2d');
          if (!canvasCtx) return;

          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          if (results.image) {
            canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
          }

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // Draw hand with racket effect
            for (let i = 0; i < landmarks.length; i++) {
              const landmark = landmarks[i];
              canvasCtx.beginPath();
              canvasCtx.arc(
                landmark.x * canvasRef.current.width,
                landmark.y * canvasRef.current.height,
                5,
                0,
                2 * Math.PI
              );
              canvasCtx.fillStyle = '#FFD700';
              canvasCtx.fill();
            }

            // Draw racket overlay
            const palm = landmarks[0];
            const middle = landmarks[12];
            canvasCtx.beginPath();
            canvasCtx.ellipse(
              middle.x * canvasRef.current.width,
              middle.y * canvasRef.current.height,
              40, 50, 0, 0, Math.PI * 2
            );
            canvasCtx.strokeStyle = '#FFD700';
            canvasCtx.lineWidth = 5;
            canvasCtx.stroke();
            canvasCtx.fillStyle = '#FFD70030';
            canvasCtx.fill();

            // Track hand position
            const handX = middle.x * CANVAS_WIDTH;
            const handY = middle.y * CANVAS_HEIGHT;
            
            // Detect swing (rapid downward motion)
            const yDelta = handY - lastHandYRef.current;
            if (yDelta > 20 && !isSwinging) {
              setIsSwinging(true);
              setTimeout(() => setIsSwinging(false), 300);
            }
            
            lastHandYRef.current = handY;
            setHandPosition({ x: handX, y: handY });
            
            // Send position to opponent
            socket?.emit('tennis-hand-move', { 
              roomCode, 
              x: handX,
              y: handY,
              swinging: yDelta > 20
            });
          }

          canvasCtx.restore();
        });

        handsRef.current = hands;

        if (videoRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && mounted) {
                await hands.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });
          cameraRef.current = camera;
          camera.start();
        }

      } catch (error) {
        console.error('MediaPipe initialization failed:', error);
      }
    };

    initializeMediaPipe();

    return () => {
      mounted = false;
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, [isActive, socket, roomCode]);

  // Socket listener for opponent
  const opponentHandRef = useRef({ x: 400, y: 100, swinging: false });
  
  useEffect(() => {
    if (!socket) return;

    socket.on('opponent-tennis-hand-move', (data: { x: number, y: number, swinging: boolean }) => {
      opponentHandRef.current = data;
    });

    socket.on('opponent-tennis-scored', (data: { score: number }) => {
      setOpponentScore(data.score);
    });

    return () => {
      socket.off('opponent-tennis-hand-move');
      socket.off('opponent-tennis-scored');
    };
  }, [socket]);

  const serveBall = () => {
    ballRef.current = {
      x: CANVAS_WIDTH / 2,
      y: isPlayerServing ? CANVAS_HEIGHT - 100 : 100,
      z: isPlayerServing ? 0.9 : 0.1,
      vx: (Math.random() - 0.5) * 2,
      vy: isPlayerServing ? -6 : 6,
      vz: isPlayerServing ? -0.015 : 0.015,
      radius: 15
    };
    setGamePhase('playing');
  };

  const checkHit = (handX: number, handY: number, isPlayer: boolean, swinging: boolean) => {
    const ball = ballRef.current;
    
    // Check if ball is in player's court
    const inPlayerCourt = isPlayer ? ball.z > 0.5 : ball.z < 0.5;
    if (!inPlayerCourt) return false;

    // Check if hand is near ball (with depth consideration)
    const distance = Math.sqrt(
      Math.pow(ball.x - handX, 2) + 
      Math.pow(ball.y - handY, 2)
    );

    const hitRadius = 60 + (swinging ? 30 : 0); // Larger radius when swinging
    
    if (distance < hitRadius) {
      // Hit the ball!
      const angle = Math.atan2(handY - ball.y, handX - ball.x);
      const power = swinging ? 8 : 5;
      
      ball.vx = -Math.cos(angle) * power;
      ball.vy = -Math.sin(angle) * power * 0.7;
      ball.vz = isPlayer ? -0.02 : 0.02;
      
      return true;
    }
    
    return false;
  };

  const checkScore = () => {
    const ball = ballRef.current;
    
    // Ball went out of bounds (player side)
    if (ball.z >= 1) {
      const newOpponentScore = opponentScore + 1;
      setOpponentScore(newOpponentScore);
      socket?.emit('tennis-scored', { roomCode, score: newOpponentScore });
      
      if (newOpponentScore >= MAX_SCORE) {
        setGamePhase('finished');
        setTimeout(() => onGameEnd('opponent', playerScore, newOpponentScore), 2000);
      } else {
        setGamePhase('scored');
        setIsPlayerServing(false);
        setTimeout(() => {
          setGamePhase('serving');
          serveBall();
        }, 1500);
      }
      return true;
    }
    
    // Ball went out of bounds (opponent side)
    if (ball.z <= 0) {
      const newPlayerScore = playerScore + 1;
      setPlayerScore(newPlayerScore);
      socket?.emit('tennis-scored', { roomCode, score: newPlayerScore });
      
      if (newPlayerScore >= MAX_SCORE) {
        setGamePhase('finished');
        setTimeout(() => onGameEnd('player', newPlayerScore, opponentScore), 2000);
      } else {
        setGamePhase('scored');
        setIsPlayerServing(true);
        setTimeout(() => {
          setGamePhase('serving');
          serveBall();
        }, 1500);
      }
      return true;
    }
    
    return false;
  };

  // Game loop
  useEffect(() => {
    if (!gameStarted || !gameCanvasRef.current || (gamePhase !== 'playing' && gamePhase !== 'serving')) return;

    const canvas = gameCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      const ball = ballRef.current;

      if (gamePhase === 'playing') {
        // Update ball position
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.z += ball.vz;

        // Gravity
        ball.vy += 0.15;

        // Wall collision (left/right)
        if (ball.x - ball.radius < 0 || ball.x + ball.radius > CANVAS_WIDTH) {
          ball.vx *= -0.8;
          ball.x = Math.max(ball.radius, Math.min(CANVAS_WIDTH - ball.radius, ball.x));
        }

        // Ground bounce
        const groundY = CANVAS_HEIGHT * (0.3 + ball.z * 0.5);
        if (ball.y + ball.radius > groundY) {
          ball.y = groundY - ball.radius;
          ball.vy *= -0.7;
          ball.vx *= 0.9;
          
          if (Math.abs(ball.vy) < 1) ball.vy = 0;
        }

        // Check player hit
        checkHit(handPosition.x, handPosition.y, true, isSwinging);
        
        // Check opponent hit
        checkHit(opponentHandRef.current.x, opponentHandRef.current.y, false, opponentHandRef.current.swinging);

        // Check for scoring
        if (checkScore()) {
          return;
        }
      }

      // Clear canvas with gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#4682B4');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw court
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, CANVAS_HEIGHT * 0.6, CANVAS_WIDTH, CANVAS_HEIGHT * 0.4);
      
      // Net
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, CANVAS_HEIGHT / 2 - 30, CANVAS_WIDTH, 5);
      
      // Court lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(50, CANVAS_HEIGHT * 0.65, CANVAS_WIDTH - 100, CANVAS_HEIGHT * 0.3);
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT / 2);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
      ctx.stroke();

      // Draw opponent racket
      const opponentY = 100 + (1 - ball.z) * 200;
      ctx.fillStyle = '#ff444444';
      ctx.beginPath();
      ctx.ellipse(opponentHandRef.current.x, opponentY, 30, 40, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw player racket indicator
      const playerY = CANVAS_HEIGHT - 100 - ball.z * 200;
      ctx.fillStyle = '#44ff4444';
      ctx.beginPath();
      ctx.ellipse(handPosition.x, playerY, 30, 40, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = isSwinging ? 5 : 3;
      ctx.stroke();

      // Draw ball with 3D effect
      const ballScreenY = CANVAS_HEIGHT * (0.3 + ball.z * 0.5) - (CANVAS_HEIGHT - ball.y) * ball.z;
      const ballSize = ball.radius * (0.5 + ball.z * 0.5);
      
      // Shadow
      ctx.fillStyle = '#00000033';
      ctx.beginPath();
      ctx.ellipse(ball.x, CANVAS_HEIGHT * (0.6 + ball.z * 0.2), ballSize * 1.2, ballSize * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Ball
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 15;
      const ballGradient = ctx.createRadialGradient(ball.x - ballSize * 0.3, ballScreenY - ballSize * 0.3, 0, ball.x, ballScreenY, ballSize);
      ballGradient.addColorStop(0, '#ffff00');
      ballGradient.addColorStop(1, '#cccc00');
      ctx.fillStyle = ballGradient;
      ctx.beginPath();
      ctx.arc(ball.x, ballScreenY, ballSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw scores
      ctx.font = 'bold 48px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(`${opponentScore}`, CANVAS_WIDTH / 2, 60);
      ctx.fillText(`${opponentScore}`, CANVAS_WIDTH / 2, 60);
      ctx.strokeText(`${playerScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
      ctx.fillText(`${playerScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameStarted, gamePhase, playerScore, opponentScore, handPosition, isSwinging, socket, roomCode, onGameEnd]);

  useEffect(() => {
    if (gamePhase === 'serving') {
      setGameStarted(true);
    }
  }, [gamePhase]);

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Hand Tracking */}
        <div className="relative bg-slate-800 rounded-2xl overflow-hidden border-2 border-yellow-500">
          <div className="absolute top-2 left-2 z-10 bg-black/70 px-3 py-1 rounded-full text-sm font-bold text-yellow-400">
            🎾 Your Racket
          </div>
          {isSwinging && (
            <div className="absolute top-2 right-2 z-10 bg-green-500/90 px-3 py-2 rounded-full text-lg font-bold animate-pulse">
              SWING! 💥
            </div>
          )}
          <video ref={videoRef} className="hidden" />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="w-full h-auto"
          />
        </div>

        {/* Game Canvas */}
        <div className="relative bg-slate-900 rounded-2xl overflow-hidden border-2 border-green-500">
          <div className="absolute top-2 left-2 right-2 z-10 flex justify-between items-center">
            <div className="bg-red-500/90 px-3 py-1 rounded-full text-sm font-bold">
              Opp: {opponentScore}
            </div>
            <div className="bg-yellow-500/90 px-3 py-1 rounded-full text-sm font-bold">
              🎾 Tennis
            </div>
            <div className="bg-green-500/90 px-3 py-1 rounded-full text-sm font-bold">
              You: {playerScore}
            </div>
          </div>

          {gamePhase === 'countdown' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
              <div className="text-9xl font-bold text-white animate-pulse">
                {countdown}
              </div>
            </div>
          )}

          {gamePhase === 'serving' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
              <div className="text-5xl font-bold text-yellow-400 animate-bounce">
                {isPlayerServing ? 'YOUR SERVE!' : 'OPPONENT SERVES!'}
              </div>
            </div>
          )}

          {gamePhase === 'scored' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
              <div className="text-6xl font-bold text-green-400">
                POINT! 🎾
              </div>
            </div>
          )}

          {gamePhase === 'finished' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
              <div className="text-center">
                <div className="text-8xl mb-4">
                  {playerScore > opponentScore ? '🏆' : '😢'}
                </div>
                <div className="text-5xl font-bold text-white">
                  {playerScore > opponentScore ? 'GAME, SET, MATCH!' : 'NICE TRY!'}
                </div>
                <div className="text-3xl text-slate-300 mt-4">
                  {playerScore} - {opponentScore}
                </div>
              </div>
            </div>
          )}

          <canvas
            ref={gameCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-auto"
          />
        </div>
      </div>

      <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <h3 className="font-bold text-lg mb-2">🎾 How to Play:</h3>
        <ul className="text-sm text-slate-300 space-y-1">
          <li>• <span className="text-yellow-400 font-bold">Move your hand</span> to position your racket</li>
          <li>• <span className="text-green-400 font-bold">Swing down quickly</span> to hit with power! 💥</li>
          <li>• First to <span className="text-blue-400 font-bold">{MAX_SCORE} points</span> wins the match!</li>
          <li>• Ball has physics - aim and time your swings! 🎯</li>
        </ul>
      </div>
    </div>
  );
}

