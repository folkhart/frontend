import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { craftingApi, inventoryApi } from '@/lib/api';
import { getRarityColor } from '@/utils/format';
import { Hammer, Check } from 'lucide-react';
import { useState } from 'react';
import anvilIcon from '@/assets/ui/craft/anvil.png';
import anvilHitIcon from '@/assets/ui/craft/anvil_hit.png';
import anvilSuccessIcon from '@/assets/ui/craft/anvil_successful.png';
import anvilFailIcon from '@/assets/ui/craft/anvil_unsucessful.png';
import recipeLowGrade from '@/assets/ui/craft/craftRecipeLowGrade.png';
import recipeMidGrade from '@/assets/ui/craft/craftRecipeMidGrade.png';
import recipeHighGrade from '@/assets/ui/craft/craftRecipeHighGrade.png';

export default function CraftingTab() {
  const queryClient = useQueryClient();
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [craftingAnimation, setCraftingAnimation] = useState<'idle' | 'crafting' | 'success' | 'fail'>('idle');

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

  const craftMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      setCraftingAnimation('crafting');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Animation delay
      return craftingApi.craft(recipeId);
    },
    onSuccess: (data) => {
      setCraftingAnimation('success');
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['character'] });
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

  const getItemImage = (spriteId: string, itemType?: string) => {
    if (!spriteId) return null;
    
    try {
      // Check if it's a gem (craft material)
      if (spriteId.includes('Gem')) {
        return new URL(`../../assets/items/craft/gems/${spriteId}.png`, import.meta.url).href;
      }
      
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

  const hasEnoughMaterials = (recipe: any) => {
    if (!inventory) return false;
    
    return recipe.materials.every((material: any) => {
      const playerItem = inventory.find((slot: any) => slot.item.id === material.itemId);
      return playerItem && playerItem.quantity >= material.quantity;
    });
  };

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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <img src={anvilIcon} alt="Crafting" className="w-6 h-6" style={{ imageRendering: 'pixelated' }} />
          Crafting
        </h2>
      </div>

      <div className="space-y-3">
        {recipes.map((recipe: any) => {
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
                </div>
                {canCraft && (
                  <Check size={20} className="text-green-400" />
                )}
              </div>

              <div className="text-xs text-gray-400 mb-2">
                <p className="font-bold text-white mb-1">Materials Required:</p>
                <div className="space-y-1">
                  {recipe.materials.map((material: any) => {
                    const playerItem = inventory?.find((slot: any) => slot.item.id === material.itemId);
                    const hasEnough = playerItem && playerItem.quantity >= material.quantity;
                    
                    return (
                      <div key={material.id} className="flex items-center justify-between">
                        <span className={hasEnough ? 'text-green-400' : 'text-red-400'}>
                          {material.item.name} x{material.quantity}
                        </span>
                        <span className={hasEnough ? 'text-green-400' : 'text-red-400'}>
                          ({playerItem?.quantity || 0}/{material.quantity})
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
                  const playerItem = inventory?.find((slot: any) => slot.item.id === material.itemId);
                  const hasEnough = playerItem && playerItem.quantity >= material.quantity;
                  
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
                        {playerItem?.quantity || 0}/{material.quantity}
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
    </div>
  );
}
