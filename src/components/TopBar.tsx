import { useState, useEffect, useRef } from 'react';
import { useGameStore } from "@/store/gameStore";
import { sendGameNotification } from '@/services/notifications';
import {
  formatGold,
  getClassIcon,
  getRarityColor,
  getRarityBorder,
} from "@/utils/format";
import { getItemImage } from "@/utils/itemSprites";
import { X, Circle } from "lucide-react";
import FramedAvatar from "@/components/FramedAvatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  inventoryApi,
  achievementApi,
  avatarApi,
  dungeonApi,
  authApi,
} from "@/lib/api";
import energyIcon from "@/assets/ui/energy.png";
import hpIcon from "@/assets/ui/hp.png";
import goldIcon from "@/assets/ui/gold.png";
import gemIcon from "@/assets/ui/gem.png";
import clockIcon from "@/assets/ui/clock.png";
import attackIconCP from "@/assets/ui/character_panel/attack.png";
import defenseIconCP from "@/assets/ui/character_panel/defense.png";
import hpIconCP from "@/assets/ui/character_panel/hp.png";
import speedIconCP from "@/assets/ui/character_panel/speed.png";
import cpIconCP from "@/assets/ui/character_panel/cp.png";
import titleIcon from "@/assets/ui/title.png";
import lockedIcon from "@/assets/ui/locked.png";
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

const getDungeonIconByName = (dungeonName: string) => {
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
  return iconMap[dungeonName] || ratCellarIcon;
};

export default function TopBar() {
  const { player, character, setCharacter } = useGameStore();
  const queryClient = useQueryClient();
  const [showStats, setShowStats] = useState(false);
  const [showEnergyTimer, setShowEnergyTimer] = useState(false);
  const [timeUntilNextEnergy, setTimeUntilNextEnergy] = useState("");
  const [selectedItemDetails, setSelectedItemDetails] = useState<any>(null);
  const [showTitleChooser, setShowTitleChooser] = useState(false);
  const [showAvatarChooser, setShowAvatarChooser] = useState(false);
  const [showFrameChooser, setShowFrameChooser] = useState(false);

  const { data: inventory } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data } = await inventoryApi.get();
      return data;
    },
    enabled: showStats,
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data } = await achievementApi.getAll();
      return data;
    },
    enabled: showStats || showTitleChooser,
  });

  const { data: avatarData } = useQuery({
    queryKey: ["avatars"],
    queryFn: async () => {
      const { data } = await avatarApi.getUnlocked();
      return data;
    },
    enabled: showAvatarChooser,
  });

  const { data: frameData } = useQuery({
    queryKey: ["frames"],
    queryFn: async () => {
      const { data } = await avatarApi.getFrames();
      return data;
    },
    enabled: showAvatarChooser,
  });

  const { data: allDungeons } = useQuery({
    queryKey: ["dungeons"],
    queryFn: async () => {
      const { data } = await dungeonApi.getAll();
      return data;
    },
    staleTime: Infinity, // Dungeons don't change, cache forever
  });

  // Helper function to get dungeon icon by dungeon ID
  const getDungeonIcon = (dungeonId: string) => {
    if (!allDungeons) return ratCellarIcon;
    const dungeon = allDungeons.find((d: any) => d.id === dungeonId);
    if (!dungeon) return ratCellarIcon;
    return getDungeonIconByName(dungeon.name);
  };

  const setAvatarMutation = useMutation({
    mutationFn: async (avatarId: string | null) => {
      const { data } = await avatarApi.setAvatar(avatarId);
      return data;
    },
    onSuccess: (data) => {
      // Immediately update character state
      if (character) {
        setCharacter({ ...character, avatarId: data.avatarId } as any);
      }
      // Invalidate all queries that show avatars
      queryClient.invalidateQueries({ queryKey: ["character"] });
      queryClient.invalidateQueries({ queryKey: ["avatars"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["guild"] });
      queryClient.invalidateQueries({ queryKey: ["guild-chat"] });
      queryClient.invalidateQueries({ queryKey: ["server-chat"] });
      (window as any).showToast?.("Avatar changed!", "success");
    },
  });

  const setFrameMutation = useMutation({
    mutationFn: async (frameId: string) => {
      const { data } = await avatarApi.setFrame(frameId);
      return data;
    },
    onSuccess: (data) => {
      // Immediately update character state
      if (character) {
        setCharacter({
          ...character,
          avatarFrame: (data as any).avatarFrame,
        } as any);
      }
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["character"] });
      queryClient.invalidateQueries({ queryKey: ["frames"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["guild"] });
      queryClient.invalidateQueries({ queryKey: ["guild-chat"] });
      queryClient.invalidateQueries({ queryKey: ["server-chat"] });
      (window as any).showToast?.("Avatar frame changed!", "success");
    },
  });

  const equipTitleMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      const { data } = await achievementApi.equipTitle(achievementId);
      return data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      queryClient.invalidateQueries({ queryKey: ["character"] });

      // Refetch profile to update character stats immediately
      const { data: profile } = await authApi.getProfile();
      setCharacter(profile.character);

      (window as any).showToast?.("Title equipped!", "success");
      setShowTitleChooser(false);
    },
  });

  const unequipTitleMutation = useMutation({
    mutationFn: async () => {
      const { data } = await achievementApi.unequipTitle();
      return data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      queryClient.invalidateQueries({ queryKey: ["character"] });

      // Refetch profile to update character stats immediately
      const { data: profile } = await authApi.getProfile();
      setCharacter(profile.character);

      (window as any).showToast?.("Title removed!", "success");
      setShowTitleChooser(false);
    },
  });

  // Track energy full notification
  const energyWasFullRef = useRef(false);

  useEffect(() => {
    if (!player || player.energy >= player.maxEnergy) {
      setTimeUntilNextEnergy("Full");
      
      // Send notification when energy becomes full
      if (player && player.energy === player.maxEnergy && !energyWasFullRef.current) {
        energyWasFullRef.current = true;
        sendGameNotification(
          'energyRefill',
          'Energy Full!',
          'Your energy is fully recharged. Time to adventure!'
        );
      }
      return;
    } else {
      energyWasFullRef.current = false;
    }

    const updateTimer = () => {
      const lastUpdate = player.energyUpdatedAt
        ? new Date(player.energyUpdatedAt).getTime()
        : Date.now();
      const timeSinceLastUpdate = Date.now() - lastUpdate;
      const timeUntilNext = 300000 - (timeSinceLastUpdate % 300000); // 5 minutes in ms

      const minutes = Math.floor(timeUntilNext / 60000);
      const seconds = Math.floor((timeUntilNext % 60000) / 1000);

      setTimeUntilNextEnergy(`${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [player?.energy, player?.energyUpdatedAt, player?.maxEnergy]);

  // Track level ups
  const previousLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (character) {
      if (previousLevelRef.current !== null && character.level > previousLevelRef.current) {
        // Level up detected!
        sendGameNotification(
          'levelUp',
          'Level Up!',
          `Congratulations! You reached Level ${character.level}!`,
          { level: character.level }
        );
      }
      previousLevelRef.current = character.level;
    }
  }, [character?.level]);

  // Get item from slot
  const getSlotItem = (slotType: string) => {
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
    };
    return slotMap[slotType]?.item || null;
  };

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
    };
    return slotMap[slotName] || null;
  };

  const getGemDetails = (gemItemId: string) => {
    if (!inventory) return null;
    const gemSlot = inventory.find((s: any) => s.item.id === gemItemId);
    return gemSlot?.item || null;
  };

  // Map achievement iconIds to actual titleIcon filenames
  const mapIconIdToFileName = (iconId: string): string => {
    const iconMap: Record<string, string> = {
      // Kill achievements
      achievement_kills_100: "monster_hunter",
      achievement_kills_500: "monster_slayer",
      achievement_kills_1000: "monster_annihilator",

      // Gold achievements
      achievement_gold_10k: "rich_adventurer",
      achievement_gold_100k: "wealthy_adventurer",
      achievement_gold_1m: "millionaire",

      // Blacksmith achievements
      achievement_enhance_3: "blacksmith_apprentice",
      achievement_enhance_6: "master_blacksmith",
      achievement_enhance_9: "legendary_blacksmith",

      // Collection achievements
      achievement_weapons_10: "weapon_collector",
      achievement_armor_10: "armor_enthusiast",

      // Social achievements
      achievement_friends_5: "social_butterfly",
      achievement_guild_join: "social_butterfly",
    };

    return iconMap[iconId] || iconId;
  };

  // Get title icon based on achievement iconId
  const getTitleIcon = (iconId: string) => {
    if (!iconId) return null;
    const fileName = mapIconIdToFileName(iconId);
    return `/assets/ui/titleIcons/${fileName}.png`;
  };

  // Get equipped title from achievements
  const equippedTitle = achievements.find((a: any) => a.isEquipped);
  const availableTitles = achievements.filter(
    (a: any) => a.completed && a.title
  );

  if (!player || !character) return null;

  // Check if running in Electron
  const isElectron =
    typeof window !== "undefined" && window.electron?.isElectron;
  const topBarTopClass = isElectron ? "top-12" : "top-0"; // Add space for custom titlebar in Electron

  return (
    <>
      <div
        className={`fixed ${topBarTopClass} left-0 right-0 z-40 bg-stone-800 p-3 flex justify-between items-center border-b-2 border-amber-700`}
      >
        <div className="flex items-center gap-3">
          <FramedAvatar
            src={
              (character as any).avatarId
                ? getDungeonIcon((character as any).avatarId)
                : `/assets/ui/chat/classIcons/${character.class.toLowerCase()}.png`
            }
            alt={character.name}
            frame={(character as any).avatarFrame || "default"}
            size="small"
            onClick={() => setShowStats(true)}
            className="cursor-pointer hover:opacity-80 transition"
            borderColor="border-amber-500"
          />
          <div>
            <button
              onClick={() => setShowStats(true)}
              className="text-white font-bold text-sm hover:text-amber-400 transition"
              style={{ fontFamily: "monospace", textShadow: "1px 1px 0 #000" }}
            >
              Lv.{character.level} {character.name}
            </button>
            <div className="flex gap-3 text-xs">
              <span
                className="text-yellow-400 flex items-center gap-1"
                style={{ fontFamily: "monospace" }}
              >
                <img
                  src={goldIcon}
                  alt="Gold"
                  className="w-3 h-3"
                  style={{ imageRendering: "pixelated" }}
                />
                {formatGold(player.gold)}
              </span>
              <span
                className="text-blue-400 flex items-center gap-1"
                style={{ fontFamily: "monospace" }}
              >
                <img
                  src={gemIcon}
                  alt="Gems"
                  className="w-3 h-3"
                  style={{ imageRendering: "pixelated" }}
                />
                {player.gems}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right text-xs">
          <div className="flex items-center gap-2 mb-1 relative">
            <button
              onClick={() => setShowEnergyTimer(!showEnergyTimer)}
              className="hover:opacity-80 transition"
            >
              <img src={energyIcon} alt="Energy" className="w-4 h-4" />
            </button>
            <div
              className="w-20 bg-stone-900 h-2 overflow-hidden"
              style={{ borderRadius: "0", border: "1px solid #1e3a8a" }}
            >
              <div
                className="bg-blue-500 h-full transition-all"
                style={{
                  width: `${(player.energy / player.maxEnergy) * 100}%`,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                }}
              />
            </div>
            <span
              className="text-blue-300 font-bold"
              style={{ fontFamily: "monospace" }}
            >
              {player.energy}/{player.maxEnergy}
            </span>

            {/* Energy Timer Tooltip */}
            {showEnergyTimer && (
              <div
                className="absolute top-6 right-0 bg-stone-900 border-2 border-blue-600 p-3 shadow-lg z-50 min-w-[180px]"
                style={{
                  borderRadius: "0",
                  boxShadow: "0 4px 0 rgba(0,0,0,0.3)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={clockIcon}
                    alt="Clock"
                    className="w-4 h-4"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <span
                    className="text-white font-bold text-sm"
                    style={{ fontFamily: "monospace" }}
                  >
                    Energy Regen
                  </span>
                </div>
                <div className="text-gray-300 text-xs space-y-1">
                  <p>Next energy in:</p>
                  <p
                    className="text-blue-400 font-bold text-base"
                    style={{ fontFamily: "monospace" }}
                  >
                    {timeUntilNextEnergy}
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    +1 energy every 5 minutes
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <img src={hpIcon} alt="HP" className="w-4 h-4" />
            <div
              className="w-20 bg-stone-900 h-2 overflow-hidden"
              style={{ borderRadius: "0", border: "1px solid #7f1d1d" }}
            >
              <div
                className="bg-red-500 h-full transition-all"
                style={{
                  width: `${(character.health / character.maxHealth) * 100}%`,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                }}
              />
            </div>
            <span
              className="text-red-300 font-bold"
              style={{ fontFamily: "monospace" }}
            >
              {character.health}/{character.maxHealth}
            </span>
          </div>
        </div>
      </div>

      {/* Character Stats Modal */}
      {showStats && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowStats(false)}
        >
          <div
            className="bg-stone-800 border-4 border-amber-600 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{ borderRadius: "0", boxShadow: "0 8px 0 rgba(0,0,0,0.5)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-amber-600">
              <h2
                className="text-3xl font-bold text-amber-400"
                style={{
                  fontFamily: "monospace",
                  textShadow:
                    "2px 2px 0 #000, 0 0 10px rgba(251, 191, 36, 0.5)",
                }}
              >
                CHARACTER STATS
              </h2>
              <button
                onClick={() => setShowStats(false)}
                className="text-amber-400 hover:text-amber-300 transition"
              >
                <X size={28} strokeWidth={3} />
              </button>
            </div>

            <div
              className="flex items-center gap-4 mb-6 bg-stone-950 border-2 border-amber-700 p-4"
              style={{
                borderRadius: "8px",
                boxShadow: "inset 0 2px 0 rgba(0,0,0,0.5), 0 4px 0 #78350f",
              }}
            >
              <FramedAvatar
                src={
                  (character as any).avatarId
                    ? getDungeonIcon((character as any).avatarId)
                    : `/assets/ui/chat/classIcons/${character.class.toLowerCase()}.png`
                }
                alt={character.name}
                frame={(character as any).avatarFrame || "default"}
                size="large"
                onClick={() => setShowAvatarChooser(true)}
                className="hover:opacity-80 transition cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {equippedTitle && equippedTitle.iconId && (
                    <img
                      src={getTitleIcon(equippedTitle.iconId)!}
                      alt={equippedTitle.title}
                      className="w-5 h-5"
                      style={{ imageRendering: "pixelated" }}
                      title={equippedTitle.title}
                      onError={(e) => {
                        console.error(
                          "Failed to load title icon in stats modal:",
                          getTitleIcon(equippedTitle.iconId)
                        );
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <h3
                    className="text-2xl font-bold text-white"
                    style={{
                      fontFamily: "monospace",
                      textShadow:
                        "2px 2px 0 #000, 0 0 10px rgba(255,255,255,0.3)",
                    }}
                  >
                    {character.name}
                  </h3>
                </div>
                <p
                  className="text-amber-400 font-bold text-sm"
                  style={{
                    fontFamily: "monospace",
                    textShadow: "1px 1px 0 #000",
                  }}
                >
                  Lv.{character.level} {character.class}
                </p>
                <p
                  className="text-xs text-gray-300 font-bold"
                  style={{ fontFamily: "monospace" }}
                >
                  CP: {character.combatPower}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTitleChooser(true);
                }}
                className="px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold transition border-2 border-purple-900 self-start"
                style={{
                  borderRadius: "0",
                  boxShadow:
                    "0 3px 0 #581c87, inset 0 1px 0 rgba(255,255,255,0.2)",
                  fontFamily: "monospace",
                }}
                title="Choose Title"
              >
                <img
                  src={titleIcon}
                  alt="Title"
                  className="w-5 h-5"
                  style={{ imageRendering: "pixelated" }}
                />
              </button>
            </div>

            {/* Experience Bar */}
            <div
              className="mb-6 bg-stone-950 border-2 border-purple-700 p-3"
              style={{ borderRadius: "8px" }}
            >
              <div
                className="flex justify-between text-sm font-bold mb-2"
                style={{ fontFamily: "monospace" }}
              >
                <span
                  className="text-purple-400"
                  style={{ textShadow: "1px 1px 0 #000" }}
                >
                  EXPERIENCE
                </span>
                <span
                  className="text-purple-300"
                  style={{ textShadow: "1px 1px 0 #000" }}
                >
                  {character.experience} / {character.level * 100}
                </span>
              </div>
              <div
                className="w-full bg-stone-900 h-4 border-2 border-purple-900"
                style={{
                  borderRadius: "0",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
                }}
              >
                <div
                  className="bg-gradient-to-r from-purple-600 to-purple-400 h-full transition-all"
                  style={{
                    width: `${
                      (character.experience / (character.level * 100)) * 100
                    }%`,
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.3), 0 0 10px rgba(168, 85, 247, 0.5)",
                  }}
                />
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - Equipment Grid */}
              <div>
                <h3
                  className="text-lg font-bold text-amber-400 mb-3"
                  style={{
                    fontFamily: "monospace",
                    textShadow: "1px 1px 0 #000",
                  }}
                >
                  Equipment
                </h3>
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: "repeat(3, 85px)",
                    gridTemplateRows: "repeat(3, 85px)",
                    justifyContent: "center",
                  }}
                >
                  {/* Row 1 */}
                  {[
                    ["earring", getSlotItem("earring"), "Earring"],
                    ["helmet", getSlotItem("helmet"), "Helmet"],
                    ["necklace", getSlotItem("necklace"), "Necklace"],
                  ].map(([slot, item, label]) => {
                    const itemSlot = getEquippedItemData(slot as string);
                    return (
                      <div
                        key={slot as string}
                        onClick={() =>
                          item && itemSlot && setSelectedItemDetails(itemSlot)
                        }
                        className={`relative aspect-square bg-stone-900 border-2 cursor-pointer transition ${
                          item
                            ? getRarityBorder((item as any).rarity) +
                              " hover:border-amber-500"
                            : "border-stone-700"
                        }`}
                        style={{ boxShadow: "0 2px 0 rgba(0,0,0,0.3)" }}
                      >
                        {item ? (
                          <div className="absolute inset-0 flex items-center justify-center p-2">
                            <div className="relative w-full h-full">
                              {(() => {
                                const imgSrc = getItemImage(
                                  (item as any).spriteId,
                                  (item as any).type
                                );
                                return imgSrc ? (
                                  <img
                                    src={imgSrc}
                                    alt={(item as any).name}
                                    className="w-full h-full object-contain"
                                    style={{ imageRendering: "pixelated" }}
                                  />
                                ) : (
                                  <div
                                    className="flex items-center justify-center w-full h-full text-xs text-gray-500 text-center p-1"
                                    style={{ fontFamily: "monospace" }}
                                  >
                                    {(item as any).name}
                                  </div>
                                );
                              })()}
                              {itemSlot?.enhancementLevel > 0 && (
                                <div
                                  className="absolute top-0 right-0 bg-amber-600 text-white text-xs font-bold px-1.5 py-0.5 border-2 border-amber-800"
                                  style={{ fontFamily: "monospace" }}
                                >
                                  +{itemSlot.enhancementLevel}
                                </div>
                              )}
                              {itemSlot?.socketSlots > 0 && (
                                <div className="absolute bottom-0 right-0 flex gap-0.5 bg-black/50 px-1">
                                  {Array.from({
                                    length: itemSlot.socketSlots,
                                  }).map((_, i) => (
                                    <Circle
                                      key={i}
                                      size={6}
                                      className={
                                        itemSlot.socketedGems[i]
                                          ? "fill-green-400 text-green-400"
                                          : "fill-stone-600 text-stone-600"
                                      }
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                            <p
                              className="text-xs font-bold"
                              style={{ fontFamily: "monospace" }}
                            >
                              {label as string}
                            </p>
                            <p className="text-[10px] text-gray-700 mt-1">
                              Empty
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Row 2 */}
                  {[
                    ["weapon", getSlotItem("weapon"), "Weapon"],
                    ["armor", getSlotItem("armor"), "Armor"],
                    ["gloves", getSlotItem("gloves"), "Gloves"],
                  ].map(([slot, item, label]) => {
                    const itemSlot = getEquippedItemData(slot as string);
                    return (
                      <div
                        key={slot as string}
                        onClick={() =>
                          item && itemSlot && setSelectedItemDetails(itemSlot)
                        }
                        className={`relative aspect-square bg-stone-900 border-2 cursor-pointer transition ${
                          item
                            ? getRarityBorder((item as any).rarity) +
                              " hover:border-amber-500"
                            : "border-stone-700"
                        }`}
                        style={{ boxShadow: "0 2px 0 rgba(0,0,0,0.3)" }}
                      >
                        {item ? (
                          <div className="absolute inset-0 flex items-center justify-center p-2">
                            <div className="relative w-full h-full">
                              {(() => {
                                const imgSrc = getItemImage(
                                  (item as any).spriteId,
                                  (item as any).type
                                );
                                return imgSrc ? (
                                  <img
                                    src={imgSrc}
                                    alt={(item as any).name}
                                    className="w-full h-full object-contain"
                                    style={{ imageRendering: "pixelated" }}
                                  />
                                ) : (
                                  <div
                                    className="flex items-center justify-center w-full h-full text-xs text-gray-500 text-center p-1"
                                    style={{ fontFamily: "monospace" }}
                                  >
                                    {(item as any).name}
                                  </div>
                                );
                              })()}
                              {itemSlot?.enhancementLevel > 0 && (
                                <div
                                  className="absolute top-0 right-0 bg-amber-600 text-white text-xs font-bold px-1.5 py-0.5 border-2 border-amber-800"
                                  style={{ fontFamily: "monospace" }}
                                >
                                  +{itemSlot.enhancementLevel}
                                </div>
                              )}
                              {itemSlot?.socketSlots > 0 && (
                                <div className="absolute bottom-0 right-0 flex gap-0.5 bg-black/50 px-1">
                                  {Array.from({
                                    length: itemSlot.socketSlots,
                                  }).map((_, i) => (
                                    <Circle
                                      key={i}
                                      size={6}
                                      className={
                                        itemSlot.socketedGems[i]
                                          ? "fill-green-400 text-green-400"
                                          : "fill-stone-600 text-stone-600"
                                      }
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                            <p
                              className="text-xs font-bold"
                              style={{ fontFamily: "monospace" }}
                            >
                              {label as string}
                            </p>
                            <p className="text-[10px] text-gray-700 mt-1">
                              Empty
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Row 3 */}
                  {[
                    ["ring", getSlotItem("ring"), "Ring"],
                    ["shoes", getSlotItem("shoes"), "Shoes"],
                    ["belt", getSlotItem("belt"), "Belt"],
                  ].map(([slot, item, label]) => {
                    const itemSlot = getEquippedItemData(slot as string);
                    return (
                      <div
                        key={slot as string}
                        onClick={() =>
                          item && itemSlot && setSelectedItemDetails(itemSlot)
                        }
                        className={`relative aspect-square bg-stone-900 border-2 cursor-pointer transition ${
                          item
                            ? getRarityBorder((item as any).rarity) +
                              " hover:border-amber-500"
                            : "border-stone-700"
                        }`}
                        style={{ boxShadow: "0 2px 0 rgba(0,0,0,0.3)" }}
                      >
                        {item ? (
                          <div className="absolute inset-0 flex items-center justify-center p-2">
                            <div className="relative w-full h-full">
                              {(() => {
                                const imgSrc = getItemImage(
                                  (item as any).spriteId,
                                  (item as any).type
                                );
                                return imgSrc ? (
                                  <img
                                    src={imgSrc}
                                    alt={(item as any).name}
                                    className="w-full h-full object-contain"
                                    style={{ imageRendering: "pixelated" }}
                                  />
                                ) : (
                                  <div
                                    className="flex items-center justify-center w-full h-full text-xs text-gray-500 text-center p-1"
                                    style={{ fontFamily: "monospace" }}
                                  >
                                    {(item as any).name}
                                  </div>
                                );
                              })()}
                              {itemSlot?.enhancementLevel > 0 && (
                                <div
                                  className="absolute top-0 right-0 bg-amber-600 text-white text-xs font-bold px-1.5 py-0.5 border-2 border-amber-800"
                                  style={{ fontFamily: "monospace" }}
                                >
                                  +{itemSlot.enhancementLevel}
                                </div>
                              )}
                              {itemSlot?.socketSlots > 0 && (
                                <div className="absolute bottom-0 right-0 flex gap-0.5 bg-black/50 px-1">
                                  {Array.from({
                                    length: itemSlot.socketSlots,
                                  }).map((_, i) => (
                                    <Circle
                                      key={i}
                                      size={6}
                                      className={
                                        itemSlot.socketedGems[i]
                                          ? "fill-green-400 text-green-400"
                                          : "fill-stone-600 text-stone-600"
                                      }
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                            <p
                              className="text-xs font-bold"
                              style={{ fontFamily: "monospace" }}
                            >
                              {label as string}
                            </p>
                            <p className="text-[10px] text-gray-700 mt-1">
                              Empty
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Side - Stats */}
              <div>
                <h3
                  className="text-lg font-bold text-amber-400 mb-3"
                  style={{
                    fontFamily: "monospace",
                    textShadow: "1px 1px 0 #000",
                  }}
                >
                  Character Stats
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="bg-stone-900 border-2 border-stone-700 p-3 flex items-center gap-2"
                    style={{ borderRadius: "8px" }}
                  >
                    <img
                      src={hpIconCP}
                      alt="HP"
                      className="w-8 h-8"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <div>
                      <p
                        className="text-[10px] text-gray-400"
                        style={{ fontFamily: "monospace" }}
                      >
                        Health
                      </p>
                      <p
                        className="text-lg font-bold text-red-400"
                        style={{ fontFamily: "monospace" }}
                      >
                        {character.maxHealth}
                      </p>
                    </div>
                  </div>
                  <div
                    className="bg-stone-900 border-2 border-stone-700 p-3 flex items-center gap-2"
                    style={{ borderRadius: "8px" }}
                  >
                    <img
                      src={attackIconCP}
                      alt="Attack"
                      className="w-8 h-8"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <div>
                      <p
                        className="text-[10px] text-gray-400"
                        style={{ fontFamily: "monospace" }}
                      >
                        Attack
                      </p>
                      <p
                        className="text-lg font-bold text-orange-400"
                        style={{ fontFamily: "monospace" }}
                      >
                        {character.attack}
                      </p>
                    </div>
                  </div>
                  <div
                    className="bg-stone-900 border-2 border-stone-700 p-3 flex items-center gap-2"
                    style={{ borderRadius: "8px" }}
                  >
                    <img
                      src={defenseIconCP}
                      alt="Defense"
                      className="w-8 h-8"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <div>
                      <p
                        className="text-[10px] text-gray-400"
                        style={{ fontFamily: "monospace" }}
                      >
                        Defense
                      </p>
                      <p
                        className="text-lg font-bold text-blue-400"
                        style={{ fontFamily: "monospace" }}
                      >
                        {character.defense}
                      </p>
                    </div>
                  </div>
                  <div
                    className="bg-stone-900 border-2 border-stone-700 p-3 flex items-center gap-2"
                    style={{ borderRadius: "8px" }}
                  >
                    <img
                      src={speedIconCP}
                      alt="Speed"
                      className="w-8 h-8"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <div>
                      <p
                        className="text-[10px] text-gray-400"
                        style={{ fontFamily: "monospace" }}
                      >
                        Speed
                      </p>
                      <p
                        className="text-lg font-bold text-green-400"
                        style={{ fontFamily: "monospace" }}
                      >
                        {character.speed}
                      </p>
                    </div>
                  </div>
                  <div
                    className="bg-stone-900 border-2 border-stone-700 p-3 flex items-center gap-2 col-span-2"
                    style={{ borderRadius: "8px" }}
                  >
                    <img
                      src={cpIconCP}
                      alt="CP"
                      className="w-8 h-8"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <div>
                      <p
                        className="text-[10px] text-gray-400"
                        style={{ fontFamily: "monospace" }}
                      >
                        Combat Power
                      </p>
                      <p
                        className="text-2xl font-bold text-amber-400"
                        style={{ fontFamily: "monospace" }}
                      >
                        {character.combatPower}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Details Modal */}
      {selectedItemDetails && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
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
                      style={{ imageRendering: "pixelated" }}
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
                  Enhancement Bonus
                </h4>
                <div className="space-y-1 text-sm">
                  {selectedItemDetails.item.attackBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Attack:</span>
                      <span className="text-amber-400">
                        +
                        {Math.floor(
                          selectedItemDetails.item.attackBonus *
                            selectedItemDetails.enhancementLevel *
                            0.1
                        )}
                      </span>
                    </div>
                  )}
                  {selectedItemDetails.item.defenseBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Defense:</span>
                      <span className="text-amber-400">
                        +
                        {Math.floor(
                          selectedItemDetails.item.defenseBonus *
                            selectedItemDetails.enhancementLevel *
                            0.1
                        )}
                      </span>
                    </div>
                  )}
                  {selectedItemDetails.item.healthBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Health:</span>
                      <span className="text-amber-400">
                        +
                        {Math.floor(
                          selectedItemDetails.item.healthBonus *
                            selectedItemDetails.enhancementLevel *
                            0.1
                        )}
                      </span>
                    </div>
                  )}
                  {selectedItemDetails.item.speedBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Speed:</span>
                      <span className="text-amber-400">
                        +
                        {Math.floor(
                          selectedItemDetails.item.speedBonus *
                            selectedItemDetails.enhancementLevel *
                            0.1
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sockets */}
            {selectedItemDetails.socketSlots > 0 && (
              <div className="bg-stone-800 p-3 rounded">
                <h4 className="text-sm font-bold text-green-400 mb-2">
                  Sockets ({selectedItemDetails.socketedGems.length}/
                  {selectedItemDetails.socketSlots})
                </h4>
                <div className="space-y-2">
                  {Array.from({ length: selectedItemDetails.socketSlots }).map(
                    (_, index) => {
                      const gemId = selectedItemDetails.socketedGems[index];
                      const gem = gemId ? getGemDetails(gemId) : null;
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-stone-900 p-2 rounded"
                        >
                          {gem ? (
                            <>
                              {getItemImage(gem.spriteId, gem.type) && (
                                <img
                                  src={getItemImage(gem.spriteId, gem.type)!}
                                  alt={gem.name}
                                  className="w-8 h-8 object-contain"
                                  style={{ imageRendering: "pixelated" }}
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
                                <div className="flex gap-2 text-xs">
                                  {gem.attackBonus > 0 && (
                                    <span className="text-red-400">
                                      +{gem.attackBonus} ATK
                                    </span>
                                  )}
                                  {gem.defenseBonus > 0 && (
                                    <span className="text-blue-400">
                                      +{gem.defenseBonus} DEF
                                    </span>
                                  )}
                                  {gem.healthBonus > 0 && (
                                    <span className="text-green-400">
                                      +{gem.healthBonus} HP
                                    </span>
                                  )}
                                  {gem.speedBonus > 0 && (
                                    <span className="text-purple-400">
                                      +{gem.speedBonus} SPD
                                    </span>
                                  )}
                                </div>
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
          </div>
        </div>
      )}

      {/* Title Chooser Modal */}
      {showTitleChooser && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-4"
          onClick={() => setShowTitleChooser(false)}
        >
          <div
            className="bg-stone-800 border-4 border-purple-600 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            style={{
              borderRadius: "0",
              boxShadow:
                "0 8px 0 #581c87, 0 16px 0 rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-purple-600">
              <div className="flex items-center gap-3">
                <img
                  src={titleIcon}
                  alt="Title"
                  className="w-8 h-8"
                  style={{ imageRendering: "pixelated" }}
                />
                <h2
                  className="text-3xl font-bold text-purple-400"
                  style={{
                    fontFamily: "monospace",
                    textShadow:
                      "2px 2px 0 #000, 0 0 10px rgba(168, 85, 247, 0.5)",
                  }}
                >
                  CHOOSE TITLE
                </h2>
              </div>
              <button
                onClick={() => setShowTitleChooser(false)}
                className="text-purple-400 hover:text-purple-300 transition"
              >
                <X size={28} strokeWidth={3} />
              </button>
            </div>

            <p
              className="text-sm text-gray-300 mb-6 font-bold"
              style={{ fontFamily: "monospace", textShadow: "1px 1px 0 #000" }}
            >
              ► Select a title from your completed achievements to display on
              your profile.
            </p>

            {equippedTitle && (
              <div
                className="mb-6 p-4 bg-purple-950/50 border-2 border-purple-500"
                style={{
                  borderRadius: "0",
                  boxShadow:
                    "0 4px 0 #7c3aed, inset 0 2px 0 rgba(168, 85, 247, 0.2)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-stone-950 border-2 border-stone-700">
                      {equippedTitle.iconId ? (
                        <img
                          src={getTitleIcon(equippedTitle.iconId)!}
                          alt={equippedTitle.title}
                          className="w-10 h-10"
                          style={{ imageRendering: "pixelated" }}
                          onError={(e) => {
                            console.error(
                              "Failed to load equipped title icon:",
                              getTitleIcon(equippedTitle.iconId)
                            );
                            (e.target as HTMLImageElement).style.display =
                              "none";
                            const parent = (e.target as HTMLImageElement)
                              .parentElement;
                            if (parent)
                              parent.innerHTML =
                                '<span class="text-xl">🏆</span>';
                          }}
                        />
                      ) : (
                        <span className="text-xl">🏆</span>
                      )}
                    </div>
                    <div>
                      <p
                        className="text-xs text-purple-300 font-bold mb-1"
                        style={{
                          fontFamily: "monospace",
                          textShadow: "1px 1px 0 #000",
                        }}
                      >
                        CURRENTLY EQUIPPED:
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          equippedTitle.titleColor &&
                          !equippedTitle.titleColor.includes("black") &&
                          !equippedTitle.titleColor.includes("#000")
                            ? equippedTitle.titleColor.startsWith("text-")
                              ? equippedTitle.titleColor
                              : ""
                            : "text-amber-400"
                        }`}
                        style={{
                          fontFamily: "monospace",
                          textShadow: "2px 2px 0 #000",
                          color:
                            equippedTitle.titleColor &&
                            !equippedTitle.titleColor.startsWith("text-") &&
                            !equippedTitle.titleColor.includes("black") &&
                            equippedTitle.titleColor !== "#000000"
                              ? equippedTitle.titleColor
                              : undefined,
                        }}
                      >
                        「{equippedTitle.title}」
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => unequipTitleMutation.mutate()}
                    disabled={unequipTitleMutation.isPending}
                    className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:bg-gray-600 text-white font-bold text-sm transition border-2 border-red-900"
                    style={{
                      borderRadius: "0",
                      boxShadow: "0 3px 0 #7f1d1d",
                      fontFamily: "monospace",
                    }}
                  >
                    {unequipTitleMutation.isPending ? "REMOVING..." : "REMOVE"}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {availableTitles.length === 0 ? (
                <div
                  className="text-center py-12 bg-stone-900 border-2 border-stone-700"
                  style={{ borderRadius: "0" }}
                >
                  <img
                    src={titleIcon}
                    alt="Title"
                    className="w-16 h-16 mx-auto mb-4 opacity-50"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <p
                    className="text-gray-300 font-bold text-lg mb-2"
                    style={{
                      fontFamily: "monospace",
                      textShadow: "1px 1px 0 #000",
                    }}
                  >
                    NO TITLES AVAILABLE
                  </p>
                  <p
                    className="text-sm text-gray-500 font-bold"
                    style={{ fontFamily: "monospace" }}
                  >
                    Complete achievements to unlock titles!
                  </p>
                </div>
              ) : (
                availableTitles.map((achievement: any) => {
                  return (
                    <div
                      key={achievement.id}
                      className={`p-4 border-2 transition cursor-pointer ${
                        achievement.isEquipped
                          ? "bg-purple-900/50 border-purple-500"
                          : "bg-stone-900 border-stone-700 hover:border-purple-500 hover:bg-stone-800"
                      }`}
                      style={{
                        borderRadius: "0",
                        boxShadow: achievement.isEquipped
                          ? "0 3px 0 #7c3aed, inset 0 1px 0 rgba(168, 85, 247, 0.2)"
                          : "0 2px 0 rgba(0,0,0,0.3)",
                      }}
                      onClick={() =>
                        !achievement.isEquipped &&
                        equipTitleMutation.mutate(achievement.id)
                      }
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 flex items-center justify-center bg-stone-950 border-2 border-stone-700">
                          {achievement.iconId ? (
                            <img
                              src={getTitleIcon(achievement.iconId)!}
                              alt={achievement.title}
                              className="w-12 h-12"
                              style={{ imageRendering: "pixelated" }}
                              onError={(e) => {
                                console.error(
                                  "Failed to load icon:",
                                  getTitleIcon(achievement.iconId)
                                );
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                                const parent = (e.target as HTMLImageElement)
                                  .parentElement;
                                if (parent)
                                  parent.innerHTML =
                                    '<span class="text-2xl">🏆</span>';
                              }}
                            />
                          ) : (
                            <span className="text-2xl">🏆</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-lg font-bold mb-1 ${
                              achievement.titleColor &&
                              !achievement.titleColor.includes("black") &&
                              !achievement.titleColor.includes("#000")
                                ? achievement.titleColor.startsWith("text-")
                                  ? achievement.titleColor
                                  : ""
                                : "text-amber-400"
                            }`}
                            style={{
                              fontFamily: "monospace",
                              textShadow: "2px 2px 0 #000",
                              color:
                                achievement.titleColor &&
                                !achievement.titleColor.startsWith("text-") &&
                                !achievement.titleColor.includes("black") &&
                                achievement.titleColor !== "#000000"
                                  ? achievement.titleColor
                                  : undefined,
                            }}
                          >
                            「{achievement.title}」
                          </p>
                          <p
                            className="text-xs text-gray-300 font-bold"
                            style={{ fontFamily: "monospace" }}
                          >
                            {achievement.name}
                          </p>
                        </div>
                        {achievement.isEquipped && (
                          <div
                            className="text-purple-400 text-sm font-bold px-3 py-1 bg-purple-950 border-2 border-purple-600"
                            style={{
                              fontFamily: "monospace",
                              textShadow: "1px 1px 0 #000",
                            }}
                          >
                            ✓ EQUIPPED
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Avatar Chooser Modal */}
      {showAvatarChooser && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-4"
          onClick={() => setShowAvatarChooser(false)}
        >
          <div
            className="bg-stone-800 border-4 border-amber-600 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            style={{ borderRadius: "0", boxShadow: "0 8px 0 rgba(0,0,0,0.5)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-amber-600">
              <h2
                className="text-3xl font-bold text-amber-400"
                style={{
                  fontFamily: "monospace",
                  textShadow:
                    "2px 2px 0 #000, 0 0 10px rgba(251, 191, 36, 0.5)",
                }}
              >
                CHOOSE AVATAR
              </h2>
              <button
                onClick={() => setShowAvatarChooser(false)}
                className="text-amber-400 hover:text-amber-300 transition"
              >
                <X size={28} strokeWidth={3} />
              </button>
            </div>

            <p
              className="text-gray-300 text-sm mb-6"
              style={{ fontFamily: "monospace" }}
            >
              Select your chat avatar. Unlock more by completing dungeons for
              the first time!
            </p>

            {/* Avatar Frames Section */}
            <div className="mb-6 pb-6 border-b-2 border-stone-700">
              <h3
                className="text-xl font-bold text-amber-400 mb-3"
                style={{
                  fontFamily: "monospace",
                  textShadow: "2px 2px 0 #000",
                }}
              >
                AVATAR FRAMES
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {["default", "bronze", "silver", "gold", "event_halloween"].map(
                  (frame) => {
                    const isSelected = (character as any).avatarFrame === frame;
                    const isUnlocked =
                      frameData?.unlockedFrames?.includes(frame);

                    return (
                      <button
                        key={frame}
                        onClick={() =>
                          isUnlocked && setFrameMutation.mutate(frame)
                        }
                        disabled={!isUnlocked || setFrameMutation.isPending}
                        className={`relative aspect-square bg-stone-900 border-2 ${
                          isSelected
                            ? "border-amber-500"
                            : isUnlocked
                            ? "border-stone-700 hover:border-amber-500"
                            : "border-stone-800"
                        } transition p-1 disabled:cursor-not-allowed`}
                        style={{
                          borderRadius: "0",
                          boxShadow: isSelected
                            ? "0 3px 0 #d97706"
                            : "0 2px 0 rgba(0,0,0,0.3)",
                          opacity: isUnlocked ? 1 : 0.4,
                        }}
                        title={frame.replace("_", " ").toUpperCase()}
                      >
                        <img
                          src={`/assets/ui/avatar_frames/48x48/${frame}.png`}
                          alt={frame}
                          className="w-full h-full object-contain"
                          style={{ imageRendering: "pixelated" }}
                        />
                        {isSelected && (
                          <div
                            className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs font-bold px-2 py-1"
                            style={{ fontFamily: "monospace" }}
                          >
                            ✓
                          </div>
                        )}
                        {!isUnlocked && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <img
                              src={lockedIcon}
                              alt="Locked"
                              className="w-6 h-6"
                              style={{ imageRendering: "pixelated" }}
                            />
                          </div>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <h3
              className="text-xl font-bold text-amber-400 mb-3"
              style={{ fontFamily: "monospace", textShadow: "2px 2px 0 #000" }}
            >
              AVATAR ICONS
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {/* Default Class Icon */}
              <button
                onClick={() => setAvatarMutation.mutate(null)}
                disabled={setAvatarMutation.isPending}
                className={`relative aspect-square bg-stone-900 border-2 ${
                  !(character as any).avatarId
                    ? "border-amber-500"
                    : "border-stone-700 hover:border-amber-500"
                } transition p-2 disabled:opacity-50`}
                style={{
                  borderRadius: "0",
                  boxShadow: !(character as any).avatarId
                    ? "0 3px 0 #d97706"
                    : "0 2px 0 rgba(0,0,0,0.3)",
                }}
              >
                <img
                  src={`/assets/ui/chat/classIcons/${character.class.toLowerCase()}.png`}
                  alt={character.class}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: "pixelated" }}
                />
                {!(character as any).avatarId && (
                  <div
                    className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs font-bold px-2 py-1"
                    style={{ fontFamily: "monospace" }}
                  >
                    ✓
                  </div>
                )}
                <p
                  className="text-xs text-gray-400 mt-2 text-center"
                  style={{ fontFamily: "monospace" }}
                >
                  Default
                </p>
              </button>

              {/* All dungeon avatars */}
              {allDungeons &&
                allDungeons.map((dungeon: any) => {
                  const isUnlocked = avatarData?.unlockedAvatars?.includes(
                    dungeon.id
                  );
                  const isSelected = (character as any).avatarId === dungeon.id;

                  return (
                    <div key={dungeon.id} className="flex flex-col">
                      <button
                        onClick={() =>
                          isUnlocked && setAvatarMutation.mutate(dungeon.id)
                        }
                        disabled={!isUnlocked || setAvatarMutation.isPending}
                        className={`relative aspect-square bg-stone-900 border-2 ${
                          isSelected
                            ? "border-amber-500"
                            : isUnlocked
                            ? "border-stone-700 hover:border-amber-500"
                            : "border-stone-800"
                        } transition p-2 disabled:cursor-not-allowed`}
                        style={{
                          borderRadius: "0",
                          boxShadow: isSelected
                            ? "0 3px 0 #d97706"
                            : "0 2px 0 rgba(0,0,0,0.3)",
                          opacity: isUnlocked ? 1 : 0.5,
                        }}
                        title={
                          isUnlocked
                            ? dungeon.name
                            : `Complete ${dungeon.name} to unlock`
                        }
                      >
                        {isUnlocked ? (
                          <img
                            src={getDungeonIconByName(dungeon.name)}
                            alt={dungeon.name}
                            className="w-full h-full object-cover"
                            style={{ imageRendering: "pixelated" }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <img
                              src={lockedIcon}
                              alt="Locked"
                              className="w-8 h-8"
                              style={{ imageRendering: "pixelated" }}
                            />
                          </div>
                        )}
                        {isSelected && (
                          <div
                            className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs font-bold px-2 py-1"
                            style={{ fontFamily: "monospace" }}
                          >
                            ✓
                          </div>
                        )}
                      </button>
                      <p
                        className="text-[10px] text-gray-400 mt-1 text-center leading-tight"
                        style={{ fontFamily: "monospace" }}
                      >
                        {dungeon.name}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
