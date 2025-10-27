import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blacksmithApi, inventoryApi } from '@/lib/api';
import { Hammer, Shield, AlertCircle } from 'lucide-react';
import { getRarityColor } from '@/utils/format';

const socketDrillIcon = new URL('../../assets/items/craft/gems/socket_drill.png', import.meta.url).href;
const refiningStoneIcon = new URL('../../assets/items/craft/gems/refining_stone.png', import.meta.url).href;
const enhancementStoneIcon = new URL('../../assets/items/craft/gems/enhancement_stone.png', import.meta.url).href;

type BlacksmithMode = 'enhance' | 'refine' | 'socket';

export default function BlacksmithTab() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<BlacksmithMode>('enhance');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [useProtection, setUseProtection] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { data: inventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data } = await inventoryApi.get();
      return data;
    },
  });

  const enhanceMutation = useMutation({
    mutationFn: ({ slotId, useProtectionScroll }: { slotId: string; useProtectionScroll: boolean }) =>
      blacksmithApi.enhance(slotId, useProtectionScroll),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      setResult(response.data);
      setSelectedItem(null);
      setUseProtection(false);
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Enhancement failed', 'error');
    },
  });

  const refineMutation = useMutation({
    mutationFn: (slotId: string) => blacksmithApi.refine(slotId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      setResult(response.data);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Refining failed', 'error');
    },
  });

  const addSocketMutation = useMutation({
    mutationFn: (slotId: string) => blacksmithApi.addSocketSlot(slotId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setResult(response.data);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Socket addition failed', 'error');
    },
  });

  const insertGemMutation = useMutation({
    mutationFn: ({ slotId, gemId }: { slotId: string; gemId: string }) =>
      blacksmithApi.insertGem(slotId, gemId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      setResult(response.data);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Gem insertion failed', 'error');
    },
  });

  const equipmentItems = inventory?.filter(
    (slot: any) => ['Weapon', 'Armor', 'Accessory'].includes(slot.item.type)
  ) || [];

  const gems = inventory?.filter((slot: any) => slot.item.type === 'Gem') || [];

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
      } else if (itemType === 'Gem' || itemType === 'Material') {
        // Gems and materials use their full spriteId path
        return new URL(`../../assets/items/${spriteId}.png`, import.meta.url).href;
      }
      
      return new URL(`../../assets/items/${folder}/${spriteId}.png`, import.meta.url).href;
    } catch (e) {
      console.error('Failed to load image:', spriteId, itemType, e);
      return null;
    }
  };

  const getEnhancementCost = (level: number) => {
    const costs: Record<number, number> = {
      0: 100, 1: 250, 2: 500, 3: 1000, 4: 2500,
      5: 5000, 6: 10000, 7: 25000, 8: 50000,
    };
    return costs[level] || 0;
  };

  const getEnhancementStones = (level: number) => {
    const stones: Record<number, number> = {
      0: 1, 1: 1, 2: 2, 3: 3, 4: 5, 5: 7, 6: 10, 7: 15, 8: 20,
    };
    return stones[level] || 0;
  };

  const getSuccessRate = (level: number) => {
    const rates: Record<number, number> = {
      0: 100, 1: 100, 2: 100, 3: 80, 4: 60, 5: 40, 6: 30, 7: 20, 8: 10,
    };
    return rates[level] || 0;
  };

  const renderEnhanceMode = () => (
    <div className="space-y-4">
      <div className="bg-stone-800 border-2 border-amber-600 p-4">
        <h3 className="text-amber-400 font-bold mb-2 flex items-center gap-2">
          <img src={enhancementStoneIcon} alt="" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
          ENHANCEMENT (+0 to +9)
        </h3>
        <p className="text-gray-300 text-sm">
          Enhance equipment to increase stats. Success rate decreases at higher levels.
        </p>
      </div>

      {!selectedItem ? (
        <div>
          <h4 className="text-white font-bold mb-2">Select Equipment to Enhance:</h4>
          <div className="grid grid-cols-2 gap-2">
            {equipmentItems.map((slot: any) => (
              <button
                key={slot.id}
                onClick={() => setSelectedItem(slot)}
                className="bg-stone-800 border-2 border-stone-700 hover:border-amber-600 p-3 text-left transition"
              >
                <div className="flex items-center gap-2">
                  {getItemImage(slot.item.spriteId, slot.item.type) && (
                    <img
                      src={getItemImage(slot.item.spriteId, slot.item.type)!}
                      alt={slot.item.name}
                      className="w-8 h-8"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  )}
                  <div className="flex-1">
                    <div className={`font-bold text-sm ${getRarityColor(slot.item.rarity)}`}>
                      {slot.item.name} {slot.enhancementLevel > 0 && `+${slot.enhancementLevel}`}
                    </div>
                    <div className="text-gray-400 text-xs">{slot.item.rarity}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-stone-900 border-2 border-amber-600 p-4">
            <div className="flex items-center gap-3 mb-3">
              {getItemImage(selectedItem.item.spriteId, selectedItem.item.type) && (
                <img
                  src={getItemImage(selectedItem.item.spriteId, selectedItem.item.type)!}
                  alt={selectedItem.item.name}
                  className="w-12 h-12"
                  style={{ imageRendering: 'pixelated' }}
                />
              )}
              <div>
                <div className="text-white font-bold">
                  {selectedItem.item.name} +{selectedItem.enhancementLevel}
                </div>
                <div className="text-amber-400 text-sm">
                  → +{selectedItem.enhancementLevel + 1}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Success Rate:</span>
                <span className={`font-bold ${getSuccessRate(selectedItem.enhancementLevel) >= 80 ? 'text-green-400' : getSuccessRate(selectedItem.enhancementLevel) >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {getSuccessRate(selectedItem.enhancementLevel)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Gold Cost:</span>
                <span className="text-amber-400 font-bold">
                  {getEnhancementCost(selectedItem.enhancementLevel)}g
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Enhancement Stones:</span>
                  <img
                    src={enhancementStoneIcon}
                    alt="Enhancement Stone"
                    className="w-4 h-4"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                <span className="text-blue-400 font-bold">
                  {getEnhancementStones(selectedItem.enhancementLevel)}
                </span>
              </div>
            </div>

            {selectedItem.enhancementLevel >= 6 && (
              <div className="mt-3 pt-3 border-t border-stone-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useProtection}
                    onChange={(e) => setUseProtection(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Shield size={14} className="text-green-400" />
                  <span className="text-sm text-gray-300">
                    Use Protection Scroll (prevents destruction)
                  </span>
                </label>
              </div>
            )}

            {selectedItem.enhancementLevel >= 7 && (
              <div className="mt-2 bg-red-900/30 border border-red-600 p-2 rounded">
                <div className="flex items-center gap-2 text-red-400 text-xs">
                  <AlertCircle size={12} />
                  <span>Item may be destroyed on failure!</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => enhanceMutation.mutate({
                slotId: selectedItem.id,
                useProtectionScroll: useProtection,
              })}
              disabled={enhanceMutation.isPending}
              className="flex-1 py-3 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold transition"
            >
              {enhanceMutation.isPending ? 'ENHANCING...' : 'ENHANCE'}
            </button>
            <button
              onClick={() => {
                setSelectedItem(null);
                setUseProtection(false);
              }}
              className="px-4 py-3 bg-stone-700 hover:bg-stone-600 text-white font-bold transition"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderRefineMode = () => (
    <div className="space-y-4">
      <div className="bg-stone-800 border-2 border-purple-600 p-4">
        <h3 className="text-purple-400 font-bold mb-2 flex items-center gap-2">
          <img src={refiningStoneIcon} alt="" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
          REFINING
        </h3>
        <p className="text-gray-300 text-sm">
          Add random bonus stats to equipment (fire attack, crit chance, etc.)
        </p>
        <div className="mt-2 text-amber-400 text-sm font-bold">
          Cost: 5000g + 1 Refining Stone
        </div>
      </div>

      {!selectedItem ? (
        <div>
          <h4 className="text-white font-bold mb-2">Select Equipment to Refine:</h4>
          <div className="grid grid-cols-2 gap-2">
            {equipmentItems.map((slot: any) => (
              <button
                key={slot.id}
                onClick={() => setSelectedItem(slot)}
                className="bg-stone-800 border-2 border-stone-700 hover:border-purple-600 p-3 text-left transition"
              >
                <div className="flex items-center gap-2">
                  {getItemImage(slot.item.spriteId, slot.item.type) && (
                    <img
                      src={getItemImage(slot.item.spriteId, slot.item.type)!}
                      alt={slot.item.name}
                      className="w-8 h-8"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  )}
                  <div className="flex-1">
                    <div className={`font-bold text-sm ${getRarityColor(slot.item.rarity)}`}>
                      {slot.item.name}
                      {slot.refineStats && <span className="text-purple-400 ml-1">★</span>}
                    </div>
                    <div className="text-gray-400 text-xs">{slot.item.rarity}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-stone-900 border-2 border-purple-600 p-4">
            <div className="flex items-center gap-3 mb-3">
              {getItemImage(selectedItem.item.spriteId, selectedItem.item.type) && (
                <img
                  src={getItemImage(selectedItem.item.spriteId, selectedItem.item.type)!}
                  alt={selectedItem.item.name}
                  className="w-12 h-12"
                  style={{ imageRendering: 'pixelated' }}
                />
              )}
              <div>
                <div className="text-white font-bold">{selectedItem.item.name}</div>
                {selectedItem.refineStats && (
                  <div className="text-purple-400 text-xs">Already refined</div>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-300">
              Refining will add 1-3 random bonus stats to this item.
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => refineMutation.mutate(selectedItem.id)}
              disabled={refineMutation.isPending}
              className="flex-1 py-3 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-600 text-white font-bold transition"
            >
              {refineMutation.isPending ? 'REFINING...' : 'REFINE'}
            </button>
            <button
              onClick={() => setSelectedItem(null)}
              className="px-4 py-3 bg-stone-700 hover:bg-stone-600 text-white font-bold transition"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderSocketMode = () => (
    <div className="space-y-4">
      <div className="bg-stone-800 border-2 border-blue-600 p-4">
        <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
          <img src={socketDrillIcon} alt="" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
          SOCKET SYSTEM
        </h3>
        <p className="text-gray-300 text-sm">
          Add socket slots to equipment or insert gems for stat bonuses.
        </p>
      </div>

      {!selectedItem ? (
        <div>
          <h4 className="text-white font-bold mb-2">Select Equipment:</h4>
          <div className="grid grid-cols-2 gap-2">
            {equipmentItems.map((slot: any) => (
              <button
                key={slot.id}
                onClick={() => setSelectedItem(slot)}
                className="bg-stone-800 border-2 border-stone-700 hover:border-blue-600 p-3 text-left transition"
              >
                <div className="flex items-center gap-2">
                  {getItemImage(slot.item.spriteId, slot.item.type) && (
                    <img
                      src={getItemImage(slot.item.spriteId, slot.item.type)!}
                      alt={slot.item.name}
                      className="w-8 h-8"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  )}
                  <div className="flex-1">
                    <div className={`font-bold text-sm ${getRarityColor(slot.item.rarity)}`}>{slot.item.name}</div>
                    <div className="text-blue-400 text-xs">
                      Sockets: {slot.socketedGems?.length || 0}/{slot.socketSlots || 0}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-stone-900 border-2 border-blue-600 p-4">
            <div className="flex items-center gap-3 mb-3">
              {getItemImage(selectedItem.item.spriteId, selectedItem.item.type) && (
                <img
                  src={getItemImage(selectedItem.item.spriteId, selectedItem.item.type)!}
                  alt={selectedItem.item.name}
                  className="w-12 h-12"
                  style={{ imageRendering: 'pixelated' }}
                />
              )}
              <div>
                <div className="text-white font-bold">{selectedItem.item.name}</div>
                <div className="text-blue-400 text-sm">
                  Sockets: {selectedItem.socketedGems?.length || 0}/{selectedItem.socketSlots || 0}
                </div>
              </div>
            </div>

            {/* Add Socket Slot */}
            {selectedItem.socketSlots < 3 && (
              <button
                onClick={() => addSocketMutation.mutate(selectedItem.id)}
                disabled={addSocketMutation.isPending}
                className="w-full py-2 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-600 text-white font-bold text-sm transition mb-3"
              >
                {addSocketMutation.isPending ? 'ADDING...' : `ADD SOCKET SLOT (${(selectedItem.socketSlots + 1) * 10000}g + Socket Drill)`}
              </button>
            )}

            {/* Insert Gem */}
            {selectedItem.socketSlots > (selectedItem.socketedGems?.length || 0) && (
              <div>
                <h5 className="text-white font-bold text-sm mb-2">Select Gem to Insert:</h5>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {gems.map((gemSlot: any) => (
                    <button
                      key={gemSlot.id}
                      onClick={() => insertGemMutation.mutate({
                        slotId: selectedItem.id,
                        gemId: gemSlot.item.id,
                      })}
                      disabled={insertGemMutation.isPending}
                      className="bg-stone-800 border-2 border-stone-700 hover:border-blue-600 p-2 transition"
                    >
                      {getItemImage(gemSlot.item.spriteId, gemSlot.item.type) && (
                        <img
                          src={getItemImage(gemSlot.item.spriteId, gemSlot.item.type)!}
                          alt={gemSlot.item.name}
                          className="w-8 h-8 mx-auto mb-1"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      )}
                      <div className="text-white text-xs font-bold">{gemSlot.item.name}</div>
                      <div className="text-gray-400 text-xs">x{gemSlot.quantity}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSelectedItem(null)}
            className="w-full py-3 bg-stone-700 hover:bg-stone-600 text-white font-bold transition"
          >
            BACK
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-3 pb-20">
      <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <Hammer size={20} className="text-amber-400" />
        BLACKSMITH
      </h2>

      {/* Result Display */}
      {result && (
        <div className="mb-4 bg-green-900 border-2 border-green-600 p-4">
          <h3 className="text-green-400 font-bold mb-2">SUCCESS!</h3>
          <div className="text-white text-sm">
            {result.success !== undefined && (
              <div>
                {result.success ? (
                  <span className="text-green-400">✓ Enhancement successful! +{result.toLevel}</span>
                ) : result.itemDestroyed ? (
                  <span className="text-red-400">✗ Item destroyed!</span>
                ) : (
                  <span className="text-yellow-400">Enhancement failed. Level: +{result.toLevel}</span>
                )}
              </div>
            )}
            {result.refineStats && (
              <div>
                <div className="text-purple-400 font-bold">Refining Complete!</div>
                <div className="text-sm">
                  {Object.entries(result.refineStats).map(([stat, value]) => (
                    <div key={stat}>+{value as number} {stat}</div>
                  ))}
                </div>
              </div>
            )}
            {result.socketSlots && (
              <div className="text-blue-400">Socket slot added! Total: {result.socketSlots}</div>
            )}
            {result.gemName && (
              <div className="text-blue-400">{result.gemName} socketed successfully!</div>
            )}
          </div>
          <button
            onClick={() => setResult(null)}
            className="mt-2 px-4 py-1 bg-green-700 hover:bg-green-600 text-white text-sm font-bold"
          >
            OK
          </button>
        </div>
      )}

      {/* Mode Selection */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setMode('enhance');
            setSelectedItem(null);
            setResult(null);
          }}
          className={`flex-1 py-2 font-bold transition ${
            mode === 'enhance'
              ? 'bg-amber-600 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{
            border: '2px solid #92400e',
            borderRadius: '0',
            boxShadow: mode === 'enhance' ? '0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: mode === 'enhance' ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          ENHANCE
        </button>
        <button
          onClick={() => {
            setMode('refine');
            setSelectedItem(null);
            setResult(null);
          }}
          className={`flex-1 py-2 font-bold transition ${
            mode === 'refine'
              ? 'bg-purple-600 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{
            border: '2px solid #581c87',
            borderRadius: '0',
            boxShadow: mode === 'refine' ? '0 2px 0 #7e22ce, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: mode === 'refine' ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          REFINE
        </button>
        <button
          onClick={() => {
            setMode('socket');
            setSelectedItem(null);
            setResult(null);
          }}
          className={`flex-1 py-2 font-bold transition ${
            mode === 'socket'
              ? 'bg-blue-600 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{
            border: '2px solid #1e3a8a',
            borderRadius: '0',
            boxShadow: mode === 'socket' ? '0 2px 0 #2563eb, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: mode === 'socket' ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          SOCKET
        </button>
      </div>

      {/* Mode Content */}
      {mode === 'enhance' && renderEnhanceMode()}
      {mode === 'refine' && renderRefineMode()}
      {mode === 'socket' && renderSocketMode()}
    </div>
  );
}
