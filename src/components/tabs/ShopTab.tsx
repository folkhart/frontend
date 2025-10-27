import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { shopApi } from '@/lib/api';
import { ShoppingBag, RefreshCw, Coins, Gem } from 'lucide-react';
import { getRarityColor, getRarityBorder } from '@/utils/format';

// Shop item interface removed - using 'any' type for flexibility

export default function ShopTab() {
  const queryClient = useQueryClient();
  const { player, setPlayer, character } = useGameStore();
  const [dailyGemsClaimed, setDailyGemsClaimed] = useState(false);
  const refreshCost = 50; // gems

  // Fetch shop items from backend
  const { data: shopItems, isLoading } = useQuery({
    queryKey: ['shop', 'items'],
    queryFn: async () => {
      const { data } = await shopApi.getItems();
      return data;
    },
  });

  const buyMutation = useMutation({
    mutationFn: async ({ itemId, currency, price }: { itemId: string; currency: 'gold' | 'gems'; price: number }) => {
      const { data } = await shopApi.buy(itemId, currency, price);
      return data;
    },
    onSuccess: async (data) => {
      // Update player state
      setPlayer(data.player);
      // Refresh inventory and shop
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      await queryClient.invalidateQueries({ queryKey: ['shop', 'items'] });
      (window as any).showToast?.(data.message, 'success');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Purchase failed', 'error');
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const { data } = await shopApi.refresh();
      return data;
    },
    onSuccess: async (data) => {
      setPlayer(data.player);
      await queryClient.invalidateQueries({ queryKey: ['shop', 'items'] });
      (window as any).showToast?.(data.message, 'success');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Not enough gems', 'error');
    },
  });

  useEffect(() => {
    // Check if we can claim daily gems
    const lastClaim = localStorage.getItem('lastDailyGemClaim');
    const now = new Date();
    const today = now.toDateString();
    
    if (lastClaim !== today) {
      setDailyGemsClaimed(false);
    } else {
      setDailyGemsClaimed(true);
    }
  }, []);

  const getItemImage = (spriteId: string, itemType?: string) => {
    if (!spriteId) return null;
    
    try {
      // Check if it's a potion (numeric sprite ID)
      if (/^\d+$/.test(spriteId)) {
        const num = parseInt(spriteId);
        if (num >= 985 && num <= 992) {
          return new URL(`../../assets/items/potions/hp/${spriteId}.png`, import.meta.url).href;
        } else if (num >= 1001 && num <= 1008) {
          return new URL(`../../assets/items/potions/mp/${spriteId}.png`, import.meta.url).href;
        } else if (num >= 1033 && num <= 1040) {
          return new URL(`../../assets/items/potions/attack/${spriteId}.png`, import.meta.url).href;
        }
      }
      
      // Determine folder based on item type
      let folder = 'weapons'; // default
      if (itemType === 'Armor') {
        folder = 'armors';
      } else if (itemType === 'Accessory') {
        folder = 'accessories';
      }
      
      return new URL(`../../assets/items/${folder}/${spriteId}.png`, import.meta.url).href;
    } catch (e) {
      console.error('Failed to load image:', spriteId, itemType, e);
      return null;
    }
  };

  const handleBuy = (item: any) => {
    buyMutation.mutate({ itemId: item.id, currency: item.currency, price: item.price });
  };

  const handleRefresh = () => {
    if (player && player.gems >= refreshCost) {
      refreshMutation.mutate();
    }
  };

  const claimDailyGems = () => {
    if (player && !dailyGemsClaimed) {
      const now = new Date();
      localStorage.setItem('lastDailyGemClaim', now.toDateString());
      setDailyGemsClaimed(true);
      
      // Update player gems
      setPlayer({ ...player, gems: player.gems + 10 });
      // TODO: Update on backend
    }
  };

  if (!player) return null;

  return (
    <div className="p-3 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShoppingBag size={20} />
          Personal Shop
        </h2>
        {character && (
          <div className="text-right">
            <p className="text-xs text-gray-400">For {character.class}</p>
            <p className="text-xs text-amber-400">✨ Personalized</p>
          </div>
        )}
      </div>

      {/* Daily Free Gems */}
      <button
        onClick={claimDailyGems}
        disabled={dailyGemsClaimed}
        className="w-full mb-2 py-3 bg-green-700 hover:bg-green-600 text-white font-bold transition relative overflow-hidden disabled:opacity-50 disabled:grayscale"
        style={{
          border: '3px solid #15803d',
          borderRadius: '0',
          boxShadow: dailyGemsClaimed ? 'none' : '0 3px 0 #166534, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
          textShadow: '1px 1px 0 #000',
          fontFamily: 'monospace',
          letterSpacing: '1px'
        }}
      >
        <Gem size={16} className="inline mr-2" />
        <span className="relative z-10">{dailyGemsClaimed ? 'DAILY GEMS CLAIMED!' : '🎁 CLAIM 10 FREE GEMS!'}</span>
        {!dailyGemsClaimed && <div className="absolute inset-0 bg-gradient-to-b from-green-400/20 to-transparent"></div>}
      </button>

      {/* Manual Refresh Button */}
      <button
        onClick={handleRefresh}
        disabled={player.gems < refreshCost || refreshMutation.isPending}
        className="w-full mb-3 py-3 bg-purple-700 hover:bg-purple-600 text-white font-bold transition relative overflow-hidden disabled:opacity-50"
        style={{
          border: '3px solid #6b21a8',
          borderRadius: '0',
          boxShadow: '0 3px 0 #7e22ce, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
          textShadow: '1px 1px 0 #000',
          fontFamily: 'monospace',
          letterSpacing: '1px'
        }}
      >
        <RefreshCw size={16} className={`inline mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
        <span className="relative z-10">🔄 REFRESH SHOP ({refreshCost} 💎)</span>
        <div className="absolute inset-0 bg-gradient-to-b from-purple-400/20 to-transparent"></div>
      </button>

      {/* Shop Items Grid */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading shop...</div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
        {shopItems?.map((shopItem: any) => {
          const item = shopItem.item;
          return (
          <div
            key={shopItem.id}
            className={`p-2 bg-stone-800 rounded-lg border-2 ${getRarityBorder(item.rarity)} relative`}
          >
            {/* Item Image */}
            <div className="w-full aspect-square bg-stone-900 rounded mb-2 flex items-center justify-center p-3">
              {getItemImage(item.spriteId, item.type) ? (
                <img 
                  src={getItemImage(item.spriteId, item.type)!} 
                  alt={item.name}
                  className="max-w-[48px] max-h-[48px] object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <span className="text-2xl">
                  {item.type === 'Weapon' && '⚔️'}
                  {item.type === 'Armor' && '🛡️'}
                  {item.type === 'Accessory' && '💍'}
                  {item.type === 'Consumable' && '🧪'}
                </span>
              )}
            </div>

            {/* Item Info */}
            <h3 className={`font-bold text-xs mb-1 truncate ${getRarityColor(item.rarity)}`}>
              {item.name}
            </h3>

            {/* Stats */}
            <div className="text-xs text-gray-400 mb-2 flex flex-wrap gap-1 min-h-[16px]">
              {item.attackBonus > 0 && <span className="text-orange-400">ATK +{item.attackBonus}</span>}
              {item.defenseBonus > 0 && <span className="text-blue-400">DEF +{item.defenseBonus}</span>}
              {item.healthBonus > 0 && <span className="text-red-400">HP +{item.healthBonus}</span>}
              {item.speedBonus > 0 && <span className="text-green-400">SPD +{item.speedBonus}</span>}
            </div>

            {/* Buy Button */}
            {shopItem.purchased ? (
              <button
                disabled
                className="w-full py-1.5 text-white text-xs font-bold rounded transition flex items-center justify-center gap-1 bg-gray-600 opacity-50 cursor-not-allowed"
              >
                ✓ ALREADY BOUGHT
              </button>
            ) : (
              <button
                onClick={() => handleBuy(shopItem)}
                disabled={
                  buyMutation.isPending ||
                  (shopItem.currency === 'gold' ? player.gold < shopItem.price : player.gems < shopItem.price)
                }
                className={`w-full py-1.5 text-white text-xs font-bold rounded transition flex items-center justify-center gap-1 ${
                  shopItem.currency === 'gold'
                    ? 'bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800'
                    : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
                } disabled:opacity-50`}
              >
                {shopItem.currency === 'gold' ? <Coins size={12} /> : <Gem size={12} />}
                {shopItem.price}
              </button>
            )}
          </div>
        );
        })}
      </div>
      )}
    </div>
  );
}
