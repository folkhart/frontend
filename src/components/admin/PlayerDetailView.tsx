import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, User, Shield, Swords, Package, Activity, 
  Trash2, Plus, Edit, Ban, CheckCircle
} from 'lucide-react';
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface PlayerDetailViewProps {
  playerId: string;
  onBack: () => void;
}

export default function PlayerDetailView({ playerId, onBack }: PlayerDetailViewProps) {
  const queryClient = useQueryClient();
  const [showGiveItem, setShowGiveItem] = useState(false);
  const [showEditStats, setShowEditStats] = useState(false);

  const { data: player, isLoading } = useQuery({
    queryKey: ['admin', 'player', playerId],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/admin/players/${playerId}/detail`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  const { data: logs } = useQuery({
    queryKey: ['admin', 'player', playerId, 'logs'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/admin/players/${playerId}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  const muteMutation = useMutation({
    mutationFn: async (duration: number) => {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${API_URL}/api/admin/players/${playerId}/mute`,
        { duration },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      toast.success('Player muted');
      queryClient.invalidateQueries({ queryKey: ['admin', 'player', playerId] });
    },
  });

  const unmuteMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${API_URL}/api/admin/players/${playerId}/unmute`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      toast.success('Player unmuted');
      queryClient.invalidateQueries({ queryKey: ['admin', 'player', playerId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_URL}/api/admin/players/${playerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      toast.success('Player deleted');
      onBack();
    },
  });

  if (isLoading) {
    return <div className="text-yellow-400">Loading player details...</div>;
  }

  if (!player) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300"
        >
          <ArrowLeft size={20} />
          Back to List
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEditStats(true)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            <Edit size={16} className="inline mr-1" />
            Edit Stats
          </button>
          <button
            onClick={() => setShowGiveItem(true)}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm"
          >
            <Plus size={16} className="inline mr-1" />
            Give Item
          </button>
          {player.isMuted ? (
            <button
              onClick={() => unmuteMutation.mutate()}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm"
            >
              <CheckCircle size={16} className="inline mr-1" />
              Unmute
            </button>
          ) : (
            <button
              onClick={() => muteMutation.mutate(60)}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm"
            >
              <Ban size={16} className="inline mr-1" />
              Mute (1h)
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this player? This cannot be undone!')) {
                deleteMutation.mutate();
              }
            }}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm"
          >
            <Trash2 size={16} className="inline mr-1" />
            Delete
          </button>
        </div>
      </div>

      {/* Player Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 border-2 border-blue-600 p-4">
          <div className="flex items-center gap-2 text-blue-400 font-bold mb-3">
            <User size={20} />
            Player Info
          </div>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-400">Username:</span> <span className="text-white font-bold">{player.username}</span></div>
            <div><span className="text-gray-400">Email:</span> <span className="text-white">{player.email}</span></div>
            <div><span className="text-gray-400">Level:</span> <span className="text-green-400 font-bold">Lv {player.character?.level || 0}</span></div>
            <div><span className="text-gray-400">Gold:</span> <span className="text-yellow-400">{player.gold.toLocaleString()}g</span></div>
            <div><span className="text-gray-400">Gems:</span> <span className="text-cyan-400">{player.gems}</span></div>
            <div><span className="text-gray-400">Energy:</span> <span className="text-orange-400">{player.energy}/{player.maxEnergy}</span></div>
            <div><span className="text-gray-400">Admin:</span> <span className={player.isAdmin ? 'text-red-400' : 'text-gray-400'}>{player.isAdmin ? 'Yes' : 'No'}</span></div>
            <div><span className="text-gray-400">Muted:</span> <span className={player.isMuted ? 'text-red-400' : 'text-green-400'}>{player.isMuted ? 'Yes' : 'No'}</span></div>
            <div><span className="text-gray-400">Created:</span> <span className="text-white">{new Date(player.createdAt).toLocaleDateString()}</span></div>
            <div><span className="text-gray-400">Last Login:</span> <span className="text-white">{new Date(player.lastLoginAt).toLocaleString()}</span></div>
          </div>
        </div>

        <div className="bg-gray-800 border-2 border-purple-600 p-4">
          <div className="flex items-center gap-2 text-purple-400 font-bold mb-3">
            <Shield size={20} />
            Character
          </div>
          {player.character ? (
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-400">Name:</span> <span className="text-white font-bold">{player.character.name}</span></div>
              <div><span className="text-gray-400">Class:</span> <span className="text-purple-400">{player.character.class}</span></div>
              <div><span className="text-gray-400">Level:</span> <span className="text-green-400">Lv {player.character.level}</span></div>
              <div><span className="text-gray-400">CP:</span> <span className="text-red-400">{player.character.combatPower}</span></div>
              <div><span className="text-gray-400">HP:</span> <span className="text-white">{player.character.health}/{player.character.maxHealth}</span></div>
              <div><span className="text-gray-400">Attack:</span> <span className="text-red-400">{player.character.attack}</span></div>
              <div><span className="text-gray-400">Defense:</span> <span className="text-blue-400">{player.character.defense}</span></div>
              <div><span className="text-gray-400">Speed:</span> <span className="text-yellow-400">{player.character.speed}</span></div>
              <div><span className="text-gray-400">Monsters:</span> <span className="text-white">{player.character.monstersKilled}</span></div>
              <div><span className="text-gray-400">Dungeons:</span> <span className="text-white">{player.character.dungeonsCompleted}</span></div>
            </div>
          ) : (
            <div className="text-gray-400">No character</div>
          )}
        </div>

        <div className="bg-gray-800 border-2 border-green-600 p-4">
          <div className="flex items-center gap-2 text-green-400 font-bold mb-3">
            <Swords size={20} />
            Statistics
          </div>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-400">Inventory Value:</span> <span className="text-yellow-400">{player.stats.inventoryValue.toLocaleString()}g</span></div>
            <div><span className="text-gray-400">Inventory Slots:</span> <span className="text-white">{player.stats.inventorySlots}</span></div>
            <div><span className="text-gray-400">Total Dungeons:</span> <span className="text-white">{player.stats.totalDungeons}</span></div>
            <div><span className="text-gray-400">Successful:</span> <span className="text-green-400">{player.stats.successfulDungeons}</span></div>
            <div><span className="text-gray-400">Success Rate:</span> <span className="text-cyan-400">{player.stats.dungeonSuccessRate.toFixed(1)}%</span></div>
            <div><span className="text-gray-400">Gold Earned:</span> <span className="text-yellow-400">{player.stats.totalGoldEarned.toLocaleString()}g</span></div>
            <div><span className="text-gray-400">Exp Earned:</span> <span className="text-purple-400">{player.stats.totalExpEarned.toLocaleString()}</span></div>
            <div><span className="text-gray-400">Achievements:</span> <span className="text-white">{player.stats.achievementCount}</span></div>
          </div>
        </div>
      </div>

      {/* Equipment */}
      {player.character && (
        <div className="bg-gray-800 border-2 border-gray-700 p-4">
          <div className="flex items-center gap-2 text-yellow-400 font-bold mb-3">
            <Package size={20} />
            Equipment
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {[
              { slot: 'Weapon', item: player.character.weapon },
              { slot: 'Armor', item: player.character.armor },
              { slot: 'Helmet', item: player.character.helmet },
              { slot: 'Gloves', item: player.character.gloves },
              { slot: 'Shoes', item: player.character.shoes },
              { slot: 'Ring', item: player.character.ring },
              { slot: 'Necklace', item: player.character.necklace },
              { slot: 'Belt', item: player.character.belt },
              { slot: 'Earring', item: player.character.earring },
            ].map(({ slot, item }) => (
              <div key={slot} className="bg-gray-900 p-2">
                <div className="text-gray-400 text-xs">{slot}</div>
                <div className="text-white font-bold">{item?.name || 'Empty'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory */}
      <div className="bg-gray-800 border-2 border-gray-700 p-4">
        <div className="flex items-center gap-2 text-yellow-400 font-bold mb-3">
          <Package size={20} />
          Inventory ({player.inventorySlots?.length || 0} items)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-96 overflow-y-auto">
          {player.inventorySlots?.map((slot: any) => (
            <div key={slot.id} className="bg-gray-900 p-2 text-center">
              <div className="text-white font-bold text-sm">{slot.item.name}</div>
              <div className="text-gray-400 text-xs">x{slot.quantity}</div>
              {slot.enhancementLevel > 0 && (
                <div className="text-green-400 text-xs">+{slot.enhancementLevel}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Activity Logs */}
      <div className="bg-gray-800 border-2 border-gray-700 p-4">
        <div className="flex items-center gap-2 text-yellow-400 font-bold mb-3">
          <Activity size={20} />
          Activity Logs ({logs?.length || 0})
        </div>
        <div className="space-y-1 max-h-96 overflow-y-auto text-xs">
          {logs?.map((log: any) => (
            <div key={log.id} className="bg-gray-900 p-2 flex items-start gap-2">
              <div className="text-gray-500 whitespace-nowrap">
                {new Date(log.createdAt).toLocaleString()}
              </div>
              <div className="flex-1">
                <span className="text-cyan-400">{log.action}</span>
                <span className="text-gray-400"> • {log.category}</span>
                {log.metadata && (
                  <div className="text-gray-500 mt-1">{JSON.stringify(log.metadata)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showGiveItem && <GiveItemModal playerId={playerId} onClose={() => setShowGiveItem(false)} />}
      {showEditStats && <EditStatsModal player={player} onClose={() => setShowEditStats(false)} />}
    </div>
  );
}

function GiveItemModal({ playerId, onClose }: { playerId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const { data: items } = useQuery({
    queryKey: ['admin', 'items'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/admin/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  const giveItemMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${API_URL}/api/admin/players/${playerId}/give-item`,
        { itemId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      toast.success('Item given successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'player', playerId] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 border-4 border-yellow-600 p-6 max-w-md w-full">
        <h3 className="text-yellow-400 font-bold text-xl mb-4">Give Item</h3>
        <div className="space-y-4">
          <div>
            <label className="text-white block mb-2">Item</label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full bg-gray-900 text-white p-2 border-2 border-gray-700"
            >
              <option value="">Select item...</option>
              {items?.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-white block mb-2">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              min="1"
              className="w-full bg-gray-900 text-white p-2 border-2 border-gray-700"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => giveItemMutation.mutate()}
              disabled={!itemId}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 disabled:opacity-50"
            >
              Give Item
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditStatsModal({ player, onClose }: { player: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [gold, setGold] = useState(player.gold);
  const [gems, setGems] = useState(player.gems);
  const [energy, setEnergy] = useState(player.energy);

  const updateStatsMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${API_URL}/api/admin/players/${player.id}/update-stats`,
        { gold, gems, energy },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      toast.success('Stats updated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'player', player.id] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 border-4 border-yellow-600 p-6 max-w-md w-full">
        <h3 className="text-yellow-400 font-bold text-xl mb-4">Edit Player Stats</h3>
        <div className="space-y-4">
          <div>
            <label className="text-white block mb-2">Gold</label>
            <input
              type="number"
              value={gold}
              onChange={(e) => setGold(parseInt(e.target.value))}
              className="w-full bg-gray-900 text-white p-2 border-2 border-gray-700"
            />
          </div>
          <div>
            <label className="text-white block mb-2">Gems</label>
            <input
              type="number"
              value={gems}
              onChange={(e) => setGems(parseInt(e.target.value))}
              className="w-full bg-gray-900 text-white p-2 border-2 border-gray-700"
            />
          </div>
          <div>
            <label className="text-white block mb-2">Energy</label>
            <input
              type="number"
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value))}
              max={player.maxEnergy}
              className="w-full bg-gray-900 text-white p-2 border-2 border-gray-700"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => updateStatsMutation.mutate()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2"
            >
              Update Stats
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
