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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#128C7E]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <MessageCircle className="h-16 w-16 text-[#25D366]" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">SpeakBlur</h1>
          <p className="text-gray-600 mb-4">Connect. Share. Respect.</p>
          <div className="flex justify-center gap-2 text-sm text-[#25D366] mb-4">
            <Users className="h-4 w-4" />
            <span>{onlineUsers} {onlineUsers === 1 ? 'user' : 'users'} online</span>
          </div>
        </div>

        {/* Community Guidelines */}
        <div className="mb-6 bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-[#128C7E]">
            <Shield className="h-5 w-5" />
            <h2 className="font-semibold">Community Guidelines</h2>
          </div>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-[#25D366]" />
              Be respectful and kind to others
            </li>
            <li className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#25D366]" />
              No hate speech or harassment
            </li>
            <li className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#25D366]" />
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#128C7E] focus:border-transparent"
              maxLength={20}
            />
          </div>
          <button
            type="submit"
            disabled={!nickname.trim()}
            className="w-full bg-[#128C7E] text-white py-3 px-4 rounded-xl hover:bg-[#0e6d62] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
}

export default Welcome;