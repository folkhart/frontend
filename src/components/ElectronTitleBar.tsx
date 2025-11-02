import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Minus, Square, X, Maximize2 } from 'lucide-react';
import logo from '@/assets/ui/logo.png';
import cpIcon from '@/assets/ui/cp.png';

export default function ElectronTitleBar() {
  const { character } = useGameStore();
  const [isMaximized, setIsMaximized] = useState(false);
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
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-stone-900 border-b-4 border-amber-700 flex items-center justify-between px-4 py-2 select-none"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Left: Logo + Character Info */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <img 
          src={logo} 
          alt="Folkhart" 
          className="w-8 h-8" 
          style={{ imageRendering: 'pixelated' }}
        />

        {character && (
          <>
            {/* Separator */}
            <div className="h-6 w-0.5 bg-stone-700"></div>

            {/* Character Info */}
            <div className="flex items-center gap-2">
              {/* Class Icon */}
              <span className="text-lg">{getClassEmoji(character.class)}</span>

              {/* Character Name */}
              <span className="text-white font-bold retro-text text-sm">
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
                <span className="text-amber-200 retro-text text-xs">⚡</span>
                <span className="text-white font-bold retro-text text-xs">
                  {character.combatPower?.toLocaleString() || 0} CP
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
  );
}
