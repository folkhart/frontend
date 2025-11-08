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

  // Initialize PixiJS
  useEffect(() => {
    if (!pixiContainerRef.current || pixiAppRef.current) return;

    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight - 200,
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

      // Boss placeholder (will be replaced with actual boss sprite)
      const bossContainer = new PIXI.Container();
      bossContainer.position.set(app.screen.width / 2, app.screen.height / 2 - 100);
      
      const bossCircle = new PIXI.Graphics();
      bossCircle.lineStyle(4, 0xffaa00);
      bossCircle.beginFill(0xff0000, 0.8);
      bossCircle.drawCircle(0, 0, 80);
      bossCircle.endFill();
      bossContainer.addChild(bossCircle);

      // Boss icon/text
      const bossText = new PIXI.Text('🐉', {
        fontSize: 80,
        fill: 0xffffff,
      });
      bossText.anchor.set(0.5);
      bossContainer.addChild(bossText);

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
  }, []);

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
          <p className="text-gray-400 mb-6">
            The world boss is currently resting. Check back later or ask an admin to spawn one!
          </p>
          
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

  return (
    <div className="relative w-full h-screen bg-stone-900 overflow-hidden">
      {/* PixiJS Canvas */}
      <div ref={pixiContainerRef} className="absolute inset-0" />

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
                  {instance.participantCount} fighters
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

        {/* Bottom Bar - Attack & Leaderboard */}
        <div className="pointer-events-auto absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Attack Button */}
            <div className="md:col-span-2">
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
