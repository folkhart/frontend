import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Award, Star, Lock, Check, Gift, RefreshCw } from 'lucide-react';
import { achievementApi, authApi } from '@/lib/api';
import { useGameStore } from '@/store/gameStore';
import achievementIcon from '@/assets/ui/achievement.png';

interface AchievementStep {
  level: number;
  title: string;
  titleColor: string;
  goldReward: number;
  gemsReward: number;
  attackBonus?: number;
  defenseBonus?: number;
  healthBonus?: number;
  points: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  iconId: string;
  requirement: {
    type: string;
    count?: number;
    level?: number;
    amount?: number;
    maxLevel?: number;
  };
  isMultiStep: boolean;
  steps?: AchievementStep[];
  title: string | null;
  titleColor: string | null;
  goldReward: number;
  gemsReward: number;
  attackBonus: number;
  defenseBonus: number;
  healthBonus: number;
  rarity: string;
  points: number;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  isEquipped: boolean;
  currentStep: number;
  claimedSteps: number[];
}

interface AchievementStats {
  totalPoints: number;
  totalCompleted: number;
  totalAchievements: number;
  completionPercentage: number;
}

export default function AchievementTab() {
  const queryClient = useQueryClient();
  const { player, setPlayer, setCharacter } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const { data: achievements = [], refetch: refetchAchievements } = useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data } = await achievementApi.getAll();
      return data;
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchOnWindowFocus: true,
  });

  const { data: stats, refetch: refetchStats } = useQuery<AchievementStats>({
    queryKey: ['achievement-stats'],
    queryFn: async () => {
      const { data } = await achievementApi.getStats();
      return data;
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchOnWindowFocus: true,
  });

  const handleRefresh = () => {
    refetchAchievements();
    refetchStats();
    (window as any).showToast?.('Achievements refreshed!', 'success');
  };

  const equipTitleMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      const { data } = await achievementApi.equipTitle(achievementId);
      return data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      
      // Refetch profile to update character stats immediately
      const { data: profile } = await authApi.getProfile();
      setCharacter(profile.character);
      
      (window as any).showToast?.('Title equipped!', 'success');
    },
  });

  const unequipTitleMutation = useMutation({
    mutationFn: async () => {
      const { data } = await achievementApi.unequipTitle();
      return data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      
      // Refetch profile to update character stats immediately
      const { data: profile } = await authApi.getProfile();
      setCharacter(profile.character);
      
      (window as any).showToast?.('Title unequipped!', 'success');
    },
  });

  const claimStepMutation = useMutation({
    mutationFn: async ({ achievementId, stepIndex }: { achievementId: string; stepIndex: number }) => {
      const { data } = await achievementApi.claimStep(achievementId, stepIndex);
      return data;
    },
    onSuccess: (data) => {
      // Immediately update player state
      if (player) {
        setPlayer({
          ...player,
          gold: player.gold + data.rewards.gold,
          gems: player.gems + data.rewards.gems,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      queryClient.invalidateQueries({ queryKey: ['achievement-stats'] });
      
      (window as any).showToast?.(
        `Step ${data.step + 1} claimed! +${data.rewards.gold}g, +${data.rewards.gems} gems`,
        'success'
      );
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data } = await achievementApi.sync();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['achievement-stats'] });
      (window as any).showToast?.('Achievement progress synced!', 'success');
    },
  });

  const categories = ['All', 'Progression', 'Combat', 'Collection', 'Crafting', 'Social'];

  const filteredAchievements = achievements.filter((achievement) =>
    selectedCategory === 'All' ? true : achievement.category === selectedCategory
  );

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common':
        return 'text-gray-400 border-gray-600';
      case 'Uncommon':
        return 'text-green-400 border-green-600';
      case 'Rare':
        return 'text-blue-400 border-blue-600';
      case 'Epic':
        return 'text-purple-400 border-purple-600';
      case 'Legendary':
        return 'text-amber-400 border-amber-600';
      default:
        return 'text-gray-400 border-gray-600';
    }
  };

  const getProgressPercentage = (achievement: Achievement) => {
    const target =
      achievement.requirement.count ||
      achievement.requirement.level ||
      achievement.requirement.amount ||
      1;
    return Math.min((achievement.progress / target) * 100, 100);
  };

  return (
    <div className="p-3 pb-20">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy size={20} className="text-amber-400" />
          ACHIEVEMENTS & TITLES
        </h2>
        <button
          onClick={handleRefresh}
          className="p-2 bg-stone-700 hover:bg-stone-600 border-2 border-amber-600 rounded transition-colors"
          title="Refresh achievements"
        >
          <RefreshCw size={16} className="text-amber-400" />
        </button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="bg-stone-800 border-2 border-amber-600 p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{stats.totalPoints}</div>
              <div className="text-xs text-gray-400">Achievement Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {stats.totalCompleted}/{stats.totalAchievements}
              </div>
              <div className="text-xs text-gray-400">Completed</div>
            </div>
          </div>
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{stats.completionPercentage}%</span>
            </div>
            <div className="w-full bg-stone-900 h-2 rounded">
              <div
                className="bg-gradient-to-r from-amber-600 to-amber-400 h-2 rounded transition-all"
                style={{ width: `${stats.completionPercentage}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="w-full py-2 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-600 text-white font-bold text-sm transition"
            style={{
              border: '2px solid #1e3a8a',
              borderRadius: '0',
              boxShadow: '0 2px 0 #1e40af',
              fontFamily: 'monospace',
            }}
          >
            {syncMutation.isPending ? '🔄 SYNCING...' : '🔄 SYNC PROGRESS'}
          </button>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 text-sm font-bold whitespace-nowrap transition ${
              selectedCategory === category
                ? 'bg-amber-600 text-white'
                : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
            }`}
            style={{
              border: '2px solid #92400e',
              boxShadow:
                selectedCategory === category
                  ? '0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)'
                  : 'none',
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Achievements List */}
      <div className="space-y-3">
        {filteredAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`bg-stone-800 border-2 p-3 ${getRarityColor(achievement.rarity)} ${
              achievement.completed ? 'opacity-100' : 'opacity-75'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className={`w-12 h-12 flex items-center justify-center rounded ${
                  achievement.completed ? 'bg-amber-900/50' : 'bg-stone-900'
                }`}
              >
                {achievement.iconId && achievement.iconId !== 'achievement' ? (
                  <img
                    src={`/assets/ui/titleIcons/${achievement.iconId}.png`}
                    alt={achievement.name}
                    className="w-10 h-10"
                    style={{ imageRendering: 'pixelated' }}
                    onError={(e) => {
                      // Fallback to generic icon if title icon doesn't exist
                      (e.target as HTMLImageElement).src = achievementIcon;
                      (e.target as HTMLImageElement).className = "w-8 h-8";
                    }}
                  />
                ) : achievement.iconId === 'achievement' ? (
                  <img
                    src={achievementIcon}
                    alt="Achievement"
                    className="w-8 h-8"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : achievement.completed ? (
                  <Check size={24} className="text-green-400" />
                ) : (
                  <Lock size={24} className="text-gray-600" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className={`font-bold ${getRarityColor(achievement.rarity).split(' ')[0]}`}>
                      {achievement.name}
                    </h3>
                    <p className="text-xs text-gray-400">{achievement.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                    <Star size={14} />
                    {achievement.points}
                  </div>
                </div>

                {/* Multi-step Progress */}
                {achievement.isMultiStep && achievement.steps && (
                  <div className="mt-2 space-y-2">
                    {achievement.steps.map((step, index) => {
                      const isReached = achievement.progress >= step.level;
                      const isClaimed = achievement.claimedSteps.includes(index);
                      return (
                        <div
                          key={index}
                          className={`p-2 rounded border ${
                            isClaimed
                              ? 'bg-green-900/30 border-green-600'
                              : isReached
                              ? 'bg-amber-900/30 border-amber-600'
                              : 'bg-stone-900 border-stone-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isClaimed ? (
                                <Check size={16} className="text-green-400" />
                              ) : isReached ? (
                                <Gift size={16} className="text-amber-400" />
                              ) : (
                                <Lock size={16} className="text-gray-600" />
                              )}
                              <span className="text-xs font-bold text-white">Level {step.level}</span>
                              <span className="text-xs text-gray-400">
                                +{step.goldReward}g, +{step.gemsReward} gems
                              </span>
                            </div>
                            {isReached && !isClaimed && (
                              <button
                                onClick={() =>
                                  claimStepMutation.mutate({ achievementId: achievement.id, stepIndex: index })
                                }
                                disabled={claimStepMutation.isPending}
                                className="px-3 py-1 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 text-white text-xs font-bold transition"
                                style={{
                                  border: '2px solid #15803d',
                                  borderRadius: '0',
                                  boxShadow: '0 2px 0 #166534',
                                  fontFamily: 'monospace',
                                }}
                              >
                                CLAIM
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Progress Bar (for non-multi-step) */}
                {!achievement.isMultiStep && !achievement.completed && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>
                        {achievement.progress}/
                        {achievement.requirement.count ||
                          achievement.requirement.level ||
                          achievement.requirement.amount}
                      </span>
                    </div>
                    <div className="w-full bg-stone-900 h-1.5 rounded">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-blue-400 h-1.5 rounded transition-all"
                        style={{ width: `${getProgressPercentage(achievement)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Rewards & Title (for non-multi-step completed) */}
                {!achievement.isMultiStep && achievement.completed && (
                  <div className="mt-2 space-y-2">
                    {/* Rewards */}
                    <div className="flex gap-3 text-xs">
                      {achievement.goldReward > 0 && (
                        <span className="text-amber-400">+{achievement.goldReward}g</span>
                      )}
                      {achievement.gemsReward > 0 && (
                        <span className="text-blue-400">+{achievement.gemsReward} gems</span>
                      )}
                      {achievement.attackBonus > 0 && (
                        <span className="text-red-400">+{achievement.attackBonus} ATK</span>
                      )}
                      {achievement.defenseBonus > 0 && (
                        <span className="text-green-400">+{achievement.defenseBonus} DEF</span>
                      )}
                      {achievement.healthBonus > 0 && (
                        <span className="text-pink-400">+{achievement.healthBonus} HP</span>
                      )}
                    </div>

                    {/* Title Equip Button */}
                    {achievement.title && (
                      <div className="flex items-center gap-2">
                        <Award size={14} style={{ color: achievement.titleColor || '#fbbf24' }} />
                        <span
                          className="text-sm font-bold"
                          style={{ color: achievement.titleColor || '#fbbf24' }}
                        >
                          {achievement.title}
                        </span>
                        {achievement.isEquipped ? (
                          <button
                            onClick={() => unequipTitleMutation.mutate()}
                            disabled={unequipTitleMutation.isPending}
                            className="ml-auto px-3 py-1 bg-red-700 hover:bg-red-600 disabled:bg-gray-600 text-white text-xs font-bold transition"
                          >
                            UNEQUIP
                          </button>
                        ) : (
                          <button
                            onClick={() => equipTitleMutation.mutate(achievement.id)}
                            disabled={equipTitleMutation.isPending}
                            className="ml-auto px-3 py-1 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 text-white text-xs font-bold transition"
                          >
                            EQUIP
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredAchievements.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            No achievements in this category yet.
          </div>
        )}
      </div>
    </div>
  );
}
