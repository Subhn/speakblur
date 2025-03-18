import React, { useState, useEffect, useRef } from 'react';
import { Send, LogOut, Reply, Smile, BarChart as ChartBar, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { Message, PollOption } from '../types';
import { io, Socket } from 'socket.io-client';

interface ChatProps {
  username: string;
  onExit: () => void;
  onlineUsers: number;
  setOnlineUsers: (count: number) => void;
}

function Chat({ username, onExit, onlineUsers, setOnlineUsers }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isPollMode, setIsPollMode] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket>();

  useEffect(() => {
    socketRef.current = io('http://localhost:3000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      socketRef.current?.emit('join', username);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socketRef.current.on('previousMessages', (previousMessages: Message[]) => {
      setMessages(previousMessages);
    });

    socketRef.current.on('userCount', (count: number) => {
      setOnlineUsers(count);
    });

    socketRef.current.on('message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on('messageUpdate', (updatedMessage: Message) => {
      setMessages(prev => 
        prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
      );
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave', username);
        socketRef.current.disconnect();
      }
    };
  }, [username, setOnlineUsers]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (socketRef.current && isConnected) {
      if (isPollMode && pollOptions.filter(opt => opt.trim()).length >= 2) {
        const message: Message = {
          id: Date.now().toString(),
          text: newMessage.trim(),
          username,
          timestamp: Date.now(),
          isPoll: true,
          pollOptions: pollOptions
            .filter(opt => opt.trim())
            .map(opt => ({
              id: Math.random().toString(36).substr(2, 9),
              text: opt,
              votes: []
            }))
        };
        socketRef.current.emit('message', message);
        setNewMessage('');
        setPollOptions(['', '']);
        setIsPollMode(false);
      } else if (!isPollMode && newMessage.trim()) {
        const message: Message = {
          id: Date.now().toString(),
          text: newMessage.trim(),
          username,
          timestamp: Date.now(),
          replyTo: replyingTo?.id,
          reactions: {}
        };
        socketRef.current.emit('message', message);
        setNewMessage('');
        setReplyingTo(null);
      }
    }
  };

  const handleVote = (messageId: string, optionId: string) => {
    if (socketRef.current && isConnected) {
      const message = messages.find(m => m.id === messageId);
      if (message?.isPoll && message.pollOptions) {
        const updatedOptions = message.pollOptions.map(opt => {
          const votes = opt.votes.filter(v => v !== username);
          if (opt.id === optionId) {
            const hasVoted = opt.votes.includes(username);
            return {
              ...opt,
              votes: hasVoted ? votes : [...votes, username]
            };
          }
          return { ...opt, votes };
        });
        const updatedMessage = { ...message, pollOptions: updatedOptions };
        socketRef.current.emit('messageUpdate', updatedMessage);
      }
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('reaction', { messageId, emoji, username });
    }
    setShowEmojiPicker(false);
    setSelectedMessageId(null);
  };

  const handleExit = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave', username);
      socketRef.current.disconnect();
    }
    onExit();
  };

  const renderPollOptions = (message: Message) => {
    if (!message.isPoll || !message.pollOptions) return null;
    return (
      <div className="mt-3 space-y-2">
        {message.pollOptions.map(option => {
          const totalVotes = option.votes.length;
          const hasVoted = option.votes.includes(username);
          const percentage = totalVotes > 0 ? (option.votes.length / totalVotes) * 100 : 0;
          
          return (
            <button
              key={option.id}
              onClick={() => handleVote(message.id, option.id)}
              className={`w-full p-2 rounded-lg relative overflow-hidden ${
                hasVoted ? 'bg-[#DCF8C6]' : 'bg-gray-100'
              }`}
            >
              <div
                className="absolute top-0 left-0 bottom-0 bg-[#25D366] opacity-20"
                style={{ width: `${percentage}%` }}
              />
              <div className="relative flex justify-between">
                <span>{option.text}</span>
                <span className="text-sm text-gray-600">{option.votes.length} votes</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderReactions = (message: Message) => {
    if (!message.reactions) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {Object.entries(message.reactions).map(([emoji, users]) => (
          users.length > 0 && (
            <button
              key={emoji}
              onClick={() => handleReaction(message.id, emoji)}
              className="bg-[#DCF8C6] rounded-full px-2 py-1 text-sm hover:bg-[#c5e9b0]"
            >
              {emoji} {users.length}
            </button>
          )
        ))}
      </div>
    );
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#E5DDD5]">
      {/* Header */}
      <div className="bg-[#128C7E] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">SpeakBlur</h2>
            <p className="text-sm text-white/80 font-medium">
              {isConnected ? `${onlineUsers} online` : 'Connecting...'}
            </p>
          </div>
          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            Exit
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 max-w-6xl mx-auto w-full">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.username === username ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className="relative group max-w-[80%]">
                <div
                  className={`rounded-lg p-4 shadow-sm ${
                    message.username === username
                      ? 'bg-[#DCF8C6]'
                      : message.username === 'System'
                      ? 'bg-gray-200'
                      : 'bg-white'
                  }`}
                >
                  {message.replyTo && (
                    <div className="text-sm opacity-75 mb-3 p-2 rounded bg-black/5 border-l-4 border-[#25D366]">
                      <p className="text-xs mb-1 text-[#128C7E]">Replying to:</p>
                      {messages.find(m => m.id === message.replyTo)?.text}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-[#128C7E]">
                      {message.username === username ? 'You' : message.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="break-words leading-relaxed">{message.text}</p>
                  {renderPollOptions(message)}
                  {renderReactions(message)}
                </div>
                
                <div className="absolute -bottom-4 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={() => setReplyingTo(message)}
                    className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50"
                  >
                    <Reply size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMessageId(message.id);
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                    className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50"
                  >
                    <Smile size={14} />
                  </button>
                </div>

                {showEmojiPicker && selectedMessageId === message.id && (
                  <div className="absolute bottom-full right-0 mb-2 z-50">
                    <EmojiPicker
                      onEmojiClick={(emojiData) => handleReaction(message.id, emojiData.emoji)}
                      width={300}
                      height={400}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-[#F0F2F5] border-t border-gray-200">
        <form onSubmit={handleSend} className="max-w-6xl mx-auto p-4">
          {replyingTo && (
            <div className="mb-3 p-2 bg-white rounded-lg flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Replying to: {replyingTo.text}
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {isPollMode && (
            <div className="mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Create Poll</h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsPollMode(false);
                    setPollOptions(['', '']);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              </div>
              {pollOptions.map((option, index) => (
                <input
                  key={index}
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...pollOptions];
                    newOptions[index] = e.target.value;
                    setPollOptions(newOptions);
                  }}
                  placeholder={`Option ${index + 1}`}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#128C7E] focus:border-transparent"
                />
              ))}
              <button
                type="button"
                onClick={() => setPollOptions([...pollOptions, ''])}
                className="text-sm text-[#128C7E] hover:text-[#0e6d62]"
              >
                + Add Option
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1 bg-white rounded-2xl p-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isPollMode ? "Poll question..." : "Type a message..."}
                className="w-full bg-transparent px-3 py-2 focus:outline-none"
                disabled={!isConnected}
              />
              <div className="flex items-center gap-2 px-3">
                
                <button
                  type="button"
                  className="text-gray-500 hover:text-[#128C7E]"
                  onClick={() => setIsPollMode(!isPollMode)}
                >
                  <ChartBar size={20} />
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={!isConnected || (!newMessage.trim() && !isPollMode) || (isPollMode && pollOptions.filter(opt => opt.trim()).length < 2)}
              className="bg-[#25D366] text-white p-4 rounded-full hover:bg-[#1ea952] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Chat;