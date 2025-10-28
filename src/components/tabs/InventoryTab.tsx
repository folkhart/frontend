import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi, characterApi, craftingApi } from "@/lib/api";
import { useGameStore } from "@/store/gameStore";
import { getRarityColor, getRarityBorder, formatGold } from "@/utils/format";
import { Check } from "lucide-react";
import sellItemIcon from "@/assets/ui/sellItemIcon.png";
import inventoryIcon from "@/assets/ui/inventory.png";

export default function InventoryTab() {
  const queryClient = useQueryClient();
  const { character, setCharacter } = useGameStore();

  const getItemImage = (spriteId: string, itemType?: string) => {
    if (!spriteId) {
      console.log("No spriteId provided");
      return null;
    }

    console.log("getItemImage called with:", { spriteId, itemType });

    try {
      // Check if it's a potion (numeric sprite ID)
      if (/^\d+$/.test(spriteId)) {
        const num = parseInt(spriteId);
        if (num >= 985 && num <= 992) {
          return new URL(
            `../../assets/items/potions/hp/${spriteId}.png`,
            import.meta.url
          ).href;
        } else if (num >= 1001 && num <= 1008) {
          return new URL(
            `../../assets/items/potions/mp/${spriteId}.png`,
            import.meta.url
          ).href;
        } else if (num >= 1033 && num <= 1040) {
          return new URL(
            `../../assets/items/potions/attack/${spriteId}.png`,
            import.meta.url
          ).href;
        }
      }

      // Check if spriteId contains a path (for gems, materials, accessories with woodenSet/, etc.)
      if (spriteId.includes('/')) {
        // spriteId already contains the full path like 'craft/gems/red_gem' or 'woodenSet/woodenRing'
        // For accessories with woodenSet/, the path is accessories/woodenSet/...
        const fullPath = spriteId.startsWith('woodenSet/') 
          ? `accessories/${spriteId}` 
          : spriteId;
        return `/src/assets/items/${fullPath}.png`;
      }

      // Determine folder based on item type
      let folder = "weapons"; // default
      if (itemType === "Armor") {
        folder = "armors";
      } else if (itemType === "Accessory") {
        folder = "accessories";
      } else if (itemType === "Consumable") {
        folder = "consumables";
      }

      return `/src/assets/items/${folder}/${spriteId}.png`;
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
      // Update character immediately with new HP
      if (response.data?.character) {
        setCharacter(response.data.character);
      }
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ["character"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      (window as any).showToast?.("Item used successfully!", "success");
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || "Failed to use item", "error");
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["character"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      (window as any).showToast?.(
        `Sold for ${formatGold(data.data.goldEarned)} gold!`,
        "success"
      );
    },
  });

  const getSlotForType = (type: string): string => {
    const mapping: Record<string, string> = {
      Weapon: "weapon",
      Armor: "armor",
      Accessory: "accessory",
    };
    return mapping[type] || "";
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
      character.accessory?.id === itemId
    );
  };

  return (
    <div className="p-3 pb-20">
      <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <img
          src={inventoryIcon}
          alt="Inventory"
          className="w-5 h-5"
          style={{ imageRendering: "pixelated" }}
        />
        Inventory
      </h2>

      <div className="grid grid-cols-2 gap-2">
        {inventory.map((slot: any) => {
          console.log("Full slot data:", slot);
          console.log("Item data:", slot.item);
          const equipped = isEquipped(slot.item?.id);
          const isConsumable =
            slot.item?.type === "Consumable" || slot.item?.type === "Potion";
          console.log(
            "Item:",
            slot.item?.name,
            "Type:",
            slot.item?.type,
            "IsConsumable:",
            isConsumable
          );
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
                      const slotType = getSlotForType(slot.item.type);
                      if (slotType) {
                        equipMutation.mutate({
                          itemId: slot.item.id,
                          slot: slotType,
                        });
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
