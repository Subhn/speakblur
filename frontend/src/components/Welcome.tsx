import React, { useState } from 'react';
import { MessageCircle, Shield, Users, Heart } from 'lucide-react';

interface WelcomeProps {
  onLogin: (username: string) => void;
  onlineUsers: number;
}

function Welcome({ onLogin, onlineUsers }: WelcomeProps) {
  const [nickname, setNickname] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      onLogin(nickname.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-pink-50 to-red-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-pink-100">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <MessageCircle className="h-16 w-16 text-pink-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">SpeakBlur</h1>
          <p className="text-gray-600 mb-4">- Anonymous chat app</p>
          <div className="flex justify-center gap-2 text-sm text-rose-500 mb-4">
            <Users className="h-4 w-4" />
            <span>{onlineUsers} {onlineUsers === 1 ? 'user' : 'users'} online</span>
          </div>
        </div>

        {/* Community Guidelines */}
        <div className="mb-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-100">
          <div className="flex items-center gap-2 mb-2 text-rose-600">
            <Shield className="h-5 w-5" />
            <h2 className="font-semibold">Community Guidelines</h2>
          </div>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              Be respectful and kind to others
            </li>
            <li className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-pink-500" />
              No hate speech or harassment
            </li>
            <li className="flex items-center gap-2">
              <Users className="h-4 w-4 text-pink-500" />
              Create a positive environment
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              className="w-full px-4 py-3 bg-pink-50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              maxLength={20}
            />
          </div>
          <button
            type="submit"
            disabled={!nickname.trim()}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 px-4 rounded-xl hover:from-pink-600 hover:to-rose-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
}

export default Welcome;