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
  
  // Game state
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(3);
  const [playerChoice, setPlayerChoice] = useState<Choice>(null);
  const [opponentChoice, setOpponentChoice] = useState<Choice>(null);
  const [gamePhase, setGamePhase] = useState<'countdown' | 'choosing' | 'locked' | 'result' | 'nextround'>('countdown');
  const [detectedGesture, setDetectedGesture] = useState<string>('Show your hand');
  const [roundHistory, setRoundHistory] = useState<Array<{round: number, playerChoice: Choice, opponentChoice: Choice, winner: string}>>([]);
  
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const MAX_ROUNDS = 5;

  // Countdown timer
  useEffect(() => {
    if (!isActive || gamePhase !== 'countdown') return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setGamePhase('choosing');
      setDetectedGesture('Make your choice!');
    }
  }, [countdown, isActive, gamePhase]);

  // Detect gesture
  const detectGesture = (landmarks: any) => {
    if (!landmarks || landmarks.length < 21) return null;

    const fingers = [];
    
    // Thumb
    fingers.push(landmarks[4].x < landmarks[3].x);
    
    // Other fingers
    for (let i = 0; i < 4; i++) {
      const tipY = landmarks[8 + i * 4].y;
      const pipY = landmarks[6 + i * 4].y;
      fingers.push(tipY < pipY);
    }

    const extendedFingers = fingers.filter(f => f).length;

    // Rock: 0-1 fingers
    if (extendedFingers <= 1) return 'rock';
    
    // Scissors: 2-3 fingers
    if (extendedFingers >= 2 && extendedFingers <= 3) {
      const indexUp = landmarks[8].y < landmarks[6].y;
      const middleUp = landmarks[12].y < landmarks[10].y;
      if (indexUp && middleUp) return 'scissors';
    }
    
    // Paper: 4-5 fingers
    if (extendedFingers >= 4) return 'paper';

    return null;
  };

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
          minDetectionConfidence: 0.75,
          minTrackingConfidence: 0.75
        });

        hands.onResults((results: any) => {
          if (!mounted || !canvasRef.current) return;

          const canvasCtx = canvasRef.current.getContext('2d');
          if (!canvasCtx) return;

          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // Draw video
          if (results.image) {
            canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
          }

          // Draw hand landmarks
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // Draw connections
            canvasCtx.strokeStyle = '#00FF00';
            canvasCtx.lineWidth = 3;
            const connections = [
              [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
              [0, 5], [5, 6], [6, 7], [7, 8], // Index
              [0, 9], [9, 10], [10, 11], [11, 12], // Middle
              [0, 13], [13, 14], [14, 15], [15, 16], // Ring
              [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
              [5, 9], [9, 13], [13, 17] // Palm
            ];
            
            connections.forEach(([start, end]) => {
              const startPoint = landmarks[start];
              const endPoint = landmarks[end];
              canvasCtx.beginPath();
              canvasCtx.moveTo(startPoint.x * canvasRef.current!.width, startPoint.y * canvasRef.current!.height);
              canvasCtx.lineTo(endPoint.x * canvasRef.current!.width, endPoint.y * canvasRef.current!.height);
              canvasCtx.stroke();
            });

            // Draw landmarks
            landmarks.forEach((landmark: any, index: number) => {
              const x = landmark.x * canvasRef.current!.width;
              const y = landmark.y * canvasRef.current!.height;
              
              canvasCtx.beginPath();
              canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
              canvasCtx.fillStyle = index === 0 || index === 4 || index === 8 || index === 12 || index === 16 || index === 20 ? '#FF0000' : '#00FF00';
              canvasCtx.fill();
            });

            // Detect gesture
            const gesture = detectGesture(landmarks);
            if (gesture && !playerChoice) {
              setDetectedGesture(`${gesture.toUpperCase()} detected - Hold to lock!`);
              
              // Auto-lock after holding for 1 second (simplified - lock immediately for now)
              if (!playerChoice && gamePhase === 'choosing') {
                setPlayerChoice(gesture);
                setGamePhase('locked');
                setDetectedGesture(`Locked: ${gesture.toUpperCase()}`);
                socket.emit('rps-choice', { roomCode, choice: gesture });
              }
            }
          } else {
            setDetectedGesture('Show your hand to the camera');
          }

          canvasCtx.restore();
        });

        handsRef.current = hands;

        if (videoRef.current && mounted) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (mounted && videoRef.current && handsRef.current) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: 1280,
            height: 720
          });

          cameraRef.current = camera;
          camera.start();
        }
      } catch (error) {
        console.error('MediaPipe initialization error:', error);
        setDetectedGesture('Error loading hand detection');
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

  // Listen for opponent choice
  useEffect(() => {
    if (!socket) return;

    const handleOpponentChoice = (data: { choice: Choice }) => {
      console.log('Opponent chose:', data.choice);
      setOpponentChoice(data.choice);
    };

    socket.on('rps-opponent-choice', handleOpponentChoice);

    return () => {
      socket.off('rps-opponent-choice', handleOpponentChoice);
    };
  }, [socket]);

  // Determine round winner when both choices are in
  useEffect(() => {
    if (!playerChoice || !opponentChoice || gamePhase !== 'locked') return;

    // Determine winner
    let roundWinner: string;
    if (playerChoice === opponentChoice) {
      roundWinner = 'tie';
    } else if (
      (playerChoice === 'rock' && opponentChoice === 'scissors') ||
      (playerChoice === 'paper' && opponentChoice === 'rock') ||
      (playerChoice === 'scissors' && opponentChoice === 'paper')
    ) {
      roundWinner = 'player';
      setPlayerScore(s => s + 1);
    } else {
      roundWinner = 'opponent';
      setOpponentScore(s => s + 1);
    }

    setRoundHistory(h => [...h, { round: currentRound, playerChoice, opponentChoice, winner: roundWinner }]);
    setGamePhase('result');

    // Show result for 3 seconds
    setTimeout(() => {
      const newPlayerScore = roundWinner === 'player' ? playerScore + 1 : playerScore;
      const newOpponentScore = roundWinner === 'opponent' ? opponentScore + 1 : opponentScore;

      // Check if game is over
      if (currentRound >= MAX_ROUNDS || newPlayerScore > MAX_ROUNDS / 2 || newOpponentScore > MAX_ROUNDS / 2) {
        // Game over
        const finalWinner = newPlayerScore > newOpponentScore ? 'player' : newOpponentScore > newPlayerScore ? 'opponent' : 'tie';
        onGameEnd(finalWinner, playerChoice, opponentChoice);
      } else {
        // Next round
        setGamePhase('nextround');
        setTimeout(() => {
          setCurrentRound(r => r + 1);
          setPlayerChoice(null);
          setOpponentChoice(null);
          setCountdown(3);
          setGamePhase('countdown');
        }, 2000);
      }
    }, 3000);
  }, [playerChoice, opponentChoice, gamePhase]);

  const getChoiceEmoji = (choice: Choice) => {
    if (!choice) return '❓';
    if (choice === 'rock') return '✊';
    if (choice === 'paper') return '✋';
    if (choice === 'scissors') return '✌️';
    return '❓';
  };

  const getWinnerText = () => {
    if (!playerChoice || !opponentChoice) return '';
    if (playerChoice === opponentChoice) return "It's a TIE!";
    
    const playerWins = 
      (playerChoice === 'rock' && opponentChoice === 'scissors') ||
      (playerChoice === 'paper' && opponentChoice === 'rock') ||
      (playerChoice === 'scissors' && opponentChoice === 'paper');
    
    return playerWins ? 'YOU WIN THIS ROUND!' : 'OPPONENT WINS THIS ROUND!';
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-slate-900 to-blue-900 rounded-2xl p-6">
      {/* Score Board */}
      <div className="w-full max-w-6xl mb-4 bg-black/40 rounded-xl p-4 backdrop-blur">
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <div className="text-sm text-slate-400">YOU</div>
            <div className="text-5xl font-bold text-green-400">{playerScore}</div>
          </div>
          
          <div className="text-center flex-1">
            <div className="text-sm text-slate-400">ROUND</div>
            <div className="text-3xl font-bold">{currentRound} / {MAX_ROUNDS}</div>
            <div className="text-xs text-slate-500 mt-1">Best of {MAX_ROUNDS}</div>
          </div>
          
          <div className="text-center flex-1">
            <div className="text-sm text-slate-400">OPPONENT</div>
            <div className="text-5xl font-bold text-red-400">{opponentScore}</div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="w-full max-w-6xl flex gap-4">
        {/* Your Camera */}
        <div className="flex-1 relative">
          <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover opacity-0"
              autoPlay
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Phase indicator */}
              {gamePhase === 'countdown' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-9xl font-bold animate-pulse">{countdown}</div>
                </div>
              )}
              
              {gamePhase === 'choosing' && (
                <div className="absolute top-4 left-4 right-4 bg-black/70 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-yellow-400">{detectedGesture}</div>
                  <div className="text-sm text-slate-300 mt-1">Show: ✊ Rock | ✋ Paper | ✌️ Scissors</div>
                </div>
              )}
              
              {gamePhase === 'locked' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div>
                    <div className="text-9xl mb-4">{getChoiceEmoji(playerChoice)}</div>
                    <div className="text-3xl font-bold text-green-400">LOCKED!</div>
                    {!opponentChoice && <div className="text-lg text-slate-300 mt-2">Waiting for opponent...</div>}
                  </div>
                </div>
              )}
              
              {gamePhase === 'result' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <div className="text-center">
                    <div className="text-6xl font-bold mb-4">{getWinnerText()}</div>
                    <div className="flex gap-8 justify-center text-8xl">
                      <div>
                        <div>{getChoiceEmoji(playerChoice)}</div>
                        <div className="text-sm text-slate-300 mt-2">You</div>
                      </div>
                      <div className="text-4xl self-center">VS</div>
                      <div>
                        <div>{getChoiceEmoji(opponentChoice)}</div>
                        <div className="text-sm text-slate-300 mt-2">Opponent</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {gamePhase === 'nextround' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-4xl font-bold animate-pulse">Next Round...</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Your Choice Display */}
          <div className="mt-2 text-center">
            <div className="text-6xl">{getChoiceEmoji(playerChoice)}</div>
            <div className="text-sm text-slate-400">Your Choice</div>
          </div>
        </div>

        {/* Opponent Side */}
        <div className="flex-1">
          <div className="bg-gradient-to-br from-red-900/30 to-purple-900/30 rounded-xl p-8 h-full flex flex-col items-center justify-center border-2 border-red-500/30">
            <div className="text-9xl mb-4">
              {gamePhase === 'locked' || gamePhase === 'result' ? getChoiceEmoji(opponentChoice) : '❓'}
            </div>
            <div className="text-2xl font-bold text-slate-300">
              {!opponentChoice && (gamePhase === 'locked' || gamePhase === 'choosing') ? 'Opponent is choosing...' : 'Opponent'}
            </div>
          </div>
        </div>
      </div>

      {/* Round History */}
      {roundHistory.length > 0 && (
        <div className="w-full max-w-6xl mt-4 bg-black/40 rounded-xl p-4 backdrop-blur">
          <div className="text-sm text-slate-400 mb-2">Round History</div>
          <div className="flex gap-2">
            {roundHistory.map((round, i) => (
              <div key={i} className={`px-3 py-2 rounded-lg ${
                round.winner === 'player' ? 'bg-green-500/30 border border-green-500' : 
                round.winner === 'opponent' ? 'bg-red-500/30 border border-red-500' : 
                'bg-slate-500/30 border border-slate-500'
              }`}>
                <div className="text-xs text-slate-300">R{round.round}</div>
                <div className="text-lg">
                  {getChoiceEmoji(round.playerChoice)} vs {getChoiceEmoji(round.opponentChoice)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
