'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoChatProps {
  roomCode: string;
  username: string;
  showOnlyLocal?: boolean;
  showOnlyRemote?: boolean;
}

export default function VideoChat({ roomCode, username, showOnlyLocal, showOnlyRemote }: VideoChatProps) {
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

  // Show only local video (for left column)
  if (showOnlyLocal) {
    return (
      <div className="relative w-full aspect-[3/4]">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {isVideoOff && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-6xl">📷</div>
          </div>
        )}
        <div className="absolute bottom-2 left-2 right-2 flex gap-2 justify-center">
          <button
            onClick={toggleMute}
            className={`p-2 rounded-full transition ${
              isMuted ? 'bg-red-600' : 'bg-black/70 hover:bg-black/90'
            }`}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={toggleVideo}
            className={`p-2 rounded-full transition ${
              isVideoOff ? 'bg-red-600' : 'bg-black/70 hover:bg-black/90'
            }`}
          >
            {isVideoOff ? '📷' : '📹'}
          </button>
        </div>
      </div>
    );
  }

  // Show only remote video (for right column)
  if (showOnlyRemote) {
    return (
      <div className="relative w-full aspect-[3/4]">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center">
              <div className="text-4xl mb-2 animate-pulse">⏳</div>
              <div className="text-xs text-slate-400">Connecting...</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default: Show both videos side by side (for lobby/waiting room)
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <h3 className="text-lg font-semibold mb-4">Video Chat</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Local Video */}
        <div className="relative">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg bg-slate-900 aspect-video object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
            {username} (You)
          </div>
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={toggleMute}
              className="bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-70 transition"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={toggleVideo}
              className="bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-70 transition"
            >
              {isVideoOff ? '📹' : '📷'}
            </button>
          </div>
        </div>

        {/* Remote Video */}
        <div className="relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg bg-slate-900 aspect-video object-cover"
          />
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 rounded-lg">
              <p className="text-slate-400">Waiting for opponent...</p>
            </div>
          )}
          {isConnected && (
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
              Opponent
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
