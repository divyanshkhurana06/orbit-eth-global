'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WalletButton from '@/components/WalletButton';
import { useUserStore } from '@/lib/store';
import { friendOperations, userOperations } from '@/lib/supabase';
import type { User } from '@/lib/supabase';
import { MouseMoveEffect } from '@/components/MouseMoveEffect';

export default function Lobby() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useUserStore();
  const [roomCode, setRoomCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendUsername, setFriendUsername] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/auth');
    } else {
      loadFriends();
    }
  }, [isAuthenticated, user, router]);

  const loadFriends = async () => {
    if (!user) return;
    const friendsList = await friendOperations.getFriends(user.id);
    setFriends(friendsList);
  };

  const handleAddFriend = async () => {
    if (!user || !friendUsername) return;
    setIsAddingFriend(true);
    const success = await friendOperations.sendFriendRequest(user.id, friendUsername);
    if (success) {
      alert('Friend request sent!');
      setFriendUsername('');
    } else {
      alert('User not found or request failed');
    }
    setIsAddingFriend(false);
  };

  const handleLogout = async () => {
    if (user) {
      await userOperations.updateUserStatus(user.id, 'offline');
    }
    logout();
    router.push('/');
  };

  if (!user) return null;

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    router.push(`/game?room=${code}&username=${user.username}&host=true`);
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim()) {
      alert('Please enter a room code!');
      return;
    }
    setShowJoinModal(false);
    router.push(`/game?room=${roomCode.toUpperCase()}&username=${user.username}&host=false`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative">
      <MouseMoveEffect />
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="text-3xl">🌐</div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Orbit</h1>
                <p className="text-xs text-slate-400">Competitive Gaming</p>
              </div>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-slate-300 hover:text-white transition">Games</a>
            <a href="#" className="text-slate-300 hover:text-white transition">Tournaments</a>
            <a href="#" className="text-slate-300 hover:text-white transition">Leaderboard</a>
            <a href="#" className="text-slate-300 hover:text-white transition">Stats</a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-sm">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold">{user.username}</span>
            </div>
            <button
              onClick={() => setShowFriendsModal(true)}
              className="px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="hidden md:inline">Friends</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg border border-slate-700 hover:border-red-600 bg-slate-800/50 hover:bg-red-900/20 transition text-sm"
            >
              Logout
            </button>
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 text-transparent bg-clip-text">
            Compete. Win. Earn.
          </h2>
          <p className="text-xl text-slate-400">
            1v1 skill-based games with crypto rewards
          </p>
        </div>

        {/* Main Action Area */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {/* Quick Play Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Quick Match</h3>
              <p className="text-slate-400">Enter your username to start playing</p>
            </div>

            <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xl">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm text-slate-400">Playing as</div>
                  <div className="font-bold text-lg">{user.username}</div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={handleCreateRoom}
                className="px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 font-bold transition transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Room
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-6 py-4 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold transition flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Join Room
              </button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Your Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Matches</span>
                <span className="font-bold">{user.total_matches}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Win Rate</span>
                <span className="font-bold text-green-400">
                  {user.total_matches > 0 ? Math.round((user.wins / user.total_matches) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Earned</span>
                <span className="font-bold text-yellow-400">{user.total_earned} SOL</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">W/L</span>
                <span className="font-bold text-slate-300">{user.wins}/{user.losses}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Modes */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Available Game Modes</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="group bg-slate-800/50 border border-slate-700 hover:border-blue-500 rounded-xl p-6 transition cursor-pointer">
              <div className="text-4xl mb-4 group-hover:scale-110 transition">🔍</div>
              <h4 className="text-xl font-bold mb-2">Object Hunt</h4>
              <p className="text-sm text-slate-400 mb-4">Race to find and show items to your camera</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Easy</span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">2-5 min</span>
              </div>
            </div>

            <div className="group bg-slate-800/30 border border-slate-700 rounded-xl p-6 opacity-60">
              <div className="text-4xl mb-4">⚡</div>
              <h4 className="text-xl font-bold mb-2">Reflex Challenge</h4>
              <p className="text-sm text-slate-400 mb-4">Test your reaction speed</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded-full">Coming Soon</span>
              </div>
            </div>

            <div className="group bg-slate-800/30 border border-slate-700 rounded-xl p-6 opacity-60">
              <div className="text-4xl mb-4">🧠</div>
              <h4 className="text-xl font-bold mb-2">Memory Match</h4>
              <p className="text-sm text-slate-400 mb-4">Remember and match sequences</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded-full">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-4 gap-6 text-center">
          <div className="p-6 bg-slate-800/30 border border-slate-700 rounded-xl">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h4 className="font-bold mb-2">AI Detection</h4>
            <p className="text-sm text-slate-400">Advanced computer vision for fair gameplay</p>
          </div>

          <div className="p-6 bg-slate-800/30 border border-slate-700 rounded-xl">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-bold mb-2">Crypto Rewards</h4>
            <p className="text-sm text-slate-400">Win real SOL in competitive matches</p>
          </div>

          <div className="p-6 bg-slate-800/30 border border-slate-700 rounded-xl">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="font-bold mb-2">Instant Matches</h4>
            <p className="text-sm text-slate-400">Find opponents and play within seconds</p>
          </div>

          <div className="p-6 bg-slate-800/30 border border-slate-700 rounded-xl">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="font-bold mb-2">Secure Escrow</h4>
            <p className="text-sm text-slate-400">On-chain smart contracts ensure fairness</p>
          </div>
        </div>
      </main>

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Join Room</h3>
              <button onClick={() => setShowJoinModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Room Code</label>
              <input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-blue-500 transition font-mono"
                maxLength={6}
              />
            </div>

              <button
                onClick={handleJoinRoom}
                className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 font-bold transition"
              >
                Join Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Friends Modal */}
      {showFriendsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-lg w-full max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Friends</h3>
              <button onClick={() => setShowFriendsModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="Enter username to add friend..."
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-blue-500 transition"
              />
              <button
                onClick={handleAddFriend}
                disabled={!friendUsername || isAddingFriend}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-bold transition"
              >
                Add
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {friends.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p>No friends yet</p>
                  <p className="text-sm">Add friends to play together!</p>
                </div>
              ) : (
                friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold">{friend.username}</div>
                        <div className={`text-xs ${
                          friend.status === 'online' ? 'text-green-400' :
                          friend.status === 'in-game' ? 'text-yellow-400' :
                          'text-slate-500'
                        }`}>
                          {friend.status === 'online' ? '● Online' :
                           friend.status === 'in-game' ? '● In Game' :
                           '○ Offline'}
                        </div>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold transition">
                      Invite
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 p-6 mt-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-slate-400">
          <div>© 2024 Orbit. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
