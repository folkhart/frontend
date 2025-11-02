import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Package, ShoppingBag, Plus, Trash2, Newspaper, Database, Download, Upload, RefreshCw, BarChart3, Calendar } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { getRarityColor } from '@/utils/format';
import AdminNewsTab from './AdminNewsTab';
import AnalyticsDashboard from '../admin/AnalyticsDashboard';
import PlayersList from '../admin/PlayersList';
import PlayerDetailView from '../admin/PlayerDetailView';
import DailyLoginRewardsEditor from '../admin/DailyLoginRewardsEditor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// API functions
const adminApi = {
  getPlayers: () => fetch(`${API_URL}/api/admin/players`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
  }).then(r => r.json()),
  
  getItems: () => fetch(`${API_URL}/api/admin/items`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
  }).then(r => r.json()),
  
  getShopItems: () => fetch(`${API_URL}/api/admin/shop-items`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
  }).then(r => r.json()),
  
  addShopItem: (data: any) => fetch(`${API_URL}/api/admin/shop-items`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  deleteShopItem: (id: string) => fetch(`${API_URL}/api/admin/shop-items/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
  }).then(r => r.json()),
  
  createItem: (data: any) => fetch(`${API_URL}/api/admin/items`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  giveItemToPlayer: (playerId: string, itemId: string, quantity: number) => fetch(`${API_URL}/api/admin/players/${playerId}/give-item`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ itemId, quantity })
  }).then(r => r.json()),

  // Backup API
  getBackups: () => fetch(`${API_URL}/api/backup/list`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
  }).then(r => r.json()),
  
  createBackup: () => fetch(`${API_URL}/api/backup/create`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
  }).then(r => r.json()),
  
  restoreBackup: (filename: string) => fetch(`${API_URL}/api/backup/restore/${filename}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
  }).then(r => r.json()),
  
  deleteBackup: (filename: string) => fetch(`${API_URL}/api/backup/${filename}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
  }).then(r => r.json()),

  downloadBackup: async (filename: string) => {
    const response = await fetch(`${API_URL}/api/backup/download/${filename}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to download backup');
    }
    
    // Create blob and trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};

export default function AdminTab() {
  const queryClient = useQueryClient();
  const { player } = useGameStore();
  const [activeTab, setActiveTab] = useState<'analytics' | 'players' | 'items' | 'shop' | 'news' | 'backups' | 'rewards'>('analytics');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [price, setPrice] = useState('100');
  const [currency, setCurrency] = useState<'gold' | 'gems'>('gold');

  // Queries
  const { data: players } = useQuery({
    queryKey: ['admin', 'players'],
    queryFn: adminApi.getPlayers,
    enabled: activeTab === 'players',
  });

  const { data: items } = useQuery({
    queryKey: ['admin', 'items'],
    queryFn: adminApi.getItems,
    enabled: activeTab === 'items' || showAddItem,
  });

  const { data: shopItems } = useQuery({
    queryKey: ['admin', 'shop-items'],
    queryFn: adminApi.getShopItems,
    enabled: activeTab === 'shop',
  });

  // Mutations
  const addShopItemMutation = useMutation({
    mutationFn: adminApi.addShopItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shop-items'] });
      setShowAddItem(false);
      setSelectedItem(null);
      (window as any).showToast?.('Item added to shop!', 'success');
    },
  });

  const deleteShopItemMutation = useMutation({
    mutationFn: adminApi.deleteShopItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shop-items'] });
      (window as any).showToast?.('Item removed from shop!', 'success');
    },
  });

  const handleAddToShop = () => {
    if (!selectedItem) return;
    addShopItemMutation.mutate({
      itemId: selectedItem.id,
      price: parseInt(price),
      currency,
      stock: -1,
    });
  };

  // Check if user is admin (you'll need to add this to player data)
  if (!player) return null;

  return (
    <div className="p-3 pb-20">
      <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        🛡️ Admin Dashboard
      </h2>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setActiveTab('analytics');
            setSelectedPlayerId(null);
          }}
          className={`flex-1 py-2 font-bold transition relative overflow-hidden ${
            activeTab === 'analytics'
              ? 'bg-cyan-700 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{
            border: '2px solid #0e7490',
            borderRadius: '0',
            boxShadow: activeTab === 'analytics' ? '0 2px 0 #155e75, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: activeTab === 'analytics' ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          <BarChart3 size={16} className="inline mr-1" />
          Analytics
        </button>
        <button
          onClick={() => {
            setActiveTab('players');
            setSelectedPlayerId(null);
          }}
          className={`flex-1 py-2 font-bold transition relative overflow-hidden ${
            activeTab === 'players'
              ? 'bg-blue-700 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{
            border: '2px solid #1e3a8a',
            borderRadius: '0',
            boxShadow: activeTab === 'players' ? '0 2px 0 #1e40af, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: activeTab === 'players' ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          <Users size={16} className="inline mr-1" />
          Players
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`flex-1 py-2 font-bold transition relative overflow-hidden ${
            activeTab === 'items'
              ? 'bg-purple-700 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{
            border: '2px solid #6b21a8',
            borderRadius: '0',
            boxShadow: activeTab === 'items' ? '0 2px 0 #7e22ce, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: activeTab === 'items' ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          <Package size={16} className="inline mr-1" />
          Items
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex-1 py-2 font-bold transition relative overflow-hidden ${
            activeTab === 'shop'
              ? 'bg-amber-700 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{
            border: '2px solid #92400e',
            borderRadius: '0',
            boxShadow: activeTab === 'shop' ? '0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: activeTab === 'shop' ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          <ShoppingBag size={16} className="inline mr-1" />
          Shop
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`flex-1 py-2 font-bold transition relative overflow-hidden ${
            activeTab === 'news'
              ? 'bg-green-700 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{
            border: '2px solid #15803d',
            borderRadius: '0',
            boxShadow: activeTab === 'news' ? '0 2px 0 #166534, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: activeTab === 'news' ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          <Newspaper size={16} className="inline mr-1" />
          News
        </button>
        <button
          onClick={() => setActiveTab('backups')}
          className={`flex-1 py-2 font-bold transition relative overflow-hidden ${
            activeTab === 'backups'
              ? 'bg-red-700 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{
            border: '2px solid #991b1b',
            borderRadius: '0',
            boxShadow: activeTab === 'backups' ? '0 2px 0 #b91c1c, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: activeTab === 'backups' ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          <Database size={16} className="inline mr-1" />
          Backups
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex-1 py-2 font-bold transition relative overflow-hidden ${
            activeTab === 'rewards'
              ? 'bg-purple-700 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{
            border: '2px solid #7e22ce',
            borderRadius: '0',
            boxShadow: activeTab === 'rewards' ? '0 2px 0 #9333ea, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: activeTab === 'rewards' ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          <Calendar size={16} className="inline mr-1" />
          Daily Rewards
        </button>
      </div>

      {/* Analytics Dashboard */}
      {activeTab === 'analytics' && <AnalyticsDashboard />}

      {/* Players Tab */}
      {activeTab === 'players' && !selectedPlayerId && (
        <PlayersList onSelectPlayer={setSelectedPlayerId} />
      )}

      {/* Player Detail View */}
      {selectedPlayerId && (
        <PlayerDetailView
          playerId={selectedPlayerId}
          onBack={() => setSelectedPlayerId(null)}
        />
      )}

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400 mb-2">Total Items: {items?.length || 0}</p>
          <div className="grid grid-cols-2 gap-2">
            {items?.map((item: any) => (
              <div key={item.id} className="bg-stone-800 border-2 border-stone-700 p-2" style={{ borderRadius: '0' }}>
                <p className={`font-bold text-xs truncate ${getRarityColor(item.rarity)}`}>
                  {item.name}
                </p>
                <p className="text-xs text-gray-400">{item.type}</p>
                <div className="text-xs mt-1">
                  {item.attackBonus > 0 && <span className="text-orange-400">ATK +{item.attackBonus} </span>}
                  {item.defenseBonus > 0 && <span className="text-blue-400">DEF +{item.defenseBonus} </span>}
                  {item.healthBonus > 0 && <span className="text-red-400">HP +{item.healthBonus}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shop Management Tab */}
      {activeTab === 'shop' && (
        <div>
          <button
            onClick={() => setShowAddItem(true)}
            className="w-full mb-3 py-3 bg-green-700 hover:bg-green-600 text-white font-bold transition relative overflow-hidden"
            style={{
              border: '3px solid #15803d',
              borderRadius: '0',
              boxShadow: '0 3px 0 #166534, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
              textShadow: '1px 1px 0 #000',
              fontFamily: 'monospace',
            }}
          >
            <Plus size={16} className="inline mr-2" />
            ADD ITEM TO SHOP
          </button>

          <div className="space-y-2">
            {shopItems?.map((shopItem: any) => (
              <div key={shopItem.id} className="bg-stone-800 border-2 border-amber-600 p-3 flex justify-between items-center" style={{ borderRadius: '0' }}>
                <div>
                  <p className={`font-bold ${getRarityColor(shopItem.item.rarity)}`}>
                    {shopItem.item.name}
                  </p>
                  <p className="text-sm">
                    {shopItem.currency === 'gold' ? '💰' : '💎'} {shopItem.price}
                  </p>
                </div>
                <button
                  onClick={() => deleteShopItemMutation.mutate(shopItem.id)}
                  className="p-2 bg-red-700 hover:bg-red-600 text-white"
                  style={{ border: '2px solid #7f1d1d', borderRadius: '0' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-800 border-4 border-amber-600 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" style={{ borderRadius: '0' }}>
            <h3 className="text-xl font-bold text-white mb-4">Add Item to Shop</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Price</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2 bg-stone-900 text-white border-2 border-stone-700"
                style={{ borderRadius: '0' }}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Currency</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrency('gold')}
                  className={`flex-1 py-2 ${currency === 'gold' ? 'bg-yellow-700' : 'bg-stone-700'}`}
                  style={{ border: '2px solid #92400e', borderRadius: '0' }}
                >
                  💰 Gold
                </button>
                <button
                  onClick={() => setCurrency('gems')}
                  className={`flex-1 py-2 ${currency === 'gems' ? 'bg-purple-700' : 'bg-stone-700'}`}
                  style={{ border: '2px solid #6b21a8', borderRadius: '0' }}
                >
                  💎 Gems
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-2">Select Item:</p>
            <div className="grid grid-cols-2 gap-2 mb-4 max-h-60 overflow-y-auto">
              {items?.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-2 text-left ${selectedItem?.id === item.id ? 'bg-amber-700 border-amber-500' : 'bg-stone-900 border-stone-700'} border-2`}
                  style={{ borderRadius: '0' }}
                >
                  <p className={`font-bold text-xs ${getRarityColor(item.rarity)}`}>{item.name}</p>
                  <p className="text-xs text-gray-400">{item.type}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddToShop}
                disabled={!selectedItem || addShopItemMutation.isPending}
                className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white font-bold disabled:opacity-50"
                style={{ border: '2px solid #15803d', borderRadius: '0' }}
              >
                Add to Shop
              </button>
              <button
                onClick={() => {
                  setShowAddItem(false);
                  setSelectedItem(null);
                }}
                className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white font-bold"
                style={{ border: '2px solid #7f1d1d', borderRadius: '0' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* News Tab */}
      {activeTab === 'news' && <AdminNewsTab />}

      {/* Backups Tab */}
      {activeTab === 'backups' && <BackupsTab />}

      {/* Daily Login Rewards Tab */}
      {activeTab === 'rewards' && <DailyLoginRewardsEditor />}
    </div>
  );
}

// Backups Tab Component
function BackupsTab() {
  const queryClient = useQueryClient();
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);

  const { data: backups, isLoading } = useQuery({
    queryKey: ['admin', 'backups'],
    queryFn: adminApi.getBackups,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const createBackupMutation = useMutation({
    mutationFn: adminApi.createBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'backups'] });
      (window as any).showToast?.('✅ Backup created successfully!', 'success');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.message || 'Failed to create backup', 'error');
    },
  });

  const restoreBackupMutation = useMutation({
    mutationFn: (filename: string) => adminApi.restoreBackup(filename),
    onSuccess: () => {
      setShowRestoreConfirm(null);
      (window as any).showToast?.('✅ Database restored! Please refresh the page.', 'success');
      setTimeout(() => window.location.reload(), 2000);
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.message || 'Failed to restore backup', 'error');
    },
  });

  const deleteBackupMutation = useMutation({
    mutationFn: (filename: string) => adminApi.deleteBackup(filename),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'backups'] });
      (window as any).showToast?.('🗑️ Backup deleted', 'info');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.message || 'Failed to delete backup', 'error');
    },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const formatSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-4">
      <div className="bg-stone-800 border-2 border-red-600 p-4" style={{ borderRadius: '0' }}>
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Database className="text-red-400" />
          Database Backup System (JSON Format)
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Automatic daily backups run at 3 AM. Backups are saved as JSON files. Download backups to keep them safe off-server. Keep up to 30 days of backups.
        </p>
        <button
          onClick={() => createBackupMutation.mutate()}
          disabled={createBackupMutation.isPending}
          className="py-2 px-4 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold flex items-center gap-2"
          style={{ border: '2px solid #15803d', borderRadius: '0' }}
        >
          <RefreshCw size={16} className={createBackupMutation.isPending ? 'animate-spin' : ''} />
          {createBackupMutation.isPending ? 'Creating Backup...' : 'Create Backup Now'}
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-center py-4">Loading backups...</p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-400">Available Backups: {backups?.length || 0}</p>
          {backups && backups.length === 0 && (
            <p className="text-center text-gray-500 py-8">No backups available yet.</p>
          )}
          {backups?.map((backup: any) => (
            <div
              key={backup.filename}
              className="bg-stone-800 border-2 border-stone-700 p-3"
              style={{ borderRadius: '0' }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-bold text-white font-mono text-sm">{backup.filename}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(backup.date)} · {formatSize(backup.size)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await adminApi.downloadBackup(backup.filename);
                        (window as any).showToast?.('📥 Download started!', 'success');
                      } catch (error: any) {
                        (window as any).showToast?.(error.message || 'Download failed', 'error');
                      }
                    }}
                    className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white font-bold text-xs flex items-center gap-1"
                    style={{ border: '2px solid #15803d', borderRadius: '0' }}
                  >
                    <Download size={14} />
                    Download
                  </button>
                  <button
                    onClick={() => setShowRestoreConfirm(backup.filename)}
                    className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1"
                    style={{ border: '2px solid #1e40af', borderRadius: '0' }}
                  >
                    <Upload size={14} />
                    Restore
                  </button>
                  <button
                    onClick={() => deleteBackupMutation.mutate(backup.filename)}
                    disabled={deleteBackupMutation.isPending}
                    className="px-3 py-1 bg-red-700 hover:bg-red-600 disabled:bg-gray-600 text-white font-bold text-xs flex items-center gap-1"
                    style={{ border: '2px solid #991b1b', borderRadius: '0' }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-stone-800 border-4 border-red-600 p-6 max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">⚠️ Confirm Restore</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to restore from this backup?
            </p>
            <p className="text-red-400 font-bold mb-4 text-sm">
              WARNING: This will replace ALL current data with the backup!
            </p>
            <p className="text-xs text-gray-400 mb-4 font-mono">{showRestoreConfirm}</p>
            <div className="flex gap-2">
              <button
                onClick={() => restoreBackupMutation.mutate(showRestoreConfirm)}
                disabled={restoreBackupMutation.isPending}
                className="flex-1 py-2 bg-red-700 hover:bg-red-600 disabled:bg-gray-600 text-white font-bold"
                style={{ border: '2px solid #991b1b', borderRadius: '0' }}
              >
                {restoreBackupMutation.isPending ? 'Restoring...' : 'Yes, Restore'}
              </button>
              <button
                onClick={() => setShowRestoreConfirm(null)}
                disabled={restoreBackupMutation.isPending}
                className="flex-1 py-2 bg-stone-700 hover:bg-stone-600 text-white font-bold"
                style={{ border: '2px solid #374151', borderRadius: '0' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
