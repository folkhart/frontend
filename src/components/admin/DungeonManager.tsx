import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Save, X } from "lucide-react";
import { toast } from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface LootItem {
  itemId: string;
  dropRate: number;
}

interface DungeonFormData {
  name: string;
  description: string;
  recommendedLevel: number;
  difficulty: "Easy" | "Normal" | "Hard" | "Nightmare" | "Hell" | "Inferno";
  backgroundSprite: string;
  dungeonIcon: string; // Icon for dungeon display
  lootItems: LootItem[]; // Array of {itemId, dropRate}
  bossHealth?: number;
  bossAttack?: number;
  bossDefense?: number;
}

export default function DungeonManager() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingDungeon, setEditingDungeon] = useState<any>(null);
  const [deletingDungeon, setDeletingDungeon] = useState<any>(null);

  // Fetch dungeons
  const { data: dungeons, isLoading: loadingDungeons } = useQuery({
    queryKey: ["admin", "dungeons"],
    queryFn: async () => {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/admin/dungeons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.json();
    },
  });

  // Fetch items for loot table
  const { data: items } = useQuery({
    queryKey: ["admin", "items"],
    queryFn: async () => {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/admin/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.json();
    },
  });

  // Delete dungeon mutation
  const deleteDungeonMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/admin/dungeons/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to delete dungeon");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Dungeon deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "dungeons"] });
      setDeletingDungeon(null);
    },
    onError: () => {
      toast.error("Failed to delete dungeon");
    },
  });

  // Filter dungeons
  const filteredDungeons = useMemo(() => {
    if (!dungeons) return [];
    return dungeons.filter((d: any) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [dungeons, searchTerm]);

  // Auto-calculate stats based on level
  const calculateDungeonStats = (level: number) => {
    const baseGold = Math.floor(25 + level * 25);
    const baseExp = Math.floor(50 + level * 50);
    const duration = Math.floor(300 + level * 60); // 5min + 1min per level
    const energyCost = Math.floor(5 + level * 2);
    const recommendedCP = Math.floor(25 + level * 15);

    // Boss stats scale with level
    const bossHealth = Math.floor(500 + level * 250);
    const bossAttack = Math.floor(25 + level * 8);
    const bossDefense = Math.floor(15 + level * 5);

    return {
      baseGold,
      baseExp,
      duration,
      energyCost,
      recommendedCP,
      bossHealth,
      bossAttack,
      bossDefense,
    };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search dungeons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold rounded-lg flex items-center gap-2 transition shadow-lg"
        >
          <Plus size={18} />
          Create Dungeon
        </button>
      </div>

      {/* Dungeons List */}
      <div className="space-y-2">
        {loadingDungeons ? (
          <p className="text-gray-400 text-center py-8">Loading dungeons...</p>
        ) : filteredDungeons.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No dungeons found</p>
        ) : (
          filteredDungeons.map((dungeon: any) => (
            <DungeonCard
              key={dungeon.id}
              dungeon={dungeon}
              onEdit={() => setEditingDungeon(dungeon)}
              onDelete={() => setDeletingDungeon(dungeon)}
            />
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingDungeon && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-red-500 rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-red-400 font-bold text-xl mb-4">Delete Dungeon?</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <span className="text-white font-bold">{deletingDungeon.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingDungeon(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteDungeonMutation.mutate(deletingDungeon.id)}
                disabled={deleteDungeonMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold disabled:opacity-50 transition"
              >
                {deleteDungeonMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingDungeon) && (
        <DungeonModal
          dungeon={editingDungeon}
          items={items || []}
          onClose={() => {
            setShowCreateModal(false);
            setEditingDungeon(null);
          }}
          calculateStats={calculateDungeonStats}
        />
      )}
    </div>
  );
}

function DungeonCard({ dungeon, onEdit, onDelete }: any) {
  const difficultyColors: Record<string, string> = {
    Easy: "text-green-400",
    Normal: "text-blue-400",
    Hard: "text-purple-400",
    Nightmare: "text-red-400",
    Hell: "text-orange-400",
    Inferno: "text-yellow-400",
  };

  return (
    <div className="bg-stone-800 border-2 border-stone-700 rounded-lg p-4 hover:border-orange-500 transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-white">{dungeon.name}</h3>
            <span
              className={`text-sm font-bold ${
                difficultyColors[dungeon.difficulty]
              }`}
            >
              {dungeon.difficulty}
            </span>
            <span className="text-sm text-gray-400">
              Lv {dungeon.recommendedLevel}
            </span>
          </div>
          <p className="text-sm text-gray-300 mb-3">{dungeon.description}</p>

          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="bg-gray-900 p-2 rounded">
              <div className="text-gray-400">Gold</div>
              <div className="text-yellow-400 font-bold">
                {dungeon.baseGoldReward}g
              </div>
            </div>
            <div className="bg-gray-900 p-2 rounded">
              <div className="text-gray-400">EXP</div>
              <div className="text-purple-400 font-bold">
                {dungeon.baseExpReward}
              </div>
            </div>
            <div className="bg-gray-900 p-2 rounded">
              <div className="text-gray-400">Energy</div>
              <div className="text-orange-400 font-bold">
                {dungeon.energyCost}
              </div>
            </div>
            <div className="bg-gray-900 p-2 rounded">
              <div className="text-gray-400">Boss HP</div>
              <div className="text-red-400 font-bold">{dungeon.bossHealth}</div>
            </div>
          </div>
        </div>

        <div className="ml-4 flex flex-col gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-2"
          >
            <Edit size={16} />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded flex items-center gap-2"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function DungeonModal({ dungeon, items, onClose, calculateStats }: any) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<DungeonFormData>({
    name: dungeon?.name || '',
    description: dungeon?.description || '',
    recommendedLevel: dungeon?.recommendedLevel || 1,
    difficulty: dungeon?.difficulty || 'Normal',
    backgroundSprite: dungeon?.backgroundSprite || 'dungeon_cave',
    dungeonIcon: dungeon?.dungeonIcon || 'slimeDen',
    lootItems: Array.isArray(dungeon?.lootTable) 
      ? dungeon.lootTable.map((l: any) => ({ itemId: l.itemId, dropRate: l.dropRate || 0.25 }))
      : [],
    bossHealth: dungeon?.bossHealth,
    bossAttack: dungeon?.bossAttack,
    bossDefense: dungeon?.bossDefense,
  });

  const [searchLoot, setSearchLoot] = useState("");
  const stats = useMemo(
    () => calculateStats(formData.recommendedLevel),
    [formData.recommendedLevel, calculateStats]
  );

  // Filter items for loot selection
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item: any) =>
      item.name.toLowerCase().includes(searchLoot.toLowerCase())
    );
  }, [items, searchLoot]);

  const createDungeonMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/admin/dungeons`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create dungeon");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Dungeon created successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "dungeons"] });
      onClose();
    },
  });

  const updateDungeonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/admin/dungeons/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update dungeon");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Dungeon updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "dungeons"] });
      onClose();
    },
  });

  const handleSubmit = () => {
    const dungeonData = {
      ...formData,
      ...stats,
      // Use custom boss stats if provided, otherwise use auto-calculated
      bossHealth: formData.bossHealth ?? stats.bossHealth,
      bossAttack: formData.bossAttack ?? stats.bossAttack,
      bossDefense: formData.bossDefense ?? stats.bossDefense,
      lootTable: formData.lootItems,
    };
    
    if (dungeon?.id) {
      // Editing existing dungeon
      updateDungeonMutation.mutate({ id: dungeon.id, data: dungeonData });
    } else {
      // Creating new dungeon
      createDungeonMutation.mutate(dungeonData);
    }
  };

  const toggleLootItem = (itemId: string) => {
    setFormData((prev) => {
      const exists = prev.lootItems.find(item => item.itemId === itemId);
      return {
        ...prev,
        lootItems: exists
          ? prev.lootItems.filter((item) => item.itemId !== itemId)
          : [...prev.lootItems, { itemId, dropRate: 0.25 }],
      };
    });
  };

  const updateDropRate = (itemId: string, dropRate: number) => {
    setFormData((prev) => ({
      ...prev,
      lootItems: prev.lootItems.map((item) =>
        item.itemId === itemId ? { ...item, dropRate: Math.max(0, Math.min(1, dropRate)) } : item
      ),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-orange-500 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-4 flex items-center justify-between">
          <h3 className="text-white font-bold text-xl">
            {dungeon ? "Edit Dungeon" : "Create New Dungeon"}
          </h3>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <h4 className="text-yellow-400 font-bold text-lg mb-3">
                Basic Information
              </h4>

              <div>
                <label className="block text-gray-300 mb-2">Dungeon Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                  placeholder="e.g., Veiled Sanctum"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                  rows={3}
                  placeholder="Describe the dungeon..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Level</label>
                  <input
                    type="number"
                    value={formData.recommendedLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recommendedLevel: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    max="50"
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        difficulty: e.target.value as any,
                      })
                    }
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Normal">Normal</option>
                    <option value="Hard">Hard</option>
                    <option value="Nightmare">Nightmare</option>
                    <option value="Hell">Hell</option>
                    <option value="Inferno">Inferno</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Dungeon Icon</label>
                <input
                  type="text"
                  value={formData.dungeonIcon}
                  onChange={(e) =>
                    setFormData({ ...formData, dungeonIcon: e.target.value })
                  }
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                  placeholder="e.g., slimeDen, dragonLair, etc."
                />
                <p className="text-xs text-gray-400 mt-1">Icon filename (without .png)</p>
              </div>

              {/* Auto-calculated Stats */}
              <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
                <h5 className="text-blue-400 font-bold mb-3">
                  📊 Auto-Calculated Stats
                </h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Gold Reward:</span>{" "}
                    <span className="text-yellow-400 font-bold">
                      {stats.baseGold}g
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">EXP Reward:</span>{" "}
                    <span className="text-purple-400 font-bold">
                      {stats.baseExp}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Duration:</span>{" "}
                    <span className="text-blue-400 font-bold">
                      {Math.floor(stats.duration / 60)}min
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Energy Cost:</span>{" "}
                    <span className="text-orange-400 font-bold">
                      {stats.energyCost}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Recommended CP:</span>{" "}
                    <span className="text-green-400 font-bold">
                      {stats.recommendedCP}
                    </span>
                  </div>
                </div>
              </div>

              {/* Editable Boss Stats */}
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                <h5 className="text-red-400 font-bold mb-3">
                  👹 Boss Stats (Editable)
                </h5>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Boss HP</label>
                    <input
                      type="number"
                      value={formData.bossHealth ?? stats.bossHealth}
                      onChange={(e) =>
                        setFormData({ ...formData, bossHealth: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-red-500 focus:outline-none text-sm"
                      placeholder={stats.bossHealth.toString()}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Boss ATK</label>
                    <input
                      type="number"
                      value={formData.bossAttack ?? stats.bossAttack}
                      onChange={(e) =>
                        setFormData({ ...formData, bossAttack: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-red-500 focus:outline-none text-sm"
                      placeholder={stats.bossAttack.toString()}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Boss DEF</label>
                    <input
                      type="number"
                      value={formData.bossDefense ?? stats.bossDefense}
                      onChange={(e) =>
                        setFormData({ ...formData, bossDefense: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-red-500 focus:outline-none text-sm"
                      placeholder={stats.bossDefense.toString()}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Auto-calculated: HP {stats.bossHealth}, ATK {stats.bossAttack}, DEF {stats.bossDefense}
                </p>
              </div>
            </div>

            {/* Right Column - Loot Table */}
            <div className="space-y-4">
              <h4 className="text-yellow-400 font-bold text-lg mb-3">
                Loot Table
              </h4>

              {/* Selected Items with Drop Rate Controls */}
              {formData.lootItems.length > 0 && (
                <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-3">
                  <h5 className="text-blue-400 font-bold text-sm mb-2">
                    Selected Items ({formData.lootItems.length})
                  </h5>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                  {formData.lootItems.map((lootItem) => {
                    const item = items?.find((i: any) => i.id === lootItem.itemId);
                    if (!item) return null;
                    return (
                      <div
                        key={lootItem.itemId}
                        className="bg-gray-800 border border-gray-700 rounded p-2"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="text-white font-bold text-sm">{item.name}</div>
                            <div className="text-gray-400 text-xs">{item.type} - {item.rarity}</div>
                          </div>
                          <button
                            onClick={() => toggleLootItem(lootItem.itemId)}
                            className="text-red-400 hover:text-red-300 transition"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs">Drop Rate:</span>
                          <input
                            type="number"
                            value={(lootItem.dropRate * 100).toFixed(0)}
                            onChange={(e) =>
                              updateDropRate(lootItem.itemId, parseFloat(e.target.value) / 100)
                            }
                            min="0"
                            max="100"
                            step="5"
                            className="flex-1 bg-gray-900 text-white px-2 py-1 text-sm rounded border border-gray-700 focus:border-orange-500 focus:outline-none"
                          />
                          <span className="text-gray-400 text-xs">%</span>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}

              {/* Search Items */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search items to add..."
                  value={searchLoot}
                  onChange={(e) => setSearchLoot(e.target.value)}
                  className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="bg-gray-900 rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                {filteredItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No items found
                  </p>
                ) : (
                  filteredItems.map((item: any) => {
                    const isSelected = formData.lootItems.some(l => l.itemId === item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleLootItem(item.id)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                          isSelected
                            ? "bg-orange-900/30 border-orange-500"
                            : "bg-gray-800 border-gray-700 hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <div className="text-white font-bold text-sm">
                              {item.name}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {item.type} - {item.rarity}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-900 p-4 flex justify-end gap-2 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              !formData.name ||
              !formData.description ||
              createDungeonMutation.isPending ||
              updateDungeonMutation.isPending
            }
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
          >
            <Save size={18} />
            {createDungeonMutation.isPending || updateDungeonMutation.isPending
              ? dungeon ? "Updating..." : "Creating..."
              : dungeon
              ? "Update Dungeon"
              : "Create Dungeon"}
          </button>
        </div>
      </div>
    </div>
  );
}
