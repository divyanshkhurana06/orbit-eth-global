'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoChatProps {
  roomCode: string;
  username: string;
}

export default function VideoChat({ roomCode, username }: VideoChatProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Simulate connection after 2 seconds
        setTimeout(() => {
          setIsConnected(true);
          // In a real implementation, this would be the remote peer's stream
          if (remoteVideoRef.current && localStreamRef.current) {
            // For demo purposes, mirror the local stream
            remoteVideoRef.current.srcObject = localStreamRef.current;
          }
        }, 2000);

      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    initializeMedia();

    return () => {
      mounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <div className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30">
      <div className="mb-4">
        <h2 className="text-xl font-bold">🎥 Video Chat</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Local Video */}
        <div className="relative">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full rounded-lg bg-gray-900 border-2 border-green-500/50"
          />
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs">
            You
          </div>
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
              <div className="text-4xl">📷</div>
            </div>
          )}
        </div>

        {/* Remote Video */}
        <div className="relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg bg-gray-900 border-2 border-red-500/50"
          />
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs">
            Opponent
          </div>
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
              <div className="text-center">
                <div className="text-3xl mb-2 animate-pulse">⏳</div>
                <div className="text-xs text-gray-400">Connecting...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={toggleMute}
          className={`px-4 py-2 rounded-lg font-bold transition ${
            isMuted
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>
        <button
          onClick={toggleVideo}
          className={`px-4 py-2 rounded-lg font-bold transition ${
            isVideoOff
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isVideoOff ? '📷' : '📹'}
        </button>
      </div>
    </div>
  );
}

