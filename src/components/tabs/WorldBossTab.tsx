import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as PIXI from 'pixi.js';
import { Skull, Swords, Trophy, Clock, Users, Zap, Gift } from 'lucide-react';
import { worldBossApi } from '@/lib/api';
import { useGameStore } from '@/store/gameStore';

export default function WorldBossTab() {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const queryClient = useQueryClient();
  const { player } = useGameStore();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [nextSpawnTimer, setNextSpawnTimer] = useState<string>('');
  const [showPhasesModal, setShowPhasesModal] = useState(false);
  const [showLootModal, setShowLootModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  // Fetch active boss
  const { data: activeBoss, isLoading: loadingBoss } = useQuery({
    queryKey: ['world-boss', 'active'],
    queryFn: async () => {
      const response = await worldBossApi.getActive();
      return response.data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch player rewards
  const { data: rewards } = useQuery({
    queryKey: ['world-boss', 'rewards'],
    queryFn: async () => {
      const response = await worldBossApi.getRewards();
      return response.data;
    },
  });

  // Attack mutation
  const attackMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      const response = await worldBossApi.attack(instanceId);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['world-boss', 'active'] });
      
      // Show damage notification
      const damage = data.damage || 0;
      const isCrit = data.isCrit || false;
      (window as any).showToast?.(
        `${isCrit ? '💥 CRITICAL! ' : '⚔️'} You dealt ${damage.toLocaleString()} damage!`,
        isCrit ? 'warning' : 'success'
      );
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || 'Failed to attack boss',
        'error'
      );
    },
  });

  // Claim reward mutation
  const claimRewardMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      const response = await worldBossApi.claimReward(rewardId);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['world-boss', 'rewards'] });
      
      (window as any).showToast?.(
        `🎁 Claimed: ${data.gold}g, ${data.experience} XP, ${data.gems} gems!`,
        'success'
      );
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.error || 'Failed to claim reward',
        'error'
      );
    },
  });

  // Initialize PixiJS with boss sprite
  useEffect(() => {
    if (!pixiContainerRef.current || pixiAppRef.current || !activeBoss?.boss) return;

    const containerWidth = pixiContainerRef.current.clientWidth;
    const containerHeight = pixiContainerRef.current.clientHeight;

    const app = new PIXI.Application({
      width: containerWidth,
      height: containerHeight,
      backgroundColor: 0x1a1a1a,
      antialias: true,
    });
    
    if (pixiContainerRef.current && app.view) {
      pixiContainerRef.current.appendChild(app.view as HTMLCanvasElement);
      pixiAppRef.current = app;

      // Create background
      const bg = new PIXI.Graphics();
      bg.beginFill(0x0f0f0f);
      bg.drawRect(0, 0, app.screen.width, app.screen.height);
      bg.endFill();
      app.stage.addChild(bg);

      // Add dramatic spotlight effect
      const spotlight = new PIXI.Graphics();
      spotlight.beginFill(0x2a2a2a, 0.5);
      spotlight.drawCircle(app.screen.width / 2, app.screen.height / 2, 200);
      spotlight.endFill();
      app.stage.addChild(spotlight);

      // Load and display boss sprite
      const bossContainer = new PIXI.Container();
      bossContainer.position.set(app.screen.width / 2, app.screen.height / 2 - 50);

      // Try to load boss sprite from assets
      const spriteId = activeBoss.boss.spriteId;
      const spritePath = `/src/assets/ui/bossIcons/${spriteId}.png`;
      
      PIXI.Assets.load(spritePath)
        .then((texture) => {
          const bossSprite = new PIXI.Sprite(texture);
          bossSprite.anchor.set(0.5);
          bossSprite.scale.set(0.8); // Adjust size as needed
          bossContainer.addChild(bossSprite);
        })
        .catch(() => {
          // Fallback: show circle with emoji if sprite not found
          const bossCircle = new PIXI.Graphics();
          bossCircle.lineStyle(4, 0xffaa00);
          bossCircle.beginFill(0xff0000, 0.8);
          bossCircle.drawCircle(0, 0, 80);
          bossCircle.endFill();
          bossContainer.addChild(bossCircle);

          const bossText = new PIXI.Text('🐉', {
            fontSize: 80,
            fill: 0xffffff,
          });
          bossText.anchor.set(0.5);
          bossContainer.addChild(bossText);
        });

      app.stage.addChild(bossContainer);

      // Animate boss (breathing effect)
      let scale = 1;
      let direction = 1;
      app.ticker.add(() => {
        scale += 0.002 * direction;
        if (scale > 1.1 || scale < 0.95) direction *= -1;
        bossContainer.scale.set(scale);
      });
    }

    return () => {
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, { children: true });
        pixiAppRef.current = null;
      }
    };
  }, [activeBoss]);

  // Update timer
  useEffect(() => {
    if (!activeBoss?.instance) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(activeBoss.instance.endsAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining('ENDED');
        queryClient.invalidateQueries({ queryKey: ['world-boss', 'active'] });
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeBoss, queryClient]);

  // Update next spawn timer for auto-spawn bosses
  useEffect(() => {
    if (!activeBoss?.boss?.autoSpawn) {
      setNextSpawnTimer('');
      return;
    }

    const updateNextSpawnTimer = () => {
      // If there's an active instance, don't show next spawn timer
      if (activeBoss.instance?.status === 'active') {
        setNextSpawnTimer('');
        return;
      }

      // Calculate next spawn time based on last instance end time + interval
      const lastInstance = activeBoss.boss.instances?.[0];
      if (!lastInstance) {
        setNextSpawnTimer('Waiting for first spawn...');
        return;
      }

      const lastEnded = new Date(lastInstance.endsAt).getTime();
      const intervalMs = activeBoss.boss.spawnIntervalHours * 60 * 60 * 1000;
      const nextSpawnTime = lastEnded + intervalMs;
      const now = new Date().getTime();
      const diff = nextSpawnTime - now;

      if (diff <= 0) {
        setNextSpawnTimer('Spawning soon...');
        queryClient.invalidateQueries({ queryKey: ['world-boss', 'active'] });
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      if (hours > 0) {
        setNextSpawnTimer(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setNextSpawnTimer(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateNextSpawnTimer();
    const interval = setInterval(updateNextSpawnTimer, 1000);
    return () => clearInterval(interval);
  }, [activeBoss, queryClient]);

  // No active boss
  if (loadingBoss) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-900 text-white">
        <div className="text-center">
          <Skull className="w-16 h-16 mx-auto mb-4 text-red-500 animate-pulse" />
          <p className="text-xl">Loading World Boss...</p>
        </div>
      </div>
    );
  }

  if (!activeBoss || !activeBoss.instance || activeBoss.instance.status !== 'active') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-900 text-white p-4">
        <div className="text-center max-w-md">
          <Skull className="w-24 h-24 mx-auto mb-6 text-gray-600" />
          <h2 className="text-3xl font-bold mb-4">No Active World Boss</h2>
          
          {/* Auto-Spawn Timer */}
          {activeBoss?.boss?.autoSpawn && nextSpawnTimer ? (
            <div className="mb-6 bg-yellow-900/30 border-2 border-yellow-600 p-4" style={{ borderRadius: '0' }}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-6 h-6 text-yellow-400" />
                <span className="text-yellow-400 font-bold text-lg">Auto-Spawn Active</span>
              </div>
              <p className="text-gray-300 text-sm mb-2">Next spawn in:</p>
              <p className="text-white text-3xl font-bold">{nextSpawnTimer}</p>
            </div>
          ) : (
            <p className="text-gray-400 mb-6">
              The world boss is currently resting. Check back later or ask an admin to spawn one!
            </p>
          )}
          
          {/* Unclaimed Rewards */}
          {rewards && rewards.length > 0 && (
            <div className="mt-8 bg-stone-800 border-2 border-yellow-600 p-6" style={{ borderRadius: '0' }}>
              <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center justify-center gap-2">
                <Gift />
                Unclaimed Rewards ({rewards.length})
              </h3>
              <div className="space-y-3">
                {rewards.map((reward: any) => (
                  <div key={reward.id} className="bg-stone-900 border border-yellow-500 p-4" style={{ borderRadius: '0' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-bold">Rank #{reward.rank}</span>
                      <span className="text-yellow-400 text-sm">
                        {new Date(reward.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 mb-3">
                      💰 {reward.gold.toLocaleString()}g • ⭐ {reward.experience.toLocaleString()} XP • 💎 {reward.gems}
                    </div>
                    <button
                      onClick={() => claimRewardMutation.mutate(reward.id)}
                      disabled={claimRewardMutation.isPending}
                      className="w-full py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold"
                      style={{ border: '2px solid #15803d', borderRadius: '0' }}
                    >
                      {claimRewardMutation.isPending ? 'Claiming...' : 'Claim Reward'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const boss = activeBoss.boss;
  const instance = activeBoss.instance;
  const leaderboard = activeBoss.leaderboard || [];
  const phases = boss.phases as any[];
  const currentPhase = phases[instance.currentPhase - 1];
  const healthPercent = (Number(instance.currentHealth) / Number(instance.maxHealth)) * 100;
  const lootTable = boss.lootTable as any[];

  return (
    <div className="relative w-full h-full bg-stone-900 overflow-hidden">
      {/* PixiJS Canvas */}
      <div ref={pixiContainerRef} className="absolute inset-0" style={{ filter: 'brightness(0.7)' }} />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Bar - Boss Info */}
        <div className="pointer-events-auto bg-gradient-to-b from-black/90 to-transparent p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Skull className="w-8 h-8 text-red-500" />
                <div>
                  <h1 className="text-2xl font-bold text-white">{boss.name}</h1>
                  <p className="text-sm text-gray-400">{boss.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-yellow-400 text-xl font-bold">
                  <Clock />
                  {timeRemaining}
                </div>
                <div className="text-sm text-gray-400 flex items-center gap-1">
                  <Users size={14} />
                  {leaderboard.length} fighters
                </div>
              </div>
            </div>

            {/* Boss Health Bar */}
            <div className="bg-stone-800 border-2 border-red-600 p-2" style={{ borderRadius: '0' }}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-white font-bold text-sm">
                  Phase {instance.currentPhase}/{phases.length} - {currentPhase.name}
                </span>
                <span className="text-white font-bold text-sm">
                  {Number(instance.currentHealth).toLocaleString()} / {Number(instance.maxHealth).toLocaleString()}
                </span>
              </div>
              <div className="h-6 bg-stone-900 border border-stone-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                  style={{ width: `${healthPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>


        {/* Modals */}
        {showPhasesModal && (
          <div className="pointer-events-auto fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowPhasesModal(false)}>
            <div className="bg-stone-900 border-4 border-red-600 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-red-400 mb-4">📊 BOSS PHASES</h2>
              <div className="space-y-2">
                {phases.map((phase: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 ${
                      idx + 1 === instance.currentPhase
                        ? 'bg-red-900/50 border-2 border-red-500'
                        : idx + 1 < instance.currentPhase
                        ? 'bg-gray-800 opacity-50'
                        : 'bg-stone-800 border border-stone-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`font-bold ${idx + 1 === instance.currentPhase ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {phase.name}
                      </span>
                      {idx + 1 === instance.currentPhase && <span className="text-green-400 text-xl">●</span>}
                      {idx + 1 < instance.currentPhase && <span className="text-gray-600 text-xl">✓</span>}
                    </div>
                    <div className="text-gray-300 text-sm">
                      HP: {phase.hp.toLocaleString()} | ATK: {phase.attack} | DEF: {phase.defense}
                    </div>
                    {phase.element && <div className="text-blue-400 text-xs mt-1">Element: {phase.element}</div>}
                  </div>
                ))}
              </div>
              <button onClick={() => setShowPhasesModal(false)} className="mt-4 w-full py-2 bg-red-700 hover:bg-red-600 text-white font-bold">
                CLOSE
              </button>
            </div>
          </div>
        )}

        {showLootModal && (
          <div className="pointer-events-auto fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowLootModal(false)}>
            <div className="bg-stone-900 border-4 border-yellow-600 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">💎 POSSIBLE LOOT</h2>
              {lootTable && lootTable.length > 0 ? (
                <div className="space-y-2">
                  {lootTable.map((item: any, idx: number) => (
                    <div key={idx} className="bg-stone-800 p-3 border border-yellow-700">
                      <span className="text-white font-bold">{item.name || 'Unknown Item'}</span>
                      <div className="text-gray-400 text-sm mt-1">Drop Rate: {item.dropRate || 25}%</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No loot configured for this boss</p>
              )}
              <button onClick={() => setShowLootModal(false)} className="mt-4 w-full py-2 bg-yellow-700 hover:bg-yellow-600 text-white font-bold">
                CLOSE
              </button>
            </div>
          </div>
        )}

        {showRewardsModal && (
          <div className="pointer-events-auto fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowRewardsModal(false)}>
            <div className="bg-stone-900 border-4 border-green-600 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-green-400 mb-4">🏆 REWARDS</h2>
              <div className="space-y-3">
                <div className="p-4 bg-yellow-900/30 border-2 border-yellow-600">
                  <div className="font-bold text-yellow-400 text-lg">Top 10 Players</div>
                  <div className="text-white mt-2">{(boss.rewardGold * 2).toLocaleString()}g • {(boss.rewardExp * 2).toLocaleString()} XP • {boss.rewardGems * 2} gems</div>
                  <div className="text-green-400 mt-1 font-bold">✅ Guaranteed 1-2 items</div>
                </div>
                <div className="p-4 bg-stone-800 border border-gray-600">
                  <div className="font-bold text-gray-300 text-lg">Top 11-50 Players</div>
                  <div className="text-white mt-2">{Math.floor(boss.rewardGold * 1.5).toLocaleString()}g • {Math.floor(boss.rewardExp * 1.5).toLocaleString()} XP • {Math.floor(boss.rewardGems * 1.5)} gems</div>
                  <div className="text-blue-400 mt-1">🎲 50% chance for item</div>
                </div>
                <div className="p-4 bg-stone-800 border border-gray-700">
                  <div className="font-bold text-gray-400 text-lg">Top 51-100 Players</div>
                  <div className="text-white mt-2">{boss.rewardGold.toLocaleString()}g • {boss.rewardExp.toLocaleString()} XP • {boss.rewardGems} gems</div>
                </div>
              </div>
              <button onClick={() => setShowRewardsModal(false)} className="mt-4 w-full py-2 bg-green-700 hover:bg-green-600 text-white font-bold">
                CLOSE
              </button>
            </div>
          </div>
        )}

        {showLeaderboardModal && (
          <div className="pointer-events-auto fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowLeaderboardModal(false)}>
            <div className="bg-stone-900 border-4 border-purple-600 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                <Trophy /> TOP DAMAGE DEALERS
              </h2>
              <div className="space-y-2">
                {leaderboard.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Be the first to attack!</p>
                ) : (
                  leaderboard.slice(0, 10).map((entry: any, index: number) => (
                    <div
                      key={entry.characterName}
                      className={`flex justify-between items-center p-3 ${
                        index < 3 ? 'bg-yellow-900/30 border-2 border-yellow-600' : 'bg-stone-800 border border-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-xl ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-amber-600' :
                          'text-gray-400'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="text-white font-bold">{entry.characterName}</span>
                      </div>
                      <span className="text-red-400 font-bold">
                        {Number(entry.totalDamage).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <button onClick={() => setShowLeaderboardModal(false)} className="mt-4 w-full py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold">
                CLOSE
              </button>
            </div>
          </div>
        )}

        {/* Bottom Bar - Attack & Leaderboard */}
        <div className="pointer-events-auto absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Attack Button */}
            <div className="md:col-span-2">
              {/* Retro Info Buttons */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <button
                  onClick={() => setShowPhasesModal(true)}
                  className="py-2 bg-stone-800 hover:bg-stone-700 border-2 border-red-600 text-white font-bold text-xs uppercase"
                  style={{ borderRadius: '0', imageRendering: 'pixelated' }}
                >
                  📊<br/>PHASES
                </button>
                <button
                  onClick={() => setShowLootModal(true)}
                  className="py-2 bg-stone-800 hover:bg-stone-700 border-2 border-yellow-600 text-white font-bold text-xs uppercase"
                  style={{ borderRadius: '0', imageRendering: 'pixelated' }}
                >
                  💎<br/>LOOT
                </button>
                <button
                  onClick={() => setShowRewardsModal(true)}
                  className="py-2 bg-stone-800 hover:bg-stone-700 border-2 border-green-600 text-white font-bold text-xs uppercase"
                  style={{ borderRadius: '0', imageRendering: 'pixelated' }}
                >
                  🏆<br/>REWARDS
                </button>
                <button
                  onClick={() => setShowLeaderboardModal(true)}
                  className="py-2 bg-stone-800 hover:bg-stone-700 border-2 border-purple-600 text-white font-bold text-xs uppercase"
                  style={{ borderRadius: '0', imageRendering: 'pixelated' }}
                >
                  👑<br/>TOP 10
                </button>
              </div>

              <button
                onClick={() => attackMutation.mutate(instance.id)}
                disabled={attackMutation.isPending || !player}
                className="w-full py-6 bg-red-700 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold text-2xl flex items-center justify-center gap-3 transform transition hover:scale-105 active:scale-95"
                style={{ border: '4px solid #991b1b', borderRadius: '0' }}
              >
                <Swords size={32} />
                {attackMutation.isPending ? 'ATTACKING...' : 'ATTACK BOSS!'}
                <Zap size={32} className="text-yellow-400" />
              </button>
              
              {!player && (
                <p className="text-center text-red-400 mt-2 text-sm">
                  You must be logged in to attack the boss
                </p>
              )}
            </div>

            {/* Leaderboard */}
            <div className="bg-stone-800 border-2 border-yellow-600 p-3 max-h-48 overflow-y-auto" style={{ borderRadius: '0' }}>
              <h3 className="text-yellow-400 font-bold mb-2 flex items-center gap-2 sticky top-0 bg-stone-800 pb-2">
                <Trophy size={18} />
                Top Damage Dealers
              </h3>
              <div className="space-y-1">
                {leaderboard.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Be the first to attack!
                  </p>
                ) : (
                  leaderboard.map((entry: any, index: number) => (
                    <div
                      key={entry.characterName}
                      className={`flex justify-between items-center p-2 ${
                        index < 3 ? 'bg-yellow-900/30 border border-yellow-600' : 'bg-stone-900'
                      }`}
                      style={{ borderRadius: '0' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-amber-600' :
                          'text-gray-400'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="text-white text-sm">{entry.characterName}</span>
                      </div>
                      <span className="text-red-400 font-bold text-sm">
                        {Number(entry.totalDamage).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
