'use client';

import { useState } from 'react';

export default function GameUI() {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ user: string; emoji: string; time: number }>>([]);

  const emojis = ['👍', '😂', '🔥', '💪', '😎', '🎉', '😢', '😱'];

  const sendEmoji = (emoji: string) => {
    setSelectedEmoji(emoji);
    setChatMessages([...chatMessages, { user: 'You', emoji, time: Date.now() }]);
    
    // Simulate opponent response
    setTimeout(() => {
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      setChatMessages(prev => [...prev, { user: 'Opponent', emoji: randomEmoji, time: Date.now() }]);
    }, 1000);

    setTimeout(() => setSelectedEmoji(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Emoji Reactions */}
      <div className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
        <h3 className="text-lg font-bold mb-4">💬 Quick Reactions</h3>
        <div className="grid grid-cols-4 gap-3">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendEmoji(emoji)}
              className="text-4xl hover:scale-125 transition transform bg-white/5 hover:bg-white/10 rounded-lg p-3"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Recent Reactions */}
        <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
          {chatMessages.slice(-5).map((msg, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 text-sm ${
                msg.user === 'You' ? 'justify-end' : 'justify-start'
              }`}
            >
              <span className="text-gray-400">{msg.user}:</span>
              <span className="text-2xl">{msg.emoji}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Game Stats */}
      <div className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
        <h3 className="text-lg font-bold mb-4">📊 Match Stats</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Best Reaction</span>
            <span className="font-bold text-green-400">245ms</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Avg Reaction</span>
            <span className="font-bold">312ms</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Win Streak</span>
            <span className="font-bold text-yellow-400">🔥 2</span>
          </div>
        </div>
      </div>

      {/* Floating Emoji */}
      {selectedEmoji && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl animate-bounce pointer-events-none z-50">
          {selectedEmoji}
        </div>
      )}
    </div>
  );
}

