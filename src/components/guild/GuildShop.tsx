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
    onSuccess: (data: any) => {
      // Immediately update guild coins and guild gold in UI
      if (guild) {
        queryClient.setQueryData(['myGuild'], (old: any) => ({
          ...old,
          guildCoins: data.newGuildCoins,
          guildGold: data.newGuildGold,
        }));
      }
      
      queryClient.invalidateQueries({ queryKey: ['myGuild'] });
      queryClient.invalidateQueries({ queryKey: ['player'] });
      (window as any).showToast?.(
        `Converted! +${data.coinsReceived} GC | +${data.guildGoldDonated} Guild Gold (5%)`,
        'success'
      );
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
      // Immediately update guild coins in UI
      if (guild && data.remainingCoins !== undefined) {
        queryClient.setQueryData(['myGuild'], (old: any) => ({
          ...old,
          guildCoins: data.remainingCoins,
        }));
      }
      
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

  const getItemSpritePath = (category: string, spriteId: string) => {
    console.log('🖼️ Building sprite path for:', { category, spriteId });
    
    // Map database spriteIds to actual file names
    const tierMap: { [key: string]: string } = {
      'bronze': '1',
      'silver': '2', 
      'gold': '3',
      'diamond': '4',
    };

    // Transform spriteId based on tier
    let fileName = spriteId;
    for (const [tier, number] of Object.entries(tierMap)) {
      if (spriteId.includes(`_${tier}`)) {
        fileName = spriteId.replace(`_${tier}`, number);
        break;
      }
    }

    // Specific transformations for each item type
    // WEAPONS
    if (fileName.startsWith('guild_sword')) {
      fileName = fileName.replace('guild_sword', 'guildsword');
      return `/assets/items/guildshop_items/weapons/guild_sword/${fileName}.png`;
    }
    if (fileName.startsWith('guild_bow')) {
      return `/assets/items/guildshop_items/weapons/guild_bow/${fileName}.png`;
    }
    if (fileName.startsWith('guild_dagger')) {
      return `/assets/items/guildshop_items/weapons/guild_dagger/${fileName}.png`;
    }
    if (fileName.startsWith('guild_shield')) {
      return `/assets/items/guildshop_items/weapons/guild_shield/${fileName}.png`;
    }
    if (fileName.startsWith('guild_staff')) {
      return `/assets/items/guildshop_items/weapons/guild_staff/${fileName}.png`;
    }

    // ARMORS
    if (fileName.includes('cleric')) {
      fileName = fileName.replace('cleric_robe', 'guild_clericrobe');
      return `/assets/items/guildshop_items/armors/cleric_robes/${fileName}.png`;
    }
    if (fileName.includes('mage') && fileName.includes('robe')) {
      fileName = fileName.replace('mage_robe', 'guild_robe');
      return `/assets/items/guildshop_items/armors/mage_robes/${fileName}.png`;
    }
    if (fileName.includes('armor')) {
      // guild_armor1 → warrior_armors folder
      return `/assets/items/guildshop_items/armors/warrior_armors/${fileName}.png`;
    }

    // ARMOR PIECES
    if (fileName.includes('glove')) {
      // guild_glove1 → gloves/guild_glove1.png
      return `/assets/items/guildshop_items/guild_armor_pieces/gloves/${fileName}.png`;
    }
    if (fileName.includes('shoe') || fileName.includes('boot')) {
      // guild_shoe1 → guild_shoes1.png (files are named guild_shoes#.png with 's')
      fileName = fileName.replace('guild_boot', 'guild_shoes').replace('guild_shoe', 'guild_shoes');
      return `/assets/items/guildshop_items/guild_armor_pieces/shoes/${fileName}.png`;
    }

    // CHESTS AND KEYS
    if (category === 'Chest') {
      // guild_chest1 → Chest1.png (extract number, capitalize C)
      const num = fileName.replace('guild_chest', '');
      return `/assets/items/guildshop_items/chests_and_keys/Chest${num}.png`;
    }
    if (category === 'Key') {
      // guild_key → key1.png
      return `/assets/items/guildshop_items/chests_and_keys/key1.png`;
    }

    // ACCESSORIES (use Icon##.png format)
    // guild_belt → Icon27.png in belts folder
    if (fileName === 'guild_belt') {
      return `/assets/items/guildshop_items/guild_accessories/belts/Icon27.png`;
    }
    // guild_earring → Icon12.png in earrings folder
    if (fileName === 'guild_earring') {
      return `/assets/items/guildshop_items/guild_accessories/earrings/Icon12.png`;
    }
    // guild_necklace → Icon29.png in necklaces folder
    if (fileName === 'guild_necklace') {
      return `/assets/items/guildshop_items/guild_accessories/necklaces/Icon29.png`;
    }
    // guild_ring → Icon1.png in rings folder
    if (fileName === 'guild_ring') {
      return `/assets/items/guildshop_items/guild_accessories/rings/Icon1.png`;
    }
    
    // Handle Icon files directly (for other accessories if any)
    if (fileName.startsWith('Icon')) {
      const iconNum = parseInt(fileName.match(/\d+/)?.[0] || '0');
      if (iconNum >= 1 && iconNum <= 11) {
        return `/assets/items/guildshop_items/guild_accessories/rings/${fileName}.png`;
      } else if (iconNum >= 12 && iconNum <= 20) {
        return `/assets/items/guildshop_items/guild_accessories/earrings/${fileName}.png`;
      } else if (iconNum >= 29 && iconNum <= 48) {
        return `/assets/items/guildshop_items/guild_accessories/necklaces/${fileName}.png`;
      } else if (iconNum === 2 || iconNum === 27 || iconNum === 35) {
        return `/assets/items/guildshop_items/guild_accessories/belts/${fileName}.png`;
      }
    }

    console.error('❌ No mapping found for:', { category, spriteId, fileName });
    return '/assets/items/placeholder.png';
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
                    src={getItemSpritePath(shopItem.category, shopItem.item.spriteId)}
                    alt={shopItem.item.name}
                    className="w-12 h-12"
                    style={{ imageRendering: 'pixelated' }}
                    onError={(e) => {
                      const target = e.currentTarget;
                      // Prevent infinite loop
                      if (!target.src.includes('placeholder.png')) {
                        target.src = '/assets/items/placeholder.png';
                      }
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
                <strong>Conversion Rate:</strong> 100 Gold = 1 Guild Coin<br />
                <span className="text-green-400">+5% automatically donated to Guild Gold</span>
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
