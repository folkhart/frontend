import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGameStore } from "@/store/gameStore";
import { dungeonApi, idleApi, authApi, characterApi } from "@/lib/api";
import { useElectron } from "@/hooks/useElectron";
import { formatGold, getRarityColor, getDifficultyColor } from "@/utils/format";
import { Clock, Zap, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import energyIcon from "@/assets/ui/energy.png";
import hpIcon from "@/assets/ui/hp.png";
import expIcon from "@/assets/ui/exp.png";
import clockIcon from "@/assets/ui/clock.png";
import goldIcon from "@/assets/ui/gold.png";
import rewardIcon from "@/assets/ui/reward.png";
import monstersIcon from "@/assets/ui/monsters.png";
import cpIcon from "@/assets/ui/cp.png";
import dungeonsIcon from "@/assets/ui/dungeons.png";
import historyIcon from "@/assets/ui/history.png";
import idleFarmingIcon from "@/assets/ui/idleFarming.png";
import serverchatIcon from "@/assets/ui/serverchat.png";
import searchIcon from "@/assets/ui/search.png";
import expandedIcon from "@/assets/ui/expanded.png";
import compactIcon from "@/assets/ui/compact.png";
import petIcon from "@/assets/ui/pet.png";
import ServerChat from "@/components/ServerChat";
import BossFight from "@/components/BossFight";
import ratCellarIcon from "@/assets/ui/dungeonIcons/ratCellar.png";
import goblinCaveIcon from "@/assets/ui/dungeonIcons/goblinCave.png";
import slimeDenIcon from "@/assets/ui/dungeonIcons/slimeDen.png";
import darkForestIcon from "@/assets/ui/dungeonIcons/darkForest.png";
import dragonLairIcon from "@/assets/ui/dungeonIcons/dragonLair.png";
import obsidianVaultIcon from "@/assets/ui/dungeonIcons/obsidianVault.png";
import hollowrootSanctuaryIcon from "@/assets/ui/dungeonIcons/hollowrootSanctuary.png";
import theMawOfSilenceIcon from "@/assets/ui/dungeonIcons/theMawOfSilence.png";
import clockworkNecropolisIcon from "@/assets/ui/dungeonIcons/clockworkNecropolis.png";
import paleCitadelIcon from "@/assets/ui/dungeonIcons/paleCitadel.png";
import theAbyssalSpireIcon from "@/assets/ui/dungeonIcons/theAbyssalSpire.png";
import eclipticThroneIcon from "@/assets/ui/dungeonIcons/eclipticThrone.png";

// Helper function to get companions that can drop from a dungeon based on level
const getCompanionDrops = (dungeonLevel: number) => {
  const companions: Array<{ name: string; rarity: string; spriteId: string }> =
    [];

  // All dungeons drop common companions
  companions.push(
    {
      name: "Buddy",
      rarity: "Common",
      spriteId: "/assets/ui/companions/buddy.png",
    },
    {
      name: "Fluffy",
      rarity: "Common",
      spriteId: "/assets/ui/companions/fluffy.png",
    },
    {
      name: "Shelly",
      rarity: "Common",
      spriteId: "/assets/ui/companions/shelly.png",
    }
  );

  // Lv10+ dungeons drop rare companions
  if (dungeonLevel >= 10) {
    companions.push(
      {
        name: "Sparkle",
        rarity: "Rare",
        spriteId: "/assets/ui/companions/sparkle.png",
      },
      {
        name: "Bolt",
        rarity: "Rare",
        spriteId: "/assets/ui/companions/bolt.png",
      }
    );
  }

  // Lv16+ dungeons drop epic companions
  if (dungeonLevel >= 16) {
    companions.push(
      {
        name: "Whisper",
        rarity: "Epic",
        spriteId: "/assets/ui/companions/whisper.png",
      },
      {
        name: "Ember",
        rarity: "Epic",
        spriteId: "/assets/ui/companions/ember.png",
      }
    );
  }

  // Lv20+ dungeons drop legendary companion
  if (dungeonLevel >= 20) {
    companions.push({
      name: "Orion",
      rarity: "Legendary",
      spriteId: "/assets/ui/companions/orion.png",
    });
  }

  return companions;
};

// Helper function to get dungeon icon based on name
const getDungeonIcon = (dungeonName: string) => {
  const iconMap: Record<string, string> = {
    "Rat Cellar": ratCellarIcon,
    "Goblin Cave": goblinCaveIcon,
    "Slime Den": slimeDenIcon,
    "Dark Forest": darkForestIcon,
    "Dragon's Lair": dragonLairIcon,
    "Shattered Obsidian Vault": obsidianVaultIcon,
    "Hollowroot Sanctuary": hollowrootSanctuaryIcon,
    "The Maw of Silence": theMawOfSilenceIcon,
    "The Clockwork Necropolis": clockworkNecropolisIcon,
    "The Pale Citadel": paleCitadelIcon,
    "The Abyssal Spire": theAbyssalSpireIcon,
    "The Ecliptic Throne": eclipticThroneIcon,
  };
  return iconMap[dungeonName] || ratCellarIcon; // Default to rat cellar if not found
};

// Calculate recommended CP based on dungeon level
const getRecommendedCP = (level: number): number => {
  // Base CP formula: level * 50 (scales with dungeon level)
  return Math.floor(level * 50);
};

// Format time remaining (hours/minutes for >1hr, minutes/seconds for <1hr)
const formatTimeRemaining = (seconds: number) => {
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
};

// Helper for guild item paths
const getGuildItemPath = (spriteId: string) => {
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

  if (spriteId === "guild_key") return `chests_and_keys/key1.png`;
  if (fileName.startsWith("guild_chest")) {
    const num = fileName.replace("guild_chest", "");
    return `chests_and_keys/Chest${num}.png`;
  }
  if (fileName.startsWith("guild_sword")) {
    const finalName = fileName.replace("guild_sword", "guildsword");
    return `weapons/guild_sword/${finalName}.png`;
  }
  if (fileName.startsWith("guild_bow"))
    return `weapons/guild_bow/${fileName}.png`;
  if (fileName.startsWith("guild_dagger"))
    return `weapons/guild_dagger/${fileName}.png`;
  if (fileName.startsWith("guild_shield"))
    return `weapons/guild_shield/${fileName}.png`;
  if (fileName.startsWith("guild_staff"))
    return `weapons/guild_staff/${fileName}.png`;
  if (fileName.startsWith("guild_armor"))
    return `armors/warrior_armors/${fileName}.png`;
  if (fileName.includes("glove"))
    return `guild_armor_pieces/gloves/${fileName}.png`;
  if (fileName.includes("boot") || fileName.includes("shoe")) {
    const shoeName = fileName
      .replace("guild_boot", "guild_shoes")
      .replace("guild_shoe", "guild_shoes");
    return `guild_armor_pieces/shoes/${shoeName}.png`;
  }
  if (fileName === "guild_belt") return `guild_accessories/belts/Icon27.png`;
  if (fileName === "guild_earring")
    return `guild_accessories/earrings/Icon12.png`;
  if (fileName === "guild_necklace")
    return `guild_accessories/necklaces/Icon29.png`;
  if (fileName === "guild_ring") return `guild_accessories/rings/Icon1.png`;
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
  return `${fileName}.png`;
};

// Helper function to get item image based on sprite ID
const getItemImage = (spriteId: string, itemType?: string) => {
  if (!spriteId) return null;

  try {
    const images = import.meta.glob("../../assets/items/**/*.png", {
      eager: true,
      as: "url",
    });

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
      } else if (num >= 1065 && num <= 1072) {
        const path = `../../assets/items/potions/energy/${spriteId}.png`;
        return images[path] || null;
      }
    }

    if (
      spriteId.startsWith("guild_") ||
      spriteId.startsWith("Chest") ||
      spriteId.startsWith("key")
    ) {
      return `/assets/items/guildshop_items/${getGuildItemPath(spriteId)}`;
    }

    if (spriteId.includes("/")) {
      // Handle paths - if it starts with weapons/, armors/, accessories/, or craft/, use as-is
      // Otherwise, for accessory sets (woodenSet, ironSet, steelSet, dungeonDrops), prepend accessories/
      let fullPath = spriteId;
      if (
        !spriteId.startsWith("weapons/") &&
        !spriteId.startsWith("armors/") &&
        !spriteId.startsWith("accessories/") &&
        !spriteId.startsWith("craft/") &&
        (spriteId.startsWith("woodenSet/") ||
          spriteId.startsWith("ironSet/") ||
          spriteId.startsWith("steelSet/") ||
          spriteId.startsWith("dungeonDrops/"))
      ) {
        fullPath = `accessories/${spriteId}`;
      }
      const path = `../../assets/items/${fullPath}.png`;
      return images[path] || null;
    }

    let folder = "weapons";
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

export default function AdventureTab() {
  const queryClient = useQueryClient();
  const { character, player, setPlayer, setCharacter } = useGameStore();
  const fastFinishCost = 10; // gems
  const [view, setView] = useState<
    "dungeons" | "idle" | "history" | "serverchat"
  >("dungeons");
  const [selectedDungeon, setSelectedDungeon] = useState<any>(null);
  const [showRewards, setShowRewards] = useState(false);
  const [showCompanionDrops, setShowCompanionDrops] = useState(true);
  const [collapsedView, setCollapsedView] = useState(() => {
    // Restore view preference from localStorage
    const saved = localStorage.getItem("dungeonViewCollapsed");
    return saved === "true";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDungeonRun, setActiveDungeonRun] = useState<any>(() => {
    // Restore from localStorage on mount
    const saved = localStorage.getItem("activeDungeonRun");
    return saved ? JSON.parse(saved) : null;
  });

  // Separate state for unclaimed rewards (persists even after run is cleared)
  const [unclaimedReward, setUnclaimedReward] = useState<any>(() => {
    const saved = localStorage.getItem("unclaimedDungeonReward");
    return saved ? JSON.parse(saved) : null;
  });

  // Idle farming reward state
  const [unclaimedIdleReward, setUnclaimedIdleReward] = useState<any>(() => {
    const saved = localStorage.getItem("unclaimedIdleReward");
    return saved ? JSON.parse(saved) : null;
  });

  // Boss fight state
  const [showBossFight, setShowBossFight] = useState(false);
  const [bossCooldown, setBossCooldown] = useState<{
    canFight: boolean;
    remainingMinutes: number;
    nextAvailableAt: Date | null;
  } | null>(null);

  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    const saved = localStorage.getItem("activeDungeonRun");
    if (saved) {
      const run = JSON.parse(saved);
      // Use completesAt if available, otherwise calculate from startTime
      if (run.completesAt) {
        const completesAt = new Date(run.completesAt).getTime();
        const remaining = Math.max(
          0,
          Math.floor((completesAt - Date.now()) / 1000)
        );
        return remaining;
      } else {
        const elapsed = Math.floor(
          (Date.now() - new Date(run.startTime).getTime()) / 1000
        );
        const remaining = Math.max(0, run.dungeon.duration - elapsed);
        return remaining;
      }
    }
    return 0;
  });
  const [idleTimeRemaining, setIdleTimeRemaining] = useState<number>(0);

  // Save collapsed view preference to localStorage
  useEffect(() => {
    localStorage.setItem("dungeonViewCollapsed", String(collapsedView));
  }, [collapsedView]);

  const { data: dungeons } = useQuery({
    queryKey: ["dungeons"],
    queryFn: async () => {
      const { data } = await dungeonApi.getAll();
      return data;
    },
  });

  // Check boss fight cooldown
  const { data: bossCooldownData } = useQuery({
    queryKey: ["bossCooldown"],
    queryFn: async () => {
      const { data } = await dungeonApi.checkBossCooldown();
      return data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Update cooldown state when data changes
  useEffect(() => {
    if (bossCooldownData) {
      setBossCooldown(bossCooldownData);
    }
  }, [bossCooldownData]);

  const { data: dungeonHistory } = useQuery({
    queryKey: ["dungeonHistory"],
    queryFn: async () => {
      const { data } = await dungeonApi.getRuns(20);
      return data;
    },
    enabled: view === "history",
  });

  const { data: idleStatus, refetch: refetchIdle } = useQuery({
    queryKey: ["idleStatus"],
    queryFn: async () => {
      const { data } = await idleApi.getStatus();
      return data;
    },
    refetchInterval: 5000,
  });

  // Fetch active dungeon run from backend on mount and sync with localStorage
  const { data: backendActiveDungeonRun } = useQuery({
    queryKey: ["activeDungeonRun"],
    queryFn: async () => {
      const { data } = await dungeonApi.getActive();
      return data;
    },
    refetchInterval: 10000, // Check every 10 seconds
  });

  // Sync backend active run with local state
  useEffect(() => {
    if (backendActiveDungeonRun && !activeDungeonRun) {
      // Backend has an active run but local state doesn't - sync it
      const runWithTime = {
        ...backendActiveDungeonRun,
        startTime: backendActiveDungeonRun.createdAt,
      };
      setActiveDungeonRun(runWithTime);
      localStorage.setItem("activeDungeonRun", JSON.stringify(runWithTime));

      const elapsed = Math.floor(
        (Date.now() - new Date(backendActiveDungeonRun.createdAt).getTime()) /
          1000
      );
      // For Active mode, calculate display duration (1.5x of actual)
      const actualDuration = backendActiveDungeonRun.dungeon.duration;
      const displayDuration =
        backendActiveDungeonRun.mode === "Active"
          ? Math.floor(actualDuration * 1.5)
          : actualDuration;
      const displayElapsed =
        backendActiveDungeonRun.mode === "Active"
          ? Math.floor(elapsed * 1.5)
          : elapsed;
      const remaining = Math.max(0, displayDuration - displayElapsed);
      setTimeRemaining(remaining);
    } else if (
      !backendActiveDungeonRun &&
      activeDungeonRun &&
      !activeDungeonRun.completed
    ) {
      // Backend doesn't have an active run but local state does
      // Check if the dungeon time has actually expired before completing
      const completesAt = new Date(activeDungeonRun.completesAt).getTime();
      const now = Date.now();
      const hasExpired = now >= completesAt;

      if (hasExpired) {
        // Time has expired, try to complete it
        dungeonApi
          .complete(activeDungeonRun.id)
          .then(({ data: result }) => {
            const completedRun = {
              ...activeDungeonRun,
              completed: true,
              result: result,
            };
            setActiveDungeonRun(completedRun);
            localStorage.setItem(
              "activeDungeonRun",
              JSON.stringify(completedRun)
            );

            // Save unclaimed reward for persistent notification
            const rewardData = {
              dungeonName: activeDungeonRun.dungeon.name,
              result: result,
              timestamp: Date.now(),
            };
            setUnclaimedReward(rewardData);
            localStorage.setItem(
              "unclaimedDungeonReward",
              JSON.stringify(rewardData)
            );

            queryClient.invalidateQueries({ queryKey: ["character"] });

            // Show notification
            (window as any).showToast?.(
              result.success
                ? "Dungeon completed successfully!"
                : "Dungeon failed!",
              result.success ? "success" : "error"
            );
          })
          .catch((error) => {
            console.error("Failed to complete dungeon:", error);
            // Clear invalid run
            setActiveDungeonRun(null);
            localStorage.removeItem("activeDungeonRun");
          });
      } else {
        // Time hasn't expired yet, but backend doesn't have it
        // This means the run was lost/cleared - just clear local state
        console.log("Backend lost the dungeon run, clearing local state");
        setActiveDungeonRun(null);
        localStorage.removeItem("activeDungeonRun");
      }
    }
  }, [backendActiveDungeonRun]);

  // Idle farming countdown timer
  useEffect(() => {
    if (idleStatus?.active && idleStatus.endsAt) {
      const updateIdleTimer = () => {
        const now = Date.now();
        const end = new Date(idleStatus.endsAt).getTime();
        const remaining = Math.max(0, Math.floor((end - now) / 1000));
        setIdleTimeRemaining(remaining);
      };

      updateIdleTimer();
      const interval = setInterval(updateIdleTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [idleStatus]);

  const { sendDungeonComplete } = useElectron();

  const fastFinishMutation = useMutation({
    mutationFn: (runId: string) => dungeonApi.fastFinish(runId),
    onMutate: async () => {
      // Optimistically update gems
      if (player) {
        setPlayer({ ...player, gems: player.gems - fastFinishCost });
      }
    },
    onSuccess: async (response) => {
      // Get the dungeon result data
      const result = response.data;

      // Save unclaimed reward for modal display
      const rewardData = {
        dungeonName: activeDungeonRun?.dungeon?.name || "Dungeon",
        result: {
          success: result.success,
          goldEarned: result.goldEarned,
          expEarned: result.expEarned,
          itemsDropped: result.itemsDropped || [],
          hpLoss: result.hpLoss || 0,
        },
        timestamp: Date.now(),
      };
      setUnclaimedReward(rewardData);
      localStorage.setItem(
        "unclaimedDungeonReward",
        JSON.stringify(rewardData)
      );

      // Send Electron notification for fast finish
      if (result.success) {
        sendDungeonComplete(
          activeDungeonRun?.dungeon?.name || "Dungeon",
          result.goldEarned,
          result.expEarned,
          result.itemsDropped?.map((item: any) => item.name)
        );
      }

      // Clear active dungeon
      setActiveDungeonRun(null);
      localStorage.removeItem("activeDungeonRun");

      // Refresh character and player data
      await queryClient.invalidateQueries({ queryKey: ["character"] });
      const { data: profile } = await authApi.getProfile();
      setPlayer(profile);

      // Update character state for HP/stats
      const { data: updatedChar } = await characterApi.get();
      setCharacter(updatedChar);
    },
    onError: (error: any) => {
      // Revert gems on error
      if (player) {
        setPlayer({ ...player, gems: player.gems + fastFinishCost });
      }
      (window as any).showToast?.(
        error.response?.data?.error || "Failed to fast finish",
        "error"
      );
    },
  });

  const startIdleMutation = useMutation({
    mutationFn: (durationHours: number = 1) =>
      idleApi.start(undefined, durationHours),
    onSuccess: async () => {
      refetchIdle();
      // Refresh player data to update energy
      const { data: profile } = await authApi.getProfile();
      setPlayer(profile);
    },
    onError: (error: any) => {
      // Show error notification
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to start idle farming";
      (window as any).showToast?.(errorMessage, "error");
    },
  });

  const claimIdleMutation = useMutation({
    mutationFn: () => idleApi.claim(),
    onSuccess: (response) => {
      // Save idle reward for modal display
      const rewardData = {
        goldEarned: response.data.goldEarned,
        expEarned: response.data.expEarned,
        itemsDropped: response.data.itemsDropped || [],
        timestamp: Date.now(),
      };
      setUnclaimedIdleReward(rewardData);
      localStorage.setItem("unclaimedIdleReward", JSON.stringify(rewardData));

      refetchIdle();
      queryClient.invalidateQueries({ queryKey: ["character"] });
    },
  });

  // Restore timer on mount
  useEffect(() => {
    if (activeDungeonRun && !activeDungeonRun.completed) {
      // Calculate actual time remaining from completesAt
      const completesAt = new Date(activeDungeonRun.completesAt).getTime();
      const now = Date.now();
      const actualTimeRemaining = Math.max(
        0,
        Math.floor((completesAt - now) / 1000)
      );

      // Update state with actual time
      setTimeRemaining(actualTimeRemaining);

      // Only set up timers if there's time remaining
      if (actualTimeRemaining > 0) {
        // Active mode runs 1.5x faster
        const speedMultiplier = activeDungeonRun.mode === "Active" ? 1.5 : 1;
        const interval = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= speedMultiplier) {
              clearInterval(interval);
              return 0;
            }
            return Math.round(prev - speedMultiplier);
          });
        }, 1000);

        // Auto-complete when actual time expires
        const timeout = setTimeout(async () => {
          try {
            const result = await dungeonApi.complete(activeDungeonRun.id);
            await queryClient.invalidateQueries({ queryKey: ["character"] });
            await queryClient.refetchQueries({ queryKey: ["character"] });

            const completedRun = {
              ...activeDungeonRun,
              completed: true,
              result: result.data,
            };
            setActiveDungeonRun(completedRun);
            localStorage.setItem(
              "activeDungeonRun",
              JSON.stringify(completedRun)
            );

            // Save unclaimed reward for persistent notification
            const rewardData = {
              dungeonName: activeDungeonRun.dungeon.name,
              result: result.data,
              timestamp: Date.now(),
            };
            setUnclaimedReward(rewardData);
            localStorage.setItem(
              "unclaimedDungeonReward",
              JSON.stringify(rewardData)
            );

            // Update character state immediately for HP/stats
            const { data: updatedChar } = await characterApi.get();
            setCharacter(updatedChar);

            // Send browser notification
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification("Dungeon Complete!", {
                body: `${activeDungeonRun.dungeon.name} completed! ${
                  result.data.success ? "✅ Victory!" : "❌ Defeated"
                }`,
                icon: "/icon.png",
                badge: "/icon.png",
              });
            }

            // Show toast
            (window as any).showToast?.(
              result.data.success
                ? "Dungeon completed successfully!"
                : "Dungeon failed!",
              result.data.success ? "success" : "error"
            );
          } catch (error: any) {
            console.error("Failed to complete dungeon:", error);
            // If dungeon run not found (400 error), clear it
            if (error.response?.status === 400) {
              console.log(
                "Dungeon run not found in database, clearing local state"
              );
              setActiveDungeonRun(null);
              localStorage.removeItem("activeDungeonRun");
            }
          }
        }, actualTimeRemaining * 1000);

        return () => {
          clearInterval(interval);
          clearTimeout(timeout);
        };
      }
    }
  }, [activeDungeonRun?.id]);

  const startDungeonMutation = useMutation({
    mutationFn: async ({
      dungeonId,
      mode,
    }: {
      dungeonId: string;
      mode: "Idle" | "Active";
    }) => {
      const { data } = await dungeonApi.start(dungeonId, mode);

      // Immediately update player energy in state
      if (player && data.energyCost !== undefined) {
        setPlayer({
          ...player,
          energy: player.energy - data.energyCost,
        });
      }

      // Add start time for persistence
      const runWithTime = { ...data, startTime: new Date().toISOString() };

      // Set active dungeon run and save to localStorage
      setActiveDungeonRun(runWithTime);
      // For Active mode, show full duration but it will count down faster
      const displayDuration =
        data.mode === "Active"
          ? Math.floor(data.dungeon.duration * 1.5)
          : data.dungeon.duration;
      setTimeRemaining(displayDuration);
      localStorage.setItem("activeDungeonRun", JSON.stringify(runWithTime));

      return data;
    },
    onSuccess: async () => {
      setSelectedDungeon(null);
      // Refresh player data to ensure sync
      const { data: profile } = await authApi.getProfile();
      setPlayer(profile);
    },
    onError: (error: any) => {
      // Show error notification
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to start dungeon";
      (window as any).showToast?.(errorMessage, "error");
    },
  });

  return (
    <div className="p-4 pb-20 relative">
      {/* Active Dungeon Banner (non-blocking) */}
      {activeDungeonRun && !activeDungeonRun.completed && (
        <div
          className="mb-4 p-4 bg-gradient-to-b from-orange-800 to-red-900 border-4 border-amber-600"
          style={{
            borderRadius: "12px",
            boxShadow:
              "0 4px 0 #92400e, 0 8px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img
                src={getDungeonIcon(activeDungeonRun.dungeon.name)}
                alt={activeDungeonRun.dungeon.name}
                className="w-10 h-10 rounded border-2 border-amber-500"
                style={{ imageRendering: "pixelated" }}
              />
              <div>
                <p
                  className="text-white font-bold text-lg"
                  style={{
                    fontFamily: "monospace",
                    textShadow: "2px 2px 0 #000",
                  }}
                >
                  {activeDungeonRun.dungeon.name}
                </p>
                <p
                  className="text-xs text-orange-200"
                  style={{ fontFamily: "monospace" }}
                >
                  {activeDungeonRun.mode} Mode - In Progress
                </p>
              </div>
            </div>
            <div className="text-right">
              <div
                className="text-3xl font-bold text-amber-300"
                style={{
                  fontFamily: "monospace",
                  textShadow: "2px 2px 0 #000",
                }}
              >
                {formatTimeRemaining(timeRemaining)}
              </div>
              <p
                className="text-xs text-orange-200"
                style={{ fontFamily: "monospace" }}
              >
                Remaining
              </p>
            </div>
          </div>
          <div
            className="w-full bg-stone-900 h-3 overflow-hidden mb-3"
            style={{ borderRadius: "0", border: "2px solid #78350f" }}
          >
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-1000"
              style={{
                width: `${
                  ((activeDungeonRun.dungeon.duration - timeRemaining) /
                    activeDungeonRun.dungeon.duration) *
                  100
                }%`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
              }}
            />
          </div>

          {/* Fast Finish Button */}
          <button
            onClick={() => fastFinishMutation.mutate(activeDungeonRun.id)}
            disabled={
              !player ||
              player.gems < fastFinishCost ||
              fastFinishMutation.isPending
            }
            className="w-full px-4 py-3 bg-purple-700 hover:bg-purple-600 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            style={{
              border: "3px solid #6b21a8",
              borderRadius: "8px",
              boxShadow:
                "0 3px 0 #7e22ce, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
              textShadow: "1px 1px 0 #000",
              fontFamily: "monospace",
              letterSpacing: "1px",
            }}
          >
            <span className="relative z-10">
              {fastFinishMutation.isPending
                ? "⏳ FINISHING..."
                : `⚡ FAST FINISH (${fastFinishCost} 💎)`}
            </span>
            <div className="absolute inset-0 bg-gradient-to-b from-purple-400/20 to-transparent"></div>
          </button>
        </div>
      )}

      {/* Dungeon Complete Modal (shows for unclaimed rewards, persists across refreshes) */}
      {unclaimedReward && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
          onClick={() => {
            setUnclaimedReward(null);
            localStorage.removeItem("unclaimedDungeonReward");
            if (activeDungeonRun?.completed) {
              setActiveDungeonRun(null);
              localStorage.removeItem("activeDungeonRun");
            }
          }}
        >
          <div
            className="bg-stone-800 rounded-lg border-2 border-amber-600 p-4 sm:p-8 max-w-md w-full text-center my-auto max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-amber-400 mb-4">
              {unclaimedReward.dungeonName}
            </h3>
            {unclaimedReward.result?.success ? (
              <>
                {/* Retro Pixel Star */}
                <div
                  className="w-16 h-16 mx-auto mb-4 bg-amber-500 relative"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                    boxShadow:
                      "0 4px 0 #92400e, 0 0 20px rgba(251, 191, 36, 0.6)",
                  }}
                >
                  <div
                    className="absolute inset-2 bg-amber-300"
                    style={{
                      clipPath:
                        "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                    }}
                  ></div>
                </div>

                <div
                  className="bg-amber-600 border-4 border-amber-500 mb-3 sm:mb-4 py-2"
                  style={{ borderRadius: "0", boxShadow: "0 4px 0 #92400e" }}
                >
                  <h2
                    className="text-2xl sm:text-3xl font-bold text-amber-200"
                    style={{
                      fontFamily: "monospace",
                      textShadow: "2px 2px 0 #000",
                    }}
                  >
                    ★ VICTORY! ★
                  </h2>
                </div>

                <div
                  className="bg-stone-900 border-4 border-amber-700 p-3 sm:p-4 mb-3 sm:mb-4"
                  style={{
                    borderRadius: "0",
                    boxShadow:
                      "0 3px 0 #78350f, inset 0 2px 0 rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    className="space-y-2 text-base sm:text-lg"
                    style={{ fontFamily: "monospace" }}
                  >
                    <div className="flex justify-between items-center py-2 border-b-2 border-stone-700">
                      <span
                        className="text-amber-400 font-bold"
                        style={{ textShadow: "1px 1px 0 #000" }}
                      >
                        💰 GOLD:
                      </span>
                      <span
                        className="text-yellow-300 font-bold"
                        style={{ textShadow: "1px 1px 0 #000" }}
                      >
                        +{unclaimedReward.result.goldEarned}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span
                        className="text-amber-400 font-bold"
                        style={{ textShadow: "1px 1px 0 #000" }}
                      >
                        ⭐ EXP:
                      </span>
                      <span
                        className="text-purple-300 font-bold"
                        style={{ textShadow: "1px 1px 0 #000" }}
                      >
                        +{unclaimedReward.result.expEarned}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Item Drops with Images */}
                {unclaimedReward.result.itemsDropped &&
                  unclaimedReward.result.itemsDropped.length > 0 && (
                    <div
                      className="bg-stone-900 border-4 border-purple-700 p-3 sm:p-4 mb-3 sm:mb-4"
                      style={{
                        borderRadius: "0",
                        boxShadow:
                          "0 3px 0 #6b21a8, inset 0 2px 0 rgba(255,255,255,0.1)",
                      }}
                    >
                      <h3
                        className="text-xs sm:text-sm font-bold text-amber-400 mb-2 sm:mb-3"
                        style={{
                          fontFamily: "monospace",
                          textShadow: "1px 1px 0 #000",
                        }}
                      >
                        💎 ITEMS OBTAINED:
                      </h3>
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                        {unclaimedReward.result.itemsDropped.map(
                          (item: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-stone-800 p-2 border-2 border-amber-600 text-center"
                              style={{ borderRadius: "0" }}
                            >
                              <div className="w-full aspect-square bg-stone-900 rounded mb-1 flex items-center justify-center p-1">
                                {item.spriteId &&
                                getItemImage(item.spriteId, item.type) ? (
                                  <img
                                    src={
                                      getItemImage(item.spriteId, item.type)!
                                    }
                                    alt={item.name}
                                    className="max-w-full max-h-full object-contain"
                                    style={{ imageRendering: "pixelated" }}
                                  />
                                ) : (
                                  <span className="text-3xl">📦</span>
                                )}
                              </div>
                              <p
                                className="text-xs text-white font-bold truncate"
                                style={{ fontFamily: "monospace" }}
                              >
                                {item.name}
                              </p>
                              <p
                                className="text-xs text-amber-400"
                                style={{ fontFamily: "monospace" }}
                              >
                                x{item.quantity}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">💀</div>
                <h2 className="text-3xl font-bold text-red-400 mb-4">
                  Defeated!
                </h2>
                {unclaimedReward.result.hpLoss && (
                  <div className="bg-stone-900 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-center gap-2 text-lg">
                      <span className="text-gray-400">HP Lost:</span>
                      <span className="text-red-400 font-bold text-2xl">
                        -{unclaimedReward.result.hpLoss}
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-gray-400 mb-4">
                  Try again with better equipment or higher level!
                </p>
              </>
            )}
            <button
              onClick={() => {
                setUnclaimedReward(null);
                localStorage.removeItem("unclaimedDungeonReward");
                if (activeDungeonRun?.completed) {
                  setActiveDungeonRun(null);
                  localStorage.removeItem("activeDungeonRun");
                }
              }}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded transition btn-press"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Idle Farming Complete Modal */}
      {unclaimedIdleReward && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setUnclaimedIdleReward(null);
            localStorage.removeItem("unclaimedIdleReward");
          }}
        >
          <div
            className="bg-stone-800 border-4 border-green-600 p-6 sm:p-8 max-w-md w-full text-center"
            style={{
              borderRadius: "0",
              boxShadow: "0 6px 0 #15803d, inset 0 2px 0 rgba(255,255,255,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Retro Pixel Wheat */}
            <div
              className="w-16 h-16 mx-auto mb-4 bg-green-600 border-4 border-green-500 flex items-center justify-center"
              style={{ borderRadius: "0", boxShadow: "0 4px 0 #15803d" }}
            >
              <span className="text-4xl">🌾</span>
            </div>

            <div
              className="bg-green-600 border-4 border-green-500 mb-3 sm:mb-4 py-2"
              style={{ borderRadius: "0", boxShadow: "0 4px 0 #15803d" }}
            >
              <h3
                className="text-xl sm:text-2xl font-bold text-green-200"
                style={{
                  fontFamily: "monospace",
                  textShadow: "2px 2px 0 #000",
                }}
              >
                ★ IDLE COMPLETE! ★
              </h3>
            </div>

            <p
              className="text-xs sm:text-sm text-amber-300 mb-4 font-bold"
              style={{ fontFamily: "monospace", textShadow: "1px 1px 0 #000" }}
            >
              You've been busy while away!
            </p>

            <div
              className="bg-stone-900 border-4 border-green-700 p-4 mb-4"
              style={{
                borderRadius: "0",
                boxShadow:
                  "0 3px 0 #15803d, inset 0 2px 0 rgba(255,255,255,0.1)",
              }}
            >
              <div
                className="space-y-2 text-base sm:text-lg"
                style={{ fontFamily: "monospace" }}
              >
                <div className="flex justify-between items-center py-2 border-b-2 border-stone-700">
                  <span
                    className="text-green-400 font-bold"
                    style={{ textShadow: "1px 1px 0 #000" }}
                  >
                    💰 GOLD:
                  </span>
                  <span
                    className="text-yellow-300 font-bold"
                    style={{ textShadow: "1px 1px 0 #000" }}
                  >
                    +{unclaimedIdleReward.goldEarned}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span
                    className="text-green-400 font-bold"
                    style={{ textShadow: "1px 1px 0 #000" }}
                  >
                    ⭐ EXP:
                  </span>
                  <span
                    className="text-purple-300 font-bold"
                    style={{ textShadow: "1px 1px 0 #000" }}
                  >
                    +{unclaimedIdleReward.expEarned}
                  </span>
                </div>
              </div>
            </div>

            {/* Item Drops with Images */}
            {unclaimedIdleReward.itemsDropped &&
              unclaimedIdleReward.itemsDropped.length > 0 && (
                <div
                  className="bg-stone-900 border-4 border-purple-700 p-4 mb-4"
                  style={{
                    borderRadius: "0",
                    boxShadow:
                      "0 3px 0 #6b21a8, inset 0 2px 0 rgba(255,255,255,0.1)",
                  }}
                >
                  <h3
                    className="text-xs sm:text-sm font-bold text-amber-400 mb-3"
                    style={{
                      fontFamily: "monospace",
                      textShadow: "1px 1px 0 #000",
                    }}
                  >
                    💎 ITEMS OBTAINED:
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {unclaimedIdleReward.itemsDropped.map(
                      (item: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-stone-800 p-2 border-2 border-green-600 text-center"
                          style={{ borderRadius: "0" }}
                        >
                          <div className="w-full aspect-square bg-stone-900 rounded mb-1 flex items-center justify-center p-1">
                            {item.spriteId &&
                            getItemImage(item.spriteId, item.type) ? (
                              <img
                                src={getItemImage(item.spriteId, item.type)!}
                                alt={item.name}
                                className="max-w-full max-h-full object-contain"
                                style={{ imageRendering: "pixelated" }}
                              />
                            ) : (
                              <span className="text-3xl">📦</span>
                            )}
                          </div>
                          <p
                            className="text-xs text-white font-bold truncate"
                            style={{ fontFamily: "monospace" }}
                          >
                            {item.name}
                          </p>
                          <p
                            className="text-xs text-green-400"
                            style={{ fontFamily: "monospace" }}
                          >
                            x{item.quantity}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            <button
              onClick={() => {
                setUnclaimedIdleReward(null);
                localStorage.removeItem("unclaimedIdleReward");
              }}
              className="w-full py-3 bg-green-700 hover:bg-green-600 text-white font-bold border-4 border-green-500 transition"
              style={{
                borderRadius: "0",
                fontFamily: "monospace",
                boxShadow:
                  "0 4px 0 #15803d, inset 0 2px 0 rgba(255,255,255,0.2)",
                textShadow: "2px 2px 0 #000",
              }}
            >
              ✓ CONTINUE
            </button>
          </div>
        </div>
      )}

      {/* Idle Status Banner */}
      {idleStatus?.active && (
        <div
          className="mb-4 p-4 bg-gradient-to-b from-green-800 to-green-900 border-4 border-green-600"
          style={{
            borderRadius: "12px",
            boxShadow:
              "0 4px 0 #15803d, 0 8px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img
                src={idleFarmingIcon}
                alt="Idle Farming"
                className="w-10 h-10 rounded border-2 border-green-500"
                style={{ imageRendering: "pixelated" }}
              />
              <div>
                <p
                  className="text-white font-bold text-lg"
                  style={{
                    fontFamily: "monospace",
                    textShadow: "2px 2px 0 #000",
                  }}
                >
                  Idle Farming Active
                </p>
                <p
                  className="text-xs text-green-200"
                  style={{ fontFamily: "monospace" }}
                >
                  {idleStatus.canClaim ? "Ready to claim!" : "In Progress"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div
                className="text-3xl font-bold text-green-300"
                style={{
                  fontFamily: "monospace",
                  textShadow: "2px 2px 0 #000",
                }}
              >
                {idleStatus.canClaim
                  ? "0:00"
                  : formatTimeRemaining(idleTimeRemaining)}
              </div>
              <p
                className="text-xs text-green-200"
                style={{ fontFamily: "monospace" }}
              >
                Remaining
              </p>
            </div>
          </div>
          <div
            className="w-full bg-stone-900 h-3 overflow-hidden mb-3"
            style={{ borderRadius: "0", border: "2px solid #15803d" }}
          >
            <div
              className="bg-gradient-to-r from-green-500 to-lime-400 h-full transition-all duration-1000"
              style={{
                width: idleStatus.canClaim
                  ? "100%"
                  : `${((3600 - idleTimeRemaining) / 3600) * 100}%`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
              }}
            />
          </div>
          <button
            onClick={() => claimIdleMutation.mutate()}
            disabled={!idleStatus.canClaim || claimIdleMutation.isPending}
            className="w-full px-4 py-3 bg-green-700 hover:bg-green-600 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            style={{
              border: "3px solid #15803d",
              borderRadius: "0",
              boxShadow: "0 3px 0 #166534, inset 0 1px 0 rgba(255,255,255,0.2)",
              textShadow: "1px 1px 0 #000",
              fontFamily: "monospace",
              letterSpacing: "1px",
            }}
          >
            <span className="relative z-10">
              {claimIdleMutation.isPending ? "CLAIMING..." : "CLAIM REWARDS"}
            </span>
            <div className="absolute inset-0 bg-gradient-to-b from-green-400/20 to-transparent"></div>
          </button>
        </div>
      )}

      {/* Start Idle Farming */}
      {!idleStatus?.active && (
        <div
          className="mb-4 p-4 bg-gradient-to-b from-stone-800 to-stone-900 border-4 border-stone-600"
          style={{
            borderRadius: "12px",
            boxShadow:
              "0 4px 0 #57534e, 0 8px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💤</span>
            <p
              className="text-white font-bold text-lg"
              style={{ fontFamily: "monospace", textShadow: "2px 2px 0 #000" }}
            >
              Start Idle Farming
            </p>
          </div>
          <p
            className="text-sm text-gray-300 mb-3"
            style={{ fontFamily: "monospace" }}
          >
            Let your character farm resources while you're away. Earn gold, exp,
            and items!
          </p>
          {character && character.level >= 10 ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => startIdleMutation.mutate(1)}
                disabled={startIdleMutation.isPending}
                className="px-4 py-3 bg-amber-700 hover:bg-amber-600 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                style={{
                  border: "3px solid #92400e",
                  borderRadius: "0",
                  boxShadow:
                    "0 3px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)",
                  textShadow: "1px 1px 0 #000",
                  fontFamily: "monospace",
                  letterSpacing: "1px",
                }}
              >
                <span className="relative z-10 text-sm">
                  {startIdleMutation.isPending ? "STARTING..." : "1 HOUR"}
                </span>
                <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
              </button>
              <button
                onClick={() => startIdleMutation.mutate(3)}
                disabled={startIdleMutation.isPending}
                className="px-4 py-3 bg-purple-700 hover:bg-purple-600 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                style={{
                  border: "3px solid #581c87",
                  borderRadius: "0",
                  boxShadow:
                    "0 3px 0 #7e22ce, inset 0 1px 0 rgba(255,255,255,0.2)",
                  textShadow: "1px 1px 0 #000",
                  fontFamily: "monospace",
                  letterSpacing: "1px",
                }}
              >
                <span className="relative z-10 text-sm">3 HOURS</span>
                <div className="absolute inset-0 bg-gradient-to-b from-purple-400/20 to-transparent"></div>
              </button>
            </div>
          ) : (
            <button
              onClick={() => startIdleMutation.mutate(1)}
              disabled={startIdleMutation.isPending}
              className="w-full px-4 py-3 bg-amber-700 hover:bg-amber-600 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              style={{
                border: "3px solid #92400e",
                borderRadius: "0",
                boxShadow:
                  "0 3px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)",
                textShadow: "1px 1px 0 #000",
                fontFamily: "monospace",
                letterSpacing: "1px",
              }}
            >
              <span className="relative z-10">
                {startIdleMutation.isPending
                  ? "STARTING..."
                  : "START IDLE FARMING (1 HOUR)"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
            </button>
          )}
        </div>
      )}

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView("dungeons")}
          className={`flex-1 py-2 font-bold transition flex items-center justify-center gap-2 relative overflow-hidden ${
            view === "dungeons"
              ? "bg-amber-700 text-white"
              : "bg-stone-800 text-gray-400 hover:bg-stone-700"
          }`}
          style={{
            border: "2px solid #92400e",
            borderRadius: "0",
            boxShadow:
              view === "dungeons"
                ? "0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)"
                : "none",
            textShadow: view === "dungeons" ? "1px 1px 0 #000" : "none",
            fontFamily: "monospace",
          }}
        >
          <img
            src={dungeonsIcon}
            alt="Dungeons"
            className="w-5 h-5"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="relative z-10">Dungeons</span>
          {view === "dungeons" && (
            <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
          )}
        </button>
        <button
          onClick={() => setView("history")}
          className={`flex-1 py-2 font-bold transition flex items-center justify-center gap-2 relative overflow-hidden ${
            view === "history"
              ? "bg-amber-700 text-white"
              : "bg-stone-800 text-gray-400 hover:bg-stone-700"
          }`}
          style={{
            border: "2px solid #92400e",
            borderRadius: "0",
            boxShadow:
              view === "history"
                ? "0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)"
                : "none",
            textShadow: view === "history" ? "1px 1px 0 #000" : "none",
            fontFamily: "monospace",
          }}
        >
          <img
            src={historyIcon}
            alt="History"
            className="w-5 h-5"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="relative z-10">History</span>
          {view === "history" && (
            <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
          )}
        </button>

        {/* Server Chat Button */}
        <button
          onClick={() => setView("serverchat")}
          className={`flex items-center gap-2 px-4 py-2 font-bold transition relative overflow-hidden ${
            view === "serverchat"
              ? "bg-amber-700 text-white"
              : "bg-stone-800 text-amber-400 hover:bg-stone-700"
          }`}
          style={{
            border: "2px solid #92400e",
            borderRadius: "0",
            boxShadow:
              view === "serverchat"
                ? "0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)"
                : "none",
            textShadow: view === "serverchat" ? "1px 1px 0 #000" : "none",
            fontFamily: "monospace",
          }}
        >
          <img
            src={serverchatIcon}
            alt="Server Chat"
            className="w-5 h-5"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="relative z-10">Chat</span>
          {view === "serverchat" && (
            <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
          )}
        </button>
      </div>

      {/* Dungeons List */}
      {view === "dungeons" && (
        <div className="space-y-3">
          {/* Search Bar and View Toggle */}
          <div className="flex gap-2 mb-2">
            <div className="flex-1 relative">
              <img
                src={searchIcon}
                alt="Search"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ imageRendering: "pixelated" }}
              />
              <input
                type="text"
                placeholder="Search dungeons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-stone-800 border-2 border-stone-600 text-white text-sm focus:border-amber-600 focus:outline-none"
                style={{
                  fontFamily: "monospace",
                }}
              />
            </div>
            <button
              onClick={() => setCollapsedView(!collapsedView)}
              className="px-3 py-2 bg-stone-700 hover:bg-stone-600 text-white text-xs font-bold transition whitespace-nowrap flex items-center gap-2"
              style={{
                border: "2px solid #57534e",
                fontFamily: "monospace",
              }}
            >
              <img
                src={collapsedView ? expandedIcon : compactIcon}
                alt={collapsedView ? "Expanded" : "Compact"}
                className="w-4 h-4"
                style={{ imageRendering: "pixelated" }}
              />
              {collapsedView ? "EXPANDED" : "COMPACT"}
            </button>
          </div>

          {dungeons && dungeons.length > 0 ? (
            dungeons
              .filter(
                (dungeon: any) =>
                  character && character.level >= dungeon.recommendedLevel
              )
              .filter((dungeon: any) => {
                if (!searchQuery.trim()) return true;
                const query = searchQuery.toLowerCase();
                return (
                  dungeon.name.toLowerCase().includes(query) ||
                  dungeon.zone.name.toLowerCase().includes(query) ||
                  dungeon.difficulty.toLowerCase().includes(query) ||
                  dungeon.recommendedLevel.toString().includes(query)
                );
              })
              .sort((a: any, b: any) => a.recommendedLevel - b.recommendedLevel)
              .map((dungeon: any) => (
                <div
                  key={dungeon.id}
                  className={`${
                    collapsedView ? "p-2" : "p-4"
                  } bg-gradient-to-b from-stone-800 to-stone-900 border-4 border-stone-600 hover:border-amber-600 transition-all cursor-pointer active:translate-y-1`}
                  onClick={() => setSelectedDungeon(dungeon)}
                  style={{
                    borderRadius: "12px",
                    boxShadow:
                      "0 4px 0 #57534e, 0 8px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.1)",
                  }}
                >
                  {collapsedView ? (
                    // Compact View
                    <div className="flex items-center gap-2">
                      <img
                        src={getDungeonIcon(dungeon.name)}
                        alt={dungeon.name}
                        className="w-10 h-10 border-2 border-stone-500"
                        style={{
                          imageRendering: "pixelated",
                          borderRadius: "6px",
                        }}
                      />
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <h3
                            className="font-bold text-white text-sm"
                            style={{
                              fontFamily: "monospace",
                              textShadow: "1px 1px 0 #000",
                            }}
                          >
                            {dungeon.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-blue-400">
                              Lv.{dungeon.recommendedLevel}
                            </span>
                            <span
                              className={`${getDifficultyColor(
                                dungeon.difficulty
                              )}`}
                            >
                              {dungeon.difficulty}
                            </span>
                            <span className="text-orange-400 flex items-center gap-1">
                              <img
                                src={cpIcon}
                                alt="CP"
                                className="w-3 h-3"
                                style={{ imageRendering: "pixelated" }}
                              />
                              {getRecommendedCP(dungeon.recommendedLevel)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1 text-amber-400">
                            <img
                              src={goldIcon}
                              alt="Gold"
                              className="w-3 h-3"
                              style={{ imageRendering: "pixelated" }}
                            />
                            <span>{formatGold(dungeon.baseGoldReward)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-400">
                            <img
                              src={energyIcon}
                              alt="Energy"
                              className="w-3 h-3"
                              style={{ imageRendering: "pixelated" }}
                            />
                            <span>{dungeon.energyCost}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Expanded View
                    <>
                      <div className="flex items-start gap-3 mb-3">
                        <img
                          src={getDungeonIcon(dungeon.name)}
                          alt={dungeon.name}
                          className="w-14 h-14 border-2 border-stone-500"
                          style={{
                            imageRendering: "pixelated",
                            borderRadius: "8px",
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3
                                  className="font-bold text-white text-lg"
                                  style={{
                                    fontFamily: "monospace",
                                    textShadow: "2px 2px 0 #000",
                                  }}
                                >
                                  {dungeon.name}
                                </h3>
                                <span
                                  className="text-xs font-bold px-2 py-0.5 bg-blue-600 text-white border-2 border-blue-800"
                                  style={{ fontFamily: "monospace" }}
                                >
                                  Lv.{dungeon.recommendedLevel}
                                </span>
                              </div>
                              <p
                                className="text-sm text-gray-400"
                                style={{ fontFamily: "monospace" }}
                              >
                                {dungeon.zone.name}
                              </p>
                            </div>
                            <span
                              className={`text-sm font-bold px-2 py-1 ${getDifficultyColor(
                                dungeon.difficulty
                              )}`}
                              style={{
                                fontFamily: "monospace",
                                textShadow: "1px 1px 0 #000",
                                border: "2px solid rgba(0,0,0,0.3)",
                                borderRadius: "4px",
                                backgroundColor: "rgba(0,0,0,0.3)",
                              }}
                            >
                              {dungeon.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div
                          className="flex items-center gap-1 text-amber-400"
                          style={{ fontFamily: "monospace" }}
                        >
                          <img
                            src={goldIcon}
                            alt="Gold"
                            className="w-4 h-4"
                            style={{ imageRendering: "pixelated" }}
                          />
                          <span>{formatGold(dungeon.baseGoldReward)} Gold</span>
                        </div>
                        <div
                          className="flex items-center gap-1 text-blue-400"
                          style={{ fontFamily: "monospace" }}
                        >
                          <img
                            src={energyIcon}
                            alt="Energy"
                            className="w-4 h-4"
                            style={{ imageRendering: "pixelated" }}
                          />
                          <span>{dungeon.energyCost} Energy</span>
                        </div>
                        <div
                          className="flex items-center gap-1 text-green-400"
                          style={{ fontFamily: "monospace" }}
                        >
                          <img
                            src={clockIcon}
                            alt="Time"
                            className="w-4 h-4"
                            style={{ imageRendering: "pixelated" }}
                          />
                          <span>{Math.floor(dungeon.duration / 60)} min</span>
                        </div>
                        <div
                          className="flex items-center gap-1 text-orange-400"
                          style={{ fontFamily: "monospace" }}
                        >
                          <img
                            src={cpIcon}
                            alt="CP"
                            className="w-4 h-4"
                            style={{ imageRendering: "pixelated" }}
                          />
                          <span>
                            Rec. CP:{" "}
                            {getRecommendedCP(dungeon.recommendedLevel)}
                          </span>
                        </div>
                      </div>

                      {/* Avatar Drop Section */}
                      <div className="mt-3 pt-3 border-t-2 border-stone-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <img
                                src={getDungeonIcon(dungeon.name)}
                                alt="Avatar"
                                className="w-8 h-8 border-2 border-amber-500"
                                style={{
                                  imageRendering: "pixelated",
                                  borderRadius: "4px",
                                  opacity: (
                                    character as any
                                  )?.unlockedAvatars?.includes(dungeon.id)
                                    ? 0.5
                                    : 1,
                                }}
                              />
                              {(character as any)?.unlockedAvatars?.includes(
                                dungeon.id
                              ) && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div
                                    className="text-red-500 text-2xl font-bold"
                                    style={{ textShadow: "2px 2px 0 #000" }}
                                  >
                                    ✓
                                  </div>
                                </div>
                              )}
                            </div>
                            <div>
                              <p
                                className="text-xs font-bold text-amber-400"
                                style={{
                                  fontFamily: "monospace",
                                  textShadow: "1px 1px 0 #000",
                                }}
                              >
                                AVATAR DROP
                              </p>
                              <p
                                className="text-[10px] text-gray-400"
                                style={{ fontFamily: "monospace" }}
                              >
                                {(character as any)?.unlockedAvatars?.includes(
                                  dungeon.id
                                )
                                  ? "ALREADY HAVE"
                                  : "FIRST-TIME ONLY"}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`text-xs font-bold px-2 py-1 border-2 ${
                              (character as any)?.unlockedAvatars?.includes(
                                dungeon.id
                              )
                                ? "bg-green-900 border-green-600 text-green-300"
                                : "bg-amber-900 border-amber-600 text-amber-300"
                            }`}
                            style={{
                              fontFamily: "monospace",
                              borderRadius: "4px",
                            }}
                          >
                            {(character as any)?.unlockedAvatars?.includes(
                              dungeon.id
                            )
                              ? "OWNED"
                              : "100%"}
                          </div>
                        </div>
                      </div>

                      {/* Companion Drops Section */}
                      {(() => {
                        const companionDrops = getCompanionDrops(
                          dungeon.recommendedLevel
                        );
                        if (companionDrops.length === 0) return null;

                        return (
                          <div className="mt-3 pt-3 border-t-2 border-pink-700">
                            <div className="flex items-center gap-2 mb-2">
                              <img
                                src={petIcon}
                                alt="Pet"
                                className="w-5 h-5"
                                style={{
                                  imageRendering: "pixelated",
                                  filter:
                                    "drop-shadow(0 0 4px rgba(236, 72, 153, 0.8))",
                                }}
                              />
                              <p
                                className="text-xs font-bold text-pink-300"
                                style={{
                                  fontFamily: "monospace",
                                  textShadow: "1px 1px 0 #000",
                                }}
                              >
                                PET COMPANION DROPS
                              </p>
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 bg-pink-900 border-2 border-pink-600 text-pink-300"
                                style={{
                                  fontFamily: "monospace",
                                  borderRadius: "4px",
                                }}
                              >
                                10% CHANCE
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {companionDrops.map((comp) => (
                                <div
                                  key={comp.name}
                                  className="relative group"
                                  title={`${comp.name} (${comp.rarity})`}
                                >
                                  <div
                                    className={`w-10 h-10 border-2 ${
                                      comp.rarity === "Legendary"
                                        ? "border-yellow-500 bg-gradient-to-br from-yellow-900/50 to-orange-900/50"
                                        : comp.rarity === "Epic"
                                        ? "border-purple-500 bg-gradient-to-br from-purple-900/50 to-pink-900/50"
                                        : comp.rarity === "Rare"
                                        ? "border-blue-500 bg-gradient-to-br from-blue-900/50 to-cyan-900/50"
                                        : "border-gray-500 bg-gradient-to-br from-gray-900/50 to-stone-900/50"
                                    } flex items-center justify-center relative overflow-hidden`}
                                    style={{
                                      borderRadius: "4px",
                                      boxShadow:
                                        comp.rarity === "Legendary"
                                          ? "0 0 10px rgba(234, 179, 8, 0.6), inset 0 0 10px rgba(234, 179, 8, 0.3)"
                                          : comp.rarity === "Epic"
                                          ? "0 0 8px rgba(168, 85, 247, 0.6), inset 0 0 8px rgba(168, 85, 247, 0.3)"
                                          : comp.rarity === "Rare"
                                          ? "0 0 6px rgba(59, 130, 246, 0.6), inset 0 0 6px rgba(59, 130, 246, 0.3)"
                                          : "0 0 4px rgba(107, 114, 128, 0.4), inset 0 0 4px rgba(107, 114, 128, 0.2)",
                                    }}
                                  >
                                    <img
                                      src={comp.spriteId}
                                      alt={comp.name}
                                      className="w-8 h-8 object-contain"
                                      style={{
                                        imageRendering: "pixelated",
                                        filter:
                                          comp.rarity === "Legendary"
                                            ? "drop-shadow(0 0 4px rgba(234, 179, 8, 0.8))"
                                            : comp.rarity === "Epic"
                                            ? "drop-shadow(0 0 3px rgba(168, 85, 247, 0.8))"
                                            : comp.rarity === "Rare"
                                            ? "drop-shadow(0 0 2px rgba(59, 130, 246, 0.8))"
                                            : "none",
                                      }}
                                    />
                                    {/* Animated glow */}
                                    <div
                                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      style={{
                                        background:
                                          comp.rarity === "Legendary"
                                            ? "radial-gradient(circle, rgba(234, 179, 8, 0.3) 0%, transparent 70%)"
                                            : comp.rarity === "Epic"
                                            ? "radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)"
                                            : comp.rarity === "Rare"
                                            ? "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)"
                                            : "none",
                                        animation:
                                          "pulse 2s ease-in-out infinite",
                                      }}
                                    />
                                  </div>
                                  {/* Tooltip */}
                                  <div
                                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black border-2 border-pink-500 text-white text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                                    style={{
                                      fontFamily: "monospace",
                                      borderRadius: "4px",
                                      boxShadow: "0 2px 8px rgba(0,0,0,0.8)",
                                    }}
                                  >
                                    {comp.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {character &&
                        character.combatPower < dungeon.recommendedCP * 0.8 && (
                          <div className="text-xs text-red-400 font-bold mt-2">
                            ⚠️ Combat Power too low!
                          </div>
                        )}
                    </>
                  )}
                </div>
              ))
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p>No dungeons available. Check back later!</p>
            </div>
          )}
        </div>
      )}

      {/* History View */}
      {view === "history" && (
        <div className="space-y-3">
          {dungeonHistory && dungeonHistory.length > 0 ? (
            dungeonHistory.map((run: any) => (
              <div
                key={run.id}
                className={`p-4 bg-stone-800 rounded-lg border-2 ${
                  run.status === "Completed"
                    ? "border-green-700"
                    : run.status === "Failed"
                    ? "border-red-700"
                    : "border-stone-700"
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <img
                    src={getDungeonIcon(run.dungeon.name)}
                    alt={run.dungeon.name}
                    className="w-12 h-12 rounded border-2 border-stone-600"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-white text-lg">
                          {run.dungeon.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {run.dungeon.zone.name}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          run.status === "Completed"
                            ? "text-green-400"
                            : run.status === "Failed"
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {run.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-gray-300">
                    <Trophy size={14} />
                    <span>{formatGold(run.goldEarned || 0)} Gold</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-300">
                    <Zap size={14} />
                    <span>{run.expEarned || 0} EXP</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-300">
                    <Clock size={14} />
                    <span>{run.mode}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-300">
                    <span className="text-xs text-gray-500">
                      {new Date(run.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {run.itemsEarned && run.itemsEarned.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-stone-700">
                    <p className="text-xs text-gray-400 mb-1">Items Earned:</p>
                    <div className="flex flex-wrap gap-1">
                      {run.itemsEarned.map((item: any, idx: number) => (
                        <span
                          key={idx}
                          className={`text-xs px-2 py-1 bg-stone-900 rounded ${getRarityColor(
                            item.rarity
                          )}`}
                        >
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p>
                No dungeon history yet. Complete some dungeons to see your
                history!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Dungeon Modal */}
      {selectedDungeon && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDungeon(null)}
        >
          <div
            className="bg-stone-800 border-4 border-amber-600 p-6 max-w-lg w-full relative max-h-[90vh] overflow-y-auto"
            style={{
              borderRadius: "0",
              boxShadow:
                "0 6px 0 #78350f, 0 12px 0 rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.2)",
              fontFamily: "monospace",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedDungeon(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-red-700 hover:bg-red-600 text-white font-bold flex items-center justify-center transition z-10"
              style={{
                border: "2px solid #7f1d1d",
                borderRadius: "0",
                boxShadow: "0 2px 0 #991b1b",
                textShadow: "1px 1px 0 #000",
              }}
            >
              ✕
            </button>

            {/* Header with Dungeon Icon */}
            <div className="flex items-start gap-4 mb-4 pb-4 border-b-2 border-stone-700">
              <img
                src={getDungeonIcon(selectedDungeon.name)}
                alt={selectedDungeon.name}
                className="w-20 h-20 border-3 border-amber-600"
                style={{
                  imageRendering: "pixelated",
                  borderRadius: "8px",
                  boxShadow: "0 4px 0 #78350f",
                }}
              />
              <div className="flex-1">
                <h2
                  className="text-2xl font-bold text-amber-400 mb-1"
                  style={{ textShadow: "2px 2px 0 #000" }}
                >
                  {selectedDungeon.name}
                </h2>
                <p className="text-xs text-gray-400 mb-2">
                  {selectedDungeon.zone?.name || "Unknown Zone"}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold px-2 py-1 ${getDifficultyColor(
                      selectedDungeon.difficulty
                    )}`}
                    style={{
                      textShadow: "1px 1px 0 #000",
                      border: "2px solid rgba(0,0,0,0.5)",
                      borderRadius: "4px",
                      backgroundColor: "rgba(0,0,0,0.3)",
                    }}
                  >
                    {selectedDungeon.difficulty}
                  </span>
                  <span className="text-xs font-bold px-2 py-1 bg-blue-600 text-white border-2 border-blue-800">
                    Lv.{selectedDungeon.recommendedLevel}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-300 mb-4 italic">
              "{selectedDungeon.description}"
            </p>

            {/* Stats Grid with Icons */}
            <div
              className="bg-stone-900 border-2 border-stone-700 p-4 mb-4"
              style={{ borderRadius: "8px" }}
            >
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-1 flex-nowrap">
                  <img
                    src={cpIcon}
                    alt="CP"
                    className="w-5 h-5 flex-shrink-0"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <span className="text-gray-400 whitespace-nowrap">
                    Rec. CP:
                  </span>
                  <span className="text-orange-400 font-bold whitespace-nowrap">
                    {getRecommendedCP(selectedDungeon.recommendedLevel)}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-nowrap">
                  <img
                    src={energyIcon}
                    alt="Energy"
                    className="w-5 h-5 flex-shrink-0"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <span className="text-gray-400 whitespace-nowrap">
                    Energy:
                  </span>
                  <span className="text-blue-400 font-bold whitespace-nowrap">
                    {selectedDungeon.energyCost}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-nowrap">
                  <img
                    src={hpIcon}
                    alt="HP"
                    className="w-5 h-5 flex-shrink-0"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <span className="text-gray-400 whitespace-nowrap">
                    HP Cost:
                  </span>
                  <span className="text-red-400 font-bold whitespace-nowrap">
                    ~
                    {Math.round(
                      getRecommendedCP(selectedDungeon.recommendedLevel) * 0.2
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-nowrap">
                  <img
                    src={clockIcon}
                    alt="Time"
                    className="w-5 h-5 flex-shrink-0"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <span className="text-gray-400 whitespace-nowrap">
                    Duration:
                  </span>
                  <span className="text-green-400 font-bold whitespace-nowrap">
                    {Math.floor(selectedDungeon.duration / 60)} min
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-nowrap">
                  <img
                    src={goldIcon}
                    alt="Gold"
                    className="w-5 h-5 flex-shrink-0"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <span className="text-gray-400 whitespace-nowrap">Gold:</span>
                  <span className="text-yellow-400 font-bold whitespace-nowrap">
                    {selectedDungeon.baseGoldReward}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-nowrap col-span-2">
                  <img
                    src={expIcon}
                    alt="EXP"
                    className="w-5 h-5 flex-shrink-0"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <span className="text-gray-400 whitespace-nowrap">
                    EXP Reward:
                  </span>
                  <span className="text-purple-400 font-bold whitespace-nowrap">
                    {selectedDungeon.baseExpReward}
                  </span>
                </div>
              </div>
            </div>

            {/* Monsters Section */}
            {selectedDungeon.description && (
              <div
                className="bg-red-950/30 border-2 border-red-900 p-3 mb-4"
                style={{ borderRadius: "8px" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={monstersIcon}
                    alt="Monsters"
                    className="w-5 h-5"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <span className="text-sm font-bold text-red-400">
                    MONSTERS:
                  </span>
                </div>
                <p className="text-xs text-gray-300">
                  {selectedDungeon.description.includes("Boss:")
                    ? selectedDungeon.description.split("Boss:")[1]?.trim()
                    : "Various enemies"}
                </p>
              </div>
            )}

            {/* Collapsible Possible Rewards */}
            {character &&
              selectedDungeon.lootTable &&
              selectedDungeon.lootTable.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowRewards(!showRewards)}
                    className="w-full py-2 bg-amber-900/50 hover:bg-amber-900/70 border-2 border-amber-700 text-amber-400 font-bold flex items-center justify-between px-3 transition"
                    style={{
                      borderRadius: "6px",
                      textShadow: "1px 1px 0 #000",
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <img
                        src={rewardIcon}
                        alt="Rewards"
                        className="w-4 h-4"
                        style={{ imageRendering: "pixelated" }}
                      />
                      POSSIBLE REWARDS (
                      {
                        selectedDungeon.lootTable.filter(
                          (e: any) =>
                            !e.classRestriction ||
                            e.classRestriction === character.class
                        ).length
                      }
                      )
                    </span>
                    {showRewards ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>

                  {showRewards && (
                    <div
                      className="mt-2 bg-stone-950 border-2 border-stone-700 p-3"
                      style={{ borderRadius: "6px" }}
                    >
                      <div className="grid grid-cols-4 gap-2">
                        {selectedDungeon.lootTable
                          .filter(
                            (entry: any) =>
                              !entry.classRestriction ||
                              entry.classRestriction === character.class
                          )
                          .map((entry: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-stone-900 p-2 relative"
                              style={{
                                border: "2px solid #78350f",
                                borderRadius: "6px",
                                boxShadow:
                                  "inset 0 1px 0 rgba(255,255,255,0.1)",
                              }}
                            >
                              <div className="w-full aspect-square bg-stone-800 rounded mb-1 flex items-center justify-center">
                                {entry.item?.spriteId &&
                                getItemImage(
                                  entry.item.spriteId,
                                  entry.item.type
                                ) ? (
                                  <img
                                    src={
                                      getItemImage(
                                        entry.item.spriteId,
                                        entry.item.type
                                      )!
                                    }
                                    alt={entry.item.name}
                                    className="max-w-full max-h-full object-contain p-1"
                                    style={{ imageRendering: "pixelated" }}
                                  />
                                ) : (
                                  <span className="text-2xl">📦</span>
                                )}
                              </div>
                              <div className="absolute top-1 right-1 bg-amber-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                                {Math.round(entry.dropRate * 100)}%
                              </div>
                              {entry.item && (
                                <p
                                  className={`text-[9px] font-bold text-center truncate ${getRarityColor(
                                    entry.item.rarity
                                  )}`}
                                >
                                  {entry.item.name}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* Companion Drops Section in Modal */}
            {(() => {
              const companionDrops = getCompanionDrops(
                selectedDungeon.recommendedLevel
              );
              if (companionDrops.length === 0) return null;

              return (
                <div className="mt-3">
                  <button
                    onClick={() => setShowCompanionDrops(!showCompanionDrops)}
                    className="w-full bg-gradient-to-b from-pink-950/50 to-stone-900 border-2 border-pink-600 p-3 flex items-center justify-between hover:from-pink-900/50 hover:to-stone-800 transition"
                    style={{
                      borderRadius: "6px",
                      fontFamily: "monospace",
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <img
                        src={petIcon}
                        alt="Pet"
                        className="w-5 h-5"
                        style={{
                          imageRendering: "pixelated",
                          filter: "drop-shadow(0 0 6px rgba(236, 72, 153, 0.8))",
                        }}
                      />
                      <span
                        className="text-sm font-bold text-pink-300"
                        style={{
                          textShadow: "2px 2px 0 #000",
                        }}
                      >
                        🐾 PET COMPANION DROPS ({companionDrops.length})
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold px-2 py-1 bg-pink-900 border-2 border-pink-500 text-pink-200"
                        style={{
                          borderRadius: "4px",
                          boxShadow: "0 2px 0 #831843",
                        }}
                      >
                        10% CHANCE
                      </span>
                      {showCompanionDrops ? (
                        <ChevronUp size={20} className="text-pink-300" />
                      ) : (
                        <ChevronDown size={20} className="text-pink-300" />
                      )}
                    </div>
                  </button>

                  {showCompanionDrops && (
                    <div
                      className="mt-2 bg-stone-950 border-2 border-pink-700 p-3"
                      style={{ borderRadius: "6px" }}
                    >
                      <div className="grid grid-cols-4 gap-2">
                    {companionDrops.map((comp) => (
                      <div key={comp.name} className="relative group">
                        <div
                          className={`w-full aspect-square border-2 ${
                            comp.rarity === "Legendary"
                              ? "border-yellow-500 bg-gradient-to-br from-yellow-900/70 to-orange-900/70"
                              : comp.rarity === "Epic"
                              ? "border-purple-500 bg-gradient-to-br from-purple-900/70 to-pink-900/70"
                              : comp.rarity === "Rare"
                              ? "border-blue-500 bg-gradient-to-br from-blue-900/70 to-cyan-900/70"
                              : "border-gray-500 bg-gradient-to-br from-gray-900/70 to-stone-900/70"
                          } flex items-center justify-center relative overflow-hidden`}
                          style={{
                            borderRadius: "6px",
                            boxShadow:
                              comp.rarity === "Legendary"
                                ? "0 0 12px rgba(234, 179, 8, 0.8), inset 0 0 12px rgba(234, 179, 8, 0.4), 0 4px 0 #854d0e"
                                : comp.rarity === "Epic"
                                ? "0 0 10px rgba(168, 85, 247, 0.8), inset 0 0 10px rgba(168, 85, 247, 0.4), 0 4px 0 #581c87"
                                : comp.rarity === "Rare"
                                ? "0 0 8px rgba(59, 130, 246, 0.8), inset 0 0 8px rgba(59, 130, 246, 0.4), 0 4px 0 #1e3a8a"
                                : "0 0 4px rgba(107, 114, 128, 0.6), inset 0 0 4px rgba(107, 114, 128, 0.3), 0 4px 0 #1f2937",
                          }}
                        >
                          <img
                            src={comp.spriteId}
                            alt={comp.name}
                            className="w-full h-full object-contain p-2"
                            style={{
                              imageRendering: "pixelated",
                              filter:
                                comp.rarity === "Legendary"
                                  ? "drop-shadow(0 0 6px rgba(234, 179, 8, 1))"
                                  : comp.rarity === "Epic"
                                  ? "drop-shadow(0 0 5px rgba(168, 85, 247, 1))"
                                  : comp.rarity === "Rare"
                                  ? "drop-shadow(0 0 4px rgba(59, 130, 246, 1))"
                                  : "drop-shadow(0 2px 2px rgba(0,0,0,0.8))",
                            }}
                          />
                          {/* Animated glow */}
                          <div
                            className="absolute inset-0 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"
                            style={{
                              background:
                                comp.rarity === "Legendary"
                                  ? "radial-gradient(circle at center, rgba(234, 179, 8, 0.4) 0%, transparent 70%)"
                                  : comp.rarity === "Epic"
                                  ? "radial-gradient(circle at center, rgba(168, 85, 247, 0.4) 0%, transparent 70%)"
                                  : comp.rarity === "Rare"
                                  ? "radial-gradient(circle at center, rgba(59, 130, 246, 0.4) 0%, transparent 70%)"
                                  : "none",
                              animation: "pulse 2s ease-in-out infinite",
                            }}
                          />
                        </div>
                        <p
                          className={`text-[10px] font-bold text-center mt-1 truncate ${
                            comp.rarity === "Legendary"
                              ? "text-yellow-300"
                              : comp.rarity === "Epic"
                              ? "text-purple-300"
                              : comp.rarity === "Rare"
                              ? "text-blue-300"
                              : "text-gray-300"
                          }`}
                          style={{
                            fontFamily: "monospace",
                            textShadow: "1px 1px 0 #000",
                          }}
                        >
                          {comp.name}
                        </p>
                      </div>
                    ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    if (activeDungeonRun && !activeDungeonRun.completed) {
                      (window as any).showToast?.(
                        `You are already doing this run: ${activeDungeonRun.dungeon.name}`,
                        "warning"
                      );
                      return;
                    }
                    startDungeonMutation.mutate({
                      dungeonId: selectedDungeon.id,
                      mode: "Idle",
                    });
                  }}
                  disabled={startDungeonMutation.isPending}
                  className="py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold transition relative overflow-hidden group disabled:opacity-50"
                  style={{
                    border: "3px solid #1e3a8a",
                    borderRadius: "0",
                    boxShadow:
                      "0 3px 0 #1e40af, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                    textShadow: "1px 1px 0 #000",
                    fontFamily: "monospace",
                    letterSpacing: "1px",
                  }}
                >
                  <span className="relative z-10">💤 IDLE RUN</span>
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-400/20 to-transparent"></div>
                </button>
                <button
                  onClick={() => {
                    if (activeDungeonRun && !activeDungeonRun.completed) {
                      (window as any).showToast?.(
                        `You are already in a dungeon: ${activeDungeonRun.dungeon.name}`,
                        "warning"
                      );
                      return;
                    }
                    startDungeonMutation.mutate({
                      dungeonId: selectedDungeon.id,
                      mode: "Active",
                    });
                  }}
                  disabled={startDungeonMutation.isPending}
                  className="py-3 bg-amber-700 hover:bg-amber-600 text-white font-bold transition relative overflow-hidden group disabled:opacity-50"
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
                  <span className="relative z-10">⚡ ACTIVE 1.5x</span>
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
                </button>
              </div>
              {/* BOSS FIGHT - Epic PixiJS Battle! */}
              <button
                onClick={async () => {
                  if (
                    !selectedDungeon.description ||
                    !selectedDungeon.description.includes("Boss:")
                  ) {
                    (window as any).showToast?.(
                      "This dungeon has no boss!",
                      "warning"
                    );
                    return;
                  }

                  if (bossCooldown && !bossCooldown.canFight) {
                    (window as any).showToast?.(
                      `Boss fight on cooldown! Wait ${bossCooldown.remainingMinutes} more minutes.`,
                      "warning"
                    );
                    return;
                  }

                  try {
                    // Start boss fight and update cooldown
                    await dungeonApi.startBoss(selectedDungeon.id);
                    setShowBossFight(true);
                    // Refetch cooldown
                    queryClient.invalidateQueries({
                      queryKey: ["bossCooldown"],
                    });
                  } catch (error: any) {
                    (window as any).showToast?.(
                      error.response?.data?.message ||
                        "Failed to start boss fight",
                      "error"
                    );
                  }
                }}
                disabled={bossCooldown ? !bossCooldown.canFight : false}
                className={`w-full py-4 font-bold transition relative overflow-hidden group ${
                  bossCooldown && !bossCooldown.canFight
                    ? "bg-gray-700 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800"
                } text-white`}
                style={{
                  border: "4px solid #991b1b",
                  borderRadius: "0",
                  boxShadow:
                    "0 4px 0 #7f1d1d, 0 8px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.2)",
                  textShadow: "2px 2px 0 #000",
                  imageRendering: "pixelated",
                  fontFamily: "monospace",
                  letterSpacing: "2px",
                }}
              >
                <span className="relative z-10 text-xl tracking-wider flex items-center justify-center gap-2">
                  {bossCooldown && !bossCooldown.canFight ? (
                    <>⏰ COOLDOWN: {bossCooldown.remainingMinutes}m</>
                  ) : (
                    <>
                      <span className="animate-pulse">👹</span>
                      BOSS FIGHT
                      <span className="animate-pulse">👹</span>
                    </>
                  )}
                </span>
                {bossCooldown && bossCooldown.canFight && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-b from-red-500/30 to-transparent group-hover:from-red-400/40"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400 animate-pulse"></div>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => setSelectedDungeon(null)}
              className="w-full mt-2 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded transition btn-press"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Server Chat View */}
      {view === "serverchat" && (
        <div className="h-[600px]">
          <ServerChat />
        </div>
      )}

      {/* Boss Fight Component */}
      {showBossFight && character && selectedDungeon && (
        <BossFight
          dungeonName={selectedDungeon.name}
          bossName={
            selectedDungeon.description.split("Boss: ")[1]?.split(".")[0] ||
            `${selectedDungeon.name} Boss`
          }
          bossLevel={
            selectedDungeon.recommendedLevel ||
            selectedDungeon.requiredLevel ||
            1
          }
          bossHealth={(selectedDungeon as any).bossHealth || 1000}
          bossAttack={(selectedDungeon as any).bossAttack || 50}
          bossDefense={(selectedDungeon as any).bossDefense || 30}
          dungeonIcon={getDungeonIcon(selectedDungeon.name)}
          playerClass={character.class}
          playerHP={character.health}
          playerMaxHP={character.maxHealth}
          playerAttack={character.attack}
          playerDefense={character.defense}
          playerSpeed={character.speed}
          playerCP={character.combatPower}
          fireAttack={(character as any).fireAttack || 0}
          iceAttack={(character as any).iceAttack || 0}
          lightningAttack={(character as any).lightningAttack || 0}
          poisonAttack={(character as any).poisonAttack || 0}
          critChance={(character as any).critChance || 0}
          critDamage={(character as any).critDamage || 0}
          lifeSteal={(character as any).lifeSteal || 0}
          dodgeChance={(character as any).dodgeChance || 0}
          onComplete={async (success, finalHP, rewards) => {
            // Complete boss fight on backend first
            try {
              await dungeonApi.completeBoss(success, finalHP, rewards);

              // Refetch all data
              await queryClient.invalidateQueries({ queryKey: ["character"] });
              await queryClient.invalidateQueries({ queryKey: ["player"] });
              await queryClient.invalidateQueries({ queryKey: ["inventory"] });
              await queryClient.invalidateQueries({
                queryKey: ["bossCooldown"],
              });

              if (success && rewards) {
                (window as any).showToast?.(
                  `🎉 Boss defeated! +${rewards?.xp || 0} XP, +${
                    rewards?.gold || 0
                  }g`,
                  "success"
                );
              } else {
                (window as any).showToast?.(
                  "💀 Defeated by the boss...",
                  "error"
                );
              }
            } catch (error) {
              console.error("Failed to complete boss fight:", error);
              (window as any).showToast?.(
                "Failed to save boss fight results",
                "error"
              );
            }

            setShowBossFight(false);
          }}
          onClose={() => setShowBossFight(false)}
        />
      )}
    </div>
  );
}
