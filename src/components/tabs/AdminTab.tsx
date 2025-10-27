import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Package, ShoppingBag, Plus, Trash2 } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { getRarityColor } from '@/utils/format';

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
};

export default function AdminTab() {
  const queryClient = useQueryClient();
  const { player } = useGameStore();
  const [activeTab, setActiveTab] = useState<'players' | 'items' | 'shop'>('players');
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
          onClick={() => setActiveTab('players')}
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
      </div>

      {/* Players Tab */}
      {activeTab === 'players' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400 mb-2">Total Players: {players?.length || 0}</p>
          {players?.map((p: any) => (
            <div key={p.id} className="bg-stone-800 border-2 border-stone-700 p-3" style={{ borderRadius: '0' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-white">{p.username}</p>
                  <p className="text-xs text-gray-400">{p.email}</p>
                  {p.character && (
                    <p className="text-sm text-amber-400 mt-1">
                      Lv.{p.character.level} {p.character.name} ({p.character.class})
                    </p>
                  )}
                </div>
                <div className="text-right text-xs">
                  <p className="text-yellow-400">💰 {p.gold}</p>
                  <p className="text-blue-400">💎 {p.gems}</p>
                  <p className="text-green-400">⚡ {p.energy}/{p.maxEnergy}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
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
    </div>
  );
}
