import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Square, Activity, RefreshCw, Bot } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const botApi = {
  getStatus: () => fetch(`${API_URL}/api/admin/bot/status`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
  }).then(r => r.json()),
  
  start: () => fetch(`${API_URL}/api/admin/bot/start`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
  }).then(r => r.json()),
  
  stop: () => fetch(`${API_URL}/api/admin/bot/stop`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
  }).then(r => r.json()),
};

interface ActivityLog {
  id: string;
  message: string;
  timestamp: Date;
  type: 'idle' | 'dungeon' | 'equip' | 'levelup' | 'error';
}

// Load activity logs from localStorage
const loadActivityLogs = (): ActivityLog[] => {
  try {
    const stored = localStorage.getItem('botActivityLogs');
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    // Convert timestamp strings back to Date objects
    return parsed.map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }));
  } catch {
    return [];
  }
};

// Save activity logs to localStorage
const saveActivityLogs = (logs: ActivityLog[]) => {
  try {
    localStorage.setItem('botActivityLogs', JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save activity logs:', e);
  }
};

export default function BotManager() {
  const queryClient = useQueryClient();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(loadActivityLogs());

  // Get bot status
  const { data: status, isLoading } = useQuery({
    queryKey: ['bot', 'status'],
    queryFn: botApi.getStatus,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Start bot mutation
  const startMutation = useMutation({
    mutationFn: botApi.start,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot', 'status'] });
      (window as any).showToast?.('Bot service started!', 'success');
      addActivityLog('Bot service started', 'idle');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.message || 'Failed to start bot service', 'error');
    },
  });

  // Stop bot mutation
  const stopMutation = useMutation({
    mutationFn: botApi.stop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot', 'status'] });
      (window as any).showToast?.('Bot service stopped!', 'success');
      addActivityLog('Bot service stopped', 'error');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.message || 'Failed to stop bot service', 'error');
    },
  });

  // Add activity log
  const addActivityLog = (message: string, type: ActivityLog['type']) => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
      type,
    };
    setActivityLogs((prev) => {
      const updated = [newLog, ...prev].slice(0, 50); // Keep last 50 logs
      saveActivityLogs(updated); // Persist to localStorage
      return updated;
    });
  };

  // Save logs to localStorage whenever they change
  useEffect(() => {
    saveActivityLogs(activityLogs);
  }, [activityLogs]);

  // Mock activity feed (in a real implementation, this would come from WebSocket or polling)
  useEffect(() => {
    if (!status?.isRunning) return;

    const mockActivities = [
      // Idle farming
      { msg: 'xXShadowReaperXx idle farmed: +52g, +28 EXP', type: 'idle' as const },
      { msg: 'CrimsonViper420 idle farmed: +38g, +19 EXP', type: 'idle' as const },
      { msg: 'NoScopeMaster idle farmed: +45g, +22 EXP', type: 'idle' as const },
      { msg: 'PostmanMalone idle farmed: +41g, +20 EXP', type: 'idle' as const },
      { msg: 'TacticalGenius idle farmed: +58g, +31 EXP', type: 'idle' as const },
      { msg: 'BuiltDifferent idle farmed: +63g, +35 EXP', type: 'idle' as const },
      // Dungeon completions
      { msg: 'PhantomBlade77 completed Dragon\'s Lair: +150g, +200 EXP, Loot: Dragon\'s Lair Ring', type: 'dungeon' as const },
      { msg: 'BlazingPhoenix completed Shattered Obsidian Vault: +200g, +250 EXP, Loot: Iron Sword', type: 'dungeon' as const },
      { msg: 'SilentAssassin42 completed Hollowroot Sanctuary: +250g, +300 EXP', type: 'dungeon' as const },
      { msg: 'ApexPredator69 completed The Maw of Silence: +300g, +350 EXP, Loot: Enhancement Stone', type: 'dungeon' as const },
      { msg: 'MLGProGamer360 completed Dragon\'s Lair: +150g, +200 EXP', type: 'dungeon' as const },
      { msg: 'NotABot4Real completed Shattered Obsidian Vault: +200g, +250 EXP, Loot: Iron Gem', type: 'dungeon' as const },
      // Level ups
      { msg: 'NightmareKing88 leveled up to 12!', type: 'levelup' as const },
      { msg: 'ThunderStrike23 leveled up to 15!', type: 'levelup' as const },
      { msg: 'DarkKnightRises leveled up to 11!', type: 'levelup' as const },
      { msg: 'TwitchStreamer leveled up to 13!', type: 'levelup' as const },
      { msg: 'GetGoodKid leveled up to 16!', type: 'levelup' as const },
      // Equipment
      { msg: 'IronLegend360 equipped 3 better items', type: 'equip' as const },
      { msg: 'FrostBiteWarrior equipped 1 better item', type: 'equip' as const },
      { msg: 'StormBringer777 equipped 2 better items', type: 'equip' as const },
      { msg: 'YTGamingLegend equipped 4 better items', type: 'equip' as const },
      { msg: 'SoloCarryKing equipped 2 better items', type: 'equip' as const },
    ];

    // Simulate activity every 10-15 seconds
    const interval = setInterval(() => {
      const randomActivity = mockActivities[Math.floor(Math.random() * mockActivities.length)];
      addActivityLog(randomActivity.msg, randomActivity.type);
    }, 10000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, [status?.isRunning]);

  const getTypeColor = (type: ActivityLog['type']) => {
    switch (type) {
      case 'idle': return 'text-cyan-400';
      case 'dungeon': return 'text-orange-400';
      case 'equip': return 'text-purple-400';
      case 'levelup': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'idle': return '⚔️';
      case 'dungeon': return '🏰';
      case 'equip': return '🎯';
      case 'levelup': return '🎉';
      case 'error': return '⚠️';
      default: return '📝';
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <RefreshCw size={32} className="mx-auto mb-2 animate-spin text-cyan-400" />
        <p className="text-gray-400">Loading bot status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className="bg-stone-800 border-2 border-stone-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bot size={32} className={status?.isRunning ? 'text-green-400' : 'text-gray-500'} />
            <div>
              <h3 className="text-xl font-bold text-white">Bot Service</h3>
              <p className={`text-sm ${status?.isRunning ? 'text-green-400' : 'text-gray-500'}`}>
                {status?.isRunning ? '🟢 Running' : '⚪ Stopped'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {status?.isRunning ? (
              <button
                onClick={() => stopMutation.mutate()}
                disabled={stopMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold border-2 border-red-800 transition disabled:opacity-50"
                style={{
                  borderRadius: '0',
                  boxShadow: '0 2px 0 #991b1b',
                  textShadow: '1px 1px 0 #000',
                  fontFamily: 'monospace',
                }}
              >
                <Square size={16} className="inline mr-2" />
                {stopMutation.isPending ? 'Stopping...' : 'Stop Bots'}
              </button>
            ) : (
              <button
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold border-2 border-green-800 transition disabled:opacity-50"
                style={{
                  borderRadius: '0',
                  boxShadow: '0 2px 0 #166534',
                  textShadow: '1px 1px 0 #000',
                  fontFamily: 'monospace',
                }}
              >
                <Play size={16} className="inline mr-2" />
                {startMutation.isPending ? 'Starting...' : 'Start Bots'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-stone-900 p-3 rounded border border-cyan-600/30">
            <div className="text-xs text-gray-400 mb-1">Cycle Time</div>
            <div className="text-lg font-bold text-cyan-400">30s</div>
          </div>
          <div className="bg-stone-900 p-3 rounded border border-cyan-600/30">
            <div className="text-xs text-gray-400 mb-1">Bot Players</div>
            <div className="text-lg font-bold text-cyan-400">~130</div>
          </div>
          <div className="bg-stone-900 p-3 rounded border border-cyan-600/30">
            <div className="text-xs text-gray-400 mb-1">Actions/Cycle</div>
            <div className="text-lg font-bold text-cyan-400">60%/30%/10%</div>
          </div>
        </div>
      </div>

      {/* Bot Behavior Info */}
      <div className="bg-stone-800 border-2 border-stone-700 rounded-lg p-4">
        <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Activity size={20} />
          Bot Behavior
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold">⚔️ 60%</span>
            <span className="text-gray-300">Idle Farming - Earn gold and EXP based on level</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400 font-bold">🏰 30%</span>
            <span className="text-gray-300">Dungeon Runs - Complete dungeons for loot (80% success)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">🎯 10%</span>
            <span className="text-gray-300">Auto-Equip - Upgrade to better items in inventory</span>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-stone-800 border-2 border-stone-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity size={20} className="animate-pulse" />
            Live Activity Feed
          </h4>
          <button
            onClick={() => {
              setActivityLogs([]);
              localStorage.removeItem('botActivityLogs');
            }}
            className="text-xs text-gray-400 hover:text-white transition"
          >
            Clear
          </button>
        </div>

        {activityLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bot size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {status?.isRunning ? 'Waiting for bot activity...' : 'Start the bot service to see activity'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="bg-stone-900 p-2 rounded border border-stone-700 hover:border-stone-600 transition"
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getTypeIcon(log.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${getTypeColor(log.type)} font-mono`}>
                      {log.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {log.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Technical Details */}
      <div className="bg-stone-800 border-2 border-stone-700 rounded-lg p-4">
        <h4 className="text-lg font-bold text-white mb-3">⚙️ Technical Details</h4>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Target Players:</span>
            <span className="text-cyan-400 font-mono">*@mock.com</span>
          </div>
          <div className="flex justify-between">
            <span>Energy Regen:</span>
            <span className="text-cyan-400 font-mono">1 per 5 min</span>
          </div>
          <div className="flex justify-between">
            <span>Level Up:</span>
            <span className="text-cyan-400 font-mono">Class-based stats</span>
          </div>
          <div className="flex justify-between">
            <span>Dungeon Selection:</span>
            <span className="text-cyan-400 font-mono">±3-5 levels</span>
          </div>
        </div>
      </div>
    </div>
  );
}
