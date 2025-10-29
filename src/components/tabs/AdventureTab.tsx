import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGameStore } from "@/store/gameStore";
import { dungeonApi, idleApi, authApi, characterApi } from "@/lib/api";
import { formatGold, getRarityColor, getDifficultyColor } from "@/utils/format";
import { Clock, Zap, Trophy } from "lucide-react";
import BossFight from "@/components/BossFight";
import dungeonsIcon from "@/assets/ui/dungeons.png";
import historyIcon from "@/assets/ui/history.png";
import idleFarmingIcon from "@/assets/ui/idleFarming.png";
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
    "The Ecliptic Throne": eclipticThroneIcon
  };
  return iconMap[dungeonName] || ratCellarIcon; // Default to rat cellar if not found
};

export default function AdventureTab() {
  const queryClient = useQueryClient();
  const { character, player, setPlayer } = useGameStore();
  const [view, setView] = useState<"dungeons" | "history">("dungeons");
  const [selectedDungeon, setSelectedDungeon] = useState<any>(null);
  const [showBossFight, setShowBossFight] = useState(false);
  const [activeDungeonRun, setActiveDungeonRun] = useState<any>(() => {
    // Restore from localStorage on mount
    const saved = localStorage.getItem("activeDungeonRun");
    return saved ? JSON.parse(saved) : null;
  });
  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    const saved = localStorage.getItem("activeDungeonRun");
    if (saved) {
      const run = JSON.parse(saved);
      // Use completesAt if available, otherwise calculate from startTime
      if (run.completesAt) {
        const completesAt = new Date(run.completesAt).getTime();
        const remaining = Math.max(0, Math.floor((completesAt - Date.now()) / 1000));
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

  const { data: dungeons } = useQuery({
    queryKey: ["dungeons"],
    queryFn: async () => {
      const { data } = await dungeonApi.getAll();
      return data;
    },
  });

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
        startTime: backendActiveDungeonRun.createdAt 
      };
      setActiveDungeonRun(runWithTime);
      localStorage.setItem("activeDungeonRun", JSON.stringify(runWithTime));
      
      const elapsed = Math.floor(
        (Date.now() - new Date(backendActiveDungeonRun.createdAt).getTime()) / 1000
      );
      const remaining = Math.max(0, backendActiveDungeonRun.dungeon.duration - elapsed);
      setTimeRemaining(remaining);
    } else if (!backendActiveDungeonRun && activeDungeonRun && !activeDungeonRun.completed) {
      // Backend doesn't have an active run but local state does
      // Check if the dungeon time has actually expired before completing
      const completesAt = new Date(activeDungeonRun.completesAt).getTime();
      const now = Date.now();
      const hasExpired = now >= completesAt;
      
      if (hasExpired) {
        // Time has expired, try to complete it
        dungeonApi.complete(activeDungeonRun.id)
          .then(({ data: result }) => {
            const completedRun = {
              ...activeDungeonRun,
              completed: true,
              result: result,
            };
            setActiveDungeonRun(completedRun);
            localStorage.setItem("activeDungeonRun", JSON.stringify(completedRun));
            queryClient.invalidateQueries({ queryKey: ["character"] });
            
            // Show notification
            (window as any).showToast?.(
              result.success ? 'Dungeon completed successfully!' : 'Dungeon failed!',
              result.success ? 'success' : 'error'
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

  const startIdleMutation = useMutation({
    mutationFn: (durationHours: number = 1) => idleApi.start(undefined, durationHours),
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
    onSuccess: () => {
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
      const actualTimeRemaining = Math.max(0, Math.floor((completesAt - now) / 1000));
      
      // Update state with actual time
      setTimeRemaining(actualTimeRemaining);
      
      // Only set up timers if there's time remaining
      if (actualTimeRemaining > 0) {
        const interval = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
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
            
            // Send browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Dungeon Complete!', {
                body: `${activeDungeonRun.dungeon.name} completed! ${result.data.success ? '✅ Victory!' : '❌ Defeated'}`,
                icon: '/icon.png',
                badge: '/icon.png',
              });
            }
            
            // Show toast
            (window as any).showToast?.(
              result.data.success ? 'Dungeon completed successfully!' : 'Dungeon failed!',
              result.data.success ? 'success' : 'error'
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
      setTimeRemaining(data.dungeon.duration);
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
            borderRadius: '12px',
            boxShadow: '0 4px 0 #92400e, 0 8px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img 
                src={getDungeonIcon(activeDungeonRun.dungeon.name)} 
                alt={activeDungeonRun.dungeon.name} 
                className="w-10 h-10 rounded border-2 border-amber-500" 
                style={{ imageRendering: 'pixelated' }}
              />
              <div>
                <p className="text-white font-bold text-lg" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
                  {activeDungeonRun.dungeon.name}
                </p>
                <p className="text-xs text-orange-200" style={{ fontFamily: 'monospace' }}>
                  {activeDungeonRun.mode} Mode - In Progress
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-amber-300" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
                {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, "0")}
              </div>
              <p className="text-xs text-orange-200" style={{ fontFamily: 'monospace' }}>Remaining</p>
            </div>
          </div>
          <div className="w-full bg-stone-900 h-3 overflow-hidden" style={{ borderRadius: '0', border: '2px solid #78350f' }}>
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-1000"
              style={{
                width: `${
                  ((activeDungeonRun.dungeon.duration - timeRemaining) /
                    activeDungeonRun.dungeon.duration) *
                  100
                }%`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
              }}
            />
          </div>
        </div>
      )}

      {/* Dungeon Complete Modal (only shows when completed) */}
      {activeDungeonRun?.completed && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setActiveDungeonRun(null)}
        >
          <div
            className="bg-stone-800 rounded-lg border-2 border-amber-600 p-8 max-w-md w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {activeDungeonRun.result?.success ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-green-400 mb-4">
                  Victory!
                </h2>
                <div className="bg-stone-900 rounded-lg p-4 mb-4">
                  <div className="space-y-2 text-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Gold:</span>
                      <span className="text-yellow-400 font-bold">
                        +{activeDungeonRun.result.goldEarned}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">EXP:</span>
                      <span className="text-purple-400 font-bold">
                        +{activeDungeonRun.result.expEarned}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Item Drops */}
                {activeDungeonRun.result.itemsDropped &&
                  activeDungeonRun.result.itemsDropped.length > 0 && (
                    <div className="bg-stone-900 rounded-lg p-4 mb-4">
                      <h3 className="text-sm font-bold text-gray-400 mb-2">
                        Items Dropped:
                      </h3>
                      <div className="space-y-1">
                        {activeDungeonRun.result.itemsDropped.map(
                          (item: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-white">📦 {item.name}</span>
                              <span className="text-gray-400">
                                x{item.quantity}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">😢</div>
                <h2 className="text-3xl font-bold text-red-400 mb-4">
                  Defeated!
                </h2>
                <p className="text-gray-400 mb-4">
                  Try again with better equipment or higher level!
                </p>
              </>
            )}
            <button
              onClick={() => {
                setActiveDungeonRun(null);
                localStorage.removeItem("activeDungeonRun");
              }}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded transition btn-press"
            >
              Continue
            </button>
          </div>
        </div>
      )}
      {/* Idle Status Banner */}
      {idleStatus?.active && (
        <div 
          className="mb-4 p-4 bg-gradient-to-b from-green-800 to-green-900 border-4 border-green-600"
          style={{
            borderRadius: '12px',
            boxShadow: '0 4px 0 #15803d, 0 8px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img 
                src={idleFarmingIcon} 
                alt="Idle Farming" 
                className="w-10 h-10 rounded border-2 border-green-500" 
                style={{ imageRendering: 'pixelated' }}
              />
              <div>
                <p className="text-white font-bold text-lg" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
                  Idle Farming Active
                </p>
                <p className="text-xs text-green-200" style={{ fontFamily: 'monospace' }}>
                  {idleStatus.canClaim ? "Ready to claim!" : "In Progress"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-300" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
                {idleStatus.canClaim 
                  ? "0:00"
                  : `${Math.floor(idleTimeRemaining / 60)}:${String(idleTimeRemaining % 60).padStart(2, "0")}`
                }
              </div>
              <p className="text-xs text-green-200" style={{ fontFamily: 'monospace' }}>Remaining</p>
            </div>
          </div>
          <div className="w-full bg-stone-900 h-3 overflow-hidden mb-3" style={{ borderRadius: '0', border: '2px solid #15803d' }}>
            <div
              className="bg-gradient-to-r from-green-500 to-lime-400 h-full transition-all duration-1000"
              style={{
                width: idleStatus.canClaim 
                  ? '100%' 
                  : `${((3600 - idleTimeRemaining) / 3600) * 100}%`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
              }}
            />
          </div>
          <button
            onClick={() => claimIdleMutation.mutate()}
            disabled={!idleStatus.canClaim || claimIdleMutation.isPending}
            className="w-full px-4 py-3 bg-green-700 hover:bg-green-600 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            style={{
              border: '3px solid #15803d',
              borderRadius: '0',
              boxShadow: '0 3px 0 #166534, inset 0 1px 0 rgba(255,255,255,0.2)',
              textShadow: '1px 1px 0 #000',
              fontFamily: 'monospace',
              letterSpacing: '1px'
            }}
          >
            <span className="relative z-10">{claimIdleMutation.isPending ? "CLAIMING..." : "CLAIM REWARDS"}</span>
            <div className="absolute inset-0 bg-gradient-to-b from-green-400/20 to-transparent"></div>
          </button>
        </div>
      )}

      {/* Start Idle Farming */}
      {!idleStatus?.active && (
        <div 
          className="mb-4 p-4 bg-gradient-to-b from-stone-800 to-stone-900 border-4 border-stone-600"
          style={{
            borderRadius: '12px',
            boxShadow: '0 4px 0 #57534e, 0 8px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.1)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💤</span>
            <p className="text-white font-bold text-lg" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
              Start Idle Farming
            </p>
          </div>
          <p className="text-sm text-gray-300 mb-3" style={{ fontFamily: 'monospace' }}>
            Let your character farm resources while you're away. Earn gold, exp, and items!
          </p>
          {character && character.level >= 10 ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => startIdleMutation.mutate(1)}
                disabled={startIdleMutation.isPending}
                className="px-4 py-3 bg-amber-700 hover:bg-amber-600 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                style={{
                  border: '3px solid #92400e',
                  borderRadius: '0',
                  boxShadow: '0 3px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)',
                  textShadow: '1px 1px 0 #000',
                  fontFamily: 'monospace',
                  letterSpacing: '1px'
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
                  border: '3px solid #581c87',
                  borderRadius: '0',
                  boxShadow: '0 3px 0 #7e22ce, inset 0 1px 0 rgba(255,255,255,0.2)',
                  textShadow: '1px 1px 0 #000',
                  fontFamily: 'monospace',
                  letterSpacing: '1px'
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
                border: '3px solid #92400e',
                borderRadius: '0',
                boxShadow: '0 3px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)',
                textShadow: '1px 1px 0 #000',
                fontFamily: 'monospace',
                letterSpacing: '1px'
              }}
            >
              <span className="relative z-10">
                {startIdleMutation.isPending ? "STARTING..." : "START IDLE FARMING (1 HOUR)"}
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
            border: '2px solid #92400e',
            borderRadius: '0',
            boxShadow: view === "dungeons" ? '0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: view === "dungeons" ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          <img src={dungeonsIcon} alt="Dungeons" className="w-5 h-5" style={{ imageRendering: 'pixelated' }} />
          <span className="relative z-10">Dungeons</span>
          {view === "dungeons" && <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>}
        </button>
        <button
          onClick={() => setView("history")}
          className={`flex-1 py-2 font-bold transition flex items-center justify-center gap-2 relative overflow-hidden ${
            view === "history"
              ? "bg-amber-700 text-white"
              : "bg-stone-800 text-gray-400 hover:bg-stone-700"
          }`}
          style={{
            border: '2px solid #92400e',
            borderRadius: '0',
            boxShadow: view === "history" ? '0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: view === "history" ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          <img src={historyIcon} alt="History" className="w-5 h-5" style={{ imageRendering: 'pixelated' }} />
          <span className="relative z-10">History</span>
          {view === "history" && <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>}
        </button>
      </div>

      {/* Dungeons List */}
      {view === "dungeons" && (
        <div className="space-y-3">
          {dungeons && dungeons.length > 0 ? (
            dungeons
              .filter((dungeon: any) => character && character.level >= dungeon.recommendedLevel)
              .map((dungeon: any) => (
              <div
                key={dungeon.id}
                className="p-4 bg-gradient-to-b from-stone-800 to-stone-900 border-4 border-stone-600 hover:border-amber-600 transition-all cursor-pointer active:translate-y-1"
                onClick={() => setSelectedDungeon(dungeon)}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 0 #57534e, 0 8px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.1)',
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <img 
                    src={getDungeonIcon(dungeon.name)} 
                    alt={dungeon.name} 
                    className="w-14 h-14 border-2 border-stone-500" 
                    style={{ imageRendering: 'pixelated', borderRadius: '8px' }}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white text-lg" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
                            {dungeon.name}
                          </h3>
                          <span 
                            className="text-xs font-bold px-2 py-0.5 bg-blue-600 text-white border-2 border-blue-800"
                            style={{ fontFamily: 'monospace' }}
                          >
                            Lv.{dungeon.recommendedLevel}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400" style={{ fontFamily: 'monospace' }}>{dungeon.zone.name}</p>
                      </div>
                      <span
                        className={`text-sm font-bold px-2 py-1 ${getDifficultyColor(dungeon.difficulty)}`}
                        style={{
                          fontFamily: 'monospace',
                          textShadow: '1px 1px 0 #000',
                          border: '2px solid rgba(0,0,0,0.3)',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(0,0,0,0.3)'
                        }}
                      >
                        {dungeon.difficulty}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div className="flex items-center gap-1 text-amber-400" style={{ fontFamily: 'monospace' }}>
                    <Trophy size={14} />
                    <span>{formatGold(dungeon.baseGoldReward)} Gold</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-400" style={{ fontFamily: 'monospace' }}>
                    <Zap size={14} />
                    <span>{dungeon.energyCost} Energy</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-400" style={{ fontFamily: 'monospace' }}>
                    <Clock size={14} />
                    <span>{Math.floor(dungeon.duration / 60)} min</span>
                  </div>
                  <div className="flex items-center gap-1 text-purple-400" style={{ fontFamily: 'monospace' }}>
                    <span>⚔️ CP: {dungeon.recommendedCP}</span>
                  </div>
                </div>

                {/* Loot Preview - Show class-specific items */}
                {character && dungeon.lootTable && (
                  <div className="border-t-2 border-stone-700 pt-2 mt-2">
                    <p className="text-xs font-bold text-amber-400 mb-2" style={{ fontFamily: 'monospace', textShadow: '1px 1px 0 #000' }}>
                      💎 POSSIBLE REWARDS:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {dungeon.lootTable
                        .filter(
                          (entry: any) =>
                            !entry.classRestriction ||
                            entry.classRestriction === character.class
                        )
                        .slice(0, 4)
                        .map((entry: any, idx: number) => (
                          <div
                            key={idx}
                            className="text-xs px-2 py-1 bg-stone-950 text-amber-300 font-bold"
                            style={{
                              fontFamily: 'monospace',
                              border: '2px solid #78350f',
                              borderRadius: '4px',
                              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
                            }}
                          >
                            {Math.round(entry.dropRate * 100)}% Drop
                          </div>
                        ))}
                      <div
                        className="text-xs px-2 py-1 bg-green-950 text-green-300 font-bold"
                        style={{
                          fontFamily: 'monospace',
                          border: '2px solid #15803d',
                          borderRadius: '4px',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
                        }}
                      >
                        🌾 Gems
                      </div>
                    </div>
                  </div>
                )}

                {character &&
                  character.combatPower < dungeon.recommendedCP * 0.8 && (
                    <div className="text-xs text-red-400 font-bold">
                      ⚠️ Combat Power too low!
                    </div>
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
                  run.status === 'Completed' 
                    ? 'border-green-700' 
                    : run.status === 'Failed' 
                    ? 'border-red-700' 
                    : 'border-stone-700'
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <img 
                    src={getDungeonIcon(run.dungeon.name)} 
                    alt={run.dungeon.name} 
                    className="w-12 h-12 rounded border-2 border-stone-600" 
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-white text-lg">
                          {run.dungeon.name}
                        </h3>
                        <p className="text-sm text-gray-400">{run.dungeon.zone.name}</p>
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          run.status === 'Completed' 
                            ? 'text-green-400' 
                            : run.status === 'Failed' 
                            ? 'text-red-400' 
                            : 'text-yellow-400'
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
                          className={`text-xs px-2 py-1 bg-stone-900 rounded ${getRarityColor(item.rarity)}`}
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
              <p>No dungeon history yet. Complete some dungeons to see your history!</p>
            </div>
          )}
        </div>
      )}

      {/* Dungeon Modal */}
      {selectedDungeon && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-800 rounded-lg border-2 border-amber-600 p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-2">
              {selectedDungeon.name}
            </h2>
            <p className="text-gray-300 text-sm mb-4">
              {selectedDungeon.description}
            </p>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Difficulty:</span>
                <span
                  className={`font-bold ${getDifficultyColor(
                    selectedDungeon.difficulty
                  )}`}
                >
                  {selectedDungeon.difficulty}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duration:</span>
                <span className="text-white">
                  {Math.floor(selectedDungeon.duration / 60)} minutes
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Energy Cost:</span>
                <span className="text-blue-400">
                  {selectedDungeon.energyCost}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gold Reward:</span>
                <span className="text-yellow-400">
                  {formatGold(selectedDungeon.baseGoldReward)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">EXP Reward:</span>
                <span className="text-purple-400">
                  {selectedDungeon.baseExpReward}
                </span>
              </div>
            </div>

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
                    border: '3px solid #1e3a8a',
                    borderRadius: '0',
                    boxShadow: '0 3px 0 #1e40af, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                    textShadow: '1px 1px 0 #000',
                    fontFamily: 'monospace',
                    letterSpacing: '1px'
                  }}
                >
                  <span className="relative z-10">💤 IDLE RUN</span>
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-400/20 to-transparent"></div>
                </button>
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
                      mode: "Active",
                    });
                  }}
                  disabled={startDungeonMutation.isPending}
                  className="py-3 bg-amber-700 hover:bg-amber-600 text-white font-bold transition relative overflow-hidden group disabled:opacity-50"
                  style={{
                    border: '3px solid #92400e',
                    borderRadius: '0',
                    boxShadow: '0 3px 0 #b45309, 0 6px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                    textShadow: '1px 1px 0 #000',
                    fontFamily: 'monospace',
                    letterSpacing: '1px'
                  }}
                >
                  <span className="relative z-10">⚡ ACTIVE 1.5x</span>
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
                </button>
              </div>
              {/* BOSS FIGHT DISABLED - Coming Soon! */}
              {/* <button
                onClick={() => {
                  if (activeDungeonRun && !activeDungeonRun.completed) {
                    (window as any).showToast?.(
                      `You are already doing this run: ${activeDungeonRun.dungeon.name}`,
                      "warning"
                    );
                    return;
                  }
                  setShowBossFight(true);
                  setSelectedDungeon(null);
                }}
                className="w-full py-4 bg-red-700 hover:bg-red-600 text-white font-bold transition relative overflow-hidden group"
                style={{
                  border: '4px solid #8B4513',
                  borderRadius: '0',
                  boxShadow: '0 4px 0 #4a0000, 0 8px 0 rgba(0,0,0,0.3)',
                  textShadow: '2px 2px 0 #000',
                  imageRendering: 'pixelated',
                  fontFamily: 'monospace',
                  letterSpacing: '2px'
                }}
              >
                <span className="relative z-10 text-xl tracking-wider">⚔️ BOSS FIGHT ⚔️</span>
                <div className="absolute inset-0 bg-gradient-to-b from-red-500/30 to-transparent group-hover:from-red-400/40"></div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400"></div>
              </button> */}
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

      {/* Boss Fight Component - DISABLED */}
      {/* {showBossFight && character && selectedDungeon && (
        <BossFight
          dungeonName={selectedDungeon.name}
          bossName={selectedDungeon.description.split("Boss: ")[1] || "Boss"}
          playerHP={character.health}
          playerMaxHP={character.maxHealth}
          playerAttack={character.attack}
          onComplete={async (success, finalHP) => {
            // Update HP in backend
            try {
              await characterApi.updateHP(finalHP);
              // Force refresh character data
              await queryClient.invalidateQueries({ queryKey: ["character"] });
              await queryClient.refetchQueries({ queryKey: ["character"] });
              
              // Also update player data
              const { data: profile } = await authApi.getProfile();
              setPlayer(profile);

              if (success) {
                (window as any).showToast?.(
                  "Boss defeated! Rewards earned!",
                  "success"
                );
              } else {
                (window as any).showToast?.("Defeated by the boss...", "error");
              }
            } catch (error) {
              console.error("Failed to update HP:", error);
            }
            setShowBossFight(false);
          }}
          onClose={() => setShowBossFight(false)}
        />
      )}
      */}
    </div>
  );
}
