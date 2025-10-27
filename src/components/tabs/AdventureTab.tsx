import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dungeonApi, idleApi, authApi, characterApi } from "@/lib/api";
import { useGameStore } from "@/store/gameStore";
import { getDifficultyColor, formatGold } from "@/utils/format";
import { Clock, Zap, Trophy } from "lucide-react";
import BossFight from "@/components/BossFight";

export default function AdventureTab() {
  const queryClient = useQueryClient();
  const { character, setPlayer } = useGameStore();
  const [view, setView] = useState<"dungeons" | "idle">("dungeons");
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
      const elapsed = Math.floor(
        (Date.now() - new Date(run.startTime).getTime()) / 1000
      );
      const remaining = Math.max(0, run.dungeon.duration - elapsed);
      return remaining;
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

  const { data: idleStatus, refetch: refetchIdle } = useQuery({
    queryKey: ["idleStatus"],
    queryFn: async () => {
      const { data } = await idleApi.getStatus();
      return data;
    },
    refetchInterval: 5000,
  });

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
    mutationFn: () => idleApi.start(),
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
    if (activeDungeonRun && !activeDungeonRun.completed && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-complete when timer reaches 0
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
      }, timeRemaining * 1000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
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
      // Refresh player data to update energy
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
        <div className="mb-4 p-4 bg-gradient-to-r from-orange-900/80 to-red-900/80 rounded-lg border-2 border-orange-600 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">⚔️</div>
              <div>
                <p className="text-white font-bold">
                  {activeDungeonRun.dungeon.name}
                </p>
                <p className="text-sm text-orange-300">
                  {activeDungeonRun.mode} Mode - In Progress
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-amber-400">
                {Math.floor(timeRemaining / 60)}:
                {String(timeRemaining % 60).padStart(2, "0")}
              </div>
              <p className="text-xs text-gray-300">Remaining</p>
            </div>
          </div>
          <div className="w-full bg-stone-900 rounded-full h-2 overflow-hidden mt-3">
            <div
              className="bg-gradient-to-r from-amber-600 to-amber-400 h-full transition-all duration-1000"
              style={{
                width: `${
                  ((activeDungeonRun.dungeon.duration - timeRemaining) /
                    activeDungeonRun.dungeon.duration) *
                  100
                }%`,
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
        <div className="mb-4 p-4 bg-green-900/50 rounded-lg border-2 border-green-600">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white font-semibold flex items-center gap-2">
              <span>🌾</span> Idle Farming Active
            </p>
            {idleStatus.canClaim && (
              <span className="text-green-300 text-sm font-bold animate-pulse">
                Ready!
              </span>
            )}
          </div>
          <p className="text-sm text-green-200 mb-3">
            {idleStatus.canClaim
              ? "Rewards are ready to claim!"
              : `Ends in: ${Math.floor(idleTimeRemaining / 60)}m ${
                  idleTimeRemaining % 60
                }s`}
          </p>
          <button
            onClick={() => claimIdleMutation.mutate()}
            disabled={!idleStatus.canClaim || claimIdleMutation.isPending}
            className="w-full px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded font-bold transition disabled:opacity-50 disabled:cursor-not-allowed btn-press"
          >
            {claimIdleMutation.isPending ? "Claiming..." : "Claim Rewards"}
          </button>
        </div>
      )}

      {/* Start Idle Farming */}
      {!idleStatus?.active && (
        <div className="mb-4 p-4 bg-stone-800 rounded-lg border-2 border-stone-700">
          <p className="text-white font-semibold mb-2">💤 Start Idle Farming</p>
          <p className="text-sm text-gray-300 mb-3">
            Let your character farm resources while you're away. Earn gold, exp,
            and items!
          </p>
          <button
            onClick={() => startIdleMutation.mutate()}
            disabled={startIdleMutation.isPending}
            className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold transition btn-press"
          >
            {startIdleMutation.isPending
              ? "Starting..."
              : "Start Idle Farming (1 hour)"}
          </button>
        </div>
      )}

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView("dungeons")}
          className={`flex-1 py-2 rounded font-bold transition btn-press ${
            view === "dungeons"
              ? "bg-amber-600 text-white"
              : "bg-stone-700 text-gray-300"
          }`}
        >
          🏰 Dungeons
        </button>
        <button
          onClick={() => setView("idle")}
          className={`flex-1 py-2 rounded font-bold transition btn-press ${
            view === "idle"
              ? "bg-amber-600 text-white"
              : "bg-stone-700 text-gray-300"
          }`}
        >
          📜 History
        </button>
      </div>

      {/* Dungeons List */}
      {view === "dungeons" && (
        <div className="space-y-3">
          {dungeons && dungeons.length > 0 ? (
            dungeons.map((dungeon: any) => (
              <div
                key={dungeon.id}
                className="p-4 bg-stone-800 rounded-lg border-2 border-stone-700 hover:border-stone-600 transition cursor-pointer"
                onClick={() => setSelectedDungeon(dungeon)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      {dungeon.name}
                    </h3>
                    <p className="text-sm text-gray-400">{dungeon.zone.name}</p>
                  </div>
                  <span
                    className={`text-sm font-bold ${getDifficultyColor(
                      dungeon.difficulty
                    )}`}
                  >
                    {dungeon.difficulty}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div className="flex items-center gap-1 text-gray-300">
                    <Trophy size={14} />
                    <span>{formatGold(dungeon.baseGoldReward)} Gold</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-300">
                    <Zap size={14} />
                    <span>{dungeon.energyCost} Energy</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-300">
                    <Clock size={14} />
                    <span>{Math.floor(dungeon.duration / 60)} min</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-300">
                    <span className={getDifficultyColor(dungeon.difficulty)}>
                      {dungeon.difficulty}
                    </span>
                  </div>
                </div>

                {/* Loot Preview - Show class-specific items */}
                {character && dungeon.lootTable && (
                  <div className="border-t border-stone-700 pt-2">
                    <p className="text-xs text-gray-400 mb-2">
                      Possible Loot for {character.class}:
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
                            className="text-xs px-2 py-1 bg-stone-900 rounded text-amber-400"
                          >
                            {Math.round(entry.dropRate * 100)}%
                          </div>
                        ))}
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
              <button
                onClick={() => {
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
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
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

      {/* Boss Fight Component */}
      {showBossFight && character && selectedDungeon && (
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
    </div>
  );
}
