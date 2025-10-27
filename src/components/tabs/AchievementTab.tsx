import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tantml:parameter name="query';
import { Trophy, Award, Star, Lock, Check } from 'lucide-react';

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
  };
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
}

interface AchievementStats {
  totalPoints: number;
  totalCompleted: number;
  totalAchievements: number;
  completionPercentage: number;
}

export default function AchievementTab() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/achievements', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch achievements');
      return response.json();
    },
  });

  const { data: stats } = useQuery<AchievementStats>({
    queryKey: ['achievement-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/achievements/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const equipTitleMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/achievements/equip/${achievementId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to equip title');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      (window as any).showToast?.('Title equipped!', 'success');
    },
  });

  const unequipTitleMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/achievements/unequip', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to unequip title');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      (window as any).showToast?.('Title unequipped!', 'success');
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
      <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <Trophy size={20} className="text-amber-400" />
        ACHIEVEMENTS & TITLES
      </h2>

      {/* Stats Overview */}
      {stats && (
        <div className="bg-stone-800 border-2 border-amber-600 p-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
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
          <div className="mt-3">
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
                {achievement.completed ? (
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

                {/* Progress Bar */}
                {!achievement.completed && (
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

                {/* Rewards & Title */}
                {achievement.completed && (
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
