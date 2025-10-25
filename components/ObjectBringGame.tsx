'use client';

import { useEffect, useRef, useState } from 'react';

interface ObjectBringGameProps {
  onGameEnd: (winner: 'player' | 'opponent', myTime: number, opponentTime: number) => void;
  isActive: boolean;
  targetItem: string;
  socket: any;
  roomCode: string;
}

// Common household items detectable by COCO-SSD
const DETECTABLE_ITEMS = [
  'cell phone',
  'cup',
  'fork',
  'knife',
  'spoon',
  'bowl',
  'banana',
  'apple',
  'orange',
  'bottle',
  'wine glass',
  'mouse',
  'keyboard',
  'remote',
  'book',
  'clock',
  'scissors',
  'toothbrush',
  'chair',
  'laptop',
  'teddy bear',
  'vase',
  'umbrella',
  'backpack',
  'handbag'
];

export { DETECTABLE_ITEMS };

export default function ObjectBringGame({ 
  onGameEnd, 
  isActive, 
  targetItem,
  socket,
  roomCode 
}: ObjectBringGameProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const [objectFound, setObjectFound] = useState(false);
  const [gameStatus, setGameStatus] = useState<'countdown' | 'searching' | 'found' | 'result'>('countdown');
  const [myTime, setMyTime] = useState<number | null>(null);
  const [opponentTime, setOpponentTime] = useState<number | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const modelRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (!isActive || !videoRef.current || !canvasRef.current) return;

    let mounted = true;

    const initializeCamera = async () => {
      try {
        // Get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Dynamically import TensorFlow (client-side only)
        const tf = await import('@tensorflow/tfjs');
        const cocoSsd = await import('@tensorflow-models/coco-ssd');
        
        // Load COCO-SSD model
        const model = await cocoSsd.load();
        modelRef.current = model;

        console.log('✅ Object detection model loaded');
      } catch (error) {
        console.error('Error initializing camera/model:', error);
      }
    };

    initializeCamera();

    // Listen for opponent finding object
    socket.on('opponent-found-object', (data: { time: number }) => {
      setOpponentTime(data.time);
    });

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isActive, socket]);

  // Countdown logic
  useEffect(() => {
    if (!isActive || gameStatus !== 'countdown') return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setGameStatus('searching');
      startTimeRef.current = Date.now();
      startDetection();
    }
  }, [isActive, gameStatus, countdown]);

  const startDetection = async () => {
    if (!videoRef.current || !canvasRef.current || !modelRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Run detection every 500ms
    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || gameStatus !== 'searching') {
        clearInterval(detectionIntervalRef.current);
        return;
      }

      try {
        // Detect objects
        const predictions = await modelRef.current.detect(videoRef.current);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw video
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Check if target item is detected
        const targetFound = predictions.find((pred: any) => {
          const normalizedClass = pred.class.toLowerCase();
          const normalizedTarget = targetItem.toLowerCase();
          return normalizedClass.includes(normalizedTarget) || 
                 normalizedTarget.includes(normalizedClass);
        });

        // Draw all detections
        predictions.forEach((prediction: any) => {
          const [x, y, width, height] = prediction.bbox;
          const isTarget = prediction.class.toLowerCase().includes(targetItem.toLowerCase());

          // Draw bounding box
          ctx.strokeStyle = isTarget ? '#00FF00' : '#FF0000';
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);

          // Draw label
          ctx.fillStyle = isTarget ? '#00FF00' : '#FF0000';
          ctx.font = '16px Arial';
          ctx.fillText(
            `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
            x,
            y > 10 ? y - 5 : y + 15
          );
        });

        // If target found and haven't registered it yet
        if (targetFound && !objectFound) {
          setObjectFound(true);
          setGameStatus('found');
          
          const foundTime = Date.now() - (startTimeRef.current || 0);
          setMyTime(foundTime);

          // Notify opponent
          socket.emit('found-object', { roomCode, time: foundTime });

          // Clear detection interval
          clearInterval(detectionIntervalRef.current);

          // Wait a bit to see if we won
          setTimeout(() => {
            setGameStatus('result');
            if (opponentTime === null || foundTime < opponentTime) {
              setTimeout(() => onGameEnd('player', foundTime, opponentTime || 999999), 2000);
            } else {
              setTimeout(() => onGameEnd('opponent', foundTime, opponentTime || 0), 2000);
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Detection error:', error);
      }
    }, 500);
  };

  return (
    <div className="relative">
      <div className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">🔍 Bring the Item!</h2>
          <div className="text-sm text-gray-400">
            Find: <span className="text-yellow-400 font-bold text-xl">{targetItem}</span>
          </div>
        </div>

        <div className="relative">
          {/* Video */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="hidden"
          />
          
          {/* Canvas for drawing detections */}
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="w-full rounded-lg border-2 border-purple-500/30"
          />

          {/* Overlay Messages */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {countdown !== null && (
              <div className="text-9xl font-bold text-white animate-pulse drop-shadow-lg">
                {countdown}
              </div>
            )}

            {gameStatus === 'searching' && (
              <div className="text-5xl font-bold text-green-400 animate-bounce bg-black/50 p-6 rounded-lg">
                FIND: {targetItem.toUpperCase()}! 🔍
              </div>
            )}

            {gameStatus === 'found' && myTime && (
              <div className="text-4xl font-bold text-blue-400 bg-black/70 p-6 rounded-lg">
                Found in {(myTime / 1000).toFixed(2)}s! ⏱️
              </div>
            )}

            {gameStatus === 'result' && (
              <div className="text-6xl font-bold text-green-400 bg-black/70 p-8 rounded-lg">
                {myTime && opponentTime && myTime < opponentTime ? '🎉 YOU WIN! 🎉' : '😢 TOO SLOW!'}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-4 bg-purple-900/30 rounded-lg">
          <h3 className="font-bold mb-2">How to Play:</h3>
          <ol className="text-sm text-gray-300 space-y-1">
            <li>1. Wait for countdown</li>
            <li>2. When game starts, go find the item: <span className="text-yellow-400 font-bold">{targetItem}</span></li>
            <li>3. Bring it to the camera quickly!</li>
            <li>4. AI will detect it automatically (green box = found!)</li>
            <li>5. Fastest player wins!</li>
          </ol>
          <div className="mt-3 text-xs text-gray-400">
            💡 Tip: Make sure the item is clearly visible in good lighting
          </div>
        </div>

        {/* Detection Status */}
        <div className="mt-4 flex justify-between text-sm">
          <div>
            <span className="text-gray-400">Your time: </span>
            <span className="font-bold text-green-400">
              {myTime ? `${(myTime / 1000).toFixed(2)}s` : '-'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Opponent: </span>
            <span className="font-bold text-red-400">
              {opponentTime ? `${(opponentTime / 1000).toFixed(2)}s` : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

