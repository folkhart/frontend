import { useQuery } from '@tanstack/react-query';
import { Search, Eye, Shield, Crown } from 'lucide-react';
import axios from 'axios';
import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface PlayersListProps {
  onSelectPlayer: (playerId: string) => void;
}

export default function PlayersList({ onSelectPlayer }: PlayersListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [sortBy, setSortBy] = useState<'level' | 'gold' | 'created'>('level');

  const { data: players, isLoading } = useQuery({
    queryKey: ['admin', 'players'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/players`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-yellow-400">Loading players...</div>;
  }

  // Filter and sort players
  let filteredPlayers = players || [];

  if (searchTerm) {
    filteredPlayers = filteredPlayers.filter((p: any) =>
      p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.character?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (filterClass) {
    filteredPlayers = filteredPlayers.filter((p: any) => p.character?.class === filterClass);
  }

  filteredPlayers = [...filteredPlayers].sort((a: any, b: any) => {
    if (sortBy === 'level') return (b.level || 0) - (a.level || 0);
    if (sortBy === 'gold') return (b.gold || 0) - (a.gold || 0);
    if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border-2 border-gray-700 text-white focus:border-yellow-600 outline-none"
          />
        </div>

        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-4 py-2 bg-gray-900 border-2 border-gray-700 text-white focus:border-yellow-600 outline-none"
        >
          <option value="">All Classes</option>
          <option value="Warrior">Warrior</option>
          <option value="Mage">Mage</option>
          <option value="Ranger">Ranger</option>
          <option value="Cleric">Cleric</option>
          <option value="Rogue">Rogue</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 bg-gray-900 border-2 border-gray-700 text-white focus:border-yellow-600 outline-none"
        >
          <option value="level">Sort by Level</option>
          <option value="gold">Sort by Gold</option>
          <option value="created">Sort by Created</option>
        </select>
      </div>

      {/* Stats */}
      <div className="bg-gray-800 border-2 border-gray-700 p-4">
        <div className="text-yellow-400 font-bold">
          Showing {filteredPlayers.length} of {players?.length || 0} players
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-gray-800 border-2 border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 text-yellow-400">Username</th>
                <th className="text-left p-3 text-yellow-400">Character</th>
                <th className="text-left p-3 text-yellow-400">Class</th>
                <th className="text-right p-3 text-yellow-400">Level</th>
                <th className="text-right p-3 text-yellow-400">Gold</th>
                <th className="text-right p-3 text-yellow-400">Gems</th>
                <th className="text-center p-3 text-yellow-400">Status</th>
                <th className="text-center p-3 text-yellow-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player: any) => (
                <tr
                  key={player.id}
                  className="border-t border-gray-700 hover:bg-gray-700 transition-colors"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {player.isAdmin && (
                        <Crown size={16} className="text-red-400" title="Admin" />
                      )}
                      <span className="text-white font-bold">{player.username}</span>
                    </div>
                    <div className="text-xs text-gray-400">{player.email}</div>
                  </td>
                  <td className="p-3">
                    {player.character ? (
                      <div>
                        <div className="text-white">{player.character.name}</div>
                        <div className="text-xs text-gray-400">
                          CP: {player.character.combatPower}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">No character</span>
                    )}
                  </td>
                  <td className="p-3">
                    {player.character ? (
                      <span className="text-purple-400">{player.character.class}</span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <span className="text-green-400 font-bold">Lv {player.level}</span>
                  </td>
                  <td className="p-3 text-right">
                    <span className="text-yellow-400">{player.gold.toLocaleString()}g</span>
                  </td>
                  <td className="p-3 text-right">
                    <span className="text-cyan-400">{player.gems}</span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {player.isMuted && (
                        <span className="text-xs bg-red-600 text-white px-2 py-0.5">Muted</span>
                      )}
                      {new Date().getTime() - new Date(player.lastLoginAt).getTime() < 300000 && (
                        <span className="text-xs bg-green-600 text-white px-2 py-0.5">Online</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onSelectPlayer(player.id)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm inline-flex items-center gap-1"
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
