import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { characterApi } from '@/lib/api';
import { useGameStore } from '@/store/gameStore';
import { getClassIcon } from '@/utils/format';

export default function CharacterCreationPage() {
  const navigate = useNavigate();
  const setCharacter = useGameStore((state) => state.setCharacter);
  
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState<any>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

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
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-b from-stone-900 to-stone-800 overflow-y-auto">
      <div className="w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-500 mb-2">Create Your Hero</h1>
          <p className="text-gray-400 text-sm">Choose your class and begin your adventure</p>
        </div>

        <div className="bg-stone-800 rounded-lg p-6 border-2 border-stone-700">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Character Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-stone-900 border border-stone-600 rounded text-white focus:outline-none focus:border-amber-500"
                required
                minLength={3}
                maxLength={20}
                placeholder="Enter your hero's name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Choose Your Class
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(classes).map(([className, classData]: [string, any]) => (
                  <button
                    key={className}
                    type="button"
                    onClick={() => setSelectedClass(className)}
                    className={`p-4 rounded-lg border-2 transition text-left ${
                      selectedClass === className
                        ? 'border-amber-500 bg-amber-900/30'
                        : 'border-stone-600 bg-stone-900 hover:border-stone-500'
                    }`}
                  >
                    <div className="text-3xl mb-2">{getClassIcon(className)}</div>
                    <div className="font-bold text-white">{className}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      ATK: {classData.baseAttack} | DEF: {classData.baseDefense}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedClassData && (
              <div className="p-4 bg-stone-900 rounded-lg border border-stone-700">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <span className="text-2xl">{getClassIcon(selectedClass)}</span>
                  {selectedClass}
                </h3>
                <p className="text-sm text-gray-300 mb-3">{selectedClassData.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Health:</span>
                    <span className="text-red-400 font-bold">{selectedClassData.baseHealth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Attack:</span>
                    <span className="text-orange-400 font-bold">{selectedClassData.baseAttack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Defense:</span>
                    <span className="text-blue-400 font-bold">{selectedClassData.baseDefense}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Speed:</span>
                    <span className="text-green-400 font-bold">{selectedClassData.baseSpeed}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name || !selectedClass}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded transition disabled:opacity-50 disabled:cursor-not-allowed btn-press"
            >
              {loading ? 'Creating Character...' : 'Start Adventure'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
