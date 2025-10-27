import { useState, useEffect } from 'react';
import { Sword, Shield } from 'lucide-react';

interface BossFightProps {
  dungeonName: string;
  bossName: string;
  playerHP: number;
  playerMaxHP: number;
  playerAttack: number;
  onComplete: (success: boolean, finalHP: number) => void;
  onClose: () => void;
}

export default function BossFight({
  dungeonName,
  bossName,
  playerHP: initialPlayerHP,
  playerMaxHP,
  playerAttack,
  onComplete,
  onClose,
}: BossFightProps) {
  const [playerHP, setPlayerHP] = useState(initialPlayerHP);
  const [bossHP, setBossHP] = useState(1000);
  const [bossMaxHP] = useState(1000);
  const [turn, setTurn] = useState<'player' | 'boss'>('player');
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const [playerDamageAnim, setPlayerDamageAnim] = useState(false);
  const [bossDamageAnim, setBossDamageAnim] = useState(false);
  const [battleEnded, setBattleEnded] = useState(false);

  const bossAttack = Math.floor(playerAttack * 0.8); // Boss hits 80% of player attack

  const addLog = (message: string) => {
    setCombatLog(prev => [...prev.slice(-4), message]);
  };

  const playerAttackAction = () => {
    if (turn !== 'player' || battleEnded) return;
    
    setIsAttacking(true);
    setBossDamageAnim(true);
    
    const damage = Math.floor(playerAttack + Math.random() * 10);
    const newBossHP = Math.max(0, bossHP - damage);
    
    setTimeout(() => {
      setBossHP(newBossHP);
      addLog(`⚔️ You dealt ${damage} damage!`);
      setBossDamageAnim(false);
      setIsAttacking(false);
      
      if (newBossHP <= 0) {
        addLog(`🎉 Victory! ${bossName} defeated!`);
        setBattleEnded(true);
        setTimeout(() => onComplete(true, playerHP), 2000);
      } else {
        setTurn('boss');
      }
    }, 500);
  };

  const playerDefendAction = () => {
    if (turn !== 'player' || battleEnded) return;
    
    addLog(`🛡️ You brace for impact!`);
    setTurn('boss');
  };

  useEffect(() => {
    if (turn === 'boss' && !battleEnded) {
      const timeout = setTimeout(() => {
        setPlayerDamageAnim(true);
        
        const damage = Math.floor(bossAttack + Math.random() * 5);
        
        setTimeout(() => {
          setPlayerHP(currentHP => {
            const newPlayerHP = Math.max(0, currentHP - damage);
            
            addLog(`💥 ${bossName} dealt ${damage} damage!`);
            setPlayerDamageAnim(false);
            
            if (newPlayerHP <= 0) {
              addLog(`💀 Defeated! You have fallen...`);
              setBattleEnded(true);
              setTimeout(() => onComplete(false, 1), 2000);
            } else {
              setTurn('player');
            }
            
            return newPlayerHP;
          });
        }, 500);
      }, 1500);
      
      return () => clearTimeout(timeout);
    }
  }, [turn, battleEnded, bossName, bossAttack]);

  useEffect(() => {
    addLog(`⚔️ Battle begins against ${bossName}!`);
  }, [bossName]);

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-amber-400 mb-2">{dungeonName}</h1>
          <h2 className="text-xl text-red-400">Boss Fight: {bossName}</h2>
        </div>

        {/* Battle Arena */}
        <div className="bg-stone-900 rounded-lg border-4 border-amber-600 p-6 mb-4">
          <div className="grid grid-cols-2 gap-8">
            {/* Player Side */}
            <div className="text-center">
              <div className={`transition-all duration-300 ${playerDamageAnim ? 'animate-shake' : ''}`}>
                <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-6xl border-4 border-blue-400 relative">
                  🧙‍♂️
                  {playerDamageAnim && (
                    <div className="absolute inset-0 bg-red-500 opacity-50 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">You</h3>
              <div className="bg-stone-800 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">HP</span>
                  <span className="text-red-400 font-bold">{playerHP}/{playerMaxHP}</span>
                </div>
                <div className="w-full bg-stone-700 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-red-600 to-red-400 h-full transition-all duration-500"
                    style={{ width: `${(playerHP / playerMaxHP) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Boss Side */}
            <div className="text-center">
              <div className={`transition-all duration-300 ${bossDamageAnim ? 'animate-shake' : ''}`}>
                <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-red-600 to-red-900 rounded-full flex items-center justify-center text-6xl border-4 border-red-400 relative">
                  👹
                  {bossDamageAnim && (
                    <div className="absolute inset-0 bg-yellow-500 opacity-50 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
              <h3 className="text-xl font-bold text-red-400 mb-2">{bossName}</h3>
              <div className="bg-stone-800 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">HP</span>
                  <span className="text-red-400 font-bold">{bossHP}/{bossMaxHP}</span>
                </div>
                <div className="w-full bg-stone-700 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-purple-400 h-full transition-all duration-500"
                    style={{ width: `${(bossHP / bossMaxHP) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Combat Log */}
          <div className="mt-6 bg-stone-800 rounded p-4 h-32 overflow-y-auto">
            <div className="space-y-1">
              {combatLog.map((log, i) => (
                <div key={i} className="text-sm text-gray-300 animate-fade-in">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!battleEnded && (
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={playerAttackAction}
              disabled={turn !== 'player' || isAttacking}
              className="py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sword size={24} />
              Attack
            </button>
            <button
              onClick={playerDefendAction}
              disabled={turn !== 'player'}
              className="py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Shield size={24} />
              Defend
            </button>
            <button
              onClick={onClose}
              className="py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold text-lg transition flex items-center justify-center gap-2"
            >
              Flee
            </button>
          </div>
        )}

        {battleEnded && (
          <div className="text-center">
            <button
              onClick={onClose}
              className="py-4 px-8 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-lg transition"
            >
              Continue
            </button>
          </div>
        )}

        {/* Turn Indicator */}
        {!battleEnded && (
          <div className="text-center mt-4">
            <div className={`inline-block px-6 py-2 rounded-full font-bold ${
              turn === 'player' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
            } animate-pulse`}>
              {turn === 'player' ? '⚔️ Your Turn' : '🔥 Boss Turn'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
