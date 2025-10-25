'use client';

import { useEffect, useRef, useState } from 'react';

interface HandRaiseGameProps {
  onGameEnd: (winner: 'player' | 'opponent') => void;
  isActive: boolean;
}

export default function HandRaiseGame({ onGameEnd, isActive }: HandRaiseGameProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [handRaised, setHandRaised] = useState(false);
  const [gameStatus, setGameStatus] = useState<'ready' | 'waiting' | 'raised' | 'winner' | 'loser'>('ready');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (!isActive || !videoRef.current || !canvasRef.current) return;

    let mounted = true;

    const initializeMediaPipe = async () => {
      try {
        // Dynamically import MediaPipe (client-side only)
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
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
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

          // Check if hand is raised (detecting hand above certain y-position)
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            const wrist = landmarks[0];
            const middleFinger = landmarks[12];

            // Draw hand landmarks
            for (const landmark of landmarks) {
              canvasCtx.beginPath();
              canvasCtx.arc(
                landmark.x * canvasRef.current.width,
                landmark.y * canvasRef.current.height,
                5,
                0,
                2 * Math.PI
              );
              canvasCtx.fillStyle = '#00FF00';
              canvasCtx.fill();
            }

            // Check if hand is raised (middle finger above wrist significantly)
            const isRaised = middleFinger.y < wrist.y - 0.2;

            if (isRaised && gameStatus === 'waiting' && !handRaised) {
              setHandRaised(true);
              setGameStatus('raised');
              
              if (startTimeRef.current) {
                const reactionMs = Date.now() - startTimeRef.current;
                setReactionTime(reactionMs);
                
                // Simulate opponent reaction time (random between 300-800ms)
                const opponentTime = Math.random() * 500 + 300;
                
                setTimeout(() => {
                  if (reactionMs < opponentTime) {
                    setGameStatus('winner');
                    setTimeout(() => onGameEnd('player'), 2000);
                  } else {
                    setGameStatus('loser');
                    setTimeout(() => onGameEnd('opponent'), 2000);
                  }
                }, 1000);
              }
            }
          }

          canvasCtx.restore();
        });

        handsRef.current = hands;

        // Initialize camera
        if (videoRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && handsRef.current) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });

          cameraRef.current = camera;
          await camera.start();
        }
      } catch (error) {
        console.error('Error initializing MediaPipe:', error);
      }
    };

    initializeMediaPipe();

    return () => {
      mounted = false;
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    // Start countdown
    let count = 3;
    setCountdown(count);
    setGameStatus('ready');
    setHandRaised(false);
    setReactionTime(null);

    const countdownInterval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        setCountdown(null);
        clearInterval(countdownInterval);
        
        // Random delay before "GO!"
        const randomDelay = Math.random() * 2000 + 1000;
        setTimeout(() => {
          setGameStatus('waiting');
          startTimeRef.current = Date.now();
        }, randomDelay);
      }
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [isActive]);

  return (
    <div className="relative">
      <div className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">✋ Hand Raise Challenge</h2>
          <div className="text-sm text-gray-400">
            Raise your hand as fast as you can!
          </div>
        </div>

        <div className="relative">
          {/* Video and Canvas */}
          <video
            ref={videoRef}
            className="hidden"
            playsInline
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="w-full rounded-lg border-2 border-purple-500/30"
          />

          {/* Overlay Messages */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {countdown !== null && (
              <div className="text-9xl font-bold text-white animate-pulse">
                {countdown}
              </div>
            )}

            {gameStatus === 'ready' && countdown === null && (
              <div className="text-6xl font-bold text-yellow-400 animate-pulse">
                Get Ready...
              </div>
            )}

            {gameStatus === 'waiting' && (
              <div className="text-6xl font-bold text-green-400 animate-bounce">
                RAISE YOUR HAND! ✋
              </div>
            )}

            {gameStatus === 'raised' && reactionTime && (
              <div className="text-4xl font-bold text-blue-400">
                {reactionTime}ms
              </div>
            )}

            {gameStatus === 'winner' && (
              <div className="text-6xl font-bold text-green-400">
                🎉 YOU WIN! 🎉
              </div>
            )}

            {gameStatus === 'loser' && (
              <div className="text-6xl font-bold text-red-400">
                😢 TOO SLOW!
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-4 bg-purple-900/30 rounded-lg">
          <h3 className="font-bold mb-2">How to Play:</h3>
          <ol className="text-sm text-gray-300 space-y-1">
            <li>1. Wait for the countdown</li>
            <li>2. When you see "RAISE YOUR HAND", raise it as fast as possible!</li>
            <li>3. Fastest player wins the round</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

