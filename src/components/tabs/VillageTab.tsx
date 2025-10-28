import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { characterApi, inventoryApi } from "@/lib/api";
import { Sword, Shield, Heart, Zap, X, Circle, Gem } from "lucide-react";
import { getRarityColor, getRarityBorder, getClassIcon } from "@/utils/format";
import inventoryIcon from "@/assets/ui/inventory.png";
import equipmentIcon from "@/assets/ui/equipment.png";
import anvilIcon from "@/assets/ui/craft/anvil.png";
import hammerIcon from "@/assets/ui/craft/hammer.png";
import CraftingTab from "./CraftingTab";
import InventoryTab from "./InventoryTab";
import BlacksmithTab from "./BlacksmithTab";

export default function VillageTab() {
  const queryClient = useQueryClient();
  const { character, setCharacter } = useGameStore();
  const [selectedSlot, setSelectedSlot] = useState<
    "weapon" | "armor" | "helmet" | "gloves" | "shoes" | "ring" | "necklace" | "belt" | "earring" | null
  >(null);
  const [activeView, setActiveView] = useState<
    "equipment" | "inventory" | "crafting" | "blacksmith"
  >("equipment");
  const [selectedItemDetails, setSelectedItemDetails] = useState<any>(null);

  const { data: inventory } = useQuery({
    queryKey: ["inventory"],
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
      await queryClient.invalidateQueries({ queryKey: ["character"] });
      await queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setSelectedSlot(null);

      (window as any).showToast?.("Item equipped successfully!", "success");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error || "Failed to equip item";
      (window as any).showToast?.(errorMessage, "error");
    },
  });

  // Removed useItemMutation - handled in InventoryTab

  if (!character) return null;

  const getItemImage = (spriteId: string, itemType?: string) => {
    if (!spriteId) return null;

    try {
      // Use eager glob imports to ensure images are bundled
      const images = import.meta.glob('../../assets/items/**/*.png', { eager: true, as: 'url' });
      
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
        }
      }

      // Check if spriteId contains a path (for gems, materials, accessories with woodenSet/, etc.)
      if (spriteId.includes('/')) {
        // spriteId already contains the full path like 'craft/gems/red_gem' or 'woodenSet/woodenRing'
        // For accessories with woodenSet/, the path is accessories/woodenSet/...
        const fullPath = spriteId.startsWith('woodenSet/') 
          ? `accessories/${spriteId}` 
          : spriteId;
        const path = `../../assets/items/${fullPath}.png`;
        return images[path] || null;
      }

      // Determine folder based on item type
      let folder = "weapons"; // default
      if (itemType === "Armor") {
        folder = "armors";
      } else if (itemType === "Accessory") {
        folder = "accessories";
      } else if (itemType === "Consumable") {
        folder = "consumables";
      } else if (itemType === "Material" || itemType === "Gem") {
        // Materials and gems go to craft/gems folder
        const path = `../../assets/items/craft/gems/${spriteId}.png`;
        return images[path] || null;
      }

      const path = `../../assets/items/${folder}/${spriteId}.png`;
      return images[path] || null;
    } catch (e) {
      console.error("Failed to load image:", spriteId, itemType, e);
      return null;
    }
  };

  const getSlotItems = (
    slotType: "weapon" | "armor" | "helmet" | "gloves" | "shoes" | "ring" | "necklace" | "belt" | "earring"
  ) => {
    if (!inventory) return [];

    if (slotType === "weapon") {
      return inventory.filter((slot: any) => slot.item.type === "Weapon");
    } else if (slotType === "armor" || slotType === "helmet" || slotType === "gloves" || slotType === "shoes") {
      // Armor pieces - filter by armorSlot
      const armorSlotMap: Record<string, string> = {
        armor: "Body",
        helmet: "Helmet",
        gloves: "Gloves",
        shoes: "Shoes",
      };
      return inventory.filter(
        (slot: any) =>
          slot.item.type === "Armor" &&
          slot.item.armorSlot === armorSlotMap[slotType]
      );
    } else {
      // Accessory slots
      const accessoryTypeMap: Record<string, string> = {
        ring: "Ring",
        necklace: "Necklace",
        belt: "Belt",
        earring: "Earring",
      };
      return inventory.filter(
        (slot: any) =>
          slot.item.type === "Accessory" &&
          slot.item.accessoryType === accessoryTypeMap[slotType]
      );
    }
  };

  // Get equipped item with enhancement data
  const getEquippedItemData = (slotName: string) => {
    if (!inventory) return null;
    const slot = inventory.find((s: any) => {
      const item = s.item;
      if (slotName === 'weapon') return character.weapon?.id === item.id;
      if (slotName === 'armor') return character.armor?.id === item.id;
      if (slotName === 'helmet') return character.helmet?.id === item.id;
      if (slotName === 'gloves') return character.gloves?.id === item.id;
      if (slotName === 'shoes') return character.shoes?.id === item.id;
      if (slotName === 'ring') return character.ring?.id === item.id;
      if (slotName === 'necklace') return character.necklace?.id === item.id;
      if (slotName === 'belt') return character.belt?.id === item.id;
      if (slotName === 'earring') return character.earring?.id === item.id;
      return false;
    });
    return slot || null;
  };

  const EquipmentSlot = ({
    slotType,
    equippedItem,
    label,
  }: {
    slotType: "weapon" | "armor" | "helmet" | "gloves" | "shoes" | "ring" | "necklace" | "belt" | "earring";
    equippedItem: any;
    label: string;
  }) => {
    const itemSlot = getEquippedItemData(slotType);
    const enhancementLevel = itemSlot?.enhancementLevel || 0;
    const socketSlots = itemSlot?.socketSlots || 0;
    const socketedGems = itemSlot?.socketedGems || [];

    return (
      <div
        onClick={() => {
          if (equippedItem && itemSlot) {
            // If item is equipped, show details modal
            setSelectedItemDetails(itemSlot);
          } else {
            // If slot is empty, open selection directly
            setSelectedSlot(slotType);
          }
        }}
        className={`relative p-4 bg-stone-900 rounded-lg border-2 cursor-pointer transition ${
          selectedSlot === slotType
            ? "border-amber-500 bg-stone-800"
            : "border-stone-700 hover:border-stone-600"
        }`}
      >
        <p className="text-xs text-gray-400 mb-2">{label}</p>
        {equippedItem ? (
          <div className="flex items-center gap-2">
            <div className="relative">
              {getItemImage(equippedItem.spriteId, equippedItem.type) && (
                <img
                  src={getItemImage(equippedItem.spriteId, equippedItem.type)!}
                  alt={equippedItem.name}
                  className="w-12 h-12 object-contain"
                />
              )}
              {/* Enhancement Level Badge */}
              {enhancementLevel > 0 && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-orange-500 text-black text-xs font-bold px-1 rounded" style={{ textShadow: 'none' }}>
                  +{enhancementLevel}
                </div>
              )}
              {/* Socket Indicators */}
              {socketSlots > 0 && (
                <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                  {Array.from({ length: socketSlots }).map((_, i) => (
                    <Circle
                      key={i}
                      size={8}
                      className={socketedGems[i] ? "fill-green-400 text-green-400" : "fill-stone-700 text-stone-700"}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`font-bold text-sm truncate ${getRarityColor(
                  equippedItem.rarity
                )}`}
              >
                {equippedItem.name}
              </p>
              <p className="text-xs text-gray-400">
                {equippedItem.attackBonus > 0 &&
                  `ATK +${equippedItem.attackBonus}`}
                {equippedItem.defenseBonus > 0 &&
                  `DEF +${equippedItem.defenseBonus}`}
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
  };

  // Get gem details from inventory
  const getGemDetails = (gemItemId: string) => {
    if (!inventory) return null;
    const gemSlot = inventory.find((s: any) => s.item.id === gemItemId);
    return gemSlot?.item || null;
  };

  return (
    <div className="p-3 pb-20">
      {/* Item Details Modal */}
      {selectedItemDetails && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedItemDetails(null)}>
          <div className="bg-stone-900 border-4 border-amber-600 rounded-lg p-4 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {getItemImage(selectedItemDetails.item.spriteId, selectedItemDetails.item.type) && (
                    <img
                      src={getItemImage(selectedItemDetails.item.spriteId, selectedItemDetails.item.type)!}
                      alt={selectedItemDetails.item.name}
                      className="w-16 h-16 object-contain"
                    />
                  )}
                  {selectedItemDetails.enhancementLevel > 0 && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-br from-amber-400 to-orange-500 text-black text-sm font-bold px-2 py-0.5 rounded">
                      +{selectedItemDetails.enhancementLevel}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${getRarityColor(selectedItemDetails.item.rarity)}`}>
                    {selectedItemDetails.item.name}
                  </h3>
                  <p className="text-sm text-gray-400">{selectedItemDetails.item.type}</p>
                </div>
              </div>
              <button onClick={() => setSelectedItemDetails(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {/* Base Stats */}
            <div className="bg-stone-800 p-3 rounded mb-3">
              <h4 className="text-sm font-bold text-amber-400 mb-2">Base Stats</h4>
              <div className="space-y-1 text-sm">
                {selectedItemDetails.item.attackBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Attack:</span>
                    <span className="text-red-400">+{selectedItemDetails.item.attackBonus}</span>
                  </div>
                )}
                {selectedItemDetails.item.defenseBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Defense:</span>
                    <span className="text-blue-400">+{selectedItemDetails.item.defenseBonus}</span>
                  </div>
                )}
                {selectedItemDetails.item.healthBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Health:</span>
                    <span className="text-green-400">+{selectedItemDetails.item.healthBonus}</span>
                  </div>
                )}
                {selectedItemDetails.item.speedBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Speed:</span>
                    <span className="text-purple-400">+{selectedItemDetails.item.speedBonus}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Enhancement Bonus */}
            {selectedItemDetails.enhancementLevel > 0 && (
              <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 p-3 rounded mb-3 border border-amber-600">
                <h4 className="text-sm font-bold text-amber-400 mb-2">Enhancement Bonus (+{selectedItemDetails.enhancementLevel})</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">All Stats:</span>
                    <span className="text-amber-300">+{selectedItemDetails.enhancementLevel * 2}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Socketed Gems */}
            {selectedItemDetails.socketSlots > 0 && (
              <div className="bg-stone-800 p-3 rounded mb-3">
                <h4 className="text-sm font-bold text-green-400 mb-2 flex items-center gap-1">
                  <Gem size={16} />
                  Sockets ({selectedItemDetails.socketedGems?.length || 0}/{selectedItemDetails.socketSlots})
                </h4>
                <div className="space-y-2">
                  {Array.from({ length: selectedItemDetails.socketSlots }).map((_, i) => {
                    const gemId = selectedItemDetails.socketedGems?.[i];
                    const gem = gemId ? getGemDetails(gemId) : null;
                    return (
                      <div key={i} className="flex items-center gap-2 bg-stone-900 p-2 rounded border border-stone-700">
                        {gem ? (
                          <>
                            {getItemImage(gem.spriteId, gem.type) && (
                              <img
                                src={getItemImage(gem.spriteId, gem.type)!}
                                alt={gem.name}
                                className="w-8 h-8 object-contain"
                              />
                            )}
                            <div className="flex-1">
                              <p className={`text-sm font-bold ${getRarityColor(gem.rarity)}`}>{gem.name}</p>
                              <p className="text-xs text-gray-400">
                                {gem.healthBonus > 0 && `+${gem.healthBonus} HP `}
                                {gem.attackBonus > 0 && `+${gem.attackBonus} ATK `}
                                {gem.defenseBonus > 0 && `+${gem.defenseBonus} DEF `}
                                {gem.speedBonus > 0 && `+${gem.speedBonus} SPD`}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Circle size={20} className="fill-stone-700 text-stone-700" />
                            <span className="text-sm">Empty Socket</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-stone-800 p-3 rounded mb-3">
              <p className="text-sm text-gray-300">{selectedItemDetails.item.description}</p>
            </div>

            {/* Change Equipment Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Determine which slot this item belongs to
                let slotType: "weapon" | "armor" | "helmet" | "gloves" | "shoes" | "ring" | "necklace" | "belt" | "earring" | null = null;
                if (character.weapon?.id === selectedItemDetails.item.id) slotType = "weapon";
                else if (character.armor?.id === selectedItemDetails.item.id) slotType = "armor";
                else if (character.helmet?.id === selectedItemDetails.item.id) slotType = "helmet";
                else if (character.gloves?.id === selectedItemDetails.item.id) slotType = "gloves";
                else if (character.shoes?.id === selectedItemDetails.item.id) slotType = "shoes";
                else if (character.ring?.id === selectedItemDetails.item.id) slotType = "ring";
                else if (character.necklace?.id === selectedItemDetails.item.id) slotType = "necklace";
                else if (character.belt?.id === selectedItemDetails.item.id) slotType = "belt";
                else if (character.earring?.id === selectedItemDetails.item.id) slotType = "earring";
                
                setSelectedItemDetails(null);
                if (slotType) setSelectedSlot(slotType);
              }}
              className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-white font-bold transition relative overflow-hidden"
              style={{
                border: '3px solid #92400e',
                borderRadius: '0',
                boxShadow: '0 3px 0 #b45309, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                textShadow: '1px 1px 0 #000',
                fontFamily: 'monospace',
                letterSpacing: '1px'
              }}
            >
              <span className="relative z-10">🔄 CHANGE EQUIPMENT</span>
              <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
            </button>
          </div>
        </div>
      )}
      {/* Tab Switcher */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setActiveView("equipment")}
          className={`flex-1 py-2 font-bold transition flex items-center justify-center gap-1 relative overflow-hidden ${
            activeView === "equipment"
              ? "bg-amber-700 text-white"
              : "bg-stone-800 text-gray-400 hover:bg-stone-700"
          }`}
          style={{
            border: "2px solid #92400e",
            borderRadius: "0",
            boxShadow:
              activeView === "equipment"
                ? "0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)"
                : "none",
            textShadow: activeView === "equipment" ? "1px 1px 0 #000" : "none",
            fontFamily: "monospace",
          }}
        >
          <img
            src={equipmentIcon}
            alt="Equipment"
            className="w-4 h-4"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="relative z-10">Equipment</span>
          {activeView === "equipment" && (
            <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
          )}
        </button>
        <button
          onClick={() => setActiveView("inventory")}
          className={`flex-1 py-2 font-bold transition flex items-center justify-center gap-1 relative overflow-hidden ${
            activeView === "inventory"
              ? "bg-amber-700 text-white"
              : "bg-stone-800 text-gray-400 hover:bg-stone-700"
          }`}
          style={{
            border: "2px solid #92400e",
            borderRadius: "0",
            boxShadow:
              activeView === "inventory"
                ? "0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)"
                : "none",
            textShadow: activeView === "inventory" ? "1px 1px 0 #000" : "none",
            fontFamily: "monospace",
          }}
        >
          <img
            src={inventoryIcon}
            alt="Inventory"
            className="w-4 h-4"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="relative z-10">Inventory</span>
          {activeView === "inventory" && (
            <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
          )}
        </button>
        <button
          onClick={() => character.level >= 5 && setActiveView("crafting")}
          disabled={character.level < 5}
          className={`flex-1 py-2 font-bold transition flex items-center justify-center gap-1 relative overflow-hidden ${
            character.level < 5
              ? "bg-stone-900 text-gray-600 cursor-not-allowed opacity-60"
              : activeView === "crafting"
              ? "bg-amber-700 text-white"
              : "bg-stone-800 text-gray-400 hover:bg-stone-700"
          }`}
          style={{
            border: "2px solid #92400e",
            borderRadius: "0",
            boxShadow:
              activeView === "crafting"
                ? "0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)"
                : "none",
            textShadow: activeView === "crafting" ? "1px 1px 0 #000" : "none",
            fontFamily: "monospace",
          }}
        >
          <img
            src={anvilIcon}
            alt="Crafting"
            className="w-4 h-4"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="relative z-10">
            {character.level < 5 ? "🔒 Crafting (Lv.5)" : "Crafting"}
          </span>
          {activeView === "crafting" && (
            <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
          )}
        </button>
        <button
          onClick={() => character.level >= 10 && setActiveView("blacksmith")}
          disabled={character.level < 10}
          className={`flex-1 py-2 font-bold transition flex items-center justify-center gap-1 relative overflow-hidden ${
            character.level < 10
              ? "bg-stone-900 text-gray-600 cursor-not-allowed opacity-60"
              : activeView === "blacksmith"
              ? "bg-amber-700 text-white"
              : "bg-stone-800 text-gray-400 hover:bg-stone-700"
          }`}
          style={{
            border: "2px solid #92400e",
            borderRadius: "0",
            boxShadow:
              activeView === "blacksmith"
                ? "0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)"
                : "none",
            textShadow: activeView === "blacksmith" ? "1px 1px 0 #000" : "none",
            fontFamily: "monospace",
          }}
        >
          <img
            src={hammerIcon}
            alt="Blacksmith"
            className="w-4 h-4"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="relative z-10">
            {character.level < 10 ? "🔒 Blacksmith (Lv.10)" : "Blacksmith"}
          </span>
          {activeView === "blacksmith" && (
            <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
          )}
        </button>
      </div>

      {activeView === "equipment" ? (
        <div>
          {/* Character Paper Doll */}
          <div className="bg-stone-800 rounded-lg border-2 border-amber-600 p-4 mb-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center text-3xl border-4 border-amber-500">
                {getClassIcon(character.class)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {character.name}
                </h3>
                <p className="text-amber-400">
                  Lv.{character.level} {character.class}
                </p>
                <p className="text-sm text-gray-400">
                  CP: {character.combatPower}
                </p>
              </div>
            </div>

            {/* Equipment Slots */}
            <div className="grid grid-cols-1 gap-3">
              <EquipmentSlot
                slotType="weapon"
                equippedItem={character.weapon}
                label="⚔️ Weapon"
              />
              <EquipmentSlot
                slotType="armor"
                equippedItem={character.armor}
                label="🛡️ Armor"
              />
            </div>

            {/* Armor Pieces */}
            <div className="mt-3">
              <p className="text-xs text-amber-400 font-bold mb-2">
                🎩 Armor Pieces
              </p>
              <div className="grid grid-cols-3 gap-2">
                <EquipmentSlot
                  slotType="helmet"
                  equippedItem={character.helmet}
                  label="🎩 Helmet"
                />
                <EquipmentSlot
                  slotType="gloves"
                  equippedItem={character.gloves}
                  label="🧤 Gloves"
                />
                <EquipmentSlot
                  slotType="shoes"
                  equippedItem={character.shoes}
                  label="👟 Shoes"
                />
              </div>
            </div>

            {/* Accessory Slots */}
            <div className="mt-3">
              <p className="text-xs text-amber-400 font-bold mb-2">
                💍 Accessories
              </p>
              <div className="grid grid-cols-2 gap-2">
                <EquipmentSlot
                  slotType="ring"
                  equippedItem={character.ring}
                  label="💍 Ring"
                />
                <EquipmentSlot
                  slotType="necklace"
                  equippedItem={character.necklace}
                  label="📿 Necklace"
                />
                <EquipmentSlot
                  slotType="belt"
                  equippedItem={character.belt}
                  label="🔗 Belt"
                />
                <EquipmentSlot
                  slotType="earring"
                  equippedItem={character.earring}
                  label="💎 Earring"
                />
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-stone-800 rounded p-2 text-center">
              <Heart size={16} className="text-red-400 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">
                {character.maxHealth}
              </p>
            </div>
            <div className="bg-stone-800 rounded p-2 text-center">
              <Sword size={16} className="text-orange-400 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{character.attack}</p>
            </div>
            <div className="bg-stone-800 rounded p-2 text-center">
              <Shield size={16} className="text-blue-400 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">
                {character.defense}
              </p>
            </div>
            <div className="bg-stone-800 rounded p-2 text-center">
              <Zap size={16} className="text-green-400 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{character.speed}</p>
            </div>
          </div>

          {/* Item Selection Modal */}
          {selectedSlot && (
            <div
              className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedSlot(null)}
            >
              <div
                className="bg-stone-800 rounded-lg border-2 border-amber-600 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    Select {selectedSlot}
                  </h3>
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-2">
                  {getSlotItems(selectedSlot).map((slot: any) => {
                    const canEquip =
                      !slot.item.classRestriction ||
                      slot.item.classRestriction === character.class;
                    return (
                      <div
                        key={slot.id}
                        onClick={() =>
                          canEquip &&
                          equipMutation.mutate({
                            itemId: slot.item.id,
                            slot: selectedSlot,
                          })
                        }
                        className={`p-3 bg-stone-900 rounded-lg border-2 transition ${
                          canEquip
                            ? `${getRarityBorder(
                                slot.item.rarity
                              )} hover:bg-stone-800 cursor-pointer`
                            : "border-red-600 opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {getItemImage(slot.item.spriteId, slot.item.type) && (
                            <img
                              src={getItemImage(slot.item.spriteId, slot.item.type)!}
                              alt={slot.item.name}
                              className="w-12 h-12 object-contain"
                            />
                          )}
                          <div className="flex-1">
                            <p
                              className={`font-bold ${getRarityColor(
                                slot.item.rarity
                              )}`}
                            >
                              {slot.item.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {slot.item.description}
                            </p>
                            {slot.item.classRestriction && (
                              <p
                                className={`text-xs mt-1 ${
                                  canEquip ? "text-green-400" : "text-red-400"
                                }`}
                              >
                                {canEquip
                                  ? `✓ ${slot.item.classRestriction} only`
                                  : `✗ ${slot.item.classRestriction} only`}
                              </p>
                            )}
                            <div className="flex gap-2 text-xs mt-1">
                              {slot.item.attackBonus > 0 && (
                                <span className="text-orange-400">
                                  ATK +{slot.item.attackBonus}
                                </span>
                              )}
                              {slot.item.defenseBonus > 0 && (
                                <span className="text-blue-400">
                                  DEF +{slot.item.defenseBonus}
                                </span>
                              )}
                              {slot.item.healthBonus > 0 && (
                                <span className="text-red-400">
                                  HP +{slot.item.healthBonus}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {getSlotItems(selectedSlot).length === 0 && (
                    <p className="text-center text-gray-400 py-8">
                      No items available
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : activeView === "inventory" ? (
        <InventoryTab />
      ) : activeView === "crafting" ? (
        <CraftingTab />
      ) : (
        <BlacksmithTab />
      )}
    </div>
  );
}
