import { useState, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shopApi, chestApi, dailyRewardApi } from "@/lib/api";
import { RefreshCw, Coins, Gem } from "lucide-react";
import { getRarityColor, getRarityBorder } from "@/utils/format";
import { getItemImage } from "@/utils/itemSprites";
import ChestOpening from "@/components/ChestOpening";
import DailyLoginCalendar from "@/components/DailyLoginCalendar";

type ShopView = "daily" | "chests";

const chests = [
  {
    id: 1,
    name: "Bronze Chest",
    image: "/assets/ui/shop/chests/Chest1.png",
    openImage: "/assets/ui/shop/chests/Chest1_open.png",
    price: 500,
    currency: "gold" as const,
    border: "border-amber-600",
    color: "text-amber-400",
  },
  {
    id: 2,
    name: "Silver Chest",
    image: "/assets/ui/shop/chests/Chest2.png",
    openImage: "/assets/ui/shop/chests/Chest2_open.png",
    price: 10,
    currency: "gems" as const,
    border: "border-blue-600",
    color: "text-blue-400",
  },
  {
    id: 3,
    name: "Gold Chest",
    image: "/assets/ui/shop/chests/Chest3.png",
    openImage: "/assets/ui/shop/chests/Chest3_open.png",
    price: 25,
    currency: "gems" as const,
    border: "border-purple-600",
    color: "text-purple-400",
  },
  {
    id: 4,
    name: "Diamond Chest",
    image: "/assets/ui/shop/chests/Chest4.png",
    openImage: "/assets/ui/shop/chests/Chest4_open.png",
    price: 50,
    currency: "gems" as const,
    border: "border-orange-600",
    color: "text-orange-400",
  },
  {
    id: 5,
    name: "Legendary Chest",
    image: "/assets/ui/shop/chests/Chest5.png",
    openImage: "/assets/ui/shop/chests/Chest5_open.png",
    price: 100,
    currency: "gems" as const,
    border: "border-red-600",
    color: "text-red-400",
  },
];

export default function ShopTab() {
  const queryClient = useQueryClient();
  const { player, setPlayer, character } = useGameStore();
  const [view, setView] = useState<ShopView>("daily");
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [openingChest, setOpeningChest] = useState<any>(null);

  // Check daily gems status from backend
  const { data: dailyGemsStatus } = useQuery({
    queryKey: ['daily-gems-status'],
    queryFn: async () => {
      const { data } = await dailyRewardApi.checkStatus();
      return data;
    },
    refetchInterval: 60000, // Check every minute
  });
  const refreshCost = 50;

  // Fetch shop items
  const { data: shopItems, isLoading } = useQuery({
    queryKey: ["shop", "items"],
    queryFn: async () => {
      const { data } = await shopApi.getItems();
      return data;
    },
  });

  // Fetch chest rewards when a chest is selected
  const { data: chestRewards } = useQuery({
    queryKey: ["chest", "rewards", openingChest?.id],
    queryFn: async () => {
      if (!openingChest) return [];
      const { data } = await chestApi.getRewards(openingChest.id);
      return data;
    },
    enabled: !!openingChest,
  });

  const buyMutation = useMutation({
    mutationFn: async ({
      itemId,
      currency,
      price,
    }: {
      itemId: string;
      currency: "gold" | "gems";
      price: number;
    }) => {
      const { data } = await shopApi.buy(itemId, currency, price);
      return data;
    },
    onSuccess: async (data: any) => {
      setPlayer(data.player);
      await queryClient.invalidateQueries({ queryKey: ["inventory"] });
      await queryClient.invalidateQueries({ queryKey: ["shop", "items"] });
      (window as any).showToast?.(data.message, "success");
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || "Purchase failed",
        "error"
      );
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const { data } = await shopApi.refresh();
      return data;
    },
    onSuccess: async (data: any) => {
      setPlayer(data.player);
      await queryClient.invalidateQueries({ queryKey: ["shop", "items"] });
      (window as any).showToast?.(data.message, "success");
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || "Not enough gems",
        "error"
      );
    },
  });

  // Update countdown timer
  useEffect(() => {
    if (!dailyGemsStatus?.nextClaimAt) return;

    const updateTimer = () => {
      const now = new Date();
      const next = new Date(dailyGemsStatus.nextClaimAt);
      const diff = next.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilNextClaim("");
        queryClient.invalidateQueries({ queryKey: ['daily-gems-status'] });
      } else {
        const hours = Math.floor(diff / 1000 / 60 / 60);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        setTimeUntilNextClaim(`${hours}h ${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [dailyGemsStatus, queryClient]);

  const handleBuy = (item: any) => {
    buyMutation.mutate({
      itemId: item.id,
      currency: item.currency,
      price: item.price,
    });
  };

  const handleRefresh = () => {
    if (player && player.gems >= refreshCost) refreshMutation.mutate();
  };

  const claimDailyGemsMutation = useMutation({
    mutationFn: async () => {
      const { data } = await dailyRewardApi.claimGems();
      return data;
    },
    onSuccess: (data) => {
      if (player) {
        setPlayer({ ...player, gems: data.totalGems });
      }
      queryClient.invalidateQueries({ queryKey: ['daily-gems-status'] });
      (window as any).showToast?.(`Claimed ${data.gemsEarned} gems! 💎`, 'success');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Failed to claim gems', 'error');
    },
  });

  const openChestMutation = useMutation({
    mutationFn: async (tier: number) => {
      const { data } = await chestApi.open(tier);
      return data;
    },
    onSuccess: async (data: any) => {
      setPlayer(data.player);
      await queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || "Failed to open chest",
        "error"
      );
      setOpeningChest(null);
    },
  });

  const handleOpenChest = (chest: (typeof chests)[0]) => {
    if (!player) return;
    const canAfford =
      chest.currency === "gold"
        ? player.gold >= chest.price
        : player.gems >= chest.price;
    if (!canAfford) {
      (window as any).showToast?.(`Not enough ${chest.currency}!`, "error");
      return;
    }
    setOpeningChest(chest);
  };

  const handleChestComplete = async (reward: any) => {
    console.log("Chest reward:", reward);
  };

  if (!player) return null;

  return (
    <div className="p-3 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <img
            src="/assets/ui/shop/shop.png"
            alt="Shop"
            className="w-5 h-5"
            style={{ imageRendering: "pixelated" }}
          />
          Personal Shop
        </h2>
        {character && view === "daily" && (
          <div className="text-right">
            <p className="text-xs text-gray-400">For {character.class}</p>
            <p className="text-xs text-amber-400">✨ Personalized</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => setView("daily")}
          className={`py-3 font-bold text-sm transition relative overflow-hidden flex items-center justify-center gap-2 ${
            view === "daily"
              ? "bg-amber-600 hover:bg-amber-500 text-white"
              : "bg-stone-700 hover:bg-stone-600 text-gray-300"
          }`}
          style={{
            border:
              view === "daily" ? "3px solid #d97706" : "3px solid #44403c",
            borderRadius: "0",
            boxShadow:
              view === "daily"
                ? "0 3px 0 #b45309, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
                : "0 3px 0 #292524, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
            textShadow: "1px 1px 0 #000",
            fontFamily: "monospace",
            letterSpacing: "1px",
          }}
        >
          <img
            src="/assets/ui/shop/daily.gif"
            alt="Gift"
            className="w-4 h-4"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="relative z-10">DAILY ITEMS</span>
          {view === "daily" && (
            <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
          )}
        </button>
        <button
          disabled
          className="py-3 font-bold text-sm relative overflow-hidden flex items-center justify-center gap-2 bg-stone-800 text-gray-500 cursor-not-allowed opacity-75"
          style={{
            border: "3px solid #292524",
            borderRadius: "0",
            boxShadow: "0 3px 0 #1c1917, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
            textShadow: "1px 1px 0 #000",
            fontFamily: "monospace",
            letterSpacing: "1px",
          }}
        >
          <img
            src="/assets/ui/shop/chests.png"
            alt="Chests"
            className="w-4 h-4 opacity-50"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="relative z-10">CHESTS</span>
          <span 
            className="ml-2 px-2 py-0.5 bg-yellow-600 text-black text-[10px] font-bold animate-pulse"
            style={{
              border: "2px solid #fbbf24",
              boxShadow: "0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.3)",
              textShadow: "none",
            }}
          >
            SOON
          </span>
        </button>
      </div>

      {/* Daily View */}
      {view === "daily" && (
        <>
          {/* 7-Day Login Calendar */}
          <DailyLoginCalendar />

          {/* Daily Free Gems */}
          <div className="mb-2">
            <button
              onClick={() => claimDailyGemsMutation.mutate()}
              disabled={!dailyGemsStatus?.canClaim || claimDailyGemsMutation.isPending}
              className="w-full py-3 bg-green-700 hover:bg-green-600 text-white font-bold transition relative overflow-hidden disabled:opacity-50 disabled:grayscale"
              style={{
                border: "3px solid #15803d",
                boxShadow: dailyGemsStatus?.canClaim
                  ? "0 3px 0 #166534, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
                  : "none",
                textShadow: "1px 1px 0 #000",
                fontFamily: "monospace",
              }}
            >
              <Gem size={16} className="inline mr-2" />
              {claimDailyGemsMutation.isPending
                ? "CLAIMING..."
                : dailyGemsStatus?.canClaim
                ? "🎁 CLAIM 10 FREE GEMS!"
                : "DAILY GEMS CLAIMED!"}
              {dailyGemsStatus?.canClaim && (
                <div className="absolute inset-0 bg-gradient-to-b from-green-400/20 to-transparent" />
              )}
            </button>
            {!dailyGemsStatus?.canClaim && timeUntilNextClaim && (
              <p
                className="text-center text-xs text-gray-400 mt-1"
                style={{ fontFamily: "monospace" }}
              >
                Next claim in:{" "}
                <span className="text-green-400">{timeUntilNextClaim}</span>
              </p>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={player.gems < refreshCost || refreshMutation.isPending}
            className="w-full mb-3 py-3 bg-purple-700 hover:bg-purple-600 text-white font-bold transition relative overflow-hidden disabled:opacity-50"
            style={{
              border: "3px solid #6b21a8",
              boxShadow:
                "0 3px 0 #7e22ce, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
              textShadow: "1px 1px 0 #000",
              fontFamily: "monospace",
            }}
          >
            <RefreshCw
              size={16}
              className={`inline mr-2 ${
                refreshMutation.isPending ? "animate-spin" : ""
              }`}
            />
            🔄 REFRESH SHOP ({refreshCost} 💎)
            <div className="absolute inset-0 bg-gradient-to-b from-purple-400/20 to-transparent" />
          </button>

          {/* Shop Items Grid */}
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">
              Loading shop...
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {shopItems?.map((shopItem: any) => {
                const item = shopItem.item;
                return (
                  <div
                    key={shopItem.id}
                    onClick={() => setSelectedItem(shopItem)}
                    className={`p-2 bg-stone-800 rounded-lg border-2 ${getRarityBorder(
                      item.rarity
                    )} relative cursor-pointer hover:bg-stone-700 transition`}
                  >
                    <div className="w-full aspect-square bg-stone-900 rounded mb-1 flex items-center justify-center p-2">
                      {getItemImage(item.spriteId, item.type) ? (
                        <img
                          src={getItemImage(item.spriteId, item.type)!}
                          alt={item.name}
                          className="max-w-full max-h-full object-contain"
                          style={{ imageRendering: "pixelated" }}
                        />
                      ) : (
                        <span className="text-xl">
                          {item.type === "Weapon" && "⚔️"}
                          {item.type === "Armor" && "🛡️"}
                          {item.type === "Accessory" && "💍"}
                          {item.type === "Consumable" && "🧪"}
                        </span>
                      )}
                    </div>
                    <h3
                      className={`font-bold text-xs truncate ${getRarityColor(
                        item.rarity
                      )}`}
                    >
                      {item.name}
                    </h3>
                    <div className="text-xs text-gray-400 mb-1 flex flex-wrap gap-1 min-h-[12px]">
                      {item.attackBonus > 0 && (
                        <span className="text-orange-400">
                          +{item.attackBonus}
                        </span>
                      )}
                      {item.defenseBonus > 0 && (
                        <span className="text-blue-400">
                          +{item.defenseBonus}
                        </span>
                      )}
                    </div>
                    {shopItem.purchased ? (
                      <div className="text-center py-1 text-white text-xs font-bold bg-gray-600 rounded opacity-50">
                        ✓ BOUGHT
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuy(shopItem);
                        }}
                        disabled={
                          buyMutation.isPending ||
                          (shopItem.currency === "gold"
                            ? player.gold < shopItem.price
                            : player.gems < shopItem.price)
                        }
                        className={`w-full py-1 text-white text-xs font-bold rounded transition flex items-center justify-center gap-1 ${
                          shopItem.currency === "gold"
                            ? "bg-yellow-600 hover:bg-yellow-700"
                            : "bg-purple-600 hover:bg-purple-700"
                        } disabled:opacity-50`}
                      >
                        {shopItem.currency === "gold" ? (
                          <Coins size={10} />
                        ) : (
                          <Gem size={10} />
                        )}
                        {shopItem.price}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Chests View */}
      {view === "chests" && (
        <div className="grid grid-cols-2 gap-3">
          {chests.map((chest) => (
            <div
              key={chest.id}
              className={`bg-stone-800 rounded-lg border-2 ${
                chest.border
              } p-4 ${chest.id === 5 ? "col-span-2" : ""}`}
            >
              <img
                src={chest.image}
                alt={chest.name}
                className={`w-full ${
                  chest.id === 5 ? "h-32" : "h-24"
                } object-contain mb-2`}
                style={{ imageRendering: "pixelated" }}
              />
              <h3 className={`${chest.color} font-bold text-center mb-2`}>
                {chest.name}
              </h3>
              <button
                onClick={() => handleOpenChest(chest)}
                disabled={
                  chest.currency === "gold"
                    ? player.gold < chest.price
                    : player.gems < chest.price
                }
                className={`w-full py-2 text-white font-bold rounded flex items-center justify-center gap-2 transition disabled:opacity-50 ${
                  chest.currency === "gold"
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {chest.currency === "gold" ? (
                  <Coins size={16} />
                ) : (
                  <Gem size={16} />
                )}
                {chest.price}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Chest Opening Animation */}
      {openingChest &&
        (chestRewards ? (
          <ChestOpening
            chestName={openingChest.name}
            chestImage={openingChest.openImage}
            possibleItems={chestRewards}
            chestTier={openingChest.id}
            onOpen={() => openChestMutation.mutate(openingChest.id)}
            result={openChestMutation.data?.item}
            onComplete={handleChestComplete}
            onClose={() => {
              setOpeningChest(null);
              openChestMutation.reset();
            }}
          />
        ) : (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
            <div className="text-white text-xl">Loading chest...</div>
          </div>
        ))}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className={`bg-stone-800 rounded-lg border-4 ${getRarityBorder(
              selectedItem.item.rarity
            )} p-6 max-w-md w-full`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-24 h-24 bg-stone-900 rounded-lg flex items-center justify-center flex-shrink-0">
                {getItemImage(
                  selectedItem.item.spriteId,
                  selectedItem.item.type
                ) ? (
                  <img
                    src={
                      getItemImage(
                        selectedItem.item.spriteId,
                        selectedItem.item.type
                      )!
                    }
                    alt={selectedItem.item.name}
                    className="max-w-full max-h-full object-contain p-2"
                    style={{ imageRendering: "pixelated" }}
                  />
                ) : (
                  <span className="text-4xl">
                    {selectedItem.item.type === "Weapon" && "⚔️"}
                    {selectedItem.item.type === "Armor" && "🛡️"}
                    {selectedItem.item.type === "Accessory" && "💍"}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h2
                  className={`text-xl font-bold mb-1 ${getRarityColor(
                    selectedItem.item.rarity
                  )}`}
                >
                  {selectedItem.item.name}
                </h2>
                <p className="text-sm text-gray-400">
                  {selectedItem.item.type}
                </p>
                <p
                  className={`text-xs ${getRarityColor(
                    selectedItem.item.rarity
                  )} mt-1`}
                >
                  {selectedItem.item.rarity}
                </p>
                {selectedItem.item.levelRequirement && selectedItem.item.levelRequirement > 1 && (
                  <p className={`text-xs mt-1 font-bold ${
                    character && character.level >= selectedItem.item.levelRequirement
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>
                    Required Level: {selectedItem.item.levelRequirement}
                  </p>
                )}
              </div>
            </div>
            {selectedItem.item.description && (
              <div className="bg-stone-900 rounded p-3 mb-4">
                <p className="text-sm text-gray-300 italic">
                  "{selectedItem.item.description}"
                </p>
              </div>
            )}
            <div className="bg-stone-900 rounded p-3 mb-4">
              <h3 className="text-sm font-bold text-amber-400 mb-2">Stats</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {selectedItem.item.attackBonus > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400">⚔️ Attack:</span>
                    <span className="text-white font-bold">
                      +{selectedItem.item.attackBonus}
                    </span>
                  </div>
                )}
                {selectedItem.item.defenseBonus > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">🛡️ Defense:</span>
                    <span className="text-white font-bold">
                      +{selectedItem.item.defenseBonus}
                    </span>
                  </div>
                )}
                {selectedItem.item.healthBonus > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">❤️ Health:</span>
                    <span className="text-white font-bold">
                      +{selectedItem.item.healthBonus}
                    </span>
                  </div>
                )}
                {selectedItem.item.speedBonus > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">⚡ Speed:</span>
                    <span className="text-white font-bold">
                      +{selectedItem.item.speedBonus}
                    </span>
                  </div>
                )}
                {!selectedItem.item.attackBonus &&
                  !selectedItem.item.defenseBonus &&
                  !selectedItem.item.healthBonus &&
                  !selectedItem.item.speedBonus && (
                    <p className="text-gray-500 col-span-2 text-center">
                      No stat bonuses
                    </p>
                  )}
              </div>
            </div>
            <div className="flex gap-2">
              {selectedItem.purchased ? (
                <button
                  disabled
                  className="flex-1 py-3 bg-gray-600 text-white font-bold rounded opacity-50"
                >
                  ✓ ALREADY BOUGHT
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleBuy(selectedItem);
                    setSelectedItem(null);
                  }}
                  disabled={
                    buyMutation.isPending ||
                    (selectedItem.currency === "gold"
                      ? player.gold < selectedItem.price
                      : player.gems < selectedItem.price)
                  }
                  className={`flex-1 py-3 text-white font-bold rounded transition flex items-center justify-center gap-2 ${
                    selectedItem.currency === "gold"
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  } disabled:opacity-50`}
                  style={{
                    border:
                      "3px solid " +
                      (selectedItem.currency === "gold"
                        ? "#b45309"
                        : "#6b21a8"),
                    boxShadow: "0 3px 0 rgba(0,0,0,0.3)",
                    textShadow: "1px 1px 0 #000",
                  }}
                >
                  {selectedItem.currency === "gold" ? (
                    <Coins size={20} />
                  ) : (
                    <Gem size={20} />
                  )}
                  BUY FOR {selectedItem.price}
                </button>
              )}
              <button
                onClick={() => setSelectedItem(null)}
                className="px-6 py-3 bg-stone-700 hover:bg-stone-600 text-white font-bold rounded transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
