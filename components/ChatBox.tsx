'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

interface ChatBoxProps {
  socket: any;
  roomCode: string;
  username: string;
}

const EMOJIS = ['👍', '👎', '😂', '😎', '🔥', '❤️', '🎉', '😢', '😡', '👏', '🙏', '💪'];

export default function ChatBox({ socket, roomCode, username }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data: Message) => {
      setMessages(prev => [...prev, data]);
    };

    socket.on('chat-message', handleChatMessage);

    return () => {
      socket.off('chat-message');
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!inputText.trim() || !socket) return;

    const message: Message = {
      id: Date.now().toString(),
      username,
      text: inputText,
      timestamp: Date.now()
    };

    socket.emit('chat-message', { roomCode, message });
    setMessages(prev => [...prev, message]);
    setInputText('');
  };

  const sendEmoji = (emoji: string) => {
    if (!socket) return;

    const message: Message = {
      id: Date.now().toString(),
      username,
      text: emoji,
      timestamp: Date.now()
    };

    socket.emit('chat-message', { roomCode, message });
    setMessages(prev => [...prev, message]);
    setShowEmojiPicker(false);
  };

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur rounded-lg border border-slate-700 flex flex-col" style={{ height: '200px' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.username === username ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs rounded-lg px-3 py-2 ${
              msg.username === username 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-100'
            }`}>
              <div className="text-xs opacity-70 mb-1">{msg.username}</div>
              <div className="text-sm">{msg.text}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-700 p-2 flex gap-2">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
        >
          😊
        </button>
        
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
        />
        
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
        >
          Send
        </button>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-2 bg-slate-800 border border-slate-600 rounded-lg p-2 grid grid-cols-6 gap-2 shadow-xl">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendEmoji(emoji)}
              className="text-2xl hover:bg-slate-700 rounded p-1 transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

