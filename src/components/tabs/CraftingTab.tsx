import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { craftingApi, inventoryApi, companionApi } from '@/lib/api';
import { getRarityColor } from '@/utils/format';
import { Hammer, Check, Sparkles, X, Grid3x3, List } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import anvilIcon from '@/assets/ui/craft/anvil.png';
import anvilHitIcon from '@/assets/ui/craft/anvil_hit.png';
import anvilSuccessIcon from '@/assets/ui/craft/anvil_successful.png';
import anvilFailIcon from '@/assets/ui/craft/anvil_unsucessful.png';
import recipeLowGrade from '@/assets/ui/craft/craftRecipeLowGrade.png';
import recipeMidGrade from '@/assets/ui/craft/craftRecipeMidGrade.png';
import recipeHighGrade from '@/assets/ui/craft/craftRecipeHighGrade.png';
import petIcon from '@/assets/ui/pet.png';

export default function CraftingTab() {
  const queryClient = useQueryClient();
  const { character, player } = useGameStore();
  const [activeTab, setActiveTab] = useState<'crafting' | 'fuse'>('crafting');
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<number>(0);
  const [craftingAnimation, setCraftingAnimation] = useState<'idle' | 'crafting' | 'success' | 'fail'>('idle');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const getRecipeIcon = (rarity: string) => {
    if (rarity === 'Legendary' || rarity === 'Epic') return recipeHighGrade;
    if (rarity === 'Rare' || rarity === 'Uncommon') return recipeMidGrade;
    return recipeLowGrade;
  };

  const getAnvilIcon = () => {
    if (craftingAnimation === 'success') return anvilSuccessIcon;
    if (craftingAnimation === 'fail') return anvilFailIcon;
    if (craftingAnimation === 'crafting') return anvilHitIcon;
    return anvilIcon;
  };

  const canCraftRecipe = (recipe: any) => {
    // Check level requirement (default to 1 if not specified)
    const requiredLevel = recipe.levelRequirement || 1;
    if (character && character.level < requiredLevel) {
      return false;
    }
    // Check class restriction
    if (recipe.resultItem.classRestriction && character?.class !== recipe.resultItem.classRestriction) {
      return false;
    }
    return true;
  };

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['craftingRecipes'],
    queryFn: async () => {
      const { data } = await craftingApi.getRecipes();
      return data;
    },
  });

  const { data: inventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data } = await inventoryApi.get();
      return data;
    },
  });

  const { data: fusableCompanions } = useQuery({
    queryKey: ['fusableCompanions'],
    queryFn: async () => {
      const { data } = await companionApi.getFusable();
      return data;
    },
    enabled: activeTab === 'fuse',
  });

  const craftMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      setCraftingAnimation('crafting');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Animation delay
      return craftingApi.craft(recipeId);
    },
    onSuccess: (data) => {
      setCraftingAnimation('success');
      // Immediately invalidate and refetch inventory and character
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.refetchQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      queryClient.refetchQueries({ queryKey: ['character'] });
      
      setTimeout(() => {
        (window as any).showToast?.(
          `Crafted ${data.data.craftedItem.name}!`,
          'success'
        );
        setSelectedRecipe(null);
        setCraftingAnimation('idle');
      }, 1500);
    },
    onError: (error: any) => {
      setCraftingAnimation('fail');
      setTimeout(() => {
        (window as any).showToast?.(
          error.response?.data?.error || 'Failed to craft item',
          'error'
        );
        setCraftingAnimation('idle');
      }, 1500);
    },
  });

  const fuseMutation = useMutation({
    mutationFn: async ({ companionName, tier }: { companionName: string; tier: number }) => {
      return companionApi.fuse(companionName, tier);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      queryClient.invalidateQueries({ queryKey: ['fusableCompanions'] });
      queryClient.invalidateQueries({ queryKey: ['player'] });
      
      (window as any).showToast?.(
        `✨ Fused into ${data.data.newCompanion.name}! +${data.data.statsIncrease.attack} ATK, +${data.data.statsIncrease.defense} DEF, +${data.data.statsIncrease.health} HP`,
        'success'
      );
      setSelectedCompanion(null);
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || 'Failed to fuse companions',
        'error'
      );
    },
  });

  const getItemImage = (spriteId: string, itemType?: string) => {
    if (!spriteId) return null;
    
    try {
      const images = import.meta.glob('../../assets/items/**/*.png', {
        eager: true,
        as: 'url',
      });

      // Check if it's a potion (numeric sprite ID)
      if (/^\d+$/.test(spriteId)) {
        const num = parseInt(spriteId);
        if (num >= 985 && num <= 992) {
          const path = `../../assets/items/potions/hp/${spriteId}.png`;
          return images[path] || null;
        } else if (num >= 1001 && num <= 1008) {
          const path = `../../assets/items/potions/mp/${spriteId}.png`;
          return images[path] || null;
        } else if (num >= 1033 && num <= 1040) {
          const path = `../../assets/items/potions/attack/${spriteId}.png`;
          return images[path] || null;
        } else if (num >= 1065 && num <= 1072) {
          const path = `../../assets/items/potions/energy/${spriteId}.png`;
          return images[path] || null;
        }
      }

      // Check for guild shop items
      if (
        spriteId.startsWith('guild_') ||
        spriteId.startsWith('Chest') ||
        spriteId.startsWith('key')
      ) {
        return `/assets/items/guildshop_items/${spriteId}.png`;
      }

      // Check if spriteId contains a path
      if (spriteId.includes('/')) {
        // If it already starts with weapons/, armors/, accessories/, or craft/, use as-is
        // Otherwise, for bare set names (woodenSet, ironSet, steelSet, dungeonDrops), prepend accessories/
        let fullPath = spriteId;
        if (
          !spriteId.startsWith('weapons/') &&
          !spriteId.startsWith('armors/') &&
          !spriteId.startsWith('accessories/') &&
          !spriteId.startsWith('craft/') &&
          (spriteId.startsWith('woodenSet/') ||
            spriteId.startsWith('ironSet/') ||
            spriteId.startsWith('steelSet/') ||
            spriteId.startsWith('dungeonDrops/'))
        ) {
          fullPath = `accessories/${spriteId}`;
        }
        const path = `../../assets/items/${fullPath}.png`;
        return images[path] || null;
      }

      // Determine folder based on item type
      let folder = 'weapons';
      if (itemType === 'Armor') {
        folder = 'armors';
      } else if (itemType === 'Accessory') {
        folder = 'accessories';
      } else if (itemType === 'Consumable') {
        folder = 'consumables';
      } else if (itemType === 'Material' || itemType === 'Gem') {
        const path = `../../assets/items/craft/gems/${spriteId}.png`;
        return images[path] || null;
      }

      const path = `../../assets/items/${folder}/${spriteId}.png`;
      return images[path] || null;
    } catch (e) {
      console.error('Failed to load image:', spriteId, itemType, e);
      return null;
    }
  };

  // Helper function to count total items (inventory + equipped)
  const getTotalItemCount = (itemId: string) => {
    // Count inventory items
    const inventoryItem = inventory?.find((slot: any) => slot.item.id === itemId);
    let totalCount = inventoryItem ? inventoryItem.quantity : 0;
    
    // Also count equipped items
    if (character) {
      const equippedSlots = ['weapon', 'armor', 'helmet', 'gloves', 'shoes', 'ring', 'necklace', 'belt', 'earring', 'accessory'];
      for (const slot of equippedSlots) {
        const equippedItem = (character as any)[slot];
        if (equippedItem && equippedItem.id === itemId) {
          totalCount += 1;
        }
      }
    }
    
    return totalCount;
  };

  const hasEnoughMaterials = (recipe: any) => {
    if (!inventory) return false;
    
    return recipe.materials.every((material: any) => {
      return getTotalItemCount(material.itemId) >= material.quantity;
    });
  };

  // Get unique rarities from recipes
  const availableRarities = useMemo<string[]>(() => {
    if (!recipes) return [];
    const rarities = new Set<string>(recipes.map((r: any) => r.resultItem.rarity as string));
    return Array.from(rarities).sort();
  }, [recipes]);

  // Filter recipes by rarity and craftability
  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];
    return recipes
      .filter((recipe: any) => canCraftRecipe(recipe))
      .filter((recipe: any) => {
        if (rarityFilter === 'all') return true;
        return recipe.resultItem.rarity === rarityFilter;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipes, rarityFilter, character]);

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin text-4xl mb-2">⏳</div>
        <p className="text-gray-400">Loading recipes...</p>
      </div>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <div className="p-4 text-center">
        <Hammer size={48} className="mx-auto mb-4 text-gray-600" />
        <p className="text-gray-400">No crafting recipes available yet</p>
      </div>
    );
  }

  return (
    <div className="p-3 pb-20">
      {/* Tab Header */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('crafting')}
          className={`flex-1 py-2 px-4 font-bold border-2 transition ${
            activeTab === 'crafting'
              ? 'bg-amber-700 border-amber-500 text-white'
              : 'bg-stone-800 border-stone-700 text-gray-400 hover:border-stone-600'
          }`}
          style={{ borderRadius: '0', fontFamily: 'monospace' }}
        >
          <div className="flex items-center justify-center gap-2">
            <Hammer size={18} />
            CRAFTING
          </div>
        </button>
        <button
          onClick={() => setActiveTab('fuse')}
          className={`flex-1 py-2 px-4 font-bold border-2 transition ${
            activeTab === 'fuse'
              ? 'bg-pink-700 border-pink-500 text-white'
              : 'bg-stone-800 border-stone-700 text-gray-400 hover:border-stone-600'
          }`}
          style={{ borderRadius: '0', fontFamily: 'monospace' }}
        >
          <div className="flex items-center justify-center gap-2">
            <img src={petIcon} alt="Fuse" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
            FUSE
          </div>
        </button>
      </div>

      {/* Crafting Tab Content */}
      {activeTab === 'crafting' && (
        <>
          {/* Filters and View Toggle */}
          <div className="flex gap-2 mb-3">
            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              className="flex-1 bg-stone-800 text-white px-3 py-2 border-2 border-stone-700 focus:border-amber-500 focus:outline-none"
              style={{ borderRadius: '0', fontFamily: 'monospace' }}
            >
              <option value="all">⭐ All Rarities</option>
              {availableRarities.map((rarity: string) => (
                <option key={rarity} value={rarity}>
                  {rarity}
                </option>
              ))}
            </select>
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className="px-3 py-2 bg-stone-800 border-2 border-stone-700 hover:border-amber-500 transition"
              style={{ borderRadius: '0' }}
              title={viewMode === 'list' ? 'Switch to Grid View' : 'Switch to List View'}
            >
              {viewMode === 'list' ? <Grid3x3 size={20} className="text-white" /> : <List size={20} className="text-white" />}
            </button>
          </div>

          {filteredRecipes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No recipes match your filters</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-3">
              {filteredRecipes.map((recipe: any) => {
          const canCraft = hasEnoughMaterials(recipe);
          
          return (
            <div
              key={recipe.id}
              className={`p-3 bg-stone-800 rounded-lg border-2 ${
                canCraft ? 'border-green-600' : 'border-stone-700'
              } transition cursor-pointer hover:border-amber-600`}
              onClick={() => setSelectedRecipe(recipe)}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="relative w-12 h-12 bg-stone-900 rounded flex items-center justify-center">
                  {getItemImage(recipe.resultItem.spriteId, recipe.resultItem.type) ? (
                    <img 
                      src={getItemImage(recipe.resultItem.spriteId, recipe.resultItem.type)!} 
                      alt={recipe.resultItem.name}
                      className="max-w-[40px] max-h-[40px] object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : (
                    <span className="text-2xl">⚒️</span>
                  )}
                  <img 
                    src={getRecipeIcon(recipe.resultItem.rarity)} 
                    alt="Recipe" 
                    className="absolute -top-1 -right-1 w-5 h-5" 
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-sm ${getRarityColor(recipe.resultItem.rarity)}`}>
                    {recipe.resultItem.name}
                  </h3>
                  <p className="text-xs text-gray-400">{recipe.resultItem.type}</p>
                  {recipe.levelRequirement > 1 && (
                    <p className={`text-xs font-bold mt-1 ${
                      character && character.level >= recipe.levelRequirement 
                        ? 'text-green-400' 
                        : 'text-amber-400'
                    }`}>
                      ⭐ Level {recipe.levelRequirement} Required
                    </p>
                  )}
                </div>
                {canCraft && (
                  <Check size={20} className="text-green-400" />
                )}
              </div>

              <div className="text-xs text-gray-400 mb-2">
                <p className="font-bold text-white mb-1">Materials Required:</p>
                <div className="space-y-1">
                  {recipe.materials.map((material: any) => {
                    const totalCount = getTotalItemCount(material.itemId);
                    const hasEnough = totalCount >= material.quantity;
                    
                    return (
                      <div key={material.id} className="flex items-center justify-between">
                        <span className={hasEnough ? 'text-green-400' : 'text-red-400'}>
                          {material.item.name} x{material.quantity}
                        </span>
                        <span className={hasEnough ? 'text-green-400' : 'text-red-400'}>
                          ({totalCount}/{material.quantity})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {recipe.resultItem.attackBonus > 0 && (
                <div className="text-xs text-orange-400">ATK +{recipe.resultItem.attackBonus}</div>
              )}
              {recipe.resultItem.defenseBonus > 0 && (
                <div className="text-xs text-blue-400">DEF +{recipe.resultItem.defenseBonus}</div>
              )}
              {recipe.resultItem.healthBonus > 0 && (
                <div className="text-xs text-red-400">HP +{recipe.resultItem.healthBonus}</div>
              )}
            </div>
          );
        })}
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-2 gap-2">
              {filteredRecipes.map((recipe: any) => {
                const canCraft = hasEnoughMaterials(recipe);
                
                return (
                  <div
                    key={recipe.id}
                    className={`p-2 bg-stone-800 rounded-lg border-2 ${
                      canCraft ? 'border-green-600' : 'border-stone-700'
                    } transition cursor-pointer hover:border-amber-600`}
                    onClick={() => setSelectedRecipe(recipe)}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="relative w-16 h-16 bg-stone-900 rounded flex items-center justify-center">
                        {getItemImage(recipe.resultItem.spriteId, recipe.resultItem.type) ? (
                          <img 
                            src={getItemImage(recipe.resultItem.spriteId, recipe.resultItem.type)!} 
                            alt={recipe.resultItem.name}
                            className="max-w-[48px] max-h-[48px] object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        ) : (
                          <span className="text-2xl">⚒️</span>
                        )}
                        <img 
                          src={getRecipeIcon(recipe.resultItem.rarity)} 
                          alt="Recipe" 
                          className="absolute -top-1 -right-1 w-4 h-4" 
                          style={{ imageRendering: 'pixelated' }}
                        />
                        {/* Craftable Check Badge */}
                        {canCraft && (
                          <div className="absolute -bottom-1 -left-1 bg-green-600 rounded-full p-0.5 border-2 border-stone-900">
                            <Check size={12} className="text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div className="w-full">
                        <h3 className={`font-bold text-xs ${getRarityColor(recipe.resultItem.rarity)} truncate`}>
                          {recipe.resultItem.name}
                        </h3>
                        <p className="text-xs text-gray-400">{recipe.resultItem.type}</p>
                        {canCraft && (
                          <p className="text-xs text-green-400 font-bold mt-1">✓ Can Craft</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        {/* Crafting Modal */}
        {selectedRecipe && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-800 rounded-lg border-4 border-amber-600 p-6 max-w-md w-full">
            {/* Anvil Animation */}
            <div className="flex justify-center mb-4">
              <img 
                src={getAnvilIcon()} 
                alt="Anvil" 
                className={`w-20 h-20 ${craftingAnimation === 'crafting' ? 'animate-bounce' : ''}`}
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-16 h-16 bg-stone-900 rounded flex items-center justify-center">
                {getItemImage(selectedRecipe.resultItem.spriteId, selectedRecipe.resultItem.type) ? (
                  <img 
                    src={getItemImage(selectedRecipe.resultItem.spriteId, selectedRecipe.resultItem.type)!} 
                    alt={selectedRecipe.resultItem.name}
                    className="max-w-[56px] max-h-[56px] object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <span className="text-4xl">⚒️</span>
                )}
                <img 
                  src={getRecipeIcon(selectedRecipe.resultItem.rarity)} 
                  alt="Recipe" 
                  className="absolute -top-1 -right-1 w-6 h-6" 
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${getRarityColor(selectedRecipe.resultItem.rarity)}`} style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
                  {selectedRecipe.resultItem.name}
                </h2>
                <p className="text-sm text-gray-300">{selectedRecipe.resultItem.type}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">{selectedRecipe.resultItem.description || 'A crafted item.'}</p>
              
              <div className="space-y-1 text-sm">
                {selectedRecipe.resultItem.attackBonus > 0 && (
                  <div className="text-orange-400">ATK: +{selectedRecipe.resultItem.attackBonus}</div>
                )}
                {selectedRecipe.resultItem.defenseBonus > 0 && (
                  <div className="text-blue-400">DEF: +{selectedRecipe.resultItem.defenseBonus}</div>
                )}
                {selectedRecipe.resultItem.healthBonus > 0 && (
                  <div className="text-red-400">HP: +{selectedRecipe.resultItem.healthBonus}</div>
                )}
              </div>
            </div>

            <div className="mb-4 p-3 bg-stone-900 rounded">
              <p className="text-sm font-bold text-white mb-2">Required Materials:</p>
              <div className="space-y-2">
                {selectedRecipe.materials.map((material: any) => {
                  const totalCount = getTotalItemCount(material.itemId);
                  const hasEnough = totalCount >= material.quantity;
                  
                  return (
                    <div key={material.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-stone-800 rounded flex items-center justify-center">
                          {getItemImage(material.item.spriteId, material.item.type) ? (
                            <img 
                              src={getItemImage(material.item.spriteId, material.item.type)!} 
                              alt={material.item.name}
                              className="max-w-[24px] max-h-[24px] object-contain"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          ) : (
                            <span className="text-xs">📦</span>
                          )}
                        </div>
                        <span className={hasEnough ? 'text-green-400' : 'text-red-400'}>
                          {material.item.name}
                        </span>
                      </div>
                      <span className={hasEnough ? 'text-green-400' : 'text-red-400'} style={{ fontFamily: 'monospace' }}>
                        {totalCount}/{material.quantity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedRecipe(null)}
                className="flex-1 py-3 bg-stone-700 hover:bg-stone-600 text-white font-bold transition relative overflow-hidden"
                style={{
                  border: '3px solid #57534e',
                  borderRadius: '0',
                  boxShadow: '0 3px 0 #44403c, inset 0 1px 0 rgba(255,255,255,0.2)',
                  textShadow: '1px 1px 0 #000',
                  fontFamily: 'monospace',
                  letterSpacing: '1px'
                }}
              >
                <span className="relative z-10">CANCEL</span>
              </button>
              <button
                onClick={() => craftMutation.mutate(selectedRecipe.id)}
                disabled={!hasEnoughMaterials(selectedRecipe) || craftMutation.isPending}
                className="flex-1 py-3 bg-amber-700 hover:bg-amber-600 text-white font-bold transition relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  border: '3px solid #92400e',
                  borderRadius: '0',
                  boxShadow: '0 3px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)',
                  textShadow: '1px 1px 0 #000',
                  fontFamily: 'monospace',
                  letterSpacing: '1px'
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Hammer size={16} />
                  {craftMutation.isPending ? 'CRAFTING...' : 'CRAFT'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
              </button>
            </div>
          </div>
        </div>
        )}
        </>
      )}

      {/* Fuse Tab Content */}
      {activeTab === 'fuse' && (
        <div className="space-y-3">
          {!fusableCompanions || fusableCompanions.length === 0 ? (
            <div className="text-center py-8">
              <img src={petIcon} alt="No Companions" className="w-16 h-16 mx-auto mb-4 opacity-50 grayscale" style={{ imageRendering: 'pixelated' }} />
              <p className="text-gray-400" style={{ fontFamily: 'monospace' }}>No companions available to fuse</p>
              <p className="text-xs text-gray-500 mt-2" style={{ fontFamily: 'monospace' }}>Get duplicate companions from boss fights!</p>
            </div>
          ) : (
            fusableCompanions.map((comp: any) => {
              const canFuse = Object.values(comp.fusableAtTier).some((v) => v);
              const lowestFusableTier = Object.entries(comp.fusableAtTier).find(([_, canFuse]) => canFuse)?.[0] || 0;
              
              return (
                <div
                  key={comp.baseName}
                  className={`p-3 bg-stone-800 rounded-lg border-2 ${
                    canFuse ? 'border-pink-600' : 'border-stone-700'
                  } transition cursor-pointer hover:border-pink-500`}
                  onClick={() => {
                    if (canFuse) {
                      setSelectedCompanion(comp);
                      setSelectedTier(Number(lowestFusableTier));
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 bg-stone-900 rounded flex items-center justify-center">
                      <img 
                        src={`/assets/ui/companions/${comp.baseName.toLowerCase()}.png`}
                        alt={comp.baseName}
                        className="max-w-[40px] max-h-[40px] object-contain"
                        style={{ imageRendering: 'pixelated' }}
                        onError={(e) => {
                          e.currentTarget.src = petIcon;
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-pink-300" style={{ fontFamily: 'monospace' }}>
                        {comp.baseName}
                      </h3>
                      <div className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'monospace' }}>
                        {Object.entries(comp.tiers).map(([tier, companions]: [string, any]) => (
                          <span key={tier} className="mr-3">
                            T{tier}: <span className={comp.fusableAtTier[Number(tier)] ? 'text-green-400 font-bold' : 'text-gray-500'}>
                              x{companions.length}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                    {canFuse && <Sparkles size={20} className="text-pink-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Fusion Preview Modal */}
      {selectedCompanion && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCompanion(null)}
        >
          <div
            className="bg-stone-800 border-4 border-pink-600 p-6 max-w-md w-full"
            style={{ borderRadius: '0', boxShadow: '0 8px 0 #831843' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-pink-300" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
                🐾 FUSE COMPANION
              </h2>
              <button onClick={() => setSelectedCompanion(null)} className="text-pink-400 hover:text-pink-300">
                <X size={24} />
              </button>
            </div>

            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-center">
                  <img 
                    src={`/assets/ui/companions/${selectedCompanion.baseName.toLowerCase()}.png`}
                    alt={selectedCompanion.baseName}
                    className="w-16 h-16 mx-auto mb-2"
                    style={{ imageRendering: 'pixelated' }}
                    onError={(e) => {
                      e.currentTarget.src = petIcon;
                    }}
                  />
                  <p className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>x2</p>
                </div>
                <Sparkles size={32} className="text-pink-400" />
                <div className="text-center">
                  <img 
                    src={`/assets/ui/companions/${selectedCompanion.baseName.toLowerCase()}.png`}
                    alt={`${selectedCompanion.baseName} T${selectedTier + 1}`}
                    className="w-16 h-16 mx-auto mb-2"
                    style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.8))' }}
                    onError={(e) => {
                      e.currentTarget.src = petIcon;
                    }}
                  />
                  <span className="inline-block bg-pink-600 text-white px-2 py-1 text-xs font-bold border-2 border-pink-400" style={{ fontFamily: 'monospace' }}>
                    T{selectedTier + 1}
                  </span>
                </div>
              </div>

              <div className="bg-stone-900 border-2 border-pink-700 p-3 mb-4">
                <p className="text-sm text-gray-300 mb-2" style={{ fontFamily: 'monospace' }}>
                  Fusing Tier {selectedTier} → Tier {selectedTier + 1}
                </p>
                <p className="text-lg font-bold text-pink-300" style={{ fontFamily: 'monospace' }}>
                  Stats: {selectedTier === 0 ? '1.5x' : selectedTier === 1 ? '2.0x' : '2.5x'}
                </p>
              </div>

              <div className="bg-amber-900 border-2 border-amber-600 p-3 mb-4">
                <p className="text-xs text-amber-300 mb-1" style={{ fontFamily: 'monospace' }}>Gold Cost:</p>
                <p className="text-xl font-bold text-yellow-300" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
                  {selectedTier === 0 ? '5,000' : selectedTier === 1 ? '15,000' : '50,000'} g
                </p>
                {player && player.gold < (selectedTier === 0 ? 5000 : selectedTier === 1 ? 15000 : 50000) && (
                  <p className="text-xs text-red-400 mt-2" style={{ fontFamily: 'monospace' }}>⚠️ Not enough gold!</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCompanion(null)}
                className="flex-1 py-3 bg-stone-700 hover:bg-stone-600 text-white font-bold border-2 border-stone-600"
                style={{ borderRadius: '0', fontFamily: 'monospace' }}
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  fuseMutation.mutate({ 
                    companionName: selectedCompanion.baseName, 
                    tier: selectedTier 
                  });
                }}
                disabled={fuseMutation.isPending || (player ? player.gold < (selectedTier === 0 ? 5000 : selectedTier === 1 ? 15000 : 50000) : false)}
                className="flex-1 py-3 bg-gradient-to-b from-pink-600 to-pink-800 hover:from-pink-500 hover:to-pink-700 text-white font-bold border-2 border-pink-400 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderRadius: '0', fontFamily: 'monospace', boxShadow: '0 4px 0 #831843' }}
              >
                {fuseMutation.isPending ? 'FUSING...' : '✨ FUSE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
