import { useQuery } from '@tanstack/react-query';
import { Activity, Users, TrendingUp, Swords, Crown } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface DashboardAnalytics {
  overview: {
    totalPlayers: number;
    newPlayers: number;
    activePlayers24h: number;
    activePlayers7d: number;
    totalCharacters: number;
    avgLevel: number;
    totalGold: number;
    totalGems: number;
  };
  dungeons: {
    totalRuns: number;
    successfulRuns: number;
    successRate: number;
    runsLast24h: number;
    popularDungeons: any[];
  };
  guilds: {
    totalGuilds: number;
    totalMembers: number;
    avgSize: number;
  };
  topPlayers: any[];
  recentActivity: any[];
  activityByCategory: any[];
  dauTrend: any[];
}

export default function AnalyticsDashboard() {
  const { data: analytics, isLoading } = useQuery<DashboardAnalytics>({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/admin/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-yellow-400">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={24} />}
          label="Total Players"
          value={analytics.overview.totalPlayers}
          subtext={`${analytics.overview.newPlayers} new (30d)`}
          color="blue"
        />
        <StatCard
          icon={<Activity size={24} />}
          label="Active Today"
          value={analytics.overview.activePlayers24h}
          subtext={`${analytics.overview.activePlayers7d} this week`}
          color="green"
        />
        <StatCard
          icon={<TrendingUp size={24} />}
          label="Avg Level"
          value={Math.round(analytics.overview.avgLevel)}
          subtext={`${analytics.overview.totalCharacters} characters`}
          color="purple"
        />
        <StatCard
          icon={<Swords size={24} />}
          label="Dungeons (24h)"
          value={analytics.dungeons.runsLast24h}
          subtext={`${analytics.dungeons.successRate.toFixed(1)}% success`}
          color="red"
        />
      </div>

      {/* Economy Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 border-2 border-yellow-600 p-4">
          <div className="text-yellow-400 text-sm font-bold mb-2">💰 Total Gold</div>
          <div className="text-3xl font-bold text-white">
            {analytics.overview.totalGold.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-800 border-2 border-cyan-600 p-4">
          <div className="text-cyan-400 text-sm font-bold mb-2">💎 Total Gems</div>
          <div className="text-3xl font-bold text-white">
            {analytics.overview.totalGems.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-800 border-2 border-purple-600 p-4">
          <div className="text-purple-400 text-sm font-bold mb-2">🏰 Guilds</div>
          <div className="text-3xl font-bold text-white">
            {analytics.guilds.totalGuilds}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {analytics.guilds.totalMembers} members (avg {analytics.guilds.avgSize})
          </div>
        </div>
      </div>

      {/* DAU Trend */}
      <div className="bg-gray-800 border-2 border-gray-700 p-4">
        <h3 className="text-yellow-400 font-bold mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          Daily Active Users (Last 7 Days)
        </h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {analytics.dauTrend.map((day, index) => {
            const maxCount = Math.max(...analytics.dauTrend.map(d => d.count));
            const height = (day.count / maxCount) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-green-500 hover:bg-green-400 transition-all"
                  style={{ height: `${height}%` }}
                  title={`${day.date}: ${day.count} players`}
                />
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-xs text-white font-bold">{day.count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Players and Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Players */}
        <div className="bg-gray-800 border-2 border-gray-700 p-4">
          <h3 className="text-yellow-400 font-bold mb-4 flex items-center gap-2">
            <Crown size={20} />
            Top 10 Players
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {analytics.topPlayers.map((player, index) => (
              <div key={player.id} className="flex items-center gap-3 bg-gray-900 p-2">
                <div className={`text-lg font-bold ${index < 3 ? 'text-yellow-400' : 'text-gray-500'}`}>
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold">{player.username}</div>
                  <div className="text-xs text-gray-400">
                    {player.character?.name} • {player.character?.class} • CP: {player.character?.combatPower}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">Lv {player.level}</div>
                  <div className="text-xs text-yellow-400">{player.gold}g</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 border-2 border-gray-700 p-4">
          <h3 className="text-yellow-400 font-bold mb-4 flex items-center gap-2">
            <Activity size={20} />
            Recent Activity
          </h3>
          <div className="space-y-1 max-h-96 overflow-y-auto text-xs">
            {analytics.recentActivity.map((log) => (
              <div key={log.id} className="bg-gray-900 p-2 flex items-start gap-2">
                <div className="text-gray-500 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </div>
                <div className="flex-1">
                  <span className="text-cyan-400">{log.player.username}</span>
                  <span className="text-gray-400"> • </span>
                  <span className="text-white">{getActionLabel(log.action)}</span>
                  {log.metadata && (
                    <span className="text-gray-500"> ({JSON.stringify(log.metadata).slice(0, 50)})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity by Category */}
      <div className="bg-gray-800 border-2 border-gray-700 p-4">
        <h3 className="text-yellow-400 font-bold mb-4">Activity by Category (Last 7 Days)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {analytics.activityByCategory.map((cat) => (
            <div key={cat.category} className="bg-gray-900 p-4 text-center">
              <div className="text-2xl font-bold text-white">{cat._count.category}</div>
              <div className="text-sm text-gray-400 capitalize">{cat.category}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtext: string;
  color: string;
}) {
  const colorClasses = {
    blue: 'border-blue-600 text-blue-400',
    green: 'border-green-600 text-green-400',
    purple: 'border-purple-600 text-purple-400',
    red: 'border-red-600 text-red-400',
  }[color];

  return (
    <div className={`bg-gray-800 border-2 ${colorClasses} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <div className="text-sm font-bold">{label}</div>
      </div>
      <div className="text-3xl font-bold text-white">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-400 mt-1">{subtext}</div>
    </div>
  );
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    login: '🔓 Logged in',
    logout: '🔒 Logged out',
    dungeon_start: '⚔️ Started dungeon',
    dungeon_complete: '✅ Completed dungeon',
    shop_purchase: '🛒 Bought item',
    level_up: '⬆️ Leveled up',
    guild_join: '🏰 Joined guild',
    guild_leave: '👋 Left guild',
  };
  return labels[action] || action;
}
