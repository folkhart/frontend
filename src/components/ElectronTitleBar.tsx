import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Minus, Square, X, Maximize2 } from 'lucide-react';
import logo from '@/assets/ui/logo.png';
import cpIcon from '@/assets/ui/cp.png';
import attackIcon from '@/assets/ui/character_panel/attack.png';
import defenseIcon from '@/assets/ui/character_panel/defense.png';
import speedIcon from '@/assets/ui/character_panel/speed.png';

export default function ElectronTitleBar() {
  const { character, setActiveTab } = useGameStore();
  const [isMaximized, setIsMaximized] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const isElectron = typeof window !== 'undefined' && window.electron?.isElectron;

  useEffect(() => {
    if (isElectron && window.electron) {
      // Check initial maximize state
      window.electron.isMaximized().then(setIsMaximized);
    }
  }, [isElectron]);

  if (!isElectron) return null;

  const handleMinimize = () => {
    window.electron?.minimizeWindow();
  };

  const handleMaximize = () => {
    window.electron?.maximizeWindow();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.electron?.closeWindow();
  };

  // Get class emoji
  const getClassEmoji = (className: string) => {
    switch (className) {
      case 'Warrior': return '⚔️';
      case 'Mage': return '🔮';
      case 'Ranger': return '🏹';
      case 'Cleric': return '✨';
      case 'Rogue': return '🗡️';
      default: return '⚔️';
    }
  };

  return (
    <>
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-stone-900 border-b-4 border-amber-700 flex items-center justify-between px-4 py-2 select-none"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Left: Logo + Character Info */}
      <div className="flex items-center gap-3">
        {/* Logo + Folkhart Text */}
        <div 
          onClick={() => setActiveTab('adventure')}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          title="Go to Adventure"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          <img 
            src={logo} 
            alt="Folkhart" 
            className="w-8 h-8" 
            style={{ imageRendering: 'pixelated' }}
          />
          <span className="text-amber-400 font-bold retro-text text-sm">FOLKHART</span>
        </div>

        {character && (
          <>
            {/* Separator */}
            <div className="h-6 w-0.5 bg-stone-700"></div>

            {/* Character Info */}
            <div className="flex items-center gap-2">
              {/* Class Icon */}
              <span className="text-lg">{getClassEmoji(character.class)}</span>

              {/* Character Name - Clickable */}
              <span 
                onClick={() => setShowStatsModal(true)}
                className="text-white font-bold retro-text text-sm cursor-pointer hover:text-amber-400 transition-colors"
                title="View Character"
                style={{ WebkitAppRegion: 'no-drag' } as any}
              >
                {character.name}
              </span>

              {/* Level */}
              <span className="text-amber-400 retro-text text-xs">
                Lv.{character.level}
              </span>

              {/* Separator */}
              <div className="h-4 w-0.5 bg-stone-700 mx-1"></div>

              {/* Combat Power */}
              <div className="flex items-center gap-1">
                <img 
                  src={cpIcon} 
                  alt="CP" 
                  className="w-4 h-4"
                  style={{ imageRendering: 'pixelated' }}
                />
                <span className="text-white font-bold retro-text text-xs">
                  {character.combatPower?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </>
        )}

        {!character && (
          <span className="text-white font-bold retro-text text-sm">
            Folkhart - Cozy Fantasy RPG
          </span>
        )}
      </div>

      {/* Right: Window Controls */}
      <div 
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        {/* Minimize */}
        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center bg-amber-600 hover:bg-amber-500 border-2 border-amber-800 transition-colors"
          title="Minimize"
        >
          <Minus className="w-4 h-4 text-white" />
        </button>

        {/* Maximize/Restore */}
        <button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center bg-green-600 hover:bg-green-500 border-2 border-green-800 transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <Square className="w-3 h-3 text-white" />
          ) : (
            <Maximize2 className="w-4 h-4 text-white" />
          )}
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center bg-red-700 hover:bg-red-600 border-2 border-red-900 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>

      {/* Character Stats Modal */}
      {showStatsModal && character && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setShowStatsModal(false)}
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          <div 
            className="bg-stone-900 border-4 border-amber-700 p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b-2 border-amber-700 pb-2">
              <h2 className="text-amber-400 font-bold retro-text text-lg">
                {getClassEmoji(character.class)} {character.name}
              </h2>
              <button
                onClick={() => setShowStatsModal(false)}
                className="text-amber-400 hover:text-amber-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-stone-800 border-2 border-amber-700 p-3 flex items-center gap-2">
                <img src={attackIcon} alt="Attack" className="w-6 h-6" style={{ imageRendering: 'pixelated' }} />
                <div>
                  <div className="text-amber-300 retro-text text-xs">ATK</div>
                  <div className="text-white font-bold retro-text text-sm">{character.attack}</div>
                </div>
              </div>

              <div className="bg-stone-800 border-2 border-amber-700 p-3 flex items-center gap-2">
                <img src={defenseIcon} alt="Defense" className="w-6 h-6" style={{ imageRendering: 'pixelated' }} />
                <div>
                  <div className="text-amber-300 retro-text text-xs">DEF</div>
                  <div className="text-white font-bold retro-text text-sm">{character.defense}</div>
                </div>
              </div>

              <div className="bg-stone-800 border-2 border-amber-700 p-3 flex items-center gap-2">
                <img src={speedIcon} alt="Speed" className="w-6 h-6" style={{ imageRendering: 'pixelated' }} />
                <div>
                  <div className="text-amber-300 retro-text text-xs">SPD</div>
                  <div className="text-white font-bold retro-text text-sm">{character.speed}</div>
                </div>
              </div>

              <div className="bg-stone-800 border-2 border-amber-700 p-3 flex items-center gap-2">
                <div className="text-2xl">{getClassEmoji(character.class)}</div>
                <div>
                  <div className="text-amber-300 retro-text text-xs">CLASS</div>
                  <div className="text-white font-bold retro-text text-xs">{character.class}</div>
                </div>
              </div>

              <div className="bg-stone-800 border-2 border-purple-600 p-3 flex items-center gap-2 col-span-2">
                <img src={cpIcon} alt="CP" className="w-6 h-6" style={{ imageRendering: 'pixelated' }} />
                <div>
                  <div className="text-purple-300 retro-text text-xs">COMBAT POWER</div>
                  <div className="text-white font-bold retro-text text-lg">{character.combatPower?.toLocaleString() || 0}</div>
                </div>
              </div>
            </div>

            {/* Level & Class */}
            <div className="bg-stone-800 border-2 border-amber-700 p-3 mb-3">
              <div className="flex justify-between">
                <span className="text-amber-300 retro-text text-xs">CLASS</span>
                <span className="text-white font-bold retro-text text-xs">{character.class}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-amber-300 retro-text text-xs">LEVEL</span>
                <span className="text-white font-bold retro-text text-xs">{character.level}</span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowStatsModal(false)}
              className="w-full py-2 bg-amber-700 hover:bg-amber-600 border-2 border-amber-800 text-white font-bold retro-text text-sm transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </>
  );
}
