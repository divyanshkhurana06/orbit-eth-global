'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WalletButton from '@/components/WalletButton';

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = () => {
    if (!username.trim()) {
      alert('Please enter a username!');
      return;
    }
    const code = generateRoomCode();
    router.push(`/game?room=${code}&username=${username}&host=true`);
  };

  const handleJoinRoom = () => {
    if (!username.trim() || !roomCode.trim()) {
      alert('Please enter both username and room code!');
      return;
    }
    router.push(`/game?room=${roomCode.toUpperCase()}&username=${username}&host=false`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      {/* Header */}
      <header className="p-6 border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🕹️</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
              SkillDuels
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-6xl font-bold mb-4">
            Play. Compete. Earn.
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            1v1 camera-based skill games with crypto rewards
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Create Room Card */}
          <div className="bg-gradient-to-br from-purple-800/50 to-pink-800/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 hover:border-purple-500/60 transition">
            <div className="text-5xl mb-4">🎮</div>
            <h3 className="text-2xl font-bold mb-4">Create Room</h3>
            <p className="text-gray-300 mb-6">
              Host a new game and invite your friends to compete
            </p>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-purple-500/30 focus:border-purple-500 outline-none mb-4"
            />
            <button
              onClick={handleCreateRoom}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold text-lg transition transform hover:scale-105"
            >
              Create Game
            </button>
          </div>

          {/* Join Room Card */}
          <div className="bg-gradient-to-br from-blue-800/50 to-cyan-800/50 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/30 hover:border-blue-500/60 transition">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold mb-4">Join Room</h3>
            <p className="text-gray-300 mb-6">
              Enter a room code to join an existing game
            </p>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-blue-500/30 focus:border-blue-500 outline-none mb-4"
            />
            <input
              type="text"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-blue-500/30 focus:border-blue-500 outline-none mb-4"
              maxLength={6}
            />
            <button
              onClick={handleJoinRoom}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 font-bold text-lg transition transform hover:scale-105"
            >
              Join Game
            </button>
          </div>
        </div>

        {/* Game Modes */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-8">Game Modes</h3>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: 'Hand Raise', emoji: '✋', desc: 'React faster!' },
              { name: 'Tennis', emoji: '🎾', desc: 'Swing to win!' },
              { name: 'Table Tennis', emoji: '🏓', desc: 'Fast reflexes!' },
              { name: 'Rock Paper Scissors', emoji: '✊', desc: 'Classic duel!' }
            ].map((game, i) => (
              <div
                key={i}
                className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition text-center"
              >
                <div className="text-4xl mb-3">{game.emoji}</div>
                <h4 className="font-bold mb-2">{game.name}</h4>
                <p className="text-sm text-gray-400">{game.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="p-6">
            <div className="text-3xl mb-3">🎥</div>
            <h4 className="font-bold mb-2">Live Camera</h4>
            <p className="text-sm text-gray-400">AI-powered gesture detection</p>
          </div>
          <div className="p-6">
            <div className="text-3xl mb-3">💰</div>
            <h4 className="font-bold mb-2">Crypto Rewards</h4>
            <p className="text-sm text-gray-400">Wager and win tokens</p>
          </div>
          <div className="p-6">
            <div className="text-3xl mb-3">🎤</div>
            <h4 className="font-bold mb-2">Voice Chat</h4>
            <p className="text-sm text-gray-400">Talk with your opponent</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-500/30 p-6 text-center text-gray-400">
        <p>Built with Next.js, MediaPipe & Web3</p>
      </footer>
    </div>
  );
}
