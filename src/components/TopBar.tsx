import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { formatGold, getClassIcon } from '@/utils/format';
import { X, Clock } from 'lucide-react';
import energyIcon from '@/assets/ui/energy.png';
import hpIcon from '@/assets/ui/hp.png';

export default function TopBar() {
  const { player, character } = useGameStore();
  const [showStats, setShowStats] = useState(false);
  const [showEnergyTimer, setShowEnergyTimer] = useState(false);
  const [timeUntilNextEnergy, setTimeUntilNextEnergy] = useState('');

  useEffect(() => {
    if (!player || player.energy >= player.maxEnergy) {
      setTimeUntilNextEnergy('Full');
      return;
    }

    const updateTimer = () => {
      const lastUpdate = player.energyUpdatedAt ? new Date(player.energyUpdatedAt).getTime() : Date.now();
      const timeSinceLastUpdate = Date.now() - lastUpdate;
      const timeUntilNext = 300000 - (timeSinceLastUpdate % 300000); // 5 minutes in ms
      
      const minutes = Math.floor(timeUntilNext / 60000);
      const seconds = Math.floor((timeUntilNext % 60000) / 1000);
      
      setTimeUntilNextEnergy(`${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [player?.energy, player?.energyUpdatedAt, player?.maxEnergy]);

  if (!player || !character) return null;

  return (
    <>
      <div className="sticky top-0 z-40 bg-stone-800 p-3 flex justify-between items-center border-b-2 border-amber-700 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStats(true)}
            className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center text-2xl border-2 border-amber-500 hover:border-amber-400 transition cursor-pointer"
          >
            {getClassIcon(character.class)}
          </button>
          <div>
            <button
              onClick={() => setShowStats(true)}
              className="text-white font-bold text-sm hover:text-amber-400 transition"
              style={{ fontFamily: 'monospace', textShadow: '1px 1px 0 #000' }}
            >
              Lv.{character.level} {character.name}
            </button>
            <div className="flex gap-3 text-xs">
              <span className="text-yellow-400" style={{ fontFamily: 'monospace' }}>💰 {formatGold(player.gold)}</span>
              <span className="text-blue-400" style={{ fontFamily: 'monospace' }}>💎 {player.gems}</span>
            </div>
          </div>
        </div>
      
      <div className="text-right text-xs">
        <div className="flex items-center gap-2 mb-1 relative">
          <button
            onClick={() => setShowEnergyTimer(!showEnergyTimer)}
            className="hover:opacity-80 transition"
          >
            <img src={energyIcon} alt="Energy" className="w-4 h-4" />
          </button>
          <div className="w-20 bg-stone-900 h-2 overflow-hidden" style={{ borderRadius: '0', border: '1px solid #1e3a8a' }}>
            <div 
              className="bg-blue-500 h-full transition-all"
              style={{ width: `${(player.energy / player.maxEnergy) * 100}%`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            />
          </div>
          <span className="text-blue-300 font-bold" style={{ fontFamily: 'monospace' }}>{player.energy}/{player.maxEnergy}</span>
          
          {/* Energy Timer Tooltip */}
          {showEnergyTimer && (
            <div className="absolute top-6 right-0 bg-stone-900 border-2 border-blue-600 p-3 shadow-lg z-50 min-w-[180px]" style={{ borderRadius: '0', boxShadow: '0 4px 0 rgba(0,0,0,0.3)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-blue-400" />
                <span className="text-white font-bold text-sm" style={{ fontFamily: 'monospace' }}>Energy Regen</span>
              </div>
              <div className="text-gray-300 text-xs space-y-1">
                <p>Next energy in:</p>
                <p className="text-blue-400 font-bold text-base" style={{ fontFamily: 'monospace' }}>{timeUntilNextEnergy}</p>
                <p className="text-gray-400 text-xs mt-2">+1 energy every 5 minutes</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <img src={hpIcon} alt="HP" className="w-4 h-4" />
          <div className="w-20 bg-stone-900 h-2 overflow-hidden" style={{ borderRadius: '0', border: '1px solid #7f1d1d' }}>
            <div 
              className="bg-red-500 h-full transition-all"
              style={{ width: `${(character.health / character.maxHealth) * 100}%`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            />
          </div>
          <span className="text-red-300 font-bold" style={{ fontFamily: 'monospace' }}>{character.health}/{character.maxHealth}</span>
        </div>
      </div>
      </div>

      {/* Character Stats Modal */}
      {showStats && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowStats(false)}>
          <div className="bg-stone-800 border-4 border-amber-600 p-6 max-w-md w-full" style={{ borderRadius: '0', boxShadow: '0 8px 0 rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Character Stats</h2>
              <button onClick={() => setShowStats(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center text-4xl border-4 border-amber-500">
                {getClassIcon(character.class)}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{character.name}</h3>
                <p className="text-amber-400">Level {character.level} {character.class}</p>
                <p className="text-sm text-gray-400">Combat Power: {character.combatPower}</p>
              </div>
            </div>

            {/* Experience Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Experience</span>
                <span>{character.experience} / {character.level * 100}</span>
              </div>
              <div className="w-full bg-stone-900 h-3 overflow-hidden" style={{ borderRadius: '0', border: '1px solid #6b21a8' }}>
                <div 
                  className="bg-purple-500 h-full transition-all"
                  style={{ width: `${(character.experience / (character.level * 100)) * 100}%`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-stone-900 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Health</p>
                <p className="text-xl font-bold text-red-400">{character.maxHealth}</p>
              </div>
              <div className="bg-stone-900 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Attack</p>
                <p className="text-xl font-bold text-orange-400">{character.attack}</p>
              </div>
              <div className="bg-stone-900 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Defense</p>
                <p className="text-xl font-bold text-blue-400">{character.defense}</p>
              </div>
              <div className="bg-stone-900 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Speed</p>
                <p className="text-xl font-bold text-green-400">{character.speed}</p>
              </div>
            </div>

            {/* Equipment */}
            <div className="bg-stone-900 rounded-lg p-3">
              <h4 className="font-bold text-white mb-2">Equipment</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Weapon:</span>
                  <span className="text-white">{character.weapon?.name || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Armor:</span>
                  <span className="text-white">{character.armor?.name || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Accessory:</span>
                  <span className="text-white">{character.accessory?.name || 'None'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
