import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Edit, Trash2, Save, X, Upload, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { getItemImage } from "@/utils/itemSprites";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface ItemFormData {
  name: string;
  description: string;
  type: string;
  rarity: string;
  levelRequirement: number;
  baseValue: number;
  spriteId: string;
  classRestriction?: string;
  accessoryType?: string;
  attackBonus?: number;
  defenseBonus?: number;
  healthBonus?: number;
  speedBonus?: number;
  stackable?: boolean;
}

export default function ItemManager() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [jsonInput, setJsonInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch items
  const { data: items, isLoading } = useQuery({
    queryKey: ["admin", "items"],
    queryFn: async () => {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/admin/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.json();
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/admin/items/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to delete item");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Item deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "items"] });
      setDeletingItem(null);
    },
    onError: () => {
      toast.error("Failed to delete item");
    },
  });

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (items: any[]) => {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/admin/items/bulk`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      });
      if (!response.ok) throw new Error("Failed to import items");
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.count} items!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "items"] });
      setShowImportModal(false);
      setJsonInput("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to import items");
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setJsonInput(content);
        toast.success("File loaded successfully!");
      } catch (error) {
        toast.error("Failed to read file");
      }
    };
    reader.readAsText(file);
  };

  const handleJsonImport = () => {
    try {
      const items = JSON.parse(jsonInput);
      if (!Array.isArray(items)) {
        toast.error("JSON must be an array of items");
        return;
      }
      bulkImportMutation.mutate(items);
    } catch (error) {
      toast.error("Invalid JSON format");
    }
  };

  // Filter items
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item: any) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || item.type === filterType;
      const matchesRarity = filterRarity === "all" || item.rarity === filterRarity;
      return matchesSearch && matchesType && matchesRarity;
    });
  }, [items, searchTerm, filterType, filterRarity]);

  const itemTypes = useMemo(() => {
    if (!items) return [];
    return Array.from(new Set(items.map((item: any) => item.type)));
  }, [items]);

  const itemRarities = useMemo(() => {
    if (!items) return [];
    return Array.from(new Set(items.map((item: any) => item.rarity)));
  }, [items]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Item Management</h2>
          <p className="text-sm text-gray-400">
            Total Items: {items?.length || 0}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-lg flex items-center gap-2 transition shadow-lg"
          >
            <Plus size={18} />
            Add Items
            <ChevronDown size={16} />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-gray-800 border-2 border-gray-700 rounded-lg shadow-xl z-50">
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition flex items-center gap-2 border-b border-gray-700"
              >
                <Plus size={18} />
                <div>
                  <div className="font-bold">Create Single Item</div>
                  <div className="text-xs text-gray-400">Manual item creation</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowImportModal(true);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition flex items-center gap-2 rounded-b-lg"
              >
                <Upload size={18} />
                <div>
                  <div className="font-bold">Import from JSON</div>
                  <div className="text-xs text-gray-400">Bulk import multiple items</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none min-w-[140px]"
        >
          <option value="all">All Types</option>
          {(itemTypes as string[]).map((type: string) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select
          value={filterRarity}
          onChange={(e) => setFilterRarity(e.target.value)}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none min-w-[140px]"
        >
          <option value="all">All Rarities</option>
          {(itemRarities as string[]).map((rarity: string) => (
            <option key={rarity} value={rarity}>
              {rarity}
            </option>
          ))}
        </select>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 gap-3">
        {isLoading ? (
          <p className="text-gray-400 text-center py-8">Loading items...</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No items found</p>
        ) : (
          filteredItems.map((item: any) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={() => setEditingItem(item)}
              onDelete={() => setDeletingItem(item)}
            />
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-red-500 rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-red-400 font-bold text-xl mb-4">Delete Item?</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="text-white font-bold">{deletingItem.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteItemMutation.mutate(deletingItem.id)}
                disabled={deleteItemMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold disabled:opacity-50 transition"
              >
                {deleteItemMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingItem) && (
        <ItemModal
          item={editingItem}
          onClose={() => {
            setShowCreateModal(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* JSON Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-purple-500 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-xl flex items-center gap-2">
                <Upload size={24} />
                Import Items from JSON
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-white hover:text-gray-200">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2 font-bold">
                    Upload JSON File or Paste JSON
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition flex items-center gap-2"
                  >
                    <Upload size={18} />
                    Choose File
                  </button>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 font-bold">
                    JSON Content ({jsonInput ? JSON.parse(jsonInput).length : 0} items)
                  </label>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='Paste your JSON here, e.g., [{"name": "Item Name", "type": "Weapon", ...}]'
                    className="w-full h-96 bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none font-mono text-sm"
                  />
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h4 className="text-yellow-400 font-bold mb-2">📋 JSON Format Example:</h4>
                  <pre className="text-xs text-gray-300 overflow-x-auto">
{`[
  {
    "name": "Golden Sword",
    "description": "A legendary golden blade",
    "type": "Weapon",
    "rarity": "Epic",
    "spriteId": "goldSet/goldSword",
    "attackBonus": 75,
    "defenseBonus": 0,
    "healthBonus": 0,
    "speedBonus": 0,
    "levelRequirement": 30,
    "baseValue": 12000,
    "classRestriction": "Warrior",
    "stackable": false
  }
]`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 p-4 flex justify-end gap-2 border-t border-gray-700">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setJsonInput("");
                }}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleJsonImport}
                disabled={!jsonInput || bulkImportMutation.isPending}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
              >
                <Upload size={18} />
                {bulkImportMutation.isPending ? "Importing..." : "Import Items"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemCard({ item, onEdit, onDelete }: any) {
  const rarityColors: Record<string, string> = {
    Common: "text-gray-400",
    Uncommon: "text-green-400",
    Rare: "text-blue-400",
    Epic: "text-purple-400",
    Legendary: "text-orange-400",
  };

  return (
    <div className="bg-stone-800 border-2 border-stone-700 rounded-lg p-4 hover:border-purple-500 transition">
      <div className="flex items-start justify-between">
        {/* Item Sprite */}
        <div className="w-16 h-16 bg-gray-900 rounded flex items-center justify-center mr-4 flex-shrink-0">
          {getItemImage(item.spriteId, item.type) ? (
            <img
              src={getItemImage(item.spriteId, item.type)!}
              alt={item.name}
              className="w-12 h-12 object-contain"
              style={{ imageRendering: "pixelated" }}
            />
          ) : (
            <span className="text-gray-600 text-xs">No Image</span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-white">{item.name}</h3>
            <span className={`text-sm font-bold ${rarityColors[item.rarity]}`}>
              {item.rarity}
            </span>
            <span className="text-sm text-gray-400">Lv {item.levelRequirement}</span>
            <span className="text-sm bg-gray-700 px-2 py-1 rounded">
              {item.type}
            </span>
          </div>
          <p className="text-sm text-gray-300 mb-3">{item.description}</p>

          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="bg-gray-900 p-2 rounded">
              <div className="text-gray-400">Value</div>
              <div className="text-yellow-400 font-bold">{item.baseValue}g</div>
            </div>
            {item.classRestriction && (
              <div className="bg-gray-900 p-2 rounded">
                <div className="text-gray-400">Class</div>
                <div className="text-purple-400 font-bold">{item.classRestriction}</div>
              </div>
            )}
            {item.attackBonus > 0 && (
              <div className="bg-gray-900 p-2 rounded">
                <div className="text-gray-400">ATK</div>
                <div className="text-red-400 font-bold">+{item.attackBonus}</div>
              </div>
            )}
            {item.defenseBonus > 0 && (
              <div className="bg-gray-900 p-2 rounded">
                <div className="text-gray-400">DEF</div>
                <div className="text-blue-400 font-bold">+{item.defenseBonus}</div>
              </div>
            )}
            {item.healthBonus > 0 && (
              <div className="bg-gray-900 p-2 rounded">
                <div className="text-gray-400">HP</div>
                <div className="text-green-400 font-bold">+{item.healthBonus}</div>
              </div>
            )}
            {item.stackable && (
              <div className="bg-gray-900 p-2 rounded">
                <div className="text-gray-400">Stackable</div>
                <div className="text-cyan-400 font-bold">✓ Yes</div>
              </div>
            )}
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

function ItemModal({ item, onClose }: any) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ItemFormData>({
    name: item?.name || "",
    description: item?.description || "",
    type: item?.type || "Weapon",
    rarity: item?.rarity || "Common",
    levelRequirement: item?.levelRequirement || 1,
    baseValue: item?.baseValue || 100,
    spriteId: item?.spriteId || "",
    classRestriction: item?.classRestriction || "",
    accessoryType: item?.accessoryType || "",
    attackBonus: item?.attackBonus || 0,
    defenseBonus: item?.defenseBonus || 0,
    healthBonus: item?.healthBonus || 0,
    speedBonus: item?.speedBonus || 0,
    stackable: item?.stackable ?? false,
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/admin/items`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create item");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Item created successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "items"] });
      onClose();
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/admin/items/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update item");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Item updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "items"] });
      onClose();
    },
  });

  const handleSubmit = () => {
    // Clean up data - remove empty strings and zero values
    const itemData: any = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      rarity: formData.rarity,
      levelRequirement: formData.levelRequirement,
      baseValue: formData.baseValue,
      spriteId: formData.spriteId,
    };

    // Add optional fields only if they have values
    if (formData.classRestriction) itemData.classRestriction = formData.classRestriction;
    if (formData.accessoryType) itemData.accessoryType = formData.accessoryType;
    if (formData.attackBonus && formData.attackBonus > 0) itemData.attackBonus = formData.attackBonus;
    if (formData.defenseBonus && formData.defenseBonus > 0) itemData.defenseBonus = formData.defenseBonus;
    if (formData.healthBonus && formData.healthBonus > 0) itemData.healthBonus = formData.healthBonus;
    if (formData.speedBonus && formData.speedBonus > 0) itemData.speedBonus = formData.speedBonus;
    itemData.stackable = formData.stackable ?? false;

    if (item?.id) {
      updateItemMutation.mutate({ id: item.id, data: itemData });
    } else {
      createItemMutation.mutate(itemData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-purple-500 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 flex items-center justify-between">
          <h3 className="text-white font-bold text-xl">
            {item ? "Edit Item" : "Create New Item"}
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
                <label className="block text-gray-300 mb-2">Item Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                  placeholder="e.g., Iron Sword"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                  rows={3}
                  placeholder="Describe the item..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Weapon">Weapon</option>
                    <option value="Armor">Armor</option>
                    <option value="Accessory">Accessory</option>
                    <option value="Consumable">Consumable</option>
                    <option value="Material">Material</option>
                    <option value="Quest">Quest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Rarity</label>
                  <select
                    value={formData.rarity}
                    onChange={(e) =>
                      setFormData({ ...formData, rarity: e.target.value })
                    }
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Common">Common</option>
                    <option value="Uncommon">Uncommon</option>
                    <option value="Rare">Rare</option>
                    <option value="Epic">Epic</option>
                    <option value="Legendary">Legendary</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Level Requirement</label>
                  <input
                    type="number"
                    value={formData.levelRequirement}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        levelRequirement: parseInt(e.target.value) || 1,
                      })
                    }
                    min="1"
                    max="50"
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Base Value (Gold)</label>
                  <input
                    type="number"
                    value={formData.baseValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        baseValue: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Class Restriction</label>
                  <select
                    value={formData.classRestriction || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, classRestriction: e.target.value })
                    }
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">None (All Classes)</option>
                    <option value="Warrior">Warrior</option>
                    <option value="Mage">Mage</option>
                    <option value="Ranger">Ranger</option>
                    <option value="Cleric">Cleric</option>
                    <option value="Rogue">Rogue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Accessory Type</label>
                  <input
                    type="text"
                    value={formData.accessoryType || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, accessoryType: e.target.value })
                    }
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                    placeholder="e.g., Ring, Necklace, Belt"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Sprite ID</label>
                <input
                  type="text"
                  value={formData.spriteId}
                  onChange={(e) =>
                    setFormData({ ...formData, spriteId: e.target.value })
                  }
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                  placeholder="e.g., weapons/sword_001"
                />
              </div>
            </div>

            {/* Right Column - Stats */}
            <div className="space-y-4">
              <h4 className="text-yellow-400 font-bold text-lg mb-3">
                Item Stats
              </h4>

              <div>
                <label className="block text-gray-300 mb-2">Attack Bonus</label>
                <input
                  type="number"
                  value={formData.attackBonus || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      attackBonus: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Defense Bonus</label>
                <input
                  type="number"
                  value={formData.defenseBonus || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defenseBonus: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Health Bonus</label>
                <input
                  type="number"
                  value={formData.healthBonus || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      healthBonus: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Speed Bonus</label>
                <input
                  type="number"
                  value={formData.speedBonus || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      speedBonus: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Stackable Checkbox */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.stackable ?? false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stackable: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-2 focus:ring-purple-500"
                  />
                  <div>
                    <div className="text-gray-300 font-bold">Stackable Item</div>
                    <div className="text-xs text-gray-400">Allow multiple items in one inventory slot</div>
                  </div>
                </label>
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
              createItemMutation.isPending ||
              updateItemMutation.isPending
            }
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
          >
            <Save size={18} />
            {createItemMutation.isPending || updateItemMutation.isPending
              ? item
                ? "Updating..."
                : "Creating..."
              : item
              ? "Update Item"
              : "Create Item"}
          </button>
        </div>
      </div>
    </div>
  );
}
