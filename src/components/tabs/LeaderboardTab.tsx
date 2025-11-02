import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { leaderboardApi, dungeonApi } from "@/lib/api";
import { Swords, Users, Trophy } from "lucide-react";
import leaderboardIcon from "@/assets/ui/leaderboard.png";
import ratCellarIcon from "@/assets/ui/dungeonIcons/ratCellar.png";
import goblinCaveIcon from "@/assets/ui/dungeonIcons/goblinCave.png";
import slimeDenIcon from "@/assets/ui/dungeonIcons/slimeDen.png";
import dragonLairIcon from "@/assets/ui/dungeonIcons/dragonLair.png";
import darkForestIcon from "@/assets/ui/dungeonIcons/darkForest.png";
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

export default function LeaderboardTab() {
  const [activeBoard, setActiveBoard] = useState<"level" | "combat" | "guilds">(
    "level"
  );

  const { data: levelBoard, isLoading: levelLoading } = useQuery({
    queryKey: ["leaderboard", "level"],
    queryFn: async () => {
      const { data } = await leaderboardApi.getByLevel(100);
      return data;
    },
    enabled: activeBoard === "level",
  });

  const { data: combatBoard, isLoading: combatLoading } = useQuery({
    queryKey: ["leaderboard", "combat"],
    queryFn: async () => {
      const { data } = await leaderboardApi.getByCP(100);
      return data;
    },
    enabled: activeBoard === "combat",
  });

  const { data: guildBoard, isLoading: guildLoading } = useQuery({
    queryKey: ["leaderboard", "guilds"],
    queryFn: async () => {
      const { data } = await leaderboardApi.getGuilds(50);
      return data;
    },
    enabled: activeBoard === "guilds",
  });

  // Fetch all dungeons for avatar icon mapping
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

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-400";
    if (rank === 2) return "text-gray-300";
    if (rank === 3) return "text-amber-600";
    return "text-gray-400";
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const isLoading = levelLoading || combatLoading || guildLoading;
  const rawData =
    activeBoard === "level"
      ? levelBoard
      : activeBoard === "combat"
      ? combatBoard
      : guildBoard;

  // Always filter out admins from leaderboard
  const currentData = useMemo(() => {
    if (!rawData || activeBoard === "guilds") return rawData;

    // Filter out admin users
    const filtered = rawData.filter((entry: any) => !entry.isAdmin);
    // Re-rank the filtered results
    return filtered.map((entry: any, index: number) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [rawData, activeBoard]);

  return (
    <div className="p-3 pb-20">
      <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <img
          src={leaderboardIcon}
          alt="Leaderboard"
          className="w-5 h-5"
          style={{ imageRendering: "pixelated" }}
        />
        Leaderboard
      </h2>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveBoard("level")}
          className={`flex-1 py-2 font-bold transition relative overflow-hidden ${
            activeBoard === "level"
              ? "bg-amber-700 text-white"
              : "bg-stone-800 text-gray-400 hover:bg-stone-700"
          }`}
          style={{
            border: "2px solid #92400e",
            borderRadius: "0",
            boxShadow:
              activeBoard === "level"
                ? "0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)"
                : "none",
            textShadow: activeBoard === "level" ? "1px 1px 0 #000" : "none",
            fontFamily: "monospace",
          }}
        >
          <Trophy size={16} className="inline mr-1" />
          Level
        </button>
        <button
          onClick={() => setActiveBoard("combat")}
          className={`flex-1 py-2 font-bold transition relative overflow-hidden ${
            activeBoard === "combat"
              ? "bg-red-700 text-white"
              : "bg-stone-800 text-gray-400 hover:bg-stone-700"
          }`}
          style={{
            border: "2px solid #7f1d1d",
            borderRadius: "0",
            boxShadow:
              activeBoard === "combat"
                ? "0 2px 0 #991b1b, inset 0 1px 0 rgba(255,255,255,0.2)"
                : "none",
            textShadow: activeBoard === "combat" ? "1px 1px 0 #000" : "none",
            fontFamily: "monospace",
          }}
        >
          <Swords size={16} className="inline mr-1" />
          Combat
        </button>
        <button
          onClick={() => setActiveBoard("guilds")}
          className={`flex-1 py-2 font-bold transition relative overflow-hidden ${
            activeBoard === "guilds"
              ? "bg-purple-700 text-white"
              : "bg-stone-800 text-gray-400 hover:bg-stone-700"
          }`}
          style={{
            border: "2px solid #6b21a8",
            borderRadius: "0",
            boxShadow:
              activeBoard === "guilds"
                ? "0 2px 0 #7e22ce, inset 0 1px 0 rgba(255,255,255,0.2)"
                : "none",
            textShadow: activeBoard === "guilds" ? "1px 1px 0 #000" : "none",
            fontFamily: "monospace",
          }}
        >
          <Users size={16} className="inline mr-1" />
          Guilds
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin text-4xl mb-2">⏳</div>
          <p className="text-gray-400">Loading leaderboard...</p>
        </div>
      )}

      {/* Leaderboard List */}
      {!isLoading && currentData && (
        <div className="space-y-2">
          {activeBoard !== "guilds"
            ? // Player Leaderboard
              currentData.map((entry: any) => (
                <div
                  key={entry.rank}
                  className={`p-3 bg-stone-800 border-2 ${
                    entry.rank <= 3 ? "border-amber-600" : "border-stone-700"
                  } flex items-center gap-3`}
                  style={{
                    borderRadius: "0",
                    boxShadow:
                      entry.rank <= 3 ? "0 2px 0 rgba(0,0,0,0.3)" : "none",
                  }}
                >
                  <div
                    className={`text-2xl font-bold ${getRankColor(
                      entry.rank
                    )} min-w-[50px]`}
                  >
                    {getRankEmoji(entry.rank)}
                  </div>
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-amber-500 overflow-hidden bg-stone-900">
                    {entry.avatarId ? (
                      <img
                        src={getDungeonIcon(entry.avatarId)}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        style={{ imageRendering: "pixelated" }}
                        onError={(e) => {
                          (
                            e.target as HTMLImageElement
                          ).src = `/assets/ui/chat/classIcons/${
                            entry.class?.toLowerCase() || "warrior"
                          }.png`;
                        }}
                      />
                    ) : (
                      <img
                        src={`/assets/ui/chat/classIcons/${
                          entry.class?.toLowerCase() || "warrior"
                        }.png`}
                        alt={entry.class}
                        className="w-6 h-6"
                        style={{ imageRendering: "pixelated" }}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white">
                      {entry.characterName}
                    </p>
                    <p className="text-xs text-gray-400">@{entry.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-amber-400 font-bold">
                      {activeBoard === "level"
                        ? `Lv.${entry.level}`
                        : `CP ${entry.combatPower}`}
                    </p>
                    <p className="text-xs text-gray-400">{entry.class}</p>
                  </div>
                </div>
              ))
            : // Guild Leaderboard
              currentData.map((entry: any) => (
                <div
                  key={entry.rank}
                  className={`p-3 bg-stone-800 border-2 ${
                    entry.rank <= 3 ? "border-purple-600" : "border-stone-700"
                  } flex items-center gap-3`}
                  style={{
                    borderRadius: "0",
                    boxShadow:
                      entry.rank <= 3 ? "0 2px 0 rgba(0,0,0,0.3)" : "none",
                  }}
                >
                  <div
                    className={`text-2xl font-bold ${getRankColor(
                      entry.rank
                    )} min-w-[50px]`}
                  >
                    {getRankEmoji(entry.rank)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white">{entry.name}</p>
                    <p className="text-xs text-gray-400">
                      {entry.memberCount}/{entry.maxMembers} members
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-purple-400 font-bold">
                      Lv.{entry.level}
                    </p>
                  </div>
                </div>
              ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && currentData && currentData.length === 0 && (
        <div className="text-center py-8">
          <Trophy size={48} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No entries yet. Be the first!</p>
        </div>
      )}
    </div>
  );
}
