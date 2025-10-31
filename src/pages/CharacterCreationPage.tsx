import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, characterApi } from '@/lib/api';
import { useGameStore } from '@/store/gameStore';
import classIcon from '@/assets/ui/class.png';
import cpIcon from '@/assets/ui/cp.png';
import attackIcon from '@/assets/ui/character_panel/attack.png';
import defenseIcon from '@/assets/ui/character_panel/defense.png';
import hpIcon from '@/assets/ui/character_panel/hp.png';
import speedIcon from '@/assets/ui/character_panel/speed.png';

export default function CharacterCreationPage() {
  const navigate = useNavigate();
  const setCharacter = useGameStore((state) => state.setCharacter);
  
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState<any>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkExistingCharacter();
    loadClasses();
  }, []);

  const checkExistingCharacter = async () => {
    try {
      // Check if player already has a character
      const { data: profile } = await authApi.getProfile();
      if (profile.character) {
        // Player already has a character, redirect to game
        navigate('/');
      }
    } catch (err) {
      console.error('Failed to check existing character:', err);
    }
  };

  const loadClasses = async () => {
    try {
      const { data } = await characterApi.getClasses();
      setClasses(data);
      setSelectedClass(Object.keys(data)[0]);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await characterApi.create(name, selectedClass);
      setCharacter(data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create character');
    } finally {
      setLoading(false);
    }
  };

  const selectedClassData = classes[selectedClass];

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-stone-950 overflow-y-auto py-4 px-2" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(120, 53, 15, 0.1) 0%, transparent 50%)' }}>
      <div className="w-full max-w-4xl">
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-3xl md:text-6xl font-bold text-amber-400 mb-2 md:mb-4" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000, 0 0 20px rgba(251, 191, 36, 0.5)', letterSpacing: '1px' }}>CREATE YOUR HERO</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-1 w-8 md:w-16 bg-gradient-to-r from-transparent to-amber-600"></div>
            <p className="text-amber-500 text-xs md:text-sm font-bold" style={{ fontFamily: 'monospace', textShadow: '1px 1px 0 #000' }}>⚔️ CHOOSE YOUR DESTINY ⚔️</p>
            <div className="h-1 w-8 md:w-16 bg-gradient-to-l from-transparent to-amber-600"></div>
          </div>
        </div>

        <div className="bg-stone-900 p-4 md:p-8 border-4 border-amber-600" style={{ borderRadius: '0', boxShadow: '0 8px 0 rgba(0,0,0,0.5), inset 0 2px 0 rgba(0,0,0,0.3)' }}>
          {error && (
            <div className="mb-6 p-4 bg-red-950 border-2 border-red-600 text-red-300 font-bold" style={{ borderRadius: '0', boxShadow: '0 3px 0 #7f1d1d', fontFamily: 'monospace' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
            <div>
              <label className="flex items-center gap-2 text-sm md:text-lg font-bold text-amber-400 mb-2 md:mb-3" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
                <img src={cpIcon} alt="Character" className="w-4 h-4 md:w-5 md:h-5" style={{ imageRendering: 'pixelated' }} />
                CHARACTER NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 md:px-6 py-3 md:py-4 bg-stone-950 border-2 md:border-4 border-stone-700 text-white text-base md:text-xl font-bold focus:outline-none focus:border-amber-600 transition"
                style={{ borderRadius: '0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)', fontFamily: 'monospace', textShadow: '1px 1px 0 #000' }}
                required
                minLength={3}
                maxLength={20}
                placeholder="ENTER NAME..."
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm md:text-lg font-bold text-amber-400 mb-2 md:mb-4" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
                <img src={classIcon} alt="Class" className="w-4 h-4 md:w-5 md:h-5" style={{ imageRendering: 'pixelated' }} />
                CHOOSE YOUR CLASS
              </label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
                {Object.entries(classes).map(([className, classData]: [string, any]) => (
                  <button
                    key={className}
                    type="button"
                    onClick={() => setSelectedClass(className)}
                    className={`relative p-2 md:p-4 border-2 md:border-4 transition group ${
                      selectedClass === className
                        ? 'border-amber-500 bg-amber-950'
                        : 'border-stone-700 bg-stone-950 hover:border-amber-700'
                    }`}
                    style={{ borderRadius: '0', boxShadow: selectedClass === className ? '0 3px 0 #d97706, inset 0 2px 0 rgba(251, 191, 36, 0.2)' : '0 2px 0 rgba(0,0,0,0.3)' }}
                  >
                    <div className="flex flex-col items-center">
                      <img
                        src={`/assets/ui/chat/classIcons/${className.toLowerCase()}.png`}
                        alt={className}
                        className="w-10 h-10 md:w-16 md:h-16 mb-1 md:mb-2"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <div className="font-bold text-white text-[10px] md:text-sm" style={{ fontFamily: 'monospace', textShadow: '1px 1px 0 #000' }}>{className.toUpperCase()}</div>
                    </div>
                    {selectedClass === className && (
                      <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-amber-500 text-black text-[10px] md:text-xs font-bold px-1 md:px-2 py-0.5 md:py-1" style={{ fontFamily: 'monospace' }}>
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {selectedClassData && (
              <div className="p-3 md:p-6 bg-stone-950 border-2 md:border-4 border-purple-700" style={{ borderRadius: '0', boxShadow: 'inset 0 2px 0 rgba(0,0,0,0.5), 0 3px 0 #581c87' }}>
                <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-4">
                  <img
                    src={`/assets/ui/chat/classIcons/${selectedClass.toLowerCase()}.png`}
                    alt={selectedClass}
                    className="w-8 h-8 md:w-12 md:h-12"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <h3 className="text-lg md:text-2xl font-bold text-amber-400" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
                    {selectedClass.toUpperCase()}
                  </h3>
                </div>
                <p className="text-xs md:text-sm text-gray-300 mb-3 md:mb-4 font-bold" style={{ fontFamily: 'monospace' }}>{selectedClassData.description}</p>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="bg-stone-900 border-2 border-stone-700 p-2 md:p-3 flex items-center gap-1 md:gap-2">
                    <img src={hpIcon} alt="HP" className="w-6 h-6 md:w-8 md:h-8" style={{ imageRendering: 'pixelated' }} />
                    <div>
                      <p className="text-[8px] md:text-[10px] text-gray-400" style={{ fontFamily: 'monospace' }}>HEALTH</p>
                      <p className="text-sm md:text-lg font-bold text-red-400" style={{ fontFamily: 'monospace' }}>{selectedClassData.baseHealth}</p>
                    </div>
                  </div>
                  <div className="bg-stone-900 border-2 border-stone-700 p-2 md:p-3 flex items-center gap-1 md:gap-2">
                    <img src={attackIcon} alt="Attack" className="w-6 h-6 md:w-8 md:h-8" style={{ imageRendering: 'pixelated' }} />
                    <div>
                      <p className="text-[8px] md:text-[10px] text-gray-400" style={{ fontFamily: 'monospace' }}>ATTACK</p>
                      <p className="text-sm md:text-lg font-bold text-orange-400" style={{ fontFamily: 'monospace' }}>{selectedClassData.baseAttack}</p>
                    </div>
                  </div>
                  <div className="bg-stone-900 border-2 border-stone-700 p-2 md:p-3 flex items-center gap-1 md:gap-2">
                    <img src={defenseIcon} alt="Defense" className="w-6 h-6 md:w-8 md:h-8" style={{ imageRendering: 'pixelated' }} />
                    <div>
                      <p className="text-[8px] md:text-[10px] text-gray-400" style={{ fontFamily: 'monospace' }}>DEFENSE</p>
                      <p className="text-sm md:text-lg font-bold text-blue-400" style={{ fontFamily: 'monospace' }}>{selectedClassData.baseDefense}</p>
                    </div>
                  </div>
                  <div className="bg-stone-900 border-2 border-stone-700 p-2 md:p-3 flex items-center gap-1 md:gap-2">
                    <img src={speedIcon} alt="Speed" className="w-6 h-6 md:w-8 md:h-8" style={{ imageRendering: 'pixelated' }} />
                    <div>
                      <p className="text-[8px] md:text-[10px] text-gray-400" style={{ fontFamily: 'monospace' }}>SPEED</p>
                      <p className="text-sm md:text-lg font-bold text-green-400" style={{ fontFamily: 'monospace' }}>{selectedClassData.baseSpeed}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name || !selectedClass}
              className="w-full py-3 md:py-5 bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold border-2 md:border-4 border-amber-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-2xl"
              style={{ borderRadius: '0', boxShadow: '0 4px 0 #78350f, inset 0 2px 0 rgba(255,255,255,0.3)', fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}
            >
              {loading ? '⏳ CREATING...' : '⚔️ START ADVENTURE ⚔️'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
