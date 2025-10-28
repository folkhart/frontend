import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guildApi } from '@/lib/api';
import { ShoppingCart, Lock, Star, Coins } from 'lucide-react';

interface ShopItem {
  id: string;
  itemId: string;
  category: string;
  guildCoinCost: number;
  minGuildLevel: number;
  isAvailable: boolean;
  item: {
    id: string;
    name: string;
    description: string;
    type: string;
    rarity: string;
    spriteId: string;
    attackBonus: number;
    defenseBonus: number;
    healthBonus: number;
    speedBonus: number;
    classRestriction?: string;
  };
}

interface GuildShopProps {
  guild: any;
}

export default function GuildShop({ guild }: GuildShopProps) {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('Weapon');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertAmount, setConvertAmount] = useState('');

  const categories = ['Weapon', 'Armor', 'Armor Piece', 'Accessory', 'Chest', 'Key'];

  // Fetch shop items
  const { data: shopItems = [] } = useQuery<ShopItem[]>({
    queryKey: ['guildShop', selectedCategory],
    queryFn: async () => {
      const { data } = await guildApi.getShopItems(selectedCategory);
      return data;
    },
  });

  // Convert gold mutation
  const convertMutation = useMutation({
    mutationFn: async (amount: number) => {
      const { data } = await guildApi.convertGoldToCoins(amount);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGuild'] });
      queryClient.invalidateQueries({ queryKey: ['player'] });
      (window as any).showToast?.('Gold converted to guild coins!', 'success');
      setShowConvertModal(false);
      setConvertAmount('');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Conversion failed', 'error');
    },
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (shopItemId: string) => {
      const { data } = await guildApi.purchaseShopItem(shopItemId);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myGuild'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      (window as any).showToast?.(
        `Purchased ${data.item.name}! Added to inventory.`,
        'success'
      );
      setShowPurchaseModal(false);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Purchase failed', 'error');
    },
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'text-gray-400 border-gray-600';
      case 'Uncommon': return 'text-green-400 border-green-600';
      case 'Rare': return 'text-blue-400 border-blue-600';
      case 'Epic': return 'text-purple-400 border-purple-600';
      case 'Legendary': return 'text-amber-400 border-amber-600';
      default: return 'text-gray-400 border-gray-600';
    }
  };

  const canPurchase = (item: ShopItem) => {
    return guild.level >= item.minGuildLevel && guild.guildCoins >= item.guildCoinCost;
  };

  const handleConvert = () => {
    const amount = parseInt(convertAmount);
    if (isNaN(amount) || amount < 100 || amount % 100 !== 0) {
      (window as any).showToast?.('Amount must be at least 100 and divisible by 100', 'error');
      return;
    }
    convertMutation.mutate(amount);
  };

  return (
    <div className="p-3 pb-20">
      {/* Header with Guild Coins */}
      <div className="bg-stone-800 border-2 border-amber-600 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Coins className="text-amber-400" size={24} />
            <div>
              <div className="text-2xl font-bold text-amber-400">
                {guild.guildCoins.toLocaleString()} GC
              </div>
              <div className="text-xs text-gray-400">Guild Coins</div>
            </div>
          </div>
          <button
            onClick={() => setShowConvertModal(true)}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white font-bold text-sm"
            style={{
              border: '2px solid #15803d',
              boxShadow: '0 2px 0 #166534',
              fontFamily: 'monospace',
            }}
          >
            💰 CONVERT GOLD
          </button>
        </div>
        <div className="text-xs text-gray-400">
          Conversion Rate: 100 Gold = 1 Guild Coin
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-2 text-sm font-bold whitespace-nowrap transition ${
              selectedCategory === category
                ? 'bg-amber-600 text-white'
                : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
            }`}
            style={{
              border: '2px solid #92400e',
              fontFamily: 'monospace',
            }}
          >
            {category.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Shop Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {shopItems.map((shopItem) => {
          const locked = !canPurchase(shopItem);
          const levelLocked = guild.level < shopItem.minGuildLevel;

          return (
            <div
              key={shopItem.id}
              className={`bg-stone-800 border-2 ${getRarityColor(shopItem.item.rarity)} p-3 ${
                locked ? 'opacity-60' : 'hover:bg-stone-700 cursor-pointer'
              }`}
              onClick={() => {
                if (!locked) {
                  setSelectedItem(shopItem);
                  setShowPurchaseModal(true);
                }
              }}
            >
              <div className="flex gap-3">
                {/* Item Sprite */}
                <div className="w-16 h-16 bg-stone-900 border border-stone-700 flex items-center justify-center relative">
                  <img
                    src={`/assets/items/guildshop_items/${shopItem.item.spriteId}.png`}
                    alt={shopItem.item.name}
                    className="w-12 h-12"
                    style={{ imageRendering: 'pixelated' }}
                    onError={(e) => {
                      e.currentTarget.src = '/assets/items/placeholder.png';
                    }}
                  />
                  {locked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Lock size={20} className="text-red-400" />
                    </div>
                  )}
                </div>

                {/* Item Info */}
                <div className="flex-1">
                  <div className={`font-bold text-sm ${getRarityColor(shopItem.item.rarity)}`}>
                    {shopItem.item.name}
                  </div>
                  <div className="text-xs text-gray-400 mb-2">
                    {shopItem.item.description}
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-2 text-xs mb-2">
                    {shopItem.item.attackBonus > 0 && (
                      <span className="text-red-400">⚔️ +{shopItem.item.attackBonus}</span>
                    )}
                    {shopItem.item.defenseBonus > 0 && (
                      <span className="text-blue-400">🛡️ +{shopItem.item.defenseBonus}</span>
                    )}
                    {shopItem.item.healthBonus > 0 && (
                      <span className="text-green-400">❤️ +{shopItem.item.healthBonus}</span>
                    )}
                    {shopItem.item.speedBonus > 0 && (
                      <span className="text-yellow-400">⚡ +{shopItem.item.speedBonus}</span>
                    )}
                  </div>

                  {/* Cost and Requirements */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                      <Coins size={14} />
                      {shopItem.guildCoinCost} GC
                    </div>
                    {levelLocked && (
                      <div className="text-xs text-red-400">
                        Lvl {shopItem.minGuildLevel} Required
                      </div>
                    )}
                  </div>

                  {shopItem.item.classRestriction && (
                    <div className="text-xs text-purple-400 mt-1">
                      {shopItem.item.classRestriction} Only
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {shopItems.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No items available in this category
        </div>
      )}

      {/* Purchase Confirmation Modal */}
      {showPurchaseModal && selectedItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-800 border-2 border-amber-600 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ShoppingCart size={20} />
              Confirm Purchase
            </h3>

            <div className="mb-4">
              <div className={`font-bold ${getRarityColor(selectedItem.item.rarity)} mb-2`}>
                {selectedItem.item.name}
              </div>
              <div className="text-sm text-gray-300 mb-3">
                {selectedItem.item.description}
              </div>

              <div className="bg-stone-900 p-3 rounded mb-3">
                <div className="text-sm text-gray-400 mb-2">Stats:</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {selectedItem.item.attackBonus > 0 && (
                    <div className="text-red-400">Attack: +{selectedItem.item.attackBonus}</div>
                  )}
                  {selectedItem.item.defenseBonus > 0 && (
                    <div className="text-blue-400">Defense: +{selectedItem.item.defenseBonus}</div>
                  )}
                  {selectedItem.item.healthBonus > 0 && (
                    <div className="text-green-400">Health: +{selectedItem.item.healthBonus}</div>
                  )}
                  {selectedItem.item.speedBonus > 0 && (
                    <div className="text-yellow-400">Speed: +{selectedItem.item.speedBonus}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-lg font-bold">
                <span className="text-gray-300">Cost:</span>
                <span className="text-amber-400 flex items-center gap-1">
                  <Coins size={18} />
                  {selectedItem.guildCoinCost} GC
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPurchaseModal(false);
                  setSelectedItem(null);
                }}
                className="flex-1 py-2 bg-stone-700 hover:bg-stone-600 text-white font-bold"
                style={{
                  border: '2px solid #44403c',
                  fontFamily: 'monospace',
                }}
              >
                CANCEL
              </button>
              <button
                onClick={() => purchaseMutation.mutate(selectedItem.id)}
                disabled={purchaseMutation.isPending}
                className="flex-1 py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold"
                style={{
                  border: '2px solid #15803d',
                  fontFamily: 'monospace',
                }}
              >
                {purchaseMutation.isPending ? 'PURCHASING...' : 'PURCHASE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Gold Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-800 border-2 border-green-600 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Coins size={20} className="text-amber-400" />
              Convert Gold to Guild Coins
            </h3>

            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-2">
                Conversion Rate: 100 Gold = 1 Guild Coin
              </div>
              <input
                type="number"
                value={convertAmount}
                onChange={(e) => setConvertAmount(e.target.value)}
                placeholder="Enter gold amount (min 100)"
                step="100"
                min="100"
                className="w-full px-3 py-2 bg-stone-900 border-2 border-stone-700 text-white"
                style={{ fontFamily: 'monospace' }}
              />
              {convertAmount && parseInt(convertAmount) >= 100 && (
                <div className="text-sm text-green-400 mt-2">
                  Will receive: {Math.floor(parseInt(convertAmount) / 100)} Guild Coins
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowConvertModal(false);
                  setConvertAmount('');
                }}
                className="flex-1 py-2 bg-stone-700 hover:bg-stone-600 text-white font-bold"
                style={{
                  border: '2px solid #44403c',
                  fontFamily: 'monospace',
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleConvert}
                disabled={convertMutation.isPending}
                className="flex-1 py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold"
                style={{
                  border: '2px solid #15803d',
                  fontFamily: 'monospace',
                }}
              >
                {convertMutation.isPending ? 'CONVERTING...' : 'CONVERT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
