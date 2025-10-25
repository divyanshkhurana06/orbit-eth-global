'use client';

import { useEffect, useRef, useState } from 'react';

interface RockPaperScissorsGameProps {
  onGameEnd: (winner: 'player' | 'opponent' | 'tie', playerChoice: string, opponentChoice: string) => void;
  isActive: boolean;
  socket: any;
  roomCode: string;
}

type Choice = 'rock' | 'paper' | 'scissors' | null;

export default function RockPaperScissorsGame({ 
  onGameEnd, 
  isActive,
  socket,
  roomCode 
}: RockPaperScissorsGameProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const [playerChoice, setPlayerChoice] = useState<Choice>(null);
  const [opponentChoice, setOpponentChoice] = useState<Choice>(null);
  const [gamePhase, setGamePhase] = useState<'countdown' | 'choosing' | 'result'>('countdown');
  const [detectedGesture, setDetectedGesture] = useState<string>('Show your hand');
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  // Countdown timer
  useEffect(() => {
    if (!isActive || gamePhase !== 'countdown') return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setGamePhase('choosing');
    }
  }, [countdown, isActive, gamePhase]);

  // Initialize MediaPipe
  useEffect(() => {
    if (!isActive || !videoRef.current || !canvasRef.current || gamePhase !== 'choosing') return;

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

            // Detect gesture
            const gesture = detectGesture(landmarks);
            setDetectedGesture(gesture);
            
            if (!playerChoice && gesture !== 'unknown') {
              setPlayerChoice(gesture as Choice);
              socket?.emit('rps-choice', { roomCode, choice: gesture });
            }
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
  }, [isActive, gamePhase, playerChoice, socket, roomCode]);

  // Socket listener for opponent choice
  useEffect(() => {
    if (!socket) return;

    socket.on('rps-opponent-choice', (data: { choice: string }) => {
      setOpponentChoice(data.choice as Choice);
    });

    return () => {
      socket.off('rps-opponent-choice');
    };
  }, [socket]);

  // Determine winner when both choices are in
  useEffect(() => {
    if (playerChoice && opponentChoice && gamePhase === 'choosing') {
      setGamePhase('result');
      
      setTimeout(() => {
        const winner = determineWinner(playerChoice, opponentChoice);
        onGameEnd(winner, playerChoice, opponentChoice);
      }, 2000);
    }
  }, [playerChoice, opponentChoice, gamePhase, onGameEnd]);

  const detectGesture = (landmarks: any[]): string => {
    // Finger tips: thumb(4), index(8), middle(12), ring(16), pinky(20)
    // Finger bases: thumb(3), index(6), middle(10), ring(14), pinky(18)
    
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    
    const indexBase = landmarks[6];
    const middleBase = landmarks[10];
    const ringBase = landmarks[14];
    const pinkyBase = landmarks[18];

    // Count extended fingers
    const indexExtended = indexTip.y < indexBase.y;
    const middleExtended = middleTip.y < middleBase.y;
    const ringExtended = ringTip.y < ringBase.y;
    const pinkyExtended = pinkyTip.y < pinkyBase.y;

    const extendedFingers = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

    // Rock: closed fist (0-1 fingers extended)
    if (extendedFingers <= 1) {
      return 'rock';
    }
    
    // Scissors: 2 fingers extended (index and middle)
    if (extendedFingers === 2 && indexExtended && middleExtended) {
      return 'scissors';
    }
    
    // Paper: all or most fingers extended
    if (extendedFingers >= 3) {
      return 'paper';
    }

    return 'unknown';
  };

  const determineWinner = (player: Choice, opponent: Choice): 'player' | 'opponent' | 'tie' => {
    if (player === opponent) return 'tie';
    
    if (
      (player === 'rock' && opponent === 'scissors') ||
      (player === 'scissors' && opponent === 'paper') ||
      (player === 'paper' && opponent === 'rock')
    ) {
      return 'player';
    }
    
    return 'opponent';
  };

  const getChoiceEmoji = (choice: Choice) => {
    if (!choice) return '❓';
    if (choice === 'rock') return '✊';
    if (choice === 'paper') return '✋';
    if (choice === 'scissors') return '✌️';
    return '❓';
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Countdown Phase */}
      {gamePhase === 'countdown' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/95 rounded-2xl">
          <div className="text-center">
            <div className="text-8xl font-bold text-blue-400 mb-4 animate-pulse">
              {countdown}
            </div>
            <p className="text-2xl text-slate-300">Get ready...</p>
          </div>
        </div>
      )}

      {/* Result Phase */}
      {gamePhase === 'result' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/95 rounded-2xl">
          <div className="text-center">
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-7xl mb-2">{getChoiceEmoji(playerChoice)}</div>
                <p className="text-xl text-slate-300">You</p>
              </div>
              <div className="text-5xl text-slate-500">VS</div>
              <div className="text-center">
                <div className="text-7xl mb-2">{getChoiceEmoji(opponentChoice)}</div>
                <p className="text-xl text-slate-300">Opponent</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-400">
              {determineWinner(playerChoice!, opponentChoice!) === 'tie' ? "It's a Tie!" : 
               determineWinner(playerChoice!, opponentChoice!) === 'player' ? 'You Win!' : 'You Lose!'}
            </div>
          </div>
        </div>
      )}

      {/* Game Canvas */}
      <div className="relative bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-700">
        <video
          ref={videoRef}
          className="hidden"
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="w-full h-auto"
        />
        
        {/* Status Overlay */}
        {gamePhase === 'choosing' && (
          <div className="absolute top-4 left-4 right-4">
            <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-bold">
                  {playerChoice ? (
                    <span className="text-green-400">Choice Locked: {getChoiceEmoji(playerChoice)}</span>
                  ) : (
                    <span className="text-yellow-400">Make your choice!</span>
                  )}
                </div>
              </div>
              <div className="text-sm text-slate-400">
                Detected: <span className="text-white font-semibold">{detectedGesture}</span>
              </div>
              <div className="flex gap-4 mt-3 text-2xl">
                <div className="flex-1 text-center p-2 bg-slate-800 rounded">✊ Rock</div>
                <div className="flex-1 text-center p-2 bg-slate-800 rounded">✋ Paper</div>
                <div className="flex-1 text-center p-2 bg-slate-800 rounded">✌️ Scissors</div>
              </div>
            </div>
          </div>
        )}

        {/* Waiting for opponent */}
        {playerChoice && !opponentChoice && gamePhase === 'choosing' && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-blue-600/90 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-lg font-bold">Waiting for opponent...</p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-slate-400">
        Show your hand gesture to the camera: ✊ Rock (fist), ✋ Paper (open hand), ✌️ Scissors (two fingers)
      </div>
    </div>
  );
}

