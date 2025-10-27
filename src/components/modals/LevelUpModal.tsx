import { X, Sparkles, Unlock } from 'lucide-react';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  unlocks?: string[];
}

export default function LevelUpModal({ isOpen, onClose, newLevel, unlocks = [] }: LevelUpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-gradient-to-b from-amber-900 to-stone-900 rounded-lg border-4 border-amber-500 p-6 max-w-md w-full relative animate-bounce-in"
        style={{
          boxShadow: '0 0 30px rgba(251, 191, 36, 0.5), inset 0 2px 0 rgba(255,255,255,0.2)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition"
        >
          <X size={24} />
        </button>

        {/* Sparkle effects */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
          <Sparkles size={48} className="text-yellow-400 animate-pulse" />
        </div>

        {/* Level Up Header */}
        <div className="text-center mb-6">
          <h2 
            className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 mb-2"
            style={{ 
              fontFamily: 'monospace',
              textShadow: '0 0 20px rgba(251, 191, 36, 0.8)',
              WebkitTextStroke: '1px rgba(0,0,0,0.5)'
            }}
          >
            LEVEL UP!
          </h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-1 w-12 bg-gradient-to-r from-transparent to-amber-500"></div>
            <p 
              className="text-6xl font-bold text-amber-400"
              style={{ 
                fontFamily: 'monospace',
                textShadow: '2px 2px 0 #000, 0 0 10px rgba(251, 191, 36, 0.8)'
              }}
            >
              {newLevel}
            </p>
            <div className="h-1 w-12 bg-gradient-to-l from-transparent to-amber-500"></div>
          </div>
          <p className="text-amber-300 text-sm" style={{ fontFamily: 'monospace' }}>
            Congratulations on reaching level {newLevel}!
          </p>
        </div>

        {/* Stats Boost */}
        <div className="bg-stone-800/50 rounded-lg p-4 mb-4 border-2 border-amber-700">
          <p className="text-center text-amber-200 font-bold mb-2" style={{ fontFamily: 'monospace' }}>
            ⚡ STATS INCREASED ⚡
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="text-red-400">❤️ HP</p>
              <p className="text-white font-bold">+10</p>
            </div>
            <div>
              <p className="text-orange-400">⚔️ ATK</p>
              <p className="text-white font-bold">+2</p>
            </div>
            <div>
              <p className="text-blue-400">🛡️ DEF</p>
              <p className="text-white font-bold">+1</p>
            </div>
          </div>
        </div>

        {/* Unlocks Section */}
        {unlocks && unlocks.length > 0 && (
          <div className="bg-purple-900/30 rounded-lg p-4 mb-4 border-2 border-purple-500">
            <div className="flex items-center gap-2 mb-3">
              <Unlock size={20} className="text-purple-400" />
              <p className="text-purple-300 font-bold" style={{ fontFamily: 'monospace' }}>
                NEW FEATURES UNLOCKED!
              </p>
            </div>
            <div className="space-y-2">
              {unlocks.map((unlock, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 bg-purple-800/30 rounded p-2"
                >
                  <Sparkles size={16} className="text-yellow-400" />
                  <p className="text-white text-sm" style={{ fontFamily: 'monospace' }}>
                    {unlock}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold transition relative overflow-hidden"
          style={{
            border: '3px solid #92400e',
            borderRadius: '8px',
            boxShadow: '0 4px 0 #b45309, inset 0 2px 0 rgba(255,255,255,0.2)',
            textShadow: '1px 1px 0 #000',
            fontFamily: 'monospace',
            letterSpacing: '2px'
          }}
        >
          <span className="relative z-10">CONTINUE</span>
          <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
        </button>
      </div>

      <style>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
}
