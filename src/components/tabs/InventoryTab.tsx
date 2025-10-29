import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi, characterApi, craftingApi } from "@/lib/api";
import { useGameStore } from "@/store/gameStore";
import { getRarityColor, getRarityBorder, formatGold } from "@/utils/format";
import { Check } from "lucide-react";
import sellItemIcon from "@/assets/ui/sellItemIcon.png";
import inventoryIcon from "@/assets/ui/inventory.png";

type CategoryFilter = "All" | "Weapons" | "Armor" | "Accessories" | "Consumables" | "Materials";

export default function InventoryTab() {
  const queryClient = useQueryClient();
  const { character, player, setCharacter, setPlayer } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");

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

      // Check if spriteId contains a path (for gems, materials, accessories with woodenSet/, etc.)
      if (spriteId.includes("/")) {
        // spriteId already contains the full path like 'craft/gems/red_gem' or 'woodenSet/woodenRing'
        // For accessories with woodenSet/, the path is accessories/woodenSet/...
        const fullPath = spriteId.startsWith("woodenSet/")
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
  const categories: CategoryFilter[] = ["All", "Weapons", "Armor", "Accessories", "Consumables", "Materials"];
  
  const filteredInventory = inventory.filter((slot: any) => {
    // Category filter
    if (selectedCategory !== "All") {
      const itemType = slot.item?.type;
      if (selectedCategory === "Weapons" && itemType !== "Weapon") return false;
      if (selectedCategory === "Armor" && itemType !== "Armor") return false;
      if (selectedCategory === "Accessories" && itemType !== "Accessory") return false;
      if (selectedCategory === "Consumables" && itemType !== "Consumable" && itemType !== "Potion") return false;
      if (selectedCategory === "Materials" && itemType !== "Material" && itemType !== "Gem") return false;
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const itemName = slot.item?.name?.toLowerCase() || "";
      const itemType = slot.item?.type?.toLowerCase() || "";
      const itemRarity = slot.item?.rarity?.toLowerCase() || "";
      return itemName.includes(query) || itemType.includes(query) || itemRarity.includes(query);
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

      {/* Category Tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === category
                ? "bg-amber-600 text-white border-2 border-amber-400"
                : "bg-stone-700 text-gray-300 border-2 border-stone-600 hover:bg-stone-600"
            }`}
            style={{ fontFamily: "monospace" }}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {filteredInventory.map((slot: any) => {
          const equipped = isEquipped(slot.item?.id);
          const isConsumable =
            slot.item?.type === "Consumable" || slot.item?.type === "Potion";

          return (
            <div
              key={slot.id}
              className={`p-2 bg-stone-800 rounded-lg border-2 ${
                equipped
                  ? "border-green-500"
                  : getRarityBorder(slot.item.rarity)
              } transition relative`}
            >
              {equipped && (
                <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                  <Check size={12} className="text-white" />
                </div>
              )}

              <div className="w-full aspect-square bg-stone-900 rounded mb-2 flex items-center justify-center p-3">
                {getItemImage(slot.item.spriteId, slot.item.type) ? (
                  <img
                    src={getItemImage(slot.item.spriteId, slot.item.type)!}
                    alt={slot.item.name}
                    className="max-w-[48px] max-h-[48px] object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                ) : (
                  <span className="text-2xl">
                    {slot.item.type === "Weapon" && "⚔️"}
                    {slot.item.type === "Armor" && "🛡️"}
                    {slot.item.type === "Accessory" && "💍"}
                    {slot.item.type === "Consumable" && "🧪"}
                  </span>
                )}
              </div>

              <h3
                className={`font-bold text-xs mb-1 truncate ${getRarityColor(
                  slot.item.rarity
                )}`}
              >
                {slot.item.name}
              </h3>

              {slot.quantity > 1 && (
                <p className="text-xs text-gray-400 mb-1">x{slot.quantity}</p>
              )}

              <div className="text-xs text-gray-400 mb-2 flex flex-wrap gap-1">
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

              {/* Sell Price */}
              <div className="flex items-center gap-1 mb-2 text-xs">
                <img
                  src={sellItemIcon}
                  alt="Sell"
                  className="w-3 h-3"
                  style={{ imageRendering: "pixelated" }}
                />
                <span
                  className="text-yellow-400"
                  style={{ fontFamily: "monospace" }}
                >
                  {formatGold(slot.item.baseValue * (slot.quantity || 1))}
                </span>
              </div>

              {slot.item.type === "Consumable" ||
              slot.item.type === "Potion" ? (
                <button
                  onClick={() => useItemMutation.mutate(slot.item.id)}
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
                  <div
                    className="w-full py-2 bg-green-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1"
                    style={{
                      border: "2px solid #15803d",
                      borderRadius: "0",
                      boxShadow:
                        "0 2px 0 #166534, inset 0 1px 0 rgba(255,255,255,0.2)",
                      textShadow: "1px 1px 0 #000",
                      fontFamily: "monospace",
                    }}
                  >
                    <Check size={12} />
                    EQUIPPED
                  </div>
                  <button
                    onClick={() =>
                      sellItemMutation.mutate({
                        inventorySlotId: slot.id,
                        quantity: slot.quantity,
                      })
                    }
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
                    onClick={() => {
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
                    disabled={equipMutation.isPending}
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
                    onClick={() =>
                      sellItemMutation.mutate({
                        inventorySlotId: slot.id,
                        quantity: slot.quantity,
                      })
                    }
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
    </div>
  );
}
