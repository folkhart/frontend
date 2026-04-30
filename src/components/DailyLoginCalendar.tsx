import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dailyLoginRewardApi } from "@/lib/api";
import { Calendar, Check, Lock } from "lucide-react";
import Lightning from "@/components/effects/Lightning";

export default function DailyLoginCalendar() {
  const queryClient = useQueryClient();

  const { data: rewardsData } = useQuery({
    queryKey: ["daily-login-rewards"],
    queryFn: async () => {
      const { data } = await dailyLoginRewardApi.getRewards();
      return data;
    },
    refetchInterval: 300000, // Refetch every 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const claimRewardMutation = useMutation({
    mutationFn: async (day: number) => {
      const { data } = await dailyLoginRewardApi.claimReward(day);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["daily-login-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });

      // Show item name with enhancement level if applicable
      let itemName = data.item?.item?.name || "rewards";
      if (data.item?.enhancementLevel && data.item.enhancementLevel > 0) {
        itemName = `+${data.item.enhancementLevel} ${itemName}`;
      }

      (window as any).showToast?.(
        `Day ${data.reward.day} claimed! You received ${itemName}!`,
        "success"
      );
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || "Failed to claim reward",
        "error"
      );
    },
  });

  const rewards = rewardsData?.rewards || [];

  // Helper function to get item image
  const getItemImage = (spriteId: string, itemType?: string) => {
    if (!spriteId) return null;
    try {
      const images = import.meta.glob("../assets/items/**/*.png", {
        eager: true,
        as: "url",
      });

      // Handle numeric sprite IDs (potions)
      if (/^\d+$/.test(spriteId)) {
        const num = parseInt(spriteId);
        if (num >= 985 && num <= 992)
          return images[`../assets/items/potions/hp/${spriteId}.png`] || null;
        if (num >= 1001 && num <= 1008)
          return images[`../assets/items/potions/mp/${spriteId}.png`] || null;
        if (num >= 1033 && num <= 1040)
          return (
            images[`../assets/items/potions/attack/${spriteId}.png`] || null
          );
        if (num >= 1065 && num <= 1072)
          return (
            images[`../assets/items/potions/energy/${spriteId}.png`] || null
          );
      }

      // If spriteId includes "/" it already has the full path
      if (spriteId.includes("/")) {
        return images[`../assets/items/${spriteId}.png`] || null;
      }

      // Otherwise, determine folder based on item type
      let folder = "weapons";
      if (itemType === "Armor") folder = "armors";
      else if (itemType === "Accessory") folder = "accessories";
      else if (itemType === "Consumable") folder = "consumables";
      else if (itemType === "Material" || itemType === "Gem")
        folder = "craft/gems";

      return images[`../assets/items/${folder}/${spriteId}.png`] || null;
    } catch (e) {
      console.error("Error loading item image:", e);
      return null;
    }
  };

  const getRewardIcon = (reward: any) => {
    const data = reward.rewardData;

    // Try to get sprite based on reward type
    switch (reward.rewardType) {
      case "enhancement_stone":
        return getItemImage("craft/gems/enhancement_stone");
      case "refining_item":
        return getItemImage("craft/gems/refining_stone");
      case "potion":
        // Use spriteId from reward data
        if (data.spriteId) {
          return getItemImage(data.spriteId);
        }
        return null;
      case "enhanced_item":
        // Show a shoe sprite (we can use any armor shoes sprite)
        return getItemImage("armors/woodenShoes");
      default:
        return null;
    }
  };

  const getRewardName = (reward: any) => {
    const data = reward.rewardData;
    if (reward.rewardType === "enhanced_item") {
      return "+7 Leather Shoes";
    }
    return data.itemName || "Reward";
  };

  const getRewardQuantity = (reward: any) => {
    const data = reward.rewardData;
    return data.quantity ? `x${data.quantity}` : "";
  };

  const canClaimDay = (day: number) => {
    const reward = rewards.find((r: any) => r.day === day);
    if (!reward) return false;
    if (reward.claimed) return false;

    // Can claim day 1 immediately
    if (day === 1) return true;

    // For other days, previous day must be claimed AND 24 hours must have passed
    const previousDay = rewards.find((r: any) => r.day === day - 1);
    if (!previousDay || !previousDay.claimed) return false;

    // Check if 24 hours have passed since previous day claim
    if (previousDay.claimedAt) {
      const hoursSinceLastClaim =
        (Date.now() - new Date(previousDay.claimedAt).getTime()) /
        (1000 * 60 * 60);
      return hoursSinceLastClaim >= 24;
    }

    return true;
  };

  return (
    <div
      className="bg-stone-900 border-4 border-amber-600 p-3 mb-4"
      style={{
        borderRadius: "0",
        boxShadow: "0 6px 0 #78350f, inset 0 2px 0 rgba(255,255,255,0.1)",
      }}
    >
      <div className="flex items-center gap-2 mb-2 pb-2 border-b-2 border-amber-700">
        <Calendar size={20} className="text-amber-400" />
        <h3
          className="text-base sm:text-lg font-bold text-amber-400"
          style={{ fontFamily: "monospace", textShadow: "2px 2px 0 #000" }}
        >
          7-DAY LOGIN REWARDS
        </h3>
      </div>

      <p
        className="text-amber-200 text-[10px] sm:text-xs mb-3 font-bold"
        style={{ fontFamily: "monospace", textShadow: "1px 1px 0 #000" }}
      >
        Login daily! Day 7: +7 Leather Shoes!
      </p>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const reward = rewards.find((r: any) => r.day === day);
            const isClaimed = reward?.claimed || false;
            const canClaim = canClaimDay(day);
            const isLocked = !isClaimed && !canClaim;

            return (
              <div
                key={day}
                className="relative flex-shrink-0"
                style={{ width: "90px" }}
              >
                <button
                  onClick={() => canClaim && claimRewardMutation.mutate(day)}
                  disabled={
                    isClaimed || isLocked || claimRewardMutation.isPending
                  }
                  className={`w-full flex flex-col items-center justify-between p-1.5 transition-all relative overflow-hidden ${
                    day === 7
                      ? isClaimed
                        ? "bg-green-900/30 border-4 border-green-700 cursor-default"
                        : canClaim
                        ? "bg-gradient-to-b from-purple-900 to-purple-950 border-4 border-purple-500 hover:border-purple-400 cursor-pointer active:scale-95 shadow-lg shadow-purple-500/50"
                        : "bg-stone-800 border-4 border-purple-800 cursor-not-allowed opacity-50"
                      : isClaimed
                      ? "bg-green-900/30 border-2 border-green-700 cursor-default"
                      : canClaim
                      ? "bg-gradient-to-b from-amber-700 to-amber-900 border-2 border-amber-500 hover:border-amber-400 cursor-pointer active:scale-95 shadow-lg"
                      : "bg-stone-800 border-2 border-stone-700 cursor-not-allowed opacity-50"
                  }`}
                  style={{
                    borderRadius: "8px",
                    boxShadow:
                      day === 7 && canClaim && !isClaimed
                        ? "0 4px 0 #7e22ce, 0 0 20px rgba(168, 85, 247, 0.5), inset 0 2px 0 rgba(255,255,255,0.2)"
                        : canClaim && !isClaimed
                        ? "0 3px 0 #92400e, inset 0 2px 0 rgba(255,255,255,0.2)"
                        : "none",
                    fontFamily: "monospace",
                    minHeight: "110px",
                  }}
                >
                  {/* Lightning effect for Day 7 */}
                  {day === 7 && !isClaimed && (
                    <div className="absolute inset-0 opacity-50 pointer-events-none">
                      <Lightning
                        hue={280}
                        intensity={0.8}
                        speed={0.5}
                        size={2}
                      />
                    </div>
                  )}
                  {/* Status icon */}
                  {isClaimed && (
                    <div
                      className="absolute top-0.5 right-0.5 bg-green-600 border border-green-400 p-0.5"
                      style={{ boxShadow: "0 1px 0 #15803d" }}
                    >
                      <Check size={8} className="text-white" />
                    </div>
                  )}
                  {isLocked && (
                    <div className="absolute top-0.5 right-0.5 bg-stone-800 border border-stone-600 p-0.5">
                      <Lock size={8} className="text-gray-500" />
                    </div>
                  )}

                  {/* Reward icon */}
                  <div className="w-full h-12 flex items-center justify-center mt-1">
                    {reward && getRewardIcon(reward) ? (
                      <img
                        src={getRewardIcon(reward)!}
                        alt={getRewardName(reward)}
                        className="max-w-full max-h-full object-contain"
                        style={{ imageRendering: "pixelated" }}
                      />
                    ) : (
                      <span className="text-2xl">💎</span>
                    )}
                  </div>

                  {/* Reward info */}
                  <div className="text-center w-full px-0.5">
                    <p
                      className="text-[8px] font-bold text-white leading-tight mb-0.5"
                      style={{
                        fontFamily: "monospace",
                        textShadow: "1px 1px 0 #000",
                      }}
                    >
                      {reward ? getRewardName(reward) : "Reward"}
                    </p>
                    <p
                      className="text-[7px] text-amber-300 font-bold"
                      style={{
                        fontFamily: "monospace",
                        textShadow: "1px 1px 0 #000",
                      }}
                    >
                      {reward ? getRewardQuantity(reward) : ""}
                    </p>
                  </div>

                  {/* Day number at bottom */}
                  <div className="w-full bg-black/80 py-0.5 text-center border-t border-amber-600">
                    <p
                      className="text-[9px] font-bold text-amber-400"
                      style={{
                        fontFamily: "monospace",
                        textShadow: "1px 1px 0 #000",
                      }}
                    >
                      DAY {day}
                    </p>
                  </div>

                  {/* Glow effect for claimable */}
                  {canClaim && !isClaimed && (
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-400/20 to-transparent pointer-events-none" />
                  )}
                </button>

                {/* Day 7 special highlight */}
                {day === 7 && !isClaimed && (
                  <div
                    className="absolute -top-1 -right-1 bg-purple-700 text-amber-300 text-[7px] font-bold px-1.5 py-0.5 rotate-12 border-2 border-purple-500"
                    style={{ 
                      borderRadius: "0",
                      fontFamily: "monospace",
                      textShadow: "1px 1px 0 #000",
                      boxShadow: "0 2px 0 #6b21a8, 0 0 8px rgba(168, 85, 247, 0.6)"
                    }}
                  >
                    EPIC
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset timer */}
      {rewardsData?.nextReset && (
        <div className="mt-3 pt-2 border-t-2 border-amber-700 text-center">
          <p
            className="text-[10px] sm:text-xs text-amber-300 font-bold"
            style={{ fontFamily: "monospace", textShadow: "1px 1px 0 #000" }}
          >
            Reset:{" "}
            <span className="text-amber-400">
              {new Date(rewardsData.nextReset).toLocaleDateString()}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
