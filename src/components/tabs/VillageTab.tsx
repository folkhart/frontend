import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { characterApi, inventoryApi } from '@/lib/api';
import { Sword, Shield, Heart, Zap, X, Trophy } from 'lucide-react';
import { getRarityColor, getRarityBorder, getClassIcon } from '@/utils/format';
import inventoryIcon from '@/assets/ui/inventory.png';
import equipmentIcon from '@/assets/ui/equipment.png';
import anvilIcon from '@/assets/ui/craft/anvil.png';
import hammerIcon from '@/assets/ui/craft/hammer.png';
import CraftingTab from './CraftingTab';
import InventoryTab from './InventoryTab';
import BlacksmithTab from './BlacksmithTab';
import AchievementTab from './AchievementTab';

export default function VillageTab() {
  const queryClient = useQueryClient();
  const { character, setCharacter } = useGameStore();
  const [selectedSlot, setSelectedSlot] = useState<'weapon' | 'armor' | 'ring' | 'necklace' | 'belt' | 'earring' | null>(null);
  const [activeView, setActiveView] = useState<'equipment' | 'inventory' | 'crafting' | 'blacksmith' | 'achievements'>('equipment');

  const { data: inventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data } = await inventoryApi.get();
      return data;
    },
  });

  const equipMutation = useMutation({
    mutationFn: async ({ itemId, slot }: { itemId: string; slot: string }) => {
      const { data } = await characterApi.equip(itemId, slot);
      return data;
    },
    onSuccess: async () => {
      // Update character in store immediately
      const { data: updatedCharacter } = await characterApi.get();
      setCharacter(updatedCharacter);
      
      // Refresh queries
      await queryClient.invalidateQueries({ queryKey: ['character'] });
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setSelectedSlot(null);
      
      (window as any).showToast?.('Item equipped successfully!', 'success');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to equip item';
      (window as any).showToast?.(errorMessage, 'error');
    },
  });

  // Removed useItemMutation - handled in InventoryTab

  if (!character) return null;

  const getItemImage = (spriteId: string, itemType?: string, itemName?: string) => {
    if (!spriteId) return null;
    
    try {
      // Handle gems
      if (itemName?.toLowerCase().includes('wooden gem')) {
        return new URL(`../../assets/items/craft/gems/woodenGem.png`, import.meta.url).href;
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

  const getSlotItems = (slotType: 'weapon' | 'armor' | 'ring' | 'necklace' | 'belt' | 'earring') => {
    if (!inventory) return [];
    
    if (slotType === 'weapon') {
      return inventory.filter((slot: any) => slot.item.type === 'Weapon');
    } else if (slotType === 'armor') {
      return inventory.filter((slot: any) => slot.item.type === 'Armor');
    } else {
      // Accessory slots
      const accessoryTypeMap: Record<string, string> = {
        ring: 'Ring',
        necklace: 'Necklace',
        belt: 'Belt',
        earring: 'Earring',
      };
      return inventory.filter((slot: any) => 
        slot.item.type === 'Accessory' && 
        slot.item.accessoryType === accessoryTypeMap[slotType]
      );
    }
  };

  const EquipmentSlot = ({ slotType, equippedItem, label }: { slotType: 'weapon' | 'armor' | 'ring' | 'necklace' | 'belt' | 'earring'; equippedItem: any; label: string }) => (
    <div
      onClick={() => setSelectedSlot(slotType)}
      className={`relative p-4 bg-stone-900 rounded-lg border-2 cursor-pointer transition ${
        selectedSlot === slotType ? 'border-amber-500 bg-stone-800' : 'border-stone-700 hover:border-stone-600'
      }`}
    >
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      {equippedItem ? (
        <div className="flex items-center gap-2">
          {getItemImage(equippedItem.spriteId, equippedItem.type, equippedItem.name) && (
            <img 
              src={getItemImage(equippedItem.spriteId, equippedItem.type, equippedItem.name)!} 
              alt={equippedItem.name} 
              className="w-12 h-12 object-contain" 
            />
          )}
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-sm truncate ${getRarityColor(equippedItem.rarity)}`}>{equippedItem.name}</p>
            <p className="text-xs text-gray-400">
              {equippedItem.attackBonus > 0 && `ATK +${equippedItem.attackBonus}`}
              {equippedItem.defenseBonus > 0 && `DEF +${equippedItem.defenseBonus}`}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-12 text-gray-600">
          <p className="text-sm">Empty</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-3 pb-20">
      {/* Tab Switcher */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setActiveView('equipment')}
          className={`flex-1 py-2 font-bold transition flex items-center justify-center gap-1 relative overflow-hidden ${
            activeView === 'equipment'
              ? 'bg-amber-700 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{
            border: '2px solid #92400e',
            borderRadius: '0',
            boxShadow: activeView === 'equipment' ? '0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: activeView === 'equipment' ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          <img src={equipmentIcon} alt="Equipment" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
          <span className="relative z-10">Equipment</span>
          {activeView === 'equipment' && <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>}
        </button>
        <button
          onClick={() => setActiveView('inventory')}
          className={`flex-1 py-2 font-bold transition flex items-center justify-center gap-1 relative overflow-hidden ${
            activeView === 'inventory'
              ? 'bg-amber-700 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{
            border: '2px solid #92400e',
            borderRadius: '0',
            boxShadow: activeView === 'inventory' ? '0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: activeView === 'inventory' ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          <img src={inventoryIcon} alt="Inventory" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
          <span className="relative z-10">Inventory</span>
          {activeView === 'inventory' && <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>}
        </button>
        <button
          onClick={() => setActiveView('crafting')}
          className={`flex-1 py-2 font-bold transition flex items-center justify-center gap-1 relative overflow-hidden ${
            activeView === 'crafting'
              ? 'bg-amber-700 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{
            border: '2px solid #92400e',
            borderRadius: '0',
            boxShadow: activeView === 'crafting' ? '0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: activeView === 'crafting' ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          <img src={anvilIcon} alt="Crafting" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
          <span className="relative z-10">Crafting</span>
          {activeView === 'crafting' && <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>}
        </button>
        <button
          onClick={() => setActiveView('blacksmith')}
          className={`flex-1 py-2 font-bold transition flex items-center justify-center gap-1 relative overflow-hidden ${
            activeView === 'blacksmith'
              ? 'bg-amber-700 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{
            border: '2px solid #92400e',
            borderRadius: '0',
            boxShadow: activeView === 'blacksmith' ? '0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: activeView === 'blacksmith' ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          <img src={hammerIcon} alt="Blacksmith" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
          <span className="relative z-10">Blacksmith</span>
          {activeView === 'blacksmith' && <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>}
        </button>
        <button
          onClick={() => setActiveView('achievements')}
          className={`flex-1 py-2 font-bold transition flex items-center justify-center gap-1 relative overflow-hidden ${
            activeView === 'achievements'
              ? 'bg-amber-700 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{
            border: '2px solid #92400e',
            borderRadius: '0',
            boxShadow: activeView === 'achievements' ? '0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: activeView === 'achievements' ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          <Trophy size={16} className="text-amber-400" />
          <span className="relative z-10">Achievements</span>
          {activeView === 'achievements' && <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>}
        </button>
      </div>

      {activeView === 'equipment' ? (
        <div>

      {/* Character Paper Doll */}
      <div className="bg-stone-800 rounded-lg border-2 border-amber-600 p-4 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center text-3xl border-4 border-amber-500">
            {getClassIcon(character.class)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{character.name}</h3>
            <p className="text-amber-400">Lv.{character.level} {character.class}</p>
            <p className="text-sm text-gray-400">CP: {character.combatPower}</p>
          </div>
        </div>

        {/* Equipment Slots */}
        <div className="grid grid-cols-1 gap-3">
          <EquipmentSlot slotType="weapon" equippedItem={character.weapon} label="⚔️ Weapon" />
          <EquipmentSlot slotType="armor" equippedItem={character.armor} label="🛡️ Armor" />
        </div>
        
        {/* Accessory Slots */}
        <div className="mt-3">
          <p className="text-xs text-amber-400 font-bold mb-2">💍 Accessories</p>
          <div className="grid grid-cols-2 gap-2">
            <EquipmentSlot slotType="ring" equippedItem={null} label="💍 Ring" />
            <EquipmentSlot slotType="necklace" equippedItem={null} label="📿 Necklace" />
            <EquipmentSlot slotType="belt" equippedItem={null} label="🔗 Belt" />
            <EquipmentSlot slotType="earring" equippedItem={null} label="💎 Earring" />
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-stone-800 rounded p-2 text-center">
          <Heart size={16} className="text-red-400 mx-auto mb-1" />
          <p className="text-white font-bold text-sm">{character.maxHealth}</p>
        </div>
        <div className="bg-stone-800 rounded p-2 text-center">
          <Sword size={16} className="text-orange-400 mx-auto mb-1" />
          <p className="text-white font-bold text-sm">{character.attack}</p>
        </div>
        <div className="bg-stone-800 rounded p-2 text-center">
          <Shield size={16} className="text-blue-400 mx-auto mb-1" />
          <p className="text-white font-bold text-sm">{character.defense}</p>
        </div>
        <div className="bg-stone-800 rounded p-2 text-center">
          <Zap size={16} className="text-green-400 mx-auto mb-1" />
          <p className="text-white font-bold text-sm">{character.speed}</p>
        </div>
      </div>

      {/* Item Selection Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSlot(null)}>
          <div className="bg-stone-800 rounded-lg border-2 border-amber-600 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Select {selectedSlot}</h3>
              <button onClick={() => setSelectedSlot(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-2">
              {getSlotItems(selectedSlot).map((slot: any) => {
                const canEquip = !slot.item.classRestriction || slot.item.classRestriction === character.class;
                return (
                  <div
                    key={slot.id}
                    onClick={() => canEquip && equipMutation.mutate({ itemId: slot.item.id, slot: selectedSlot })}
                    className={`p-3 bg-stone-900 rounded-lg border-2 transition ${
                      canEquip 
                        ? `${getRarityBorder(slot.item.rarity)} hover:bg-stone-800 cursor-pointer` 
                        : 'border-red-600 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getItemImage(slot.item.spriteId, slot.item.type, slot.item.name) && (
                        <img 
                          src={getItemImage(slot.item.spriteId, slot.item.type, slot.item.name)!} 
                          alt={slot.item.name} 
                          className="w-12 h-12 object-contain" 
                        />
                      )}
                      <div className="flex-1">
                        <p className={`font-bold ${getRarityColor(slot.item.rarity)}`}>{slot.item.name}</p>
                        <p className="text-xs text-gray-400">{slot.item.description}</p>
                        {slot.item.classRestriction && (
                          <p className={`text-xs mt-1 ${canEquip ? 'text-green-400' : 'text-red-400'}`}>
                            {canEquip ? `✓ ${slot.item.classRestriction} only` : `✗ ${slot.item.classRestriction} only`}
                          </p>
                        )}
                        <div className="flex gap-2 text-xs mt-1">
                          {slot.item.attackBonus > 0 && <span className="text-orange-400">ATK +{slot.item.attackBonus}</span>}
                          {slot.item.defenseBonus > 0 && <span className="text-blue-400">DEF +{slot.item.defenseBonus}</span>}
                          {slot.item.healthBonus > 0 && <span className="text-red-400">HP +{slot.item.healthBonus}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {getSlotItems(selectedSlot).length === 0 && (
                <p className="text-center text-gray-400 py-8">No items available</p>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
      ) : activeView === 'inventory' ? (
        <InventoryTab />
      ) : activeView === 'crafting' ? (
        <CraftingTab />
      ) : activeView === 'blacksmith' ? (
        <BlacksmithTab />
      ) : (
        <AchievementTab />
      )}
    </div>
  );
}
