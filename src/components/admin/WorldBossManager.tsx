import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Skull, Play, Trash2, Edit, Clock, Users, Upload, Download } from 'lucide-react';
import { worldBossApi } from '@/lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function WorldBossManager() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingBoss, setEditingBoss] = useState<any>(null);
  const [jsonInput, setJsonInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all world bosses
  const { data: bosses, isLoading } = useQuery({
    queryKey: ['admin', 'world-bosses'],
    queryFn: async () => {
      const response = await worldBossApi.admin.getAll();
      return response.data;
    },
  });

  // Fetch items for loot table
  const { data: items } = useQuery({
    queryKey: ['admin', 'items'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/api/admin/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.json();
    },
  });

  // Create mutation
  const createBossMutation = useMutation({
    mutationFn: worldBossApi.admin.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'world-bosses'] });
      setShowCreateModal(false);
      (window as any).showToast?.('✅ World Boss created!', 'success');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Failed to create boss', 'error');
    },
  });

  // Update mutation
  const updateBossMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      worldBossApi.admin.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'world-bosses'] });
      setEditingBoss(null);
      (window as any).showToast?.('✅ World Boss updated!', 'success');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Failed to update boss', 'error');
    },
  });

  // Delete mutation
  const deleteBossMutation = useMutation({
    mutationFn: worldBossApi.admin.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'world-bosses'] });
      (window as any).showToast?.('🗑️ World Boss deleted!', 'info');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Failed to delete boss', 'error');
    },
  });

  // Spawn mutation
  const spawnBossMutation = useMutation({
    mutationFn: worldBossApi.admin.spawn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'world-bosses'] });
      (window as any).showToast?.('🐉 World Boss spawned!', 'success');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Failed to spawn boss', 'error');
    },
  });

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (bosses: any[]) => {
      const results = [];
      for (const boss of bosses) {
        try {
          const result = await worldBossApi.admin.create(boss);
          results.push(result);
        } catch (error) {
          console.error('Failed to import boss:', boss.name, error);
        }
      }
      return results;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'world-bosses'] });
      setShowImportModal(false);
      setJsonInput('');
      (window as any).showToast?.(`✅ Successfully imported ${data.length} boss(es)!`, 'success');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Failed to import bosses', 'error');
    },
  });

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setJsonInput(content);
        (window as any).showToast?.('📁 File loaded successfully!', 'success');
      } catch (error) {
        (window as any).showToast?.('❌ Failed to read file', 'error');
      }
    };
    reader.readAsText(file);
  };

  // JSON import handler
  const handleJsonImport = () => {
    try {
      const data = JSON.parse(jsonInput);
      const bosses = Array.isArray(data) ? data : [data];
      bulkImportMutation.mutate(bosses);
    } catch (error) {
      (window as any).showToast?.('❌ Invalid JSON format', 'error');
    }
  };

  // Export bosses to JSON
  const handleExportJson = () => {
    if (!bosses || bosses.length === 0) {
      (window as any).showToast?.('⚠️ No bosses to export', 'warning');
      return;
    }

    const exportData = bosses.map((boss: any) => ({
      name: boss.name,
      description: boss.description,
      spriteId: boss.spriteId,
      iconId: boss.iconId,
      phases: boss.phases,
      spawnIntervalHours: boss.spawnIntervalHours,
      battleDurationMinutes: boss.battleDurationMinutes,
      rewardGold: boss.rewardGold,
      rewardExp: boss.rewardExp,
      rewardGems: boss.rewardGems,
      lootTable: boss.lootTable,
      minLevel: boss.minLevel,
      minCP: boss.minCP,
      isActive: boss.isActive,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `world_bosses_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    (window as any).showToast?.('📥 Bosses exported successfully!', 'success');
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400">Loading world bosses...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-stone-800 border-2 border-red-600 p-4" style={{ borderRadius: '0' }}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Skull className="text-red-400" />
            World Boss Management
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="py-2 px-4 bg-blue-700 hover:bg-blue-600 text-white font-bold flex items-center gap-2"
              style={{ border: '2px solid #1e40af', borderRadius: '0' }}
            >
              <Upload size={16} />
              Import JSON
            </button>
            <button
              onClick={handleExportJson}
              disabled={!bosses || bosses.length === 0}
              className="py-2 px-4 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold flex items-center gap-2"
              style={{ border: '2px solid #6b21a8', borderRadius: '0' }}
            >
              <Download size={16} />
              Export JSON
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="py-2 px-4 bg-green-700 hover:bg-green-600 text-white font-bold flex items-center gap-2"
              style={{ border: '2px solid #15803d', borderRadius: '0' }}
            >
              <Plus size={16} />
              Create Boss
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-400">
          Manage server-wide raid bosses. Players fight together with real-time damage tracking and leaderboards.
        </p>
      </div>

      {/* Boss List */}
      <div className="space-y-3">
        {!bosses || bosses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No world bosses created yet. Click "Create Boss" to add one!
          </div>
        ) : (
          bosses.map((boss: any) => (
            <BossCard
              key={boss.id}
              boss={boss}
              onEdit={() => setEditingBoss(boss)}
              onDelete={() => {
                if (window.confirm(`Delete "${boss.name}"? This cannot be undone!`)) {
                  deleteBossMutation.mutate(boss.id);
                }
              }}
              onSpawn={() => spawnBossMutation.mutate(boss.id)}
              isSpawning={spawnBossMutation.isPending}
            />
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingBoss) && (
        <BossFormModal
          boss={editingBoss}
          items={items || []}
          onClose={() => {
            setShowCreateModal(false);
            setEditingBoss(null);
          }}
          onSubmit={(data) => {
            if (editingBoss) {
              updateBossMutation.mutate({ id: editingBoss.id, data });
            } else {
              createBossMutation.mutate(data);
            }
          }}
          isSubmitting={createBossMutation.isPending || updateBossMutation.isPending}
        />
      )}

      {/* Import JSON Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-stone-800 border-4 border-blue-600 p-6 max-w-4xl w-full my-8" style={{ borderRadius: '0' }}>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Upload size={24} />
              Import World Bosses from JSON
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2 font-bold">Upload JSON File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white font-bold flex items-center gap-2"
                  style={{ border: '2px solid #374151', borderRadius: '0' }}
                >
                  <Upload size={18} />
                  Choose File
                </button>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-bold">Or Paste JSON Content</label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='Paste JSON here...'
                  className="w-full h-96 bg-stone-900 text-white px-4 py-3 border-2 border-stone-700 font-mono text-sm"
                  style={{ borderRadius: '0' }}
                />
              </div>

              <div className="bg-stone-900 border-2 border-yellow-600 p-4" style={{ borderRadius: '0' }}>
                <h4 className="text-yellow-400 font-bold mb-2">📋 JSON Format Example:</h4>
                <pre className="text-xs text-gray-300 overflow-x-auto">
{`[
  {
    "name": "Ancient Dragon Lord",
    "description": "A legendary dragon that has awakened from its millennium slumber",
    "spriteId": "dragon_boss",
    "iconId": "boss",
    "spawnIntervalHours": 12,
    "battleDurationMinutes": 30,
    "minLevel": 20,
    "minCP": 5000,
    "rewardGold": 50000,
    "rewardExp": 25000,
    "rewardGems": 500,
    "lootTable": [],
    "isActive": true,
    "phases": [
      {
        "phase": 1,
        "name": "🔥 Fire Phase",
        "hp": 500000,
        "attack": 150,
        "defense": 80,
        "element": "fire"
      },
      {
        "phase": 2,
        "name": "❄️ Ice Phase",
        "hp": 750000,
        "attack": 180,
        "defense": 100,
        "element": "ice"
      },
      {
        "phase": 3,
        "name": "⚡ Final Phase",
        "hp": 1000000,
        "attack": 220,
        "defense": 120,
        "element": "lightning"
      }
    ]
  }
]`}
                </pre>
              </div>

              <div className="flex gap-3 pt-4 border-t-2 border-stone-700">
                <button
                  onClick={handleJsonImport}
                  disabled={!jsonInput || bulkImportMutation.isPending}
                  className="flex-1 py-3 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold"
                  style={{ border: '2px solid #15803d', borderRadius: '0' }}
                >
                  {bulkImportMutation.isPending ? 'Importing...' : 'Import Bosses'}
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setJsonInput('');
                  }}
                  disabled={bulkImportMutation.isPending}
                  className="flex-1 py-3 bg-red-700 hover:bg-red-600 disabled:bg-gray-600 text-white font-bold"
                  style={{ border: '2px solid #991b1b', borderRadius: '0' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Boss Card Component
function BossCard({
  boss,
  onEdit,
  onDelete,
  onSpawn,
  isSpawning,
}: {
  boss: any;
  onEdit: () => void;
  onDelete: () => void;
  onSpawn: () => void;
  isSpawning: boolean;
}) {
  const phases = boss.phases as any[];
  const totalHP = phases.reduce((sum: number, p: any) => sum + p.hp, 0);
  const activeInstance = boss.instances?.[0];

  return (
    <div
      className={`bg-stone-800 border-2 ${
        boss.isActive ? 'border-red-600' : 'border-stone-700'
      } p-4`}
      style={{ borderRadius: '0' }}
    >
      <div className="flex gap-4 mb-3">
        {/* Boss Sprite */}
        <div className="flex-shrink-0">
          <img
            src={`/src/assets/ui/bossIcons/${boss.spriteId}.png`}
            alt={boss.name}
            className="w-20 h-20 object-contain border-2 border-red-600 bg-stone-900 p-1"
            style={{ imageRendering: 'pixelated' }}
            onError={(e) => {
              // Fallback to skull icon if sprite not found
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-lg font-bold text-white">{boss.name}</h4>
            {!boss.isActive && (
              <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs font-bold">
                INACTIVE
              </span>
            )}
            {activeInstance?.status === 'active' && (
              <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold animate-pulse">
                LIVE NOW
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-2">{boss.description}</p>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="bg-stone-900 p-2">
              <div className="text-gray-400">Total HP</div>
              <div className="text-white font-bold">{totalHP.toLocaleString()}</div>
            </div>
            <div className="bg-stone-900 p-2">
              <div className="text-gray-400">Phases</div>
              <div className="text-white font-bold">{phases.length}</div>
            </div>
            <div className="bg-stone-900 p-2">
              <div className="text-gray-400">Min Level</div>
              <div className="text-white font-bold">{boss.minLevel}</div>
            </div>
            <div className="bg-stone-900 p-2">
              <div className="text-gray-400">Min CP</div>
              <div className="text-white font-bold">{boss.minCP}</div>
            </div>
          </div>

          {/* Rewards */}
          <div className="mt-2 flex gap-3 text-sm">
            <span className="text-yellow-400">💰 {boss.rewardGold.toLocaleString()}</span>
            <span className="text-cyan-400">⭐ {boss.rewardExp.toLocaleString()} XP</span>
            <span className="text-purple-400">💎 {boss.rewardGems}</span>
          </div>

          {/* Spawn Info */}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              Spawns every {boss.spawnIntervalHours}h
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} />
              {boss.battleDurationMinutes} min battle
            </span>
          </div>

          {/* Active Instance Info */}
          {activeInstance && activeInstance.status === 'active' && (
            <div className="mt-2 bg-red-900/30 border border-red-600 p-2 text-xs">
              <div className="text-red-400 font-bold mb-1">ACTIVE BATTLE</div>
              <div className="text-gray-300">
                Phase {activeInstance.currentPhase}/{phases.length} • 
                {' '}{activeInstance.participantCount} players fighting
              </div>
              <div className="text-gray-400">
                Ends: {new Date(activeInstance.endsAt).toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 ml-4">
          <button
            onClick={onSpawn}
            disabled={isSpawning || (activeInstance?.status === 'active')}
            className="px-3 py-1.5 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1"
            style={{ border: '2px solid #15803d', borderRadius: '0' }}
            title={activeInstance?.status === 'active' ? 'Boss already active' : 'Spawn boss now'}
          >
            <Play size={14} />
            Spawn
          </button>
          <button
            onClick={onEdit}
            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1"
            style={{ border: '2px solid #1e40af', borderRadius: '0' }}
          >
            <Edit size={14} />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1"
            style={{ border: '2px solid #991b1b', borderRadius: '0' }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Boss Form Modal Component
function BossFormModal({
  boss,
  items,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  boss?: any;
  items: any[];
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'basic' | 'rewards' | 'phases'>('basic');
  const [itemSearch, setItemSearch] = useState('');
  const [formData, setFormData] = useState({
    name: boss?.name || '',
    description: boss?.description || '',
    spriteId: boss?.spriteId || 'dragon_boss',
    iconId: boss?.iconId || 'boss',
    spawnIntervalHours: boss?.spawnIntervalHours || 12,
    battleDurationMinutes: boss?.battleDurationMinutes || 30,
    minLevel: boss?.minLevel || 20,
    minCP: boss?.minCP || 5000,
    rewardGold: boss?.rewardGold || 10000,
    rewardExp: boss?.rewardExp || 5000,
    rewardGems: boss?.rewardGems || 100,
    lootTable: boss?.lootTable || [],
    isActive: boss?.isActive ?? true,
    autoSpawn: boss?.autoSpawn ?? false,
    phases: boss?.phases || [
      { phase: 1, name: 'Fire Phase', hp: 100000, attack: 100, defense: 50, element: 'fire' },
      { phase: 2, name: 'Ice Phase', hp: 150000, attack: 120, defense: 60, element: 'ice' },
      { phase: 3, name: 'Lightning Phase', hp: 200000, attack: 150, defense: 70, element: 'lightning' },
    ],
  });

  const toggleLootItem = (itemId: string) => {
    const existing = formData.lootTable.find((l: any) => l.itemId === itemId);
    if (existing) {
      setFormData({
        ...formData,
        lootTable: formData.lootTable.filter((l: any) => l.itemId !== itemId),
      });
    } else {
      setFormData({
        ...formData,
        lootTable: [...formData.lootTable, { itemId, dropRate: 25 }],
      });
    }
  };

  const updateDropRate = (itemId: string, dropRate: number) => {
    setFormData({
      ...formData,
      lootTable: formData.lootTable.map((l: any) =>
        l.itemId === itemId ? { ...l, dropRate } : l
      ),
    });
  };

  const filteredItems = items.filter((item: any) =>
    item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.type.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updatePhase = (index: number, field: string, value: any) => {
    const newPhases = [...formData.phases];
    newPhases[index] = { ...newPhases[index], [field]: value };
    setFormData({ ...formData, phases: newPhases });
  };

  const addPhase = () => {
    setFormData({
      ...formData,
      phases: [
        ...formData.phases,
        {
          phase: formData.phases.length + 1,
          name: `Phase ${formData.phases.length + 1}`,
          hp: 100000,
          attack: 100,
          defense: 50,
          element: 'fire',
        },
      ],
    });
  };

  const removePhase = (index: number) => {
    if (formData.phases.length <= 1) {
      (window as any).showToast?.('Boss must have at least 1 phase', 'error');
      return;
    }
    const newPhases = formData.phases.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, phases: newPhases });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-stone-800 border-4 border-red-600 p-6 max-w-4xl w-full my-8" style={{ borderRadius: '0' }}>
        <h3 className="text-xl font-bold text-white mb-4">
          {boss ? 'Edit World Boss' : 'Create World Boss'}
        </h3>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4 border-b-2 border-stone-700">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2 font-bold text-sm ${
              activeTab === 'basic'
                ? 'bg-red-700 text-white border-t-2 border-x-2 border-red-600'
                : 'bg-stone-900 text-gray-400 hover:text-white'
            }`}
            style={{ borderRadius: '0', borderBottom: activeTab === 'basic' ? '2px solid #1c1917' : 'none' }}
          >
            📝 BASIC INFO
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rewards')}
            className={`px-4 py-2 font-bold text-sm ${
              activeTab === 'rewards'
                ? 'bg-red-700 text-white border-t-2 border-x-2 border-red-600'
                : 'bg-stone-900 text-gray-400 hover:text-white'
            }`}
            style={{ borderRadius: '0', borderBottom: activeTab === 'rewards' ? '2px solid #1c1917' : 'none' }}
          >
            💰 REWARDS & LOOT
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('phases')}
            className={`px-4 py-2 font-bold text-sm ${
              activeTab === 'phases'
                ? 'bg-red-700 text-white border-t-2 border-x-2 border-red-600'
                : 'bg-stone-900 text-gray-400 hover:text-white'
            }`}
            style={{ borderRadius: '0', borderBottom: activeTab === 'phases' ? '2px solid #1c1917' : 'none' }}
          >
            🔥 BOSS PHASES
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* BASIC INFO TAB */}
          {activeTab === 'basic' && (
            <>
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Boss Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full p-2 bg-stone-900 text-white border-2 border-stone-700"
                style={{ borderRadius: '0' }}
                placeholder="e.g., Ancient Dragon Lord"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Sprite ID *</label>
              <input
                type="text"
                value={formData.spriteId}
                onChange={(e) => setFormData({ ...formData, spriteId: e.target.value })}
                required
                className="w-full p-2 bg-stone-900 text-white border-2 border-stone-700"
                style={{ borderRadius: '0' }}
                placeholder="e.g., dragon_boss"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={2}
              className="w-full p-2 bg-stone-900 text-white border-2 border-stone-700"
              style={{ borderRadius: '0' }}
              placeholder="A terrifying ancient dragon awakens..."
            />
          </div>

          {/* Requirements & Timing */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Min Level</label>
              <input
                type="number"
                value={formData.minLevel}
                onChange={(e) => setFormData({ ...formData, minLevel: parseInt(e.target.value) })}
                className="w-full p-2 bg-stone-900 text-white border-2 border-stone-700"
                style={{ borderRadius: '0' }}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Min CP</label>
              <input
                type="number"
                value={formData.minCP}
                onChange={(e) => setFormData({ ...formData, minCP: parseInt(e.target.value) })}
                className="w-full p-2 bg-stone-900 text-white border-2 border-stone-700"
                style={{ borderRadius: '0' }}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Spawn Interval (hours)</label>
              <input
                type="number"
                value={formData.spawnIntervalHours}
                onChange={(e) => setFormData({ ...formData, spawnIntervalHours: parseInt(e.target.value) })}
                className="w-full p-2 bg-stone-900 text-white border-2 border-stone-700"
                style={{ borderRadius: '0' }}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Battle Duration (min)</label>
              <input
                type="number"
                value={formData.battleDurationMinutes}
                onChange={(e) => setFormData({ ...formData, battleDurationMinutes: parseInt(e.target.value) })}
                className="w-full p-2 bg-stone-900 text-white border-2 border-stone-700"
                style={{ borderRadius: '0' }}
              />
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            <label className="text-sm text-gray-400">Boss is active (can spawn)</label>
          </div>

          {/* Auto-Spawn Toggle */}
          <div className="bg-stone-900 border-2 border-yellow-600 p-4">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={formData.autoSpawn}
                onChange={(e) => setFormData({ ...formData, autoSpawn: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm font-bold text-yellow-400">⏰ Auto-Spawn Enabled</label>
            </div>
            <p className="text-xs text-gray-400 ml-6">
              Boss will automatically spawn every <strong>{formData.spawnIntervalHours} hours</strong> after being defeated or timing out.
              {!formData.autoSpawn && " (Currently disabled - spawn manually from admin panel)"}
            </p>
          </div>
            </>
          )}

          {/* REWARDS & LOOT TAB */}
          {activeTab === 'rewards' && (
            <>
          {/* Rewards */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">💰 Gold Reward</label>
              <input
                type="number"
                value={formData.rewardGold}
                onChange={(e) => setFormData({ ...formData, rewardGold: parseInt(e.target.value) })}
                className="w-full p-2 bg-stone-900 text-white border-2 border-stone-700"
                style={{ borderRadius: '0' }}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">⭐ EXP Reward</label>
              <input
                type="number"
                value={formData.rewardExp}
                onChange={(e) => setFormData({ ...formData, rewardExp: parseInt(e.target.value) })}
                className="w-full p-2 bg-stone-900 text-white border-2 border-stone-700"
                style={{ borderRadius: '0' }}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">💎 Gems Reward</label>
              <input
                type="number"
                value={formData.rewardGems}
                onChange={(e) => setFormData({ ...formData, rewardGems: parseInt(e.target.value) })}
                className="w-full p-2 bg-stone-900 text-white border-2 border-stone-700"
                style={{ borderRadius: '0' }}
              />
            </div>
          </div>

          {/* Loot Table */}
          <div className="border-t border-stone-700 pt-4 mt-4">
            <h4 className="text-md font-bold text-white mb-2">💎 Loot Table</h4>
            <p className="text-xs text-gray-500 mb-3">Select items that can drop from this boss</p>
            
            {/* Selected Items */}
            {formData.lootTable.length > 0 && (
              <div className="mb-3 p-3 bg-stone-900 border border-yellow-600">
                <p className="text-sm text-yellow-400 mb-2">Selected Items ({formData.lootTable.length})</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {formData.lootTable.map((loot: any) => {
                    const item = items.find((i: any) => i.id === loot.itemId);
                    return item ? (
                      <div key={loot.itemId} className="flex items-center justify-between gap-2 p-2 bg-stone-800">
                        <span className="text-white text-sm">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={loot.dropRate}
                            onChange={(e) => updateDropRate(loot.itemId, parseInt(e.target.value))}
                            className="w-16 p-1 bg-stone-900 text-white border border-stone-700 text-xs"
                            style={{ borderRadius: '0' }}
                          />
                          <span className="text-gray-400 text-xs">%</span>
                          <button
                            type="button"
                            onClick={() => toggleLootItem(loot.itemId)}
                            className="px-2 py-1 bg-red-700 hover:bg-red-600 text-white text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Search & Select Items */}
            <input
              type="text"
              placeholder="Search items..."
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              className="w-full p-2 bg-stone-900 text-white border-2 border-stone-700 mb-2"
              style={{ borderRadius: '0' }}
            />
            
            <div className="max-h-48 overflow-y-auto bg-stone-900 border border-stone-700">
              {filteredItems.length > 0 ? (
                filteredItems.map((item: any) => {
                  const isSelected = formData.lootTable.some((l: any) => l.itemId === item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleLootItem(item.id)}
                      className={`p-2 cursor-pointer hover:bg-stone-800 flex items-center justify-between ${
                        isSelected ? 'bg-yellow-900/30 border-l-4 border-yellow-600' : ''
                      }`}
                    >
                      <span className="text-white text-sm">
                        {isSelected && '✓ '}
                        {item.name}
                      </span>
                      <span className="text-gray-400 text-xs">{item.type} | {item.rarity}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-4 text-sm">No items found</p>
              )}
            </div>
          </div>

            </>
          )}

          {/* BOSS PHASES TAB */}
          {activeTab === 'phases' && (
            <>
          {/* Phases */}
          <div className="border-t border-stone-700 pt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-bold text-white">Boss Phases</h4>
              <button
                type="button"
                onClick={addPhase}
                className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white font-bold text-xs"
                style={{ border: '2px solid #15803d', borderRadius: '0' }}
              >
                <Plus size={12} className="inline mr-1" />
                Add Phase
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {formData.phases.map((phase: any, index: number) => (
                <div key={index} className="bg-stone-900 border border-stone-700 p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-bold">Phase {index + 1}</span>
                    {formData.phases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhase(index)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <input
                      type="text"
                      value={phase.name}
                      onChange={(e) => updatePhase(index, 'name', e.target.value)}
                      placeholder="Phase Name"
                      className="p-1.5 bg-stone-800 text-white border border-stone-700 text-sm"
                      style={{ borderRadius: '0' }}
                    />
                    <input
                      type="number"
                      value={phase.hp}
                      onChange={(e) => updatePhase(index, 'hp', parseInt(e.target.value))}
                      placeholder="HP"
                      className="p-1.5 bg-stone-800 text-white border border-stone-700 text-sm"
                      style={{ borderRadius: '0' }}
                    />
                    <input
                      type="number"
                      value={phase.attack}
                      onChange={(e) => updatePhase(index, 'attack', parseInt(e.target.value))}
                      placeholder="ATK"
                      className="p-1.5 bg-stone-800 text-white border border-stone-700 text-sm"
                      style={{ borderRadius: '0' }}
                    />
                    <input
                      type="number"
                      value={phase.defense}
                      onChange={(e) => updatePhase(index, 'defense', parseInt(e.target.value))}
                      placeholder="DEF"
                      className="p-1.5 bg-stone-800 text-white border border-stone-700 text-sm"
                      style={{ borderRadius: '0' }}
                    />
                    <select
                      value={phase.element}
                      onChange={(e) => updatePhase(index, 'element', e.target.value)}
                      className="p-1.5 bg-stone-800 text-white border border-stone-700 text-sm"
                      style={{ borderRadius: '0' }}
                    >
                      <option value="fire">🔥 Fire</option>
                      <option value="ice">❄️ Ice</option>
                      <option value="lightning">⚡ Lightning</option>
                      <option value="poison">☠️ Poison</option>
                      <option value="dark">🌑 Dark</option>
                      <option value="light">✨ Light</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-stone-700">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold"
              style={{ border: '2px solid #15803d', borderRadius: '0' }}
            >
              {isSubmitting ? 'Saving...' : boss ? 'Update Boss' : 'Create Boss'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-red-700 hover:bg-red-600 disabled:bg-gray-600 text-white font-bold"
              style={{ border: '2px solid #991b1b', borderRadius: '0' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
