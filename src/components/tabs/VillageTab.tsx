import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { characterApi, inventoryApi } from "@/lib/api";
import { X, Circle } from "lucide-react";
import { getRarityColor, getRarityBorder, getClassIcon } from "@/utils/format";
import { getItemImage } from "@/utils/itemSprites";
import inventoryIcon from "@/assets/ui/inventory.png";
import equipmentIcon from "@/assets/ui/equipment.png";
import anvilIcon from "@/assets/ui/craft/anvil.png";
import hammerIcon from "@/assets/ui/craft/hammer.png";
import refiningBonusIcon from "@/assets/ui/character_panel/refining_bonus.png";
import socketDrillIcon from "@/assets/items/craft/gems/socket_drill.png";
import petIcon from "@/assets/ui/pet.png";
import fireIcon from "@/assets/ui/specialAttributes/fire_damage.png";
import iceIcon from "@/assets/ui/specialAttributes/ice_damage.png";
import lightningIcon from "@/assets/ui/specialAttributes/lightning_damage.png";
import poisonIcon from "@/assets/ui/specialAttributes/poison_damage.png";
import critChanceIcon from "@/assets/ui/specialAttributes/attack.png";
import critDamageIcon from "@/assets/ui/specialAttributes/critical_damage.png";
import lifestealIcon from "@/assets/ui/specialAttributes/lifesteal.png";
import dodgeIcon from "@/assets/ui/specialAttributes/dodge.png";
import hpIconCP from "@/assets/ui/character_panel/hp.png";
import attackIconCP from "@/assets/ui/character_panel/attack.png";
import defenseIconCP from "@/assets/ui/character_panel/defense.png";
import speedIconCP from "@/assets/ui/character_panel/speed.png";
import Lightning from "@/components/effects/Lightning";
import ColorBends from "@/components/effects/ColorBends";
import CraftingTab from "./CraftingTab";
import InventoryTab from "./InventoryTab";
import BlacksmithTab from "./BlacksmithTab";

// Enhancement bonus table (must match backend)
const ENHANCEMENT_BONUS: Record<number, number> = {
  0: 0,
  1: 5,
  2: 10,
  3: 15,
  4: 20,
  5: 30,
  6: 40,
  7: 55,
  8: 75,
  9: 100,
};

export default function VillageTab() {
  const queryClient = useQueryClient();
  const { character, setCharacter } = useGameStore();
  const [selectedSlot, setSelectedSlot] = useState<
    | "weapon"
    | "armor"
    | "helmet"
    | "gloves"
    | "shoes"
    | "ring"
    | "necklace"
    | "belt"
    | "earring"
    | "companion"
    | null
  >(null);
  const [activeView, setActiveView] = useState<
    "equipment" | "inventory" | "crafting" | "blacksmith"
  >("equipment");
  const [selectedItemDetails, setSelectedItemDetails] = useState<any>(null);

  const { data: inventory, isLoading: isInventoryLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data } = await inventoryApi.get();
      return data;
    },
  });

  // Query for character data to keep it in sync
  useQuery({
    queryKey: ["character"],
    queryFn: async () => {
      const { data } = await characterApi.get();
      setCharacter(data); // Update store whenever fresh data comes in
      return data;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const equipMutation = useMutation({
    mutationFn: async ({ slotId, slot }: { slotId: string; slot: string }) => {
      const { data } = await characterApi.equip(slotId, slot);
      return data;
    },
    onSuccess: async () => {
      // Update character in store immediately
      const { data: updatedCharacter } = await characterApi.get();
      setCharacter(updatedCharacter);

      // Refresh queries with immediate refetch
      await queryClient.invalidateQueries({ queryKey: ["character"] });
      await queryClient.invalidateQueries({ queryKey: ["inventory"] });
      await queryClient.refetchQueries({ queryKey: ["inventory"] }); // Force immediate refetch
      await queryClient.refetchQueries({ queryKey: ["character"] }); // Force immediate refetch
      setSelectedSlot(null);

      (window as any).showToast?.("Item equipped successfully!", "success");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error || "Failed to equip item";
      (window as any).showToast?.(errorMessage, "error");
    },
  });

  const unequipMutation = useMutation({
    mutationFn: async (slot: string) => {
      const { data } = await characterApi.unequip(slot);
      return data;
    },
    onSuccess: async () => {
      // Update character in store immediately
      const { data: updatedCharacter } = await characterApi.get();
      setCharacter(updatedCharacter);

      // Refresh queries with immediate refetch
      await queryClient.invalidateQueries({ queryKey: ["character"] });
      await queryClient.invalidateQueries({ queryKey: ["inventory"] });
      await queryClient.refetchQueries({ queryKey: ["inventory"] }); // Force immediate refetch
      await queryClient.refetchQueries({ queryKey: ["character"] }); // Force immediate refetch
      setSelectedItemDetails(null);

      (window as any).showToast?.("Item unequipped successfully!", "success");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error || "Failed to unequip item";
      (window as any).showToast?.(errorMessage, "error");
    },
  });

  // Removed useItemMutation - handled in InventoryTab

  // Helper functions to get items from slots
  const getSlotItem = (slotType: string) => {
    if (!character) return null;
    const slotMap: Record<string, any> = {
      weapon: character.weaponSlot,
      armor: character.armorSlot,
      helmet: character.helmetSlot,
      gloves: character.glovesSlot,
      companion: (character as any).companionSlot,
      shoes: character.shoesSlot,
      ring: character.ringSlot,
      necklace: character.necklaceSlot,
      belt: character.beltSlot,
      earring: character.earringSlot,
    };
    return slotMap[slotType]?.item || null;
  };

  if (!character || isInventoryLoading) return null;

  const getSlotItems = (
    slotType:
      | "weapon"
      | "armor"
      | "helmet"
      | "gloves"
      | "shoes"
      | "ring"
      | "necklace"
      | "belt"
      | "earring"
      | "companion"
  ) => {
    if (!inventory) return [];

    if (slotType === "weapon") {
      return inventory.filter((slot: any) => slot.item.type === "Weapon");
    } else if (slotType === "companion") {
      return inventory.filter((slot: any) => slot.item.type === "Companion");
    } else if (
      slotType === "armor" ||
      slotType === "helmet" ||
      slotType === "gloves" ||
      slotType === "shoes"
    ) {
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

  // Get equipped item with enhancement data from slot
  const getEquippedItemData = (slotName: string) => {
    if (!character) return null;
    const slotMap: Record<string, any> = {
      weapon: character.weaponSlot,
      armor: character.armorSlot,
      helmet: character.helmetSlot,
      gloves: character.glovesSlot,
      shoes: character.shoesSlot,
      ring: character.ringSlot,
      necklace: character.necklaceSlot,
      belt: character.beltSlot,
      earring: character.earringSlot,
      companion: (character as any).companionSlot,
    };
    return slotMap[slotName] || null;
  };

  const EquipmentSlot = ({
    slotType,
    equippedItem,
    label,
  }: {
    slotType:
      | "weapon"
      | "armor"
      | "helmet"
      | "gloves"
      | "shoes"
      | "ring"
      | "necklace"
      | "belt"
      | "earring";
    equippedItem: any;
    label: string;
  }) => {
    const itemSlot = getEquippedItemData(slotType);
    const enhancementLevel = itemSlot?.enhancementLevel || 0;
    const socketSlots = itemSlot?.socketSlots || 0;
    const socketedGems = itemSlot?.socketedGems || [];

    // Get border color based on rarity and enhancement level
    const getBorderClass = () => {
      if (selectedSlot === slotType) return "border-amber-500";
      if (equippedItem) {
        if (enhancementLevel >= 9) return "border-purple-500";
        if (enhancementLevel >= 8) return "border-pink-500";
        if (enhancementLevel >= 7) return "border-indigo-500";
        if (enhancementLevel >= 6) return "border-cyan-400";
        return getRarityBorder(equippedItem.rarity);
      }
      return "border-stone-700";
    };

    // Get glow effect based on enhancement level
    const getGlowEffect = () => {
      if (enhancementLevel >= 9) {
        return "shadow-[0_0_20px_rgba(168,85,247,0.8),0_0_40px_rgba(168,85,247,0.4)]";
      }
      if (enhancementLevel >= 8) {
        return "shadow-[0_0_20px_rgba(236,72,153,0.8),0_0_40px_rgba(236,72,153,0.4)]";
      }
      if (enhancementLevel >= 7) {
        return "shadow-[0_0_15px_rgba(99,102,241,0.6),0_0_30px_rgba(99,102,241,0.3)]";
      }
      if (enhancementLevel >= 6) {
        return "shadow-[0_0_15px_rgba(34,211,238,0.6),0_0_30px_rgba(34,211,238,0.3)]";
      }
      return "";
    };

    // Get animation effect based on enhancement level
    const getAnimationStyle = () => {
      if (enhancementLevel >= 1 && enhancementLevel <= 2) {
        return { animation: "shimmer 2s ease-in-out infinite" };
      }
      if (enhancementLevel >= 3 && enhancementLevel <= 4) {
        return { animation: "glow-pulse 1.5s ease-in-out infinite" };
      }
      if (enhancementLevel === 5) {
        return { animation: "sparkle-shine 1.2s ease-in-out infinite" };
      }
      return {};
    };

    return (
      <div
        onClick={() => {
          if (equippedItem && itemSlot) {
            setSelectedItemDetails(itemSlot);
          } else {
            setSelectedSlot(slotType);
          }
        }}
        className={`relative aspect-square bg-stone-900 border-2 cursor-pointer transition ${getBorderClass()} ${
          equippedItem ? "hover:border-amber-500" : "hover:border-amber-600"
        } ${getGlowEffect()}`}
        style={{
          boxShadow: "0 2px 0 rgba(0,0,0,0.3)",
          ...getAnimationStyle(),
        }}
      >
        {equippedItem ? (
          <div className="absolute inset-0 flex items-center justify-center p-2">
            {/* +9 WebGL Lightning Effect */}
            {enhancementLevel >= 9 && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <Lightning
                  hue={270}
                  xOffset={0}
                  speed={1.5}
                  intensity={0.8}
                  size={2}
                />
              </div>
            )}
            {/* +8 WebGL ColorBends Effect */}
            {enhancementLevel === 8 && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <ColorBends
                  colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
                  rotation={30}
                  speed={0.3}
                  scale={1.2}
                  frequency={1.4}
                  warpStrength={1.2}
                  mouseInfluence={0}
                  parallax={0}
                  noise={0.08}
                  transparent
                />
              </div>
            )}
            {/* +7 Galaxy Effect */}
            {enhancementLevel === 7 && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20" />
                {Array.from({ length: 15 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animation: `twinkle 3s ease-in-out infinite ${
                        Math.random() * 3
                      }s`,
                      opacity: 0.8,
                    }}
                  />
                ))}
              </div>
            )}
            {/* +6 Electric Border Effect */}
            {enhancementLevel === 6 && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)",
                    animation: "electricSweep 2s linear infinite",
                  }}
                />
              </div>
            )}
            <div className="relative w-full h-full">
              {getItemImage(equippedItem.spriteId, equippedItem.type) && (
                <img
                  src={getItemImage(equippedItem.spriteId, equippedItem.type)!}
                  alt={equippedItem.name}
                  className={`w-full h-full object-contain ${
                    enhancementLevel >= 9
                      ? "filter drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                      : enhancementLevel >= 8
                      ? "filter drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]"
                      : enhancementLevel >= 7
                      ? "filter drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                      : enhancementLevel >= 6
                      ? "filter drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]"
                      : ""
                  }`}
                  style={{ imageRendering: "pixelated" }}
                />
              )}
            </div>
            {/* Enhancement Level Badge */}
            {enhancementLevel > 0 && (
              <div
                className={`absolute top-0 right-0 text-white text-xs font-bold px-1.5 py-0.5 border-2 ${
                  enhancementLevel >= 9
                    ? "bg-purple-500 border-purple-700 shadow-[0_0_10px_rgba(168,85,247,0.8)]"
                    : enhancementLevel >= 8
                    ? "bg-pink-500 border-pink-700 shadow-[0_0_10px_rgba(236,72,153,0.8)]"
                    : enhancementLevel >= 7
                    ? "bg-indigo-500 border-indigo-700 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                    : enhancementLevel >= 6
                    ? "bg-cyan-500 border-cyan-700 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                    : "bg-amber-600 border-amber-800"
                }`}
                style={{ fontFamily: "monospace" }}
              >
                +{enhancementLevel}
              </div>
            )}
            {/* Socket Indicators */}
            {socketSlots > 0 && (
              <div className="absolute bottom-0 right-0 flex gap-0.5 bg-black/50 px-1">
                {Array.from({ length: socketSlots }).map((_, i) => (
                  <Circle
                    key={i}
                    size={6}
                    className={
                      socketedGems[i]
                        ? "fill-green-400 text-green-400"
                        : "fill-stone-600 text-stone-600"
                    }
                  />
                ))}
              </div>
            )}
            {/* Refining Indicator */}
            {itemSlot?.refineStats &&
              Object.keys(itemSlot.refineStats).length > 0 && (
                <div
                  className="absolute bottom-0 left-0 bg-purple-600 border border-purple-400 text-white text-xs font-bold px-1 py-0.5"
                  style={{
                    fontFamily: "monospace",
                    textShadow: "0 0 4px rgba(168,85,247,0.8)",
                  }}
                >
                  ✨
                </div>
              )}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
            <p
              className="text-xs font-bold"
              style={{ fontFamily: "monospace" }}
            >
              {label}
            </p>
            <p className="text-[10px] text-gray-700 mt-1">Empty</p>
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
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedItemDetails(null)}
        >
          <div
            className="bg-stone-900 border-4 border-amber-600 rounded-lg p-4 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {getItemImage(
                    selectedItemDetails.item.spriteId,
                    selectedItemDetails.item.type
                  ) && (
                    <img
                      src={
                        getItemImage(
                          selectedItemDetails.item.spriteId,
                          selectedItemDetails.item.type
                        )!
                      }
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
                  <h3
                    className={`text-xl font-bold ${getRarityColor(
                      selectedItemDetails.item.rarity
                    )}`}
                  >
                    {selectedItemDetails.item.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {selectedItemDetails.item.type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItemDetails(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Base Stats */}
            <div className="bg-stone-800 p-3 rounded mb-3">
              <h4 className="text-sm font-bold text-amber-400 mb-2">
                Base Stats
              </h4>
              <div className="space-y-1 text-sm">
                {selectedItemDetails.item.attackBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Attack:</span>
                    <span className="text-red-400">
                      +{selectedItemDetails.item.attackBonus}
                    </span>
                  </div>
                )}
                {selectedItemDetails.item.defenseBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Defense:</span>
                    <span className="text-blue-400">
                      +{selectedItemDetails.item.defenseBonus}
                    </span>
                  </div>
                )}
                {selectedItemDetails.item.healthBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Health:</span>
                    <span className="text-green-400">
                      +{selectedItemDetails.item.healthBonus}
                    </span>
                  </div>
                )}
                {selectedItemDetails.item.speedBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Speed:</span>
                    <span className="text-purple-400">
                      +{selectedItemDetails.item.speedBonus}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Enhancement Bonus */}
            {selectedItemDetails.enhancementLevel > 0 && (
              <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 p-3 rounded mb-3 border border-amber-600">
                <h4 className="text-sm font-bold text-amber-400 mb-2">
                  Enhancement Bonus (+{selectedItemDetails.enhancementLevel})
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">All Stats:</span>
                    <span className="text-amber-300">
                      +{ENHANCEMENT_BONUS[selectedItemDetails.enhancementLevel] || 0}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Refining Stats */}
            {selectedItemDetails.refineStats &&
              typeof selectedItemDetails.refineStats === "object" &&
              Object.keys(selectedItemDetails.refineStats).length > 0 && (
                <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 p-3 rounded mb-3 border border-purple-600">
                  <h4 className="text-sm font-bold text-purple-400 mb-2 flex items-center gap-1">
                    <img
                      src={refiningBonusIcon}
                      alt="Refining"
                      className="w-4 h-4"
                      style={{ imageRendering: "pixelated" }}
                    />
                    Refining Bonuses
                  </h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(selectedItemDetails.refineStats).map(
                      ([stat, value]) => {
                        const statIcons: Record<string, string> = {
                          fireAttack: "🔥",
                          iceAttack: "❄️",
                          lightningAttack: "⚡",
                          poisonAttack: "☠️",
                          critChance: "💥",
                          critDamage: "💢",
                          lifeSteal: "💖",
                          dodgeChance: "🌀",
                        };
                        const statNames: Record<string, string> = {
                          fireAttack: "Fire Attack",
                          iceAttack: "Ice Attack",
                          lightningAttack: "Lightning Attack",
                          poisonAttack: "Poison Attack",
                          critChance: "Critical Chance",
                          critDamage: "Critical Damage",
                          lifeSteal: "Life Steal",
                          dodgeChance: "Dodge Chance",
                        };
                        return (
                          <div key={stat} className="flex justify-between">
                            <span className="text-purple-200">
                              {statIcons[stat] || "⭐"}{" "}
                              {statNames[stat] || stat}:
                            </span>
                            <span className="text-purple-300 font-bold">
                              +{value as number}
                              {stat.includes("Chance") ||
                              stat.includes("Damage") ||
                              stat.includes("Steal")
                                ? "%"
                                : ""}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

            {/* Socketed Gems */}
            {selectedItemDetails.socketSlots > 0 && (
              <div className="bg-stone-800 p-3 rounded mb-3">
                <h4 className="text-sm font-bold text-green-400 mb-2 flex items-center gap-1">
                  <img
                    src={socketDrillIcon}
                    alt="Socket"
                    className="w-4 h-4"
                    style={{ imageRendering: "pixelated" }}
                  />
                  Sockets ({selectedItemDetails.socketedGems?.length || 0}/
                  {selectedItemDetails.socketSlots})
                </h4>
                <div className="space-y-2">
                  {Array.from({ length: selectedItemDetails.socketSlots }).map(
                    (_, i) => {
                      const gemId = selectedItemDetails.socketedGems?.[i];
                      const gem = gemId ? getGemDetails(gemId) : null;
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-stone-900 p-2 rounded border border-stone-700"
                        >
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
                                <p
                                  className={`text-sm font-bold ${getRarityColor(
                                    gem.rarity
                                  )}`}
                                >
                                  {gem.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {gem.healthBonus > 0 &&
                                    `+${gem.healthBonus} HP `}
                                  {gem.attackBonus > 0 &&
                                    `+${gem.attackBonus} ATK `}
                                  {gem.defenseBonus > 0 &&
                                    `+${gem.defenseBonus} DEF `}
                                  {gem.speedBonus > 0 &&
                                    `+${gem.speedBonus} SPD`}
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-500">
                              <Circle
                                size={20}
                                className="fill-stone-700 text-stone-700"
                              />
                              <span className="text-sm">Empty Socket</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-stone-800 p-3 rounded mb-3">
              <p className="text-sm text-gray-300">
                {selectedItemDetails.item.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {/* Unequip Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Determine which slot this item belongs to
                  let slotType:
                    | "weapon"
                    | "armor"
                    | "helmet"
                    | "gloves"
                    | "shoes"
                    | "ring"
                    | "necklace"
                    | "belt"
                    | "earring"
                    | null = null;
                  if (getSlotItem("weapon")?.id === selectedItemDetails.item.id)
                    slotType = "weapon";
                  else if (
                    getSlotItem("armor")?.id === selectedItemDetails.item.id
                  )
                    slotType = "armor";
                  else if (
                    getSlotItem("helmet")?.id === selectedItemDetails.item.id
                  )
                    slotType = "helmet";
                  else if (
                    getSlotItem("gloves")?.id === selectedItemDetails.item.id
                  )
                    slotType = "gloves";
                  else if (
                    getSlotItem("shoes")?.id === selectedItemDetails.item.id
                  )
                    slotType = "shoes";
                  else if (
                    getSlotItem("ring")?.id === selectedItemDetails.item.id
                  )
                    slotType = "ring";
                  else if (
                    getSlotItem("necklace")?.id === selectedItemDetails.item.id
                  )
                    slotType = "necklace";
                  else if (
                    getSlotItem("belt")?.id === selectedItemDetails.item.id
                  )
                    slotType = "belt";
                  else if (
                    getSlotItem("earring")?.id === selectedItemDetails.item.id
                  )
                    slotType = "earring";

                  if (slotType) {
                    unequipMutation.mutate(slotType);
                  }
                }}
                disabled={unequipMutation.isPending}
                className="flex-1 py-3 bg-red-700 hover:bg-red-600 disabled:bg-gray-600 text-white font-bold transition relative overflow-hidden"
                style={{
                  border: "3px solid #7f1d1d",
                  borderRadius: "0",
                  boxShadow:
                    "0 3px 0 #991b1b, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                  textShadow: "1px 1px 0 #000",
                  fontFamily: "monospace",
                  letterSpacing: "1px",
                }}
              >
                <span className="relative z-10">
                  {unequipMutation.isPending ? "⏳" : "✖️"} UNEQUIP
                </span>
                <div className="absolute inset-0 bg-gradient-to-b from-red-400/20 to-transparent"></div>
              </button>

              {/* Change Equipment Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Determine which slot this item belongs to
                  let slotType:
                    | "weapon"
                    | "armor"
                    | "helmet"
                    | "gloves"
                    | "shoes"
                    | "ring"
                    | "necklace"
                    | "belt"
                    | "earring"
                    | null = null;
                  if (getSlotItem("weapon")?.id === selectedItemDetails.item.id)
                    slotType = "weapon";
                  else if (
                    getSlotItem("armor")?.id === selectedItemDetails.item.id
                  )
                    slotType = "armor";
                  else if (
                    getSlotItem("helmet")?.id === selectedItemDetails.item.id
                  )
                    slotType = "helmet";
                  else if (
                    getSlotItem("gloves")?.id === selectedItemDetails.item.id
                  )
                    slotType = "gloves";
                  else if (
                    getSlotItem("shoes")?.id === selectedItemDetails.item.id
                  )
                    slotType = "shoes";
                  else if (
                    getSlotItem("ring")?.id === selectedItemDetails.item.id
                  )
                    slotType = "ring";
                  else if (
                    getSlotItem("necklace")?.id === selectedItemDetails.item.id
                  )
                    slotType = "necklace";
                  else if (
                    getSlotItem("belt")?.id === selectedItemDetails.item.id
                  )
                    slotType = "belt";
                  else if (
                    getSlotItem("earring")?.id === selectedItemDetails.item.id
                  )
                    slotType = "earring";

                  setSelectedItemDetails(null);
                  if (slotType) setSelectedSlot(slotType);
                }}
                className="flex-1 py-3 bg-amber-700 hover:bg-amber-600 text-white font-bold transition relative overflow-hidden"
                style={{
                  border: "3px solid #92400e",
                  borderRadius: "0",
                  boxShadow:
                    "0 3px 0 #b45309, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                  textShadow: "1px 1px 0 #000",
                  fontFamily: "monospace",
                  letterSpacing: "1px",
                }}
              >
                <span className="relative z-10">🔄 CHANGE</span>
                <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
              </button>
            </div>
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

            {/* Equipment Slots - Compact Body Layout */}
            <div className="relative max-w-xs mx-auto">
              {/* Use CSS Grid for precise positioning */}
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: "repeat(3, 85px)",
                  gridTemplateRows: "repeat(3, 85px)",
                  justifyContent: "center",
                }}
              >
                {/* Row 1: Earring, Helmet, Necklace */}
                <EquipmentSlot
                  slotType="earring"
                  equippedItem={getSlotItem("earring")}
                  label="Earring"
                />
                <EquipmentSlot
                  slotType="helmet"
                  equippedItem={getSlotItem("helmet")}
                  label="Helmet"
                />
                <EquipmentSlot
                  slotType="necklace"
                  equippedItem={getSlotItem("necklace")}
                  label="Necklace"
                />

                {/* Row 2: Weapon, Armor, Gloves */}
                <EquipmentSlot
                  slotType="weapon"
                  equippedItem={getSlotItem("weapon")}
                  label="Weapon"
                />
                <EquipmentSlot
                  slotType="armor"
                  equippedItem={getSlotItem("armor")}
                  label="Armor"
                />
                <EquipmentSlot
                  slotType="gloves"
                  equippedItem={getSlotItem("gloves")}
                  label="Gloves"
                />

                {/* Row 3: Ring, Shoes, Belt */}
                <EquipmentSlot
                  slotType="ring"
                  equippedItem={getSlotItem("ring")}
                  label="Ring"
                />
                <EquipmentSlot
                  slotType="shoes"
                  equippedItem={getSlotItem("shoes")}
                  label="Shoes"
                />
                <EquipmentSlot
                  slotType="belt"
                  equippedItem={getSlotItem("belt")}
                  label="Belt"
                />
              </div>
            </div>
          </div>

          {/* Pet/Companion Slot - Premium Retro Design */}
          <div
            className="relative bg-gradient-to-b from-pink-950 via-stone-900 to-stone-950 border-4 border-pink-500 p-5 mb-4"
            style={{
              boxShadow:
                "0 8px 0 #831843, 0 12px 0 rgba(0,0,0,0.8), inset 0 -4px 0 rgba(0,0,0,0.5), inset 0 4px 0 rgba(255,105,180,0.3)",
              borderRadius: "0",
            }}
          >
            {/* Decorative corners */}
            <div
              className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-yellow-400"
              style={{ margin: "-2px" }}
            />
            <div
              className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-yellow-400"
              style={{ margin: "-2px" }}
            />
            <div
              className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-yellow-400"
              style={{ margin: "-2px" }}
            />
            <div
              className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-yellow-400"
              style={{ margin: "-2px" }}
            />

            {/* Title with pet icon */}
            <div className="flex items-center justify-center gap-3 mb-4 pb-3 border-b-2 border-pink-700">
              <h3
                className="text-pink-300 font-bold text-xl tracking-wider"
                style={{
                  fontFamily: "monospace",
                  textShadow:
                    "3px 3px 0 #000, 0 0 20px rgba(236, 72, 153, 0.8), 0 0 40px rgba(236, 72, 153, 0.4)",
                  letterSpacing: "0.15em",
                }}
              >
                PET COMPANION
              </h3>
            </div>

            <div className="flex items-center gap-4">
              {/* Pet Display - Enhanced */}
              <div
                className="w-28 h-28 bg-gradient-to-br from-black via-stone-950 to-pink-950 border-4 border-pink-400 flex items-center justify-center cursor-pointer hover:border-pink-300 transition relative group"
                onClick={() => setSelectedSlot("companion")}
                style={{
                  imageRendering: "pixelated",
                  boxShadow:
                    "0 6px 0 #be185d, inset 0 4px 0 rgba(236, 72, 153, 0.3), inset 0 -4px 0 rgba(0,0,0,0.5), 0 0 20px rgba(236, 72, 153, 0.4)",
                  borderRadius: "0",
                }}
              >
                {/* Animated glow effect */}
                <div className="absolute inset-0 bg-pink-500 opacity-0 group-hover:opacity-20 transition pointer-events-none" />

                {getSlotItem("companion") ? (
                  <>
                    <img
                      src={`/assets/ui/${
                        getSlotItem("companion")?.spriteId
                      }.png`}
                      alt={getSlotItem("companion")?.name}
                      className="w-full h-full object-contain p-3 relative z-10"
                      style={{
                        imageRendering: "pixelated",
                        filter: "drop-shadow(0 0 10px rgba(236, 72, 153, 0.6))",
                      }}
                    />
                    {/* Rarity glow with enhanced effect */}
                    <div
                      className={`absolute inset-0 ${getRarityBorder(
                        getSlotItem("companion")?.rarity
                      )} opacity-60 pointer-events-none`}
                      style={{
                        boxShadow: `inset 0 0 20px currentColor`,
                        animation: "pulse 2s ease-in-out infinite",
                      }}
                    />
                  </>
                ) : (
                  <img
                    src={petIcon}
                    alt="No Pet Equipped"
                    className="w-20 h-20 object-contain opacity-40 grayscale group-hover:opacity-60 group-hover:grayscale-0 transition"
                    style={{
                      imageRendering: "pixelated",
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))",
                    }}
                  />
                )}
              </div>

              {/* Pet Info */}
              <div className="flex-1">
                {getSlotItem("companion") ? (
                  <>
                    <h4
                      className={`font-bold text-xl ${getRarityColor(
                        getSlotItem("companion")?.rarity
                      )}`}
                      style={{
                        fontFamily: "monospace",
                        textShadow: "2px 2px 0 #000, 0 0 10px currentColor",
                      }}
                    >
                      {getSlotItem("companion")?.name}
                    </h4>
                    <p
                      className="text-sm text-pink-200 mb-2"
                      style={{
                        fontFamily: "monospace",
                        textShadow: "1px 1px 0 #000",
                      }}
                    >
                      {getSlotItem("companion")?.companionType} •{" "}
                      {getSlotItem("companion")?.rarity}
                    </p>

                    {/* Stats - Premium badges */}
                    <div
                      className="flex gap-2 mt-2 text-xs"
                      style={{ fontFamily: "monospace" }}
                    >
                      {getSlotItem("companion")?.attackBonus > 0 && (
                        <span
                          className="bg-gradient-to-b from-red-600 to-red-800 text-white px-2 py-1 border-2 border-red-400 font-bold"
                          style={{
                            boxShadow:
                              "0 2px 0 #7f1d1d, inset 0 1px 0 rgba(255,255,255,0.3)",
                            textShadow: "1px 1px 0 #000",
                          }}
                        >
                          +{getSlotItem("companion")?.attackBonus} ATK
                        </span>
                      )}
                      {getSlotItem("companion")?.defenseBonus > 0 && (
                        <span
                          className="bg-gradient-to-b from-blue-600 to-blue-800 text-white px-2 py-1 border-2 border-blue-400 font-bold"
                          style={{
                            boxShadow:
                              "0 2px 0 #1e3a8a, inset 0 1px 0 rgba(255,255,255,0.3)",
                            textShadow: "1px 1px 0 #000",
                          }}
                        >
                          +{getSlotItem("companion")?.defenseBonus} DEF
                        </span>
                      )}
                      {getSlotItem("companion")?.healthBonus > 0 && (
                        <span
                          className="bg-gradient-to-b from-green-600 to-green-800 text-white px-2 py-1 border-2 border-green-400 font-bold"
                          style={{
                            boxShadow:
                              "0 2px 0 #14532d, inset 0 1px 0 rgba(255,255,255,0.3)",
                            textShadow: "1px 1px 0 #000",
                          }}
                        >
                          +{getSlotItem("companion")?.healthBonus} HP
                        </span>
                      )}
                    </div>

                    {/* Ability - Premium display */}
                    {getSlotItem("companion")?.abilityName && (
                      <div
                        className="mt-3 bg-gradient-to-br from-purple-900 to-purple-950 px-3 py-2 border-2 border-purple-500"
                        style={{
                          boxShadow:
                            "0 4px 0 #581c87, inset 0 2px 0 rgba(168,85,247,0.3)",
                          borderRadius: "0",
                        }}
                      >
                        <p
                          className="text-purple-200 text-xs font-bold"
                          style={{
                            fontFamily: "monospace",
                            textShadow: "1px 1px 0 #000",
                          }}
                        >
                          ⚡ {getSlotItem("companion")?.abilityName}
                        </p>
                        <p
                          className="text-purple-300 text-xs"
                          style={{
                            fontFamily: "monospace",
                            textShadow: "1px 1px 0 #000",
                          }}
                        >
                          Power: {getSlotItem("companion")?.abilityPower}
                        </p>
                      </div>
                    )}

                    {/* Unequip Button - Premium design */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        unequipMutation.mutate("companion");
                      }}
                      className="mt-3 px-4 py-2 bg-gradient-to-b from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white text-sm font-bold border-2 border-red-500 transition-all"
                      style={{
                        fontFamily: "monospace",
                        boxShadow:
                          "0 4px 0 #7f1d1d, inset 0 2px 0 rgba(255,255,255,0.2)",
                        textShadow: "2px 2px 0 #000",
                        borderRadius: "0",
                      }}
                    >
                      UNEQUIP PET
                    </button>
                  </>
                ) : (
                  <>
                    <h4
                      className="font-bold text-pink-200 text-lg"
                      style={{
                        fontFamily: "monospace",
                        textShadow: "2px 2px 0 #000",
                      }}
                    >
                      No Pet Equipped
                    </h4>
                    <p
                      className="text-sm text-pink-300/60 mt-1 mb-3"
                      style={{
                        fontFamily: "monospace",
                        textShadow: "1px 1px 0 #000",
                      }}
                    >
                      Click the slot to equip a companion!
                    </p>
                    <button
                      onClick={() => setSelectedSlot("companion")}
                      className="px-4 py-2 bg-gradient-to-b from-pink-600 to-pink-800 hover:from-pink-500 hover:to-pink-700 text-white text-sm font-bold border-2 border-pink-400 transition-all"
                      style={{
                        fontFamily: "monospace",
                        boxShadow:
                          "0 4px 0 #be185d, inset 0 2px 0 rgba(255,255,255,0.2)",
                        textShadow: "2px 2px 0 #000",
                        borderRadius: "0",
                      }}
                    >
                      EQUIP PET
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Character Stats - Retro RPG Style */}
          <div className="bg-gradient-to-b from-stone-900 to-stone-800 rounded-lg border-2 border-amber-600 p-4 mb-4">
            <h3
              className="text-amber-400 font-bold text-lg mb-3 text-center"
              style={{ fontFamily: "monospace", textShadow: "2px 2px 0 #000" }}
            >
              ═══ CHARACTER STATS ═══
            </h3>

            {/* Core Stats */}
            <div className="bg-black/40 rounded p-3 mb-3 border border-amber-800">
              <h4
                className="text-amber-300 font-bold text-sm mb-2"
                style={{ fontFamily: "monospace" }}
              >
                ▸ CORE ATTRIBUTES
              </h4>
              <div
                className="grid grid-cols-2 gap-2 text-sm"
                style={{ fontFamily: "monospace" }}
              >
                <div className="flex items-center justify-between bg-stone-900/50 p-2 rounded border border-red-900/50">
                  <span className="text-red-400 flex items-center gap-1">
                    <img src={hpIconCP} alt="HP" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
                    HP
                  </span>
                  <span className="text-white font-bold">
                    {character.maxHealth}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-stone-900/50 p-2 rounded border border-orange-900/50">
                  <span className="text-orange-400 flex items-center gap-1">
                    <img src={attackIconCP} alt="ATK" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
                    ATK
                  </span>
                  <span className="text-white font-bold">
                    {character.attack}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-stone-900/50 p-2 rounded border border-blue-900/50">
                  <span className="text-blue-400 flex items-center gap-1">
                    <img src={defenseIconCP} alt="DEF" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
                    DEF
                  </span>
                  <span className="text-white font-bold">
                    {character.defense}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-stone-900/50 p-2 rounded border border-green-900/50">
                  <span className="text-green-400 flex items-center gap-1">
                    <img src={speedIconCP} alt="SPD" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
                    SPD
                  </span>
                  <span className="text-white font-bold">
                    {character.speed}
                  </span>
                </div>
              </div>
            </div>

            {/* Special Stats - Only show if character has any */}
            {((character as any).fireAttack > 0 ||
              (character as any).iceAttack > 0 ||
              (character as any).lightningAttack > 0 ||
              (character as any).poisonAttack > 0 ||
              (character as any).critChance > 0 ||
              (character as any).critDamage > 0 ||
              (character as any).lifeSteal > 0 ||
              (character as any).dodgeChance > 0) && (
              <div className="bg-black/40 rounded p-3 border border-purple-800">
                <h4
                  className="text-purple-300 font-bold text-sm mb-2"
                  style={{ fontFamily: "monospace" }}
                >
                  ▸ SPECIAL ATTRIBUTES
                </h4>
                <div
                  className="grid grid-cols-2 gap-2 text-xs"
                  style={{ fontFamily: "monospace" }}
                >
                  {(character as any).fireAttack > 0 && (
                    <div className="flex items-center justify-between bg-stone-900/50 p-2 rounded border border-red-700/30">
                      <span className="text-red-300 flex items-center gap-1">
                        <img src={fireIcon} alt="Fire" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
                        Fire
                      </span>
                      <span className="text-red-400 font-bold">
                        +{(character as any).fireAttack}
                      </span>
                    </div>
                  )}
                  {(character as any).iceAttack > 0 && (
                    <div className="flex items-center justify-between bg-stone-900/50 p-2 rounded border border-cyan-700/30">
                      <span className="text-cyan-300 flex items-center gap-1">
                        <img src={iceIcon} alt="Ice" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
                        Ice
                      </span>
                      <span className="text-cyan-400 font-bold">
                        +{(character as any).iceAttack}
                      </span>
                    </div>
                  )}
                  {(character as any).lightningAttack > 0 && (
                    <div className="flex items-center justify-between bg-stone-900/50 p-2 rounded border border-yellow-700/30">
                      <span className="text-yellow-300 flex items-center gap-1">
                        <img src={lightningIcon} alt="Lightning" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
                        Lightning
                      </span>
                      <span className="text-yellow-400 font-bold">
                        +{(character as any).lightningAttack}
                      </span>
                    </div>
                  )}
                  {(character as any).poisonAttack > 0 && (
                    <div className="flex items-center justify-between bg-stone-900/50 p-2 rounded border border-green-700/30">
                      <span className="text-green-300 flex items-center gap-1">
                        <img src={poisonIcon} alt="Poison" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
                        Poison
                      </span>
                      <span className="text-green-400 font-bold">
                        +{(character as any).poisonAttack}
                      </span>
                    </div>
                  )}
                  {(character as any).critChance > 0 && (
                    <div className="flex items-center justify-between bg-stone-900/50 p-2 rounded border border-amber-700/30">
                      <span className="text-amber-300 flex items-center gap-1">
                        <img src={critChanceIcon} alt="Crit Chance" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
                        Crit %
                      </span>
                      <span className="text-amber-400 font-bold">
                        {(character as any).critChance}%
                      </span>
                    </div>
                  )}
                  {(character as any).critDamage > 0 && (
                    <div className="flex items-center justify-between bg-stone-900/50 p-2 rounded border border-orange-700/30">
                      <span className="text-orange-300 flex items-center gap-1">
                        <img src={critDamageIcon} alt="Crit Damage" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
                        Crit DMG
                      </span>
                      <span className="text-orange-400 font-bold">
                        +{(character as any).critDamage}%
                      </span>
                    </div>
                  )}
                  {(character as any).lifeSteal > 0 && (
                    <div className="flex items-center justify-between bg-stone-900/50 p-2 rounded border border-pink-700/30">
                      <span className="text-pink-300 flex items-center gap-1">
                        <img src={lifestealIcon} alt="Lifesteal" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
                        Lifesteal
                      </span>
                      <span className="text-pink-400 font-bold">
                        {(character as any).lifeSteal}%
                      </span>
                    </div>
                  )}
                  {(character as any).dodgeChance > 0 && (
                    <div className="flex items-center justify-between bg-stone-900/50 p-2 rounded border border-indigo-700/30">
                      <span className="text-indigo-300 flex items-center gap-1">
                        <img src={dodgeIcon} alt="Dodge" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
                        Dodge
                      </span>
                      <span className="text-indigo-400 font-bold">
                        {(character as any).dodgeChance}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
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
                            slotId: slot.id,
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
                              src={
                                getItemImage(
                                  slot.item.spriteId,
                                  slot.item.type
                                )!
                              }
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
                              {slot.enhancementLevel > 0 && (
                                <span className="text-yellow-400 ml-2">
                                  +{slot.enhancementLevel}
                                </span>
                              )}
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
                            <div className="flex flex-wrap gap-2 text-xs mt-1">
                              {/* Base Stats */}
                              {slot.item.attackBonus > 0 && (
                                <span className="text-orange-400">
                                  ATK +{slot.item.attackBonus}
                                  {slot.enhancementLevel > 0 && (
                                    <span className="text-yellow-400">
                                      {" "}(+{slot.enhancementLevel * 2})
                                    </span>
                                  )}
                                </span>
                              )}
                              {slot.item.defenseBonus > 0 && (
                                <span className="text-blue-400">
                                  DEF +{slot.item.defenseBonus}
                                  {slot.enhancementLevel > 0 && (
                                    <span className="text-yellow-400">
                                      {" "}(+{slot.enhancementLevel * 2})
                                    </span>
                                  )}
                                </span>
                              )}
                              {slot.item.healthBonus > 0 && (
                                <span className="text-red-400">
                                  HP +{slot.item.healthBonus}
                                  {slot.enhancementLevel > 0 && (
                                    <span className="text-yellow-400">
                                      {" "}(+{slot.enhancementLevel * 10})
                                    </span>
                                  )}
                                </span>
                              )}
                              {/* Refinement Stats */}
                              {slot.refineStats && (
                                <>
                                  {Object.entries(slot.refineStats).map(([stat, value]: [string, any]) => (
                                    <span key={stat} className="text-purple-400">
                                      {stat.replace(/([A-Z])/g, ' $1').trim()}: +{value}
                                    </span>
                                  ))}
                                </>
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
