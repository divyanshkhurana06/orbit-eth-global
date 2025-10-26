'use client';

import { useEffect, useRef, useState } from 'react';

interface TableTennisGameProps {
  onGameEnd: (winner: 'player' | 'opponent', playerScore: number, opponentScore: number) => void;
  isActive: boolean;
  socket: any;
  roomCode: string;
  playerName?: string;
  opponentName?: string;
}

export default function TableTennisGame({ 
  onGameEnd, 
  isActive,
  socket,
  roomCode,
  playerName = 'Left Player',
  opponentName = 'Right Player'
}: TableTennisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  // Game refs
  const ballPosRef = useRef({ x: 640, y: 360 });
  const speedRef = useRef({ x: 9.2, y: 9.2 }); // Increased by 15% (8 * 1.15 = 9.2)
  const leftPaddleYRef = useRef(300);
  const rightPaddleYRef = useRef(300);
  const animationFrameRef = useRef<number | null>(null);
  const gameOverRef = useRef(false);
  const scoresRef = useRef({ left: 0, right: 0 });
  
  // MediaPipe
  const handsRef = useRef<any>(null);
  const mediaPipeCameraRef = useRef<any>(null);
  
  // Images
  const imagesRef = useRef<{
    background: HTMLImageElement | null;
    ball: HTMLImageElement | null;
    bat1: HTMLImageElement | null;
    bat2: HTMLImageElement | null;
    gameOver: HTMLImageElement | null;
  }>({
    background: null,
    ball: null,
    bat1: null,
    bat2: null,
    gameOver: null
  });

  const CANVAS_WIDTH = 1280;
  const CANVAS_HEIGHT = 720;
  const WIN_SCORE = 11;

  // Reset ball to center
  const resetBall = () => {
    ballPosRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
    const direction = Math.random() > 0.5 ? 1 : -1;
    speedRef.current = { x: 9.2 * direction, y: 9.2 * (Math.random() > 0.5 ? 1 : -1) }; // Increased by 15%
    console.log(`Ball reset! Speed: x=${speedRef.current.x}, y=${speedRef.current.y}`);
  };

  // Countdown
  useEffect(() => {
    if (!isActive) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setGameStarted(true);
      resetBall();
    }
  }, [countdown, isActive]);

  // Load images
  useEffect(() => {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    Promise.all([
      loadImage('/table-tennis/Background.png'),
      loadImage('/table-tennis/Ball.png'),
      loadImage('/table-tennis/bat1.png'),
      loadImage('/table-tennis/bat2.png'),
      loadImage('/table-tennis/gameOver.png')
    ]).then(([background, ball, bat1, bat2, gameOverImg]) => {
      imagesRef.current = {
        background,
        ball,
        bat1,
        bat2,
        gameOver: gameOverImg
      };
      console.log('✅ All images loaded!');
    }).catch(err => {
      console.error('❌ Failed to load images:', err);
    });
  }, []);

  // Initialize MediaPipe
  useEffect(() => {
    if (!isActive || !videoRef.current || !gameStarted) return;

    let mounted = true;

    const initializeMediaPipe = async () => {
      try {
        const { Hands } = await import('@mediapipe/hands');
        const { Camera } = await import('@mediapipe/camera_utils');

        const hands = new Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7
        });

        hands.onResults((results: any) => {
          if (!mounted) return;

          if (results.multiHandedness && results.multiHandLandmarks) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
              const landmarks = results.multiHandLandmarks[i];
              const handedness = results.multiHandedness[i].label;
              
              const ys = landmarks.map((l: any) => l.y);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);
              const handCenterY = ((minY + maxY) / 2) * CANVAS_HEIGHT;
              const paddleY = Math.max(20, Math.min(415, handCenterY - 40));
              
              if (handedness === 'Left') {
                leftPaddleYRef.current = paddleY;
                socket?.emit('paddle-move', { roomCode, y: paddleY, side: 'left' });
              } else if (handedness === 'Right') {
                rightPaddleYRef.current = paddleY;
                socket?.emit('paddle-move', { roomCode, y: paddleY, side: 'right' });
              }
            }
          }
        });

        handsRef.current = hands;

        if (videoRef.current && mounted) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (mounted && videoRef.current && handsRef.current) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });
          mediaPipeCameraRef.current = camera;
          camera.start();
          console.log('✅ MediaPipe started!');
        }
      } catch (error) {
        console.error('❌ MediaPipe error:', error);
      }
    };

    initializeMediaPipe();

    return () => {
      mounted = false;
      mediaPipeCameraRef.current?.stop();
    };
  }, [isActive, gameStarted, socket, roomCode]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleOpponentPaddle = (data: { y: number, side: string }) => {
      if (data.side === 'left') {
        leftPaddleYRef.current = data.y;
      } else if (data.side === 'right') {
        rightPaddleYRef.current = data.y;
      }
    };

    socket.on('opponent-paddle-move', handleOpponentPaddle);

    return () => {
      socket.off('opponent-paddle-move');
    };
  }, [socket]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const images = imagesRef.current;

    const gameLoop = () => {
      if (!images.background || !images.ball || !images.bat1 || !images.bat2) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Clear and draw background
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.drawImage(images.background, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (!gameOverRef.current) {
        // Ball movement
        ballPosRef.current.x += speedRef.current.x;
        ballPosRef.current.y += speedRef.current.y;

        // Top/bottom bounce
        if (ballPosRef.current.y >= 500 || ballPosRef.current.y <= 10) {
          speedRef.current.y = -speedRef.current.y;
        }

        const bat1X = 59;
        const bat1Y = leftPaddleYRef.current;
        const bat1W = images.bat1.width;
        const bat1H = images.bat1.height;

        const bat2X = 1195;
        const bat2Y = rightPaddleYRef.current;
        const bat2W = images.bat2.width;
        const bat2H = images.bat2.height;

        // Left paddle collision
        if (
          ballPosRef.current.x > bat1X &&
          ballPosRef.current.x < bat1X + bat1W &&
          ballPosRef.current.y > bat1Y &&
          ballPosRef.current.y < bat1Y + bat1H &&
          speedRef.current.x < 0
        ) {
          speedRef.current.x = -speedRef.current.x;
          ballPosRef.current.x = bat1X + bat1W + 5;
        }

        // Right paddle collision
        if (
          ballPosRef.current.x > bat2X - 50 &&
          ballPosRef.current.x < bat2X &&
          ballPosRef.current.y > bat2Y &&
          ballPosRef.current.y < bat2Y + bat2H &&
          speedRef.current.x > 0
        ) {
          speedRef.current.x = -speedRef.current.x;
          ballPosRef.current.x = bat2X - 50 - 5;
        }

        // Scoring
        if (ballPosRef.current.x < 40) {
          // Right scores
          scoresRef.current.right += 1;
          setOpponentScore(scoresRef.current.right);
          
          const leftScore = scoresRef.current.left;
          const rightScore = scoresRef.current.right;
          
          if ((leftScore >= WIN_SCORE || rightScore >= WIN_SCORE) && Math.abs(leftScore - rightScore) >= 2) {
            gameOverRef.current = true;
            setGameOver(true);
            setTimeout(() => onGameEnd(leftScore > rightScore ? 'player' : 'opponent', leftScore, rightScore), 3000);
          } else {
            resetBall();
          }
        } else if (ballPosRef.current.x > 1200) {
          // Left scores
          scoresRef.current.left += 1;
          setPlayerScore(scoresRef.current.left);
          
          const leftScore = scoresRef.current.left;
          const rightScore = scoresRef.current.right;
          
          if ((leftScore >= WIN_SCORE || rightScore >= WIN_SCORE) && Math.abs(leftScore - rightScore) >= 2) {
            gameOverRef.current = true;
            setGameOver(true);
            setTimeout(() => onGameEnd(leftScore > rightScore ? 'player' : 'opponent', leftScore, rightScore), 3000);
          } else {
            resetBall();
          }
        }

        // Draw everything
        ctx.drawImage(images.bat1, bat1X, bat1Y);
        ctx.drawImage(images.bat2, bat2X, bat2Y);
        ctx.drawImage(images.ball, ballPosRef.current.x, ballPosRef.current.y);

        // Draw scores
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 60px Arial';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 10;
        ctx.fillText(scoresRef.current.left.toString(), 300, 650);
        ctx.fillText(scoresRef.current.right.toString(), 900, 650);
        ctx.shadowBlur = 0;
      } else {
        // Game over
        ctx.drawImage(images.gameOver!, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const totalScore = scoresRef.current.left + scoresRef.current.right;
        ctx.fillStyle = '#C800C8';
        ctx.font = 'bold 80px Arial';
        ctx.fillText(totalScore.toString().padStart(2, '0'), 585, 360);
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameStarted, onGameEnd]);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 rounded-2xl">
      {/* Score */}
      <div className="w-full mb-4 flex justify-between items-center bg-black/50 rounded-xl p-4 backdrop-blur">
        <div className="text-center flex-1">
          <div className="text-sm text-green-400">{playerName}</div>
          <div className="text-4xl font-bold">{playerScore}</div>
        </div>
        <div className="text-center flex-1">
          <div className="text-xl font-bold text-yellow-400">🏓 TABLE TENNIS</div>
          <div className="text-sm text-slate-300">
            {playerScore >= 10 && opponentScore >= 10 && Math.abs(playerScore - opponentScore) < 2
              ? '🔥 DEUCE! Win by 2!'
              : `First to ${WIN_SCORE} (win by 2)`
            }
          </div>
        </div>
        <div className="text-center flex-1">
          <div className="text-sm text-red-400">{opponentName}</div>
          <div className="text-4xl font-bold">{opponentScore}</div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative flex-1 flex items-center justify-center">
        <div className="relative">
          <canvas 
            ref={canvasRef} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT}
            className="border-4 border-white/20 rounded-xl shadow-2xl"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          
          <video ref={videoRef} autoPlay playsInline muted className="hidden" width={640} height={480} />

          {/* Countdown */}
          {countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl">
              <div className="text-9xl font-bold animate-pulse">{countdown}</div>
            </div>
          )}

          {/* Game Over */}
          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl">
              <div className="text-6xl font-bold mb-6 animate-pulse">
                🎉 {playerScore > opponentScore ? playerName : opponentName} WINS! 🎉
              </div>
              <div className="text-5xl font-bold text-yellow-400 mb-4">
                {playerScore} - {opponentScore}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      {gameStarted && !gameOver && (
        <div className="mt-4 text-center bg-black/50 rounded-xl p-3 backdrop-blur">
          <div className="text-lg text-yellow-400 font-semibold">
            ✋ Move LEFT HAND = GREEN paddle | Move RIGHT HAND = RED paddle
          </div>
          <div className="text-sm text-slate-400 mt-2">
            Don't let the ball pass! First to {WIN_SCORE} wins (win by 2)
          </div>
        </div>
      )}
    </div>
  );
}
