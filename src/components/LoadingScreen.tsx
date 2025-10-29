import { useState, useEffect } from 'react';
import logoImg from '@/assets/ui/logo.png';

const FOLKHART_FACTS = [
  "⚔️ Folkhart features 5 unique classes: Warrior, Mage, Rogue, Ranger, and Cleric!",
  "🏰 Join guilds to unlock exclusive items and chat with fellow adventurers!",
  "💎 Enhance your equipment at the Blacksmith to increase its power!",
  "🎯 Complete achievements to unlock special titles and show off your accomplishments!",
  "⚡ Energy regenerates +1 every 5 minutes - plan your dungeon runs wisely!",
  "🗡️ Socket gems into your equipment for powerful stat bonuses!",
  "🏆 Climb the leaderboards to prove you're the strongest adventurer!",
  "🎒 Manage your inventory carefully - sell unwanted items for gold!",
  "🌟 Idle farming lets you earn rewards even when you're away!",
  "🔥 Each dungeon has unique monsters and rewards - explore them all!",
  "💰 Guild coins can be earned by contributing to your guild's success!",
  "🎨 Customize your character with titles earned from achievements!",
  "⚒️ Craft powerful items using materials gathered from dungeons!",
  "🛡️ Equipment comes in 5 rarities: Common, Uncommon, Rare, Epic, and Legendary!",
  "📜 Check the News tab for updates and special events!",
];

export default function LoadingScreen() {
  const [currentFact, setCurrentFact] = useState(0);
  const [dots, setDots] = useState('');

  // Rotate facts every 4 seconds
  useEffect(() => {
    const factInterval = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % FOLKHART_FACTS.length);
    }, 4000);

    return () => clearInterval(factInterval);
  }, []);

  // Animate loading dots
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(dotInterval);
  }, []);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(251, 191, 36, 0.1) 2px, rgba(251, 191, 36, 0.1) 4px)',
          animation: 'scroll 20s linear infinite'
        }} />
      </div>

      <div className="text-center z-10 max-w-2xl px-4">
        {/* Logo */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-amber-600 blur-3xl opacity-20 animate-pulse" />
          <img 
            src={logoImg} 
            alt="Folkhart" 
            className="w-48 h-48 mx-auto relative"
            style={{ 
              imageRendering: 'pixelated',
              filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.5))'
            }}
          />
        </div>

        {/* Title */}
        <h1 
          className="text-6xl font-bold text-amber-400 mb-2" 
          style={{ 
            fontFamily: 'monospace', 
            textShadow: '4px 4px 0 #000, 0 0 20px rgba(251, 191, 36, 0.5)',
            letterSpacing: '0.1em'
          }}
        >
          FOLKHART
        </h1>
        
        <p 
          className="text-xl text-amber-300 mb-8" 
          style={{ 
            fontFamily: 'monospace',
            textShadow: '2px 2px 0 #000'
          }}
        >
          Cozy Fantasy RPG
        </p>

        {/* Loading Bar */}
        <div className="mb-8">
          <div className="w-full max-w-md mx-auto bg-stone-950 h-6 border-4 border-amber-600" style={{ borderRadius: '0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}>
            <div 
              className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 relative overflow-hidden"
              style={{ 
                width: '100%',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 0 10px rgba(251, 191, 36, 0.5)',
                animation: 'shimmer 2s infinite'
              }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                style={{ animation: 'slide 1.5s infinite' }}
              />
            </div>
          </div>
          <p 
            className="text-amber-400 font-bold mt-3 text-lg" 
            style={{ fontFamily: 'monospace', textShadow: '1px 1px 0 #000' }}
          >
            Loading{dots}
          </p>
        </div>

        {/* Rotating Facts */}
        <div className="bg-stone-900 border-2 border-amber-700 p-4 min-h-[80px] flex items-center justify-center" style={{ borderRadius: '0', boxShadow: '0 4px 0 #78350f' }}>
          <p 
            key={currentFact}
            className="text-gray-300 text-sm font-bold animate-fadeIn"
            style={{ 
              fontFamily: 'monospace',
              textShadow: '1px 1px 0 #000',
              animation: 'fadeIn 0.5s ease-in-out'
            }}
          >
            {FOLKHART_FACTS[currentFact]}
          </p>
        </div>

        {/* Version */}
        <p className="text-gray-600 text-xs mt-4" style={{ fontFamily: 'monospace' }}>
          v1.0.0 - Beta
        </p>
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
