import { LogOut, Info, Trophy, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { disconnectSocket } from '@/lib/socket';

export default function SettingsTab() {
  const navigate = useNavigate();
  const { player, clearAuth, setActiveTab } = useGameStore();

  const handleLogout = () => {
    disconnectSocket();
    clearAuth();
    navigate('/');
  };

  return (
    <div className="p-4 pb-20">
      <h2 className="text-2xl font-bold text-white mb-4">⚙️ Settings</h2>

      {/* Profile Section */}
      <div className="bg-stone-800 rounded-lg border-2 border-stone-700 p-4 mb-4">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <User size={20} />
          Profile
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Username:</span>
            <span className="text-white font-bold">{player?.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Email:</span>
            <span className="text-white">{player?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Account Level:</span>
            <span className="text-amber-400 font-bold">{player?.level}</span>
          </div>
        </div>
      </div>

      {/* Leaderboard Button */}
      <button
        onClick={() => setActiveTab('leaderboard')}
        className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-white font-bold transition relative overflow-hidden mb-4"
        style={{
          border: '3px solid #92400e',
          borderRadius: '0',
          boxShadow: '0 3px 0 #b45309, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
          textShadow: '1px 1px 0 #000',
          fontFamily: 'monospace',
          letterSpacing: '1px'
        }}
      >
        <Trophy size={20} className="inline mr-2" />
        <span className="relative z-10">🏆 LEADERBOARD</span>
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
      </button>

      {/* Admin Panel Button - Only show for admins */}
      {player?.isAdmin && (
        <button
          onClick={() => setActiveTab('admin')}
          className="w-full py-3 bg-red-700 hover:bg-red-600 text-white font-bold transition relative overflow-hidden mb-4"
          style={{
            border: '3px solid #7f1d1d',
            borderRadius: '0',
            boxShadow: '0 3px 0 #991b1b, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
            textShadow: '1px 1px 0 #000',
            fontFamily: 'monospace',
            letterSpacing: '1px'
          }}
        >
          <span className="relative z-10">🛡️ ADMIN PANEL</span>
          <div className="absolute inset-0 bg-gradient-to-b from-red-400/20 to-transparent"></div>
        </button>
      )}

      {/* Game Info */}
      <div className="bg-stone-800 rounded-lg border-2 border-stone-700 p-4 mb-4">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Info size={20} />
          About
        </h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p><strong className="text-white">Folkhart</strong></p>
          <p>Version: 1.0.0 (MVP)</p>
          <p className="text-xs text-gray-400">
            A cozy fantasy MMORPG browser game with idle and active gameplay.
          </p>
        </div>
      </div>

      {/* Game Stats */}
      <div className="bg-stone-800 rounded-lg border-2 border-stone-700 p-4 mb-4">
        <h3 className="font-bold text-white mb-3">📊 Statistics</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-stone-900 rounded p-3">
            <p className="text-gray-400 text-xs mb-1">Total Gold</p>
            <p className="text-yellow-400 font-bold text-lg">{player?.gold || 0}</p>
          </div>
          <div className="bg-stone-900 rounded p-3">
            <p className="text-gray-400 text-xs mb-1">Total Gems</p>
            <p className="text-blue-400 font-bold text-lg">{player?.gems || 0}</p>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full py-3 bg-red-700 hover:bg-red-600 text-white font-bold transition relative overflow-hidden"
        style={{
          border: '3px solid #7f1d1d',
          borderRadius: '0',
          boxShadow: '0 3px 0 #991b1b, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
          textShadow: '1px 1px 0 #000',
          fontFamily: 'monospace',
          letterSpacing: '1px'
        }}
      >
        <LogOut size={20} className="inline mr-2" />
        <span className="relative z-10">LOGOUT</span>
        <div className="absolute inset-0 bg-gradient-to-b from-red-400/20 to-transparent"></div>
      </button>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-gray-500">
        <p>Made with 💖 for cozy gaming</p>
        <p className="mt-1">© 2024 Folkhart</p>
      </div>
    </div>
  );
}
