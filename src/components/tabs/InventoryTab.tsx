import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi, characterApi, craftingApi } from "@/lib/api";
import { useGameStore } from "@/store/gameStore";
import { getRarityColor, getRarityBorder, formatGold } from "@/utils/format";
import { Check } from "lucide-react";
import sellItemIcon from "@/assets/ui/sellItemIcon.png";
import inventoryIcon from "@/assets/ui/inventory.png";

type CategoryFilter =
  | "All"
  | "Weapons"
  | "Armor"
  | "Accessories"
  | "Consumables"
  | "Materials";

export default function InventoryTab() {
  const queryClient = useQueryClient();
  const { character, player, setCharacter, setPlayer } = useGameStore();
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [selectedItemDetail, setSelectedItemDetail] = useState<any>(null);

  const getGuildItemPath = (spriteId: string, itemType?: string) => {
    // FIRST: Convert tier names to numbers (bronze→1, silver→2, gold→3, diamond→4)
    let fileName = spriteId;
    const tierMap: { [key: string]: string } = {
      bronze: "1",
      silver: "2",
      gold: "3",
      diamond: "4",
    };

    for (const [tier, number] of Object.entries(tierMap)) {
      if (fileName.includes(`_${tier}`)) {
        fileName = fileName.replace(`_${tier}`, number);
        break;
      }
    }

    console.log("   → After tier mapping:", fileName);

    // Handle guild_key (no tier, maps to key1.png)
    if (spriteId === "guild_key") {
      return `chests_and_keys/key1.png`;
    }

    // Handle guild_chest# (maps to Chest#.png with capital C)
    if (fileName.startsWith("guild_chest")) {
      const num = fileName.replace("guild_chest", "");
      return `chests_and_keys/Chest${num}.png`;
    }

    // Handle guild_sword# (maps to guildsword#.png - no underscore)
    if (fileName.startsWith("guild_sword")) {
      const finalName = fileName.replace("guild_sword", "guildsword");
      return `weapons/guild_sword/${finalName}.png`;
    }

    // Handle other weapons
    if (fileName.startsWith("guild_bow"))
      return `weapons/guild_bow/${fileName}.png`;
    if (fileName.startsWith("guild_dagger"))
      return `weapons/guild_dagger/${fileName}.png`;
    if (fileName.startsWith("guild_shield"))
      return `weapons/guild_shield/${fileName}.png`;
    if (fileName.startsWith("guild_staff"))
      return `weapons/guild_staff/${fileName}.png`;

    // Handle armors
    if (fileName.startsWith("guild_armor"))
      return `armors/warrior_armors/${fileName}.png`;

    // Handle armor pieces
    // guild_glove1 to guild_glove4
    if (fileName.includes("glove"))
      return `guild_armor_pieces/gloves/${fileName}.png`;
    // guild_shoe1 → guild_shoes1.png
    if (fileName.includes("boot") || fileName.includes("shoe")) {
      const shoeName = fileName
        .replace("guild_boot", "guild_shoes")
        .replace("guild_shoe", "guild_shoes");
      return `guild_armor_pieces/shoes/${shoeName}.png`;
    }

    // Handle accessories (map to Icon files)
    if (fileName === "guild_belt") return `guild_accessories/belts/Icon27.png`;
    if (fileName === "guild_earring")
      return `guild_accessories/earrings/Icon12.png`;
    if (fileName === "guild_necklace")
      return `guild_accessories/necklaces/Icon29.png`;
    if (fileName === "guild_ring") return `guild_accessories/rings/Icon1.png`;

    // Handle Icon files directly
    if (fileName.startsWith("Icon")) {
      const iconNum = parseInt(fileName.match(/\d+/)?.[0] || "0");
      if (iconNum >= 1 && iconNum <= 11)
        return `guild_accessories/rings/${fileName}.png`;
      if (iconNum >= 12 && iconNum <= 20)
        return `guild_accessories/earrings/${fileName}.png`;
      if (iconNum >= 29 && iconNum <= 48)
        return `guild_accessories/necklaces/${fileName}.png`;
      if (iconNum === 2 || iconNum === 27 || iconNum === 35)
        return `guild_accessories/belts/${fileName}.png`;
    }

    console.warn(
      "⚠️ [INVENTORY] No mapping found for guild item:",
      spriteId,
      "→",
      fileName
    );
    return `${fileName}.png`; // fallback
  };

  const getItemImage = (spriteId: string, itemType?: string) => {
    if (!spriteId) return null;

    try {
      // Use eager glob imports to ensure images are bundled
      const images = import.meta.glob("../../assets/items/**/*.png", {
        eager: true,
        as: "url",
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
        }
      }

      // Check for guild shop items (guild_sword, guild_dagger, Chest, key, etc.)
      if (
        spriteId.startsWith("guild_") ||
        spriteId.startsWith("Chest") ||
        spriteId.startsWith("key")
      ) {
        // Guild items need special path handling
        return `/assets/items/guildshop_items/${getGuildItemPath(
          spriteId,
          itemType
        )}`;
      }

      // Check if spriteId contains a path (for gems, materials, accessories with woodenSet/, ironSet/, etc.)
      if (spriteId.includes("/")) {
        // spriteId already contains the full path like 'craft/gems/red_gem' or 'woodenSet/woodenRing' or 'ironSet/ironRing'
        // For accessories with woodenSet/ or ironSet/, the path is accessories/woodenSet/... or accessories/ironSet/...
        const fullPath =
          spriteId.startsWith("woodenSet/") ||
          spriteId.startsWith("ironSet/") ||
          spriteId.startsWith("dungeonDrops/")
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

  const {
    data: inventory,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      console.log("Fetching inventory...");
      try {
        const response = await inventoryApi.get();
        console.log("Inventory response:", response);
        console.log("Inventory data:", response.data);
        return response.data;
      } catch (err) {
        console.error("Inventory fetch error:", err);
        throw err;
      }
    },
  });

  console.log("Query state:", { inventory, isLoading, error });

  const equipMutation = useMutation({
    mutationFn: async ({ itemId, slot }: { itemId: string; slot: string }) => {
      const result = await characterApi.equip(itemId, slot);
      return result;
    },
    onSuccess: async () => {
      // Update character immediately
      const { data: updatedCharacter } = await characterApi.get();
      setCharacter(updatedCharacter);

      queryClient.invalidateQueries({ queryKey: ["character"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  const unequipMutation = useMutation({
    mutationFn: async (slot: string) => {
      const result = await characterApi.unequip(slot);
      return result;
    },
    onSuccess: async () => {
      // Update character immediately
      const { data: updatedCharacter } = await characterApi.get();
      setCharacter(updatedCharacter);

      queryClient.invalidateQueries({ queryKey: ["character"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      (window as any).showToast?.("Item unequipped!", "success");
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || "Failed to unequip item",
        "error"
      );
    },
  });

  const useItemMutation = useMutation({
    mutationFn: (itemId: string) => inventoryApi.use(itemId),
    onSuccess: async (response) => {
      // Handle chest opening rewards
      if (response.data?.effect === "chest_opened" && response.data?.reward) {
        const reward = response.data.reward;
        const rarityEmoji =
          reward.rarity === "Legendary"
            ? "⭐"
            : reward.rarity === "Epic"
            ? "💜"
            : reward.rarity === "Rare"
            ? "💙"
            : reward.rarity === "Uncommon"
            ? "💚"
            : "⚪";

        // Show special chest opening notification
        (window as any).showToast?.(
          `🎁 CHEST OPENED!\n${rarityEmoji} ${reward.name} (${reward.rarity})\n📦 ${reward.type} added to inventory!`,
          "success"
        );
      } else {
        // Update character immediately with new HP
        if (response.data?.character) {
          setCharacter(response.data.character);
        }
        (window as any).showToast?.("Item used successfully!", "success");
      }

      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ["character"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || "Failed to use item",
        "error"
      );
    },
  });

  const sellItemMutation = useMutation({
    mutationFn: ({
      inventorySlotId,
      quantity,
    }: {
      inventorySlotId: string;
      quantity: number;
    }) => craftingApi.sell(inventorySlotId, quantity),
    onSuccess: async (data) => {
      // Immediately update player gold in state
      if (player && data.data.goldEarned) {
        setPlayer({
          ...player,
          gold: player.gold + data.data.goldEarned,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["character"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      (window as any).showToast?.(
        `Sold for ${formatGold(data.data.goldEarned)} gold!`,
        "success"
      );
    },
  });

  const getSlotForItem = (item: any): string => {
    // For accessories, use the accessoryType field
    if (item.type === "Accessory" && item.accessoryType) {
      // Convert "Ring" -> "ring", "Necklace" -> "necklace", etc.
      return item.accessoryType.toLowerCase();
    }

    // For armor pieces, use the armorSlot field
    if (item.type === "Armor" && item.armorSlot) {
      // Convert "Body" -> "armor", "Helmet" -> "helmet", etc.
      if (item.armorSlot === "Body") return "armor";
      return item.armorSlot.toLowerCase(); // helmet, gloves, shoes
    }

    // For weapons
    if (item.type === "Weapon") return "weapon";

    // Fallback for old items without sub-types
    const mapping: Record<string, string> = {
      Weapon: "weapon",
      Armor: "armor",
      Accessory: "ring", // Default accessory to ring slot
    };
    return mapping[item.type] || "";
  };

  const openSellModal = (slot: any) => {
    setSelectedSlot(slot);
    setSellQuantity(1);
    setSellModalOpen(true);
  };

  const handleSell = () => {
    if (selectedSlot && sellQuantity > 0) {
      sellItemMutation.mutate({
        inventorySlotId: selectedSlot.id,
        quantity: sellQuantity,
      });
      setSellModalOpen(false);
      setSelectedSlot(null);
      setSellQuantity(1);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin text-4xl mb-2">⏳</div>
        <p className="text-gray-400">Loading inventory...</p>
      </div>
    );
  }

  console.log("Inventory state:", {
    inventory,
    isLoading,
    length: inventory?.length,
  });

  if (!inventory || inventory.length === 0) {
    return (
      <div className="p-4 text-center">
        <img
          src={inventoryIcon}
          alt="Empty Inventory"
          className="w-12 h-12 mx-auto mb-4 opacity-50"
          style={{ imageRendering: "pixelated" }}
        />
        <p className="text-gray-400">Your inventory is empty</p>
        <p className="text-xs text-gray-500 mt-2">
          Debug:{" "}
          {JSON.stringify({
            hasInventory: !!inventory,
            length: inventory?.length,
          })}
        </p>
      </div>
    );
  }

  const isEquipped = (itemId: string) => {
    if (!character) return false;
    return (
      character.weapon?.id === itemId ||
      character.armor?.id === itemId ||
      character.helmet?.id === itemId ||
      character.gloves?.id === itemId ||
      character.shoes?.id === itemId ||
      character.ring?.id === itemId ||
      character.necklace?.id === itemId ||
      character.belt?.id === itemId ||
      character.earring?.id === itemId
    );
  };

  // Filter inventory by category and search
  const categories: CategoryFilter[] = [
    "All",
    "Weapons",
    "Armor",
    "Accessories",
    "Consumables",
    "Materials",
  ];

  const filteredInventory = inventory.filter((slot: any) => {
    // Category filter
    if (selectedCategory !== "All") {
      const itemType = slot.item?.type;
      if (selectedCategory === "Weapons" && itemType !== "Weapon") return false;
      if (selectedCategory === "Armor" && itemType !== "Armor") return false;
      if (selectedCategory === "Accessories" && itemType !== "Accessory")
        return false;
      if (
        selectedCategory === "Consumables" &&
        itemType !== "Consumable" &&
        itemType !== "Potion"
      )
        return false;
      if (
        selectedCategory === "Materials" &&
        itemType !== "Material" &&
        itemType !== "Gem"
      )
        return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const itemName = slot.item?.name?.toLowerCase() || "";
      const itemType = slot.item?.type?.toLowerCase() || "";
      const itemRarity = slot.item?.rarity?.toLowerCase() || "";
      return (
        itemName.includes(query) ||
        itemType.includes(query) ||
        itemRarity.includes(query)
      );
    }

    return true;
  });

  return (
    <div className="p-3 pb-20">
      <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <img
          src={inventoryIcon}
          alt="Inventory"
          className="w-5 h-5"
          style={{ imageRendering: "pixelated" }}
        />
        Inventory ({filteredInventory.length})
      </h2>

      {/* Search Bar */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-stone-800 border-2 border-stone-600 rounded text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
          style={{ fontFamily: "monospace" }}
        />
      </div>

      {/* Category Tabs - Retro 2x3 Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`py-2 text-xs font-bold transition relative overflow-hidden ${
              selectedCategory === category
                ? "bg-amber-700 text-white"
                : "bg-stone-800 text-gray-400 hover:bg-stone-700"
            }`}
            style={{
              border: selectedCategory === category ? '2px solid #92400e' : '2px solid #57534e',
              borderRadius: '0',
              boxShadow: selectedCategory === category 
                ? '0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)' 
                : 'none',
              textShadow: selectedCategory === category ? '1px 1px 0 #000' : 'none',
              fontFamily: "monospace"
            }}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {filteredInventory.map((slot: any) => {
          const equipped = isEquipped(slot.item?.id);
          const isConsumable =
            slot.item?.type === "Consumable" || slot.item?.type === "Potion";

          return (
            <div
              key={slot.id}
              onClick={() => setSelectedItemDetail(slot)}
              className={`p-2 bg-stone-800 rounded-lg border-2 ${
                equipped
                  ? "border-green-500"
                  : getRarityBorder(slot.item.rarity)
              } transition relative cursor-pointer hover:scale-105 active:scale-95`}
            >
              {equipped && (
                <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                  <Check size={12} className="text-white" />
                </div>
              )}

              <div className="w-full aspect-square bg-stone-900 rounded mb-1 flex items-center justify-center p-2">
                {getItemImage(slot.item.spriteId, slot.item.type) ? (
                  <img
                    src={getItemImage(slot.item.spriteId, slot.item.type)!}
                    alt={slot.item.name}
                    className="max-w-full max-h-full object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                ) : (
                  <span className="text-xl">
                    {slot.item.type === "Weapon" && "⚔️"}
                    {slot.item.type === "Armor" && "🛡️"}
                    {slot.item.type === "Accessory" && "💍"}
                    {slot.item.type === "Consumable" && "🧪"}
                  </span>
                )}
              </div>

              <h3
                className={`font-bold text-xs truncate ${getRarityColor(
                  slot.item.rarity
                )}`}
              >
                {slot.item.name}
              </h3>

              {/* Level requirement and quantity */}
              <div className="text-xs text-gray-400 mb-1 flex items-center justify-between min-h-[12px]">
                {slot.item.levelRequirement > 0 && (
                  <span className={(character?.level || 0) >= slot.item.levelRequirement ? "text-gray-400" : "text-red-400"}>
                    Lv.{slot.item.levelRequirement}
                  </span>
                )}
                {slot.quantity > 1 && (
                  <span className="ml-auto">x{slot.quantity}</span>
                )}
              </div>

              <div className="text-xs text-gray-400 mb-1 flex flex-wrap gap-1 min-h-[12px]">
                {slot.item.attackBonus > 0 && (
                  <span className="text-orange-400">
                    +{slot.item.attackBonus}
                  </span>
                )}
                {slot.item.defenseBonus > 0 && (
                  <span className="text-blue-400">
                    +{slot.item.defenseBonus}
                  </span>
                )}
                {slot.item.healthBonus > 0 && (
                  <span className="text-red-400">
                    +{slot.item.healthBonus}
                  </span>
                )}
              </div>

              {slot.item.type === "Material" ||
              slot.item.type === "Gem" ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openSellModal(slot);
                  }}
                  disabled={sellItemMutation.isPending}
                  className="w-full py-1 bg-yellow-700 hover:bg-yellow-600 text-white text-xs font-bold transition relative overflow-hidden disabled:opacity-50"
                  style={{
                    border: "2px solid #a16207",
                    borderRadius: "0",
                    boxShadow:
                      "0 2px 0 #ca8a04, inset 0 1px 0 rgba(255,255,255,0.2)",
                    textShadow: "1px 1px 0 #000",
                    fontFamily: "monospace",
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-1">
                    <img
                      src={sellItemIcon}
                      alt="Sell"
                      className="w-3 h-3"
                      style={{ imageRendering: "pixelated" }}
                    />
                    SELL
                  </span>
                </button>
              ) : slot.item.type === "Consumable" ||
              slot.item.type === "Potion" ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    useItemMutation.mutate(slot.item.id);
                  }}
                  disabled={useItemMutation.isPending}
                  className="w-full py-2 bg-green-700 hover:bg-green-600 text-white text-xs font-bold transition relative overflow-hidden disabled:opacity-50"
                  style={{
                    border: "2px solid #15803d",
                    borderRadius: "0",
                    boxShadow:
                      "0 2px 0 #166534, 0 4px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                    textShadow: "1px 1px 0 #000",
                    fontFamily: "monospace",
                  }}
                >
                  <span className="relative z-10">🧪 USE</span>
                  <div className="absolute inset-0 bg-gradient-to-b from-green-400/20 to-transparent"></div>
                </button>
              ) : equipped ? (
                <div className="space-y-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const slotType = getSlotForItem(slot.item);
                      if (slotType) {
                        unequipMutation.mutate(slotType);
                      }
                    }}
                    disabled={unequipMutation.isPending}
                    className="w-full py-2 bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition relative overflow-hidden disabled:opacity-50"
                    style={{
                      border: "2px solid #991b1b",
                      borderRadius: "0",
                      boxShadow:
                        "0 2px 0 #b91c1c, 0 4px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                      textShadow: "1px 1px 0 #000",
                      fontFamily: "monospace",
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-1">
                      <Check size={12} />
                      UNEQUIP
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-b from-red-400/20 to-transparent"></div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openSellModal(slot);
                    }}
                    disabled={sellItemMutation.isPending}
                    className="w-full py-1 bg-yellow-700 hover:bg-yellow-600 text-white text-xs font-bold transition relative overflow-hidden disabled:opacity-50"
                    style={{
                      border: "2px solid #a16207",
                      borderRadius: "0",
                      boxShadow:
                        "0 2px 0 #ca8a04, inset 0 1px 0 rgba(255,255,255,0.2)",
                      textShadow: "1px 1px 0 #000",
                      fontFamily: "monospace",
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-1">
                      <img
                        src={sellItemIcon}
                        alt="Sell"
                        className="w-3 h-3"
                        style={{ imageRendering: "pixelated" }}
                      />
                      SELL
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Check level requirement
                      if (slot.item.levelRequirement > 0 && (character?.level || 0) < slot.item.levelRequirement) {
                        (window as any).showToast?.(
                          `Requires Level ${slot.item.levelRequirement}`,
                          "error"
                        );
                        return;
                      }
                      const slotType = getSlotForItem(slot.item);
                      if (slotType) {
                        equipMutation.mutate({
                          itemId: slot.item.id,
                          slot: slotType,
                        });
                      } else {
                        (window as any).showToast?.(
                          "Cannot determine equipment slot",
                          "error"
                        );
                      }
                    }}
                    disabled={equipMutation.isPending || (slot.item.levelRequirement > 0 && (character?.level || 0) < slot.item.levelRequirement)}
                    className="w-full py-2 bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold transition relative overflow-hidden disabled:opacity-50"
                    style={{
                      border: "2px solid #92400e",
                      borderRadius: "0",
                      boxShadow:
                        "0 2px 0 #b45309, 0 4px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                      textShadow: "1px 1px 0 #000",
                      fontFamily: "monospace",
                    }}
                  >
                    <span className="relative z-10">⚔️ EQUIP</span>
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openSellModal(slot);
                    }}
                    disabled={sellItemMutation.isPending}
                    className="w-full py-1 bg-yellow-700 hover:bg-yellow-600 text-white text-xs font-bold transition relative overflow-hidden disabled:opacity-50"
                    style={{
                      border: "2px solid #a16207",
                      borderRadius: "0",
                      boxShadow:
                        "0 2px 0 #ca8a04, inset 0 1px 0 rgba(255,255,255,0.2)",
                      textShadow: "1px 1px 0 #000",
                      fontFamily: "monospace",
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-1">
                      <img
                        src={sellItemIcon}
                        alt="Sell"
                        className="w-3 h-3"
                        style={{ imageRendering: "pixelated" }}
                      />
                      SELL
                    </span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sell Modal */}
      {sellModalOpen && selectedSlot && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSellModalOpen(false)}
        >
          <div
            className="bg-stone-800 border-4 border-amber-600 p-6 max-w-md w-full"
            style={{ borderRadius: "0", boxShadow: "0 8px 0 rgba(0,0,0,0.5)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-2xl font-bold text-amber-400 mb-4 text-center"
              style={{
                fontFamily: "monospace",
                textShadow: "2px 2px 0 #000",
              }}
            >
              <img
                src={sellItemIcon}
                alt="Sell"
                className="w-6 h-6 inline mr-2"
                style={{ imageRendering: "pixelated" }}
              />
              SELL ITEM
            </h2>

            {/* Item Display */}
            <div className="bg-stone-900 border-2 border-stone-700 p-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-stone-800 rounded flex items-center justify-center">
                  {getItemImage(selectedSlot.item.spriteId, selectedSlot.item.type) ? (
                    <img
                      src={getItemImage(selectedSlot.item.spriteId, selectedSlot.item.type)!}
                      alt={selectedSlot.item.name}
                      className="max-w-[48px] max-h-[48px] object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  ) : (
                    <span className="text-3xl">💰</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={`font-bold text-lg ${getRarityColor(
                      selectedSlot.item.rarity
                    )}`}
                    style={{ fontFamily: "monospace" }}
                  >
                    {selectedSlot.item.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Available: {selectedSlot.quantity}
                  </p>
                  <p className="text-sm text-yellow-400">
                    Value: {formatGold(selectedSlot.item.baseValue)} each
                  </p>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-4">
              <label
                className="block text-white font-bold mb-2"
                style={{ fontFamily: "monospace" }}
              >
                Quantity to Sell:
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSellQuantity(Math.max(1, sellQuantity - 1))}
                  className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white font-bold"
                  style={{
                    border: "2px solid #57534e",
                    borderRadius: "0",
                    fontFamily: "monospace",
                  }}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={selectedSlot.quantity}
                  value={sellQuantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setSellQuantity(Math.min(Math.max(1, val), selectedSlot.quantity));
                  }}
                  className="flex-1 px-4 py-2 bg-stone-900 border-2 border-stone-600 text-white text-center font-bold"
                  style={{
                    borderRadius: "0",
                    fontFamily: "monospace",
                  }}
                />
                <button
                  onClick={() =>
                    setSellQuantity(Math.min(selectedSlot.quantity, sellQuantity + 1))
                  }
                  className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white font-bold"
                  style={{
                    border: "2px solid #57534e",
                    borderRadius: "0",
                    fontFamily: "monospace",
                  }}
                >
                  +
                </button>
                <button
                  onClick={() => setSellQuantity(selectedSlot.quantity)}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white font-bold"
                  style={{
                    border: "2px solid #92400e",
                    borderRadius: "0",
                    fontFamily: "monospace",
                  }}
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Total Price */}
            <div className="bg-amber-900/30 border-2 border-amber-600 p-3 mb-4">
              <p
                className="text-center text-xl font-bold text-yellow-400"
                style={{
                  fontFamily: "monospace",
                  textShadow: "1px 1px 0 #000",
                }}
              >
                Total: {formatGold(selectedSlot.item.baseValue * sellQuantity)}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setSellModalOpen(false)}
                className="flex-1 py-3 bg-stone-700 hover:bg-stone-600 text-white font-bold transition"
                style={{
                  border: "2px solid #57534e",
                  borderRadius: "0",
                  boxShadow: "0 2px 0 #44403c",
                  textShadow: "1px 1px 0 #000",
                  fontFamily: "monospace",
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleSell}
                disabled={sellItemMutation.isPending}
                className="flex-1 py-3 bg-yellow-700 hover:bg-yellow-600 text-white font-bold transition disabled:opacity-50"
                style={{
                  border: "2px solid #a16207",
                  borderRadius: "0",
                  boxShadow: "0 2px 0 #ca8a04",
                  textShadow: "1px 1px 0 #000",
                  fontFamily: "monospace",
                }}
              >
                <img
                  src={sellItemIcon}
                  alt="Sell"
                  className="w-4 h-4 inline mr-1"
                  style={{ imageRendering: "pixelated" }}
                />
                SELL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItemDetail && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setSelectedItemDetail(null)}
        >
          <div
            className={`bg-stone-800 border-4 ${getRarityBorder(
              selectedItemDetail.item.rarity
            )} p-4 sm:p-6 max-w-md w-full my-auto`}
            style={{ borderRadius: "0", boxShadow: "0 8px 0 rgba(0,0,0,0.5)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Item Image and Basic Info */}
            <div className="flex items-start gap-3 sm:gap-4 mb-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-stone-900 rounded flex items-center justify-center flex-shrink-0">
                {getItemImage(
                  selectedItemDetail.item.spriteId,
                  selectedItemDetail.item.type
                ) ? (
                  <img
                    src={
                      getItemImage(
                        selectedItemDetail.item.spriteId,
                        selectedItemDetail.item.type
                      )!
                    }
                    alt={selectedItemDetail.item.name}
                    className="max-w-full max-h-full object-contain p-2"
                    style={{ imageRendering: "pixelated" }}
                  />
                ) : (
                  <span className="text-3xl sm:text-4xl">
                    {selectedItemDetail.item.type === "Weapon" && "⚔️"}
                    {selectedItemDetail.item.type === "Armor" && "🛡️"}
                    {selectedItemDetail.item.type === "Accessory" && "💍"}
                    {selectedItemDetail.item.type === "Consumable" && "🧪"}
                    {selectedItemDetail.item.type === "Material" && "📦"}
                    {selectedItemDetail.item.type === "Gem" && "💎"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  className={`text-lg sm:text-xl font-bold mb-1 ${getRarityColor(
                    selectedItemDetail.item.rarity
                  )} break-words`}
                  style={{ fontFamily: "monospace" }}
                >
                  {selectedItemDetail.item.name}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  {selectedItemDetail.item.type}
                  {selectedItemDetail.item.armorSlot && ` - ${selectedItemDetail.item.armorSlot}`}
                  {selectedItemDetail.item.accessoryType && ` - ${selectedItemDetail.item.accessoryType}`}
                </p>
                <p
                  className={`text-xs ${getRarityColor(
                    selectedItemDetail.item.rarity
                  )} mt-1`}
                >
                  {selectedItemDetail.item.rarity}
                </p>
                {selectedItemDetail.quantity > 1 && (
                  <p className="text-xs sm:text-sm text-amber-400 font-bold mt-1">
                    Quantity: {selectedItemDetail.quantity}
                  </p>
                )}
                {isEquipped(selectedItemDetail.item.id) && (
                  <div className="flex items-center gap-1 mt-1">
                    <Check size={14} className="text-green-400" />
                    <span className="text-xs text-green-400 font-bold">
                      EQUIPPED
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {selectedItemDetail.item.description && (
              <div className="bg-stone-900 rounded p-2 sm:p-3 mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-gray-300 italic break-words">
                  "{selectedItemDetail.item.description}"
                </p>
              </div>
            )}

            {/* Stats Section */}
            <div className="bg-stone-900 rounded p-2 sm:p-3 mb-3 sm:mb-4">
              <h3
                className="text-xs sm:text-sm font-bold text-amber-400 mb-2"
                style={{ fontFamily: "monospace" }}
              >
                STATS
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                {selectedItemDetail.item.levelRequirement > 0 && (
                  <div className="flex items-center gap-2">
                    <span className={(character?.level || 0) >= selectedItemDetail.item.levelRequirement ? "text-gray-400" : "text-red-400"}>
                      📊 Level Required:
                    </span>
                    <span className={(character?.level || 0) >= selectedItemDetail.item.levelRequirement ? "text-white font-bold" : "text-red-400 font-bold"}>
                      {selectedItemDetail.item.levelRequirement}
                    </span>
                  </div>
                )}
                {selectedItemDetail.item.attackBonus > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400">⚔️ Attack:</span>
                    <span className="text-white font-bold">
                      +{selectedItemDetail.item.attackBonus}
                    </span>
                  </div>
                )}
                {selectedItemDetail.item.defenseBonus > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">🛡️ Defense:</span>
                    <span className="text-white font-bold">
                      +{selectedItemDetail.item.defenseBonus}
                    </span>
                  </div>
                )}
                {selectedItemDetail.item.healthBonus > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">❤️ Health:</span>
                    <span className="text-white font-bold">
                      +{selectedItemDetail.item.healthBonus}
                    </span>
                  </div>
                )}
                {selectedItemDetail.item.speedBonus > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">⚡ Speed:</span>
                    <span className="text-white font-bold">
                      +{selectedItemDetail.item.speedBonus}
                    </span>
                  </div>
                )}
                {!selectedItemDetail.item.attackBonus &&
                  !selectedItemDetail.item.defenseBonus &&
                  !selectedItemDetail.item.healthBonus &&
                  !selectedItemDetail.item.speedBonus && (
                    <p className="text-gray-500 col-span-full text-center text-xs">
                      {selectedItemDetail.item.type === "Material" || selectedItemDetail.item.type === "Gem"
                        ? "Crafting Material"
                        : "No stat bonuses"}
                    </p>
                  )}
              </div>
            </div>

            {/* Sell Value */}
            <div className="bg-amber-900/20 border-2 border-amber-600 rounded p-2 sm:p-3 mb-3 sm:mb-4">
              <div className="flex items-center justify-center gap-2">
                <img
                  src={sellItemIcon}
                  alt="Sell"
                  className="w-4 h-4"
                  style={{ imageRendering: "pixelated" }}
                />
                <span
                  className="text-sm sm:text-base font-bold text-yellow-400"
                  style={{ fontFamily: "monospace" }}
                >
                  Sell Value: {formatGold(selectedItemDetail.item.baseValue * selectedItemDetail.quantity)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              {selectedItemDetail.item.type === "Consumable" ||
              selectedItemDetail.item.type === "Potion" ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      useItemMutation.mutate(selectedItemDetail.item.id);
                      setSelectedItemDetail(null);
                    }}
                    disabled={useItemMutation.isPending}
                    className="flex-1 py-2 sm:py-3 bg-green-700 hover:bg-green-600 text-white text-xs sm:text-sm font-bold transition disabled:opacity-50"
                    style={{
                      border: "2px solid #15803d",
                      borderRadius: "0",
                      boxShadow: "0 2px 0 #166534",
                      textShadow: "1px 1px 0 #000",
                      fontFamily: "monospace",
                    }}
                  >
                    🧪 USE
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItemDetail(null);
                      openSellModal(selectedItemDetail);
                    }}
                    className="flex-1 py-2 sm:py-3 bg-yellow-700 hover:bg-yellow-600 text-white text-xs sm:text-sm font-bold transition"
                    style={{
                      border: "2px solid #a16207",
                      borderRadius: "0",
                      boxShadow: "0 2px 0 #ca8a04",
                      textShadow: "1px 1px 0 #000",
                      fontFamily: "monospace",
                    }}
                  >
                    <img
                      src={sellItemIcon}
                      alt="Sell"
                      className="w-3 h-3 inline mr-1"
                      style={{ imageRendering: "pixelated" }}
                    />
                    SELL
                  </button>
                </>
              ) : isEquipped(selectedItemDetail.item.id) ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItemDetail(null);
                    openSellModal(selectedItemDetail);
                  }}
                  className="flex-1 py-2 sm:py-3 bg-yellow-700 hover:bg-yellow-600 text-white text-xs sm:text-sm font-bold transition"
                  style={{
                    border: "2px solid #a16207",
                    borderRadius: "0",
                    boxShadow: "0 2px 0 #ca8a04",
                    textShadow: "1px 1px 0 #000",
                    fontFamily: "monospace",
                  }}
                >
                  <img
                    src={sellItemIcon}
                    alt="Sell"
                    className="w-3 h-3 inline mr-1"
                    style={{ imageRendering: "pixelated" }}
                  />
                  SELL
                </button>
              ) : (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Check level requirement
                      if (selectedItemDetail.item.levelRequirement > 0 && (character?.level || 0) < selectedItemDetail.item.levelRequirement) {
                        (window as any).showToast?.(
                          `Requires Level ${selectedItemDetail.item.levelRequirement}`,
                          "error"
                        );
                        return;
                      }
                      const slotType = getSlotForItem(selectedItemDetail.item);
                      if (slotType) {
                        equipMutation.mutate({
                          itemId: selectedItemDetail.item.id,
                          slot: slotType,
                        });
                        setSelectedItemDetail(null);
                      } else {
                        (window as any).showToast?.(
                          "Cannot determine equipment slot",
                          "error"
                        );
                      }
                    }}
                    disabled={equipMutation.isPending || (selectedItemDetail.item.levelRequirement > 0 && (character?.level || 0) < selectedItemDetail.item.levelRequirement)}
                    className="flex-1 py-2 sm:py-3 bg-amber-700 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold transition disabled:opacity-50"
                    style={{
                      border: "2px solid #92400e",
                      borderRadius: "0",
                      boxShadow: "0 2px 0 #b45309",
                      textShadow: "1px 1px 0 #000",
                      fontFamily: "monospace",
                    }}
                  >
                    ⚔️ EQUIP
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItemDetail(null);
                      openSellModal(selectedItemDetail);
                    }}
                    className="flex-1 py-2 sm:py-3 bg-yellow-700 hover:bg-yellow-600 text-white text-xs sm:text-sm font-bold transition"
                    style={{
                      border: "2px solid #a16207",
                      borderRadius: "0",
                      boxShadow: "0 2px 0 #ca8a04",
                      textShadow: "1px 1px 0 #000",
                      fontFamily: "monospace",
                    }}
                  >
                    <img
                      src={sellItemIcon}
                      alt="Sell"
                      className="w-3 h-3 inline mr-1"
                      style={{ imageRendering: "pixelated" }}
                    />
                    SELL
                  </button>
                </>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedItemDetail(null)}
              className="w-full mt-2 py-2 bg-stone-700 hover:bg-stone-600 text-white text-xs sm:text-sm font-bold transition"
              style={{
                border: "2px solid #57534e",
                borderRadius: "0",
                boxShadow: "0 2px 0 #44403c",
                textShadow: "1px 1px 0 #000",
                fontFamily: "monospace",
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
