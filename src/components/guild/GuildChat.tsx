import { useState, useEffect, useRef } from 'react';
import { Send, Smile } from 'lucide-react';
import { useSocket } from '@/lib/socket';

interface ChatMessage {
  id: string;
  message: string;
  createdAt: Date | string;
  player: {
    username: string;
    level: number;
    class?: string;
  };
}

const EMOJIS = [
  'Coins_Animated_32x32',
  'Diamond_Animated_32x32',
  'Dragon_Animated_32x32',
  'Emerald_Animated_32x32',
  'Enchanter_Animated_32x32',
  'Icon1', 'Icon2', 'Icon3', 'Icon4', 'Icon5',
  'Icon6', 'Icon7', 'Icon8', 'Icon9', 'Icon10',
  'Icon11', 'Icon12', 'Icon13', 'Icon14', 'Icon15',
];

interface GuildChatProps {
  initialMessages?: ChatMessage[];
  guildName: string;
}

export default function GuildChat({ initialMessages = [], guildName }: GuildChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const socket = useSocket();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load initial messages
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Listen for new guild chat messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: ChatMessage) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    socket.on('guild_chat_message', handleNewMessage);

    return () => {
      socket.off('guild_chat_message', handleNewMessage);
    };
  }, [socket]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !socket) return;

    // Send via Socket.io
    socket.emit('guild_chat_message', { message: inputMessage });
    
    // Clear input
    setInputMessage('');
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getClassColor = (playerClass?: string) => {
    switch (playerClass) {
      case 'Mage': return 'bg-purple-600 border-purple-800';
      case 'Warrior': return 'bg-red-600 border-red-800';
      case 'Rogue': return 'bg-green-600 border-green-800';
      case 'Ranger': return 'bg-emerald-600 border-emerald-800';
      case 'Cleric': return 'bg-blue-600 border-blue-800';
      default: return 'bg-amber-600 border-amber-800';
    }
  };

  const insertEmoji = (emoji: string) => {
    const emojiCode = `:${emoji}:`;
    setInputMessage(prev => prev + emojiCode);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const renderMessageWithEmojis = (text: string) => {
    // Replace :emoji: codes with actual emoji images
    const parts = text.split(/(:(?:Coins|Diamond|Dragon|Emerald|Enchanter|Icon\d+)(?:_Animated_32x32)?:)/g);
    
    return parts.map((part, index) => {
      const match = part.match(/:([^:]+):/);
      if (match) {
        const emojiName = match[1];
        const ext = emojiName.includes('Animated') ? 'gif' : 'png';
        return (
          <img
            key={index}
            src={`/assets/ui/guild/guild_emojis/${emojiName}.${ext}`}
            alt={emojiName}
            className="inline-block w-6 h-6 mx-0.5"
            style={{ imageRendering: 'pixelated', verticalAlign: 'middle' }}
          />
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 border-2 border-stone-700">
      {/* Chat Header */}
      <div className="bg-amber-600 border-b-2 border-amber-800 px-3 py-2">
        <h3 className="text-white font-bold text-sm">
          💬 {guildName} Chat
        </h3>
      </div>

      {/* Messages Container - Mobile Optimized */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            No messages yet. Be the first to say hello!
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className="bg-stone-800 border border-stone-700 p-2 rounded"
            >
              <div className="flex items-start gap-2">
                {/* Player Avatar - Class Based Color */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${getClassColor(msg.player.class)}`}>
                  <span className="text-white text-xs font-bold">
                    {msg.player.username.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  {/* Username, Class & Level */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-400 font-bold text-sm">
                      {msg.player.username}
                    </span>
                    {msg.player.class && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-stone-700 text-gray-300">
                        {msg.player.class}
                      </span>
                    )}
                    <span className="text-gray-500 text-xs">
                      Lv.{msg.player.level}
                    </span>
                    <span className="text-gray-600 text-xs ml-auto">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>

                  {/* Message Text with Emojis */}
                  <div className="text-gray-200 text-sm break-words">
                    {renderMessageWithEmojis(msg.message)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Mobile Optimized */}
      <div className="border-t-2 border-stone-700 bg-stone-800 p-2 relative">
        {/* Emoji Picker Popup */}
        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 right-0 bg-stone-900 border-2 border-stone-700 rounded-t-lg p-3 mb-1 max-h-48 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-bold text-xs">Guild Emojis</h4>
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {EMOJIS.map((emoji) => {
                const ext = emoji.includes('Animated') ? 'gif' : 'png';
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="p-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded transition"
                  >
                    <img
                      src={`/assets/ui/guild/guild_emojis/${emoji}.${ext}`}
                      alt={emoji}
                      className="w-8 h-8 mx-auto"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={sendMessage}>
          <div className="flex gap-2">
            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="px-3 py-2 bg-stone-900 hover:bg-stone-700 border-2 border-stone-700 text-amber-400 rounded transition"
              title="Insert emoji"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Message Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              maxLength={200}
              className="flex-1 px-3 py-2 bg-stone-900 border-2 border-stone-700 rounded text-white text-sm placeholder-gray-500 focus:border-amber-500 focus:outline-none"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded font-bold transition flex items-center gap-1"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {inputMessage.length}/200
          </div>
        </form>
      </div>
    </div>
  );
}
