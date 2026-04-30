import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Edit, Trash2, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import { getItemImage } from "@/utils/itemSprites";
import { getRarityColor } from "@/utils/format";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface RecipeFormData {
  resultItemId: string;
  materials: Array<{ itemId: string; quantity: number }>;
  goldCost: number;
  levelRequirement: number;
}

export default function CraftingRecipeManager() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<any>(null);

  // Fetch recipes
  const { data: recipes, isLoading } = useQuery({
    queryKey: ["admin", "crafting-recipes"],
    queryFn: async () => {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/admin/crafting-recipes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.json();
    },
  });

  // Fetch all items for selection
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

  // Delete recipe mutation
  const deleteRecipeMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/admin/crafting-recipes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to delete recipe");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Recipe deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "crafting-recipes"] });
      setDeletingRecipe(null);
    },
    onError: () => {
      toast.error("Failed to delete recipe");
    },
  });

  // Filter recipes
  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];
    return recipes.filter((recipe: any) => {
      const resultItem = recipe.resultItem?.name || "";
      return resultItem.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [recipes, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Crafting Recipe Management</h2>
          <p className="text-sm text-gray-400">
            Total Recipes: {recipes?.length || 0}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-lg flex items-center gap-2 transition shadow-lg"
        >
          <Plus size={18} />
          Create Recipe
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Search by result item..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
        />
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 gap-3">
        {isLoading ? (
          <p className="text-gray-400 text-center py-8">Loading recipes...</p>
        ) : filteredRecipes.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No recipes found</p>
        ) : (
          filteredRecipes.map((recipe: any) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={() => setEditingRecipe(recipe)}
              onDelete={() => setDeletingRecipe(recipe)}
            />
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingRecipe && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-red-500 rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-red-400 font-bold text-xl mb-4">Delete Recipe?</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete the recipe for{" "}
              <span className="text-white font-bold">{deletingRecipe.resultItem?.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingRecipe(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteRecipeMutation.mutate(deletingRecipe.id)}
                disabled={deleteRecipeMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold disabled:opacity-50 transition"
              >
                {deleteRecipeMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingRecipe) && (
        <RecipeModal
          recipe={editingRecipe}
          items={items || []}
          onClose={() => {
            setShowCreateModal(false);
            setEditingRecipe(null);
          }}
        />
      )}
    </div>
  );
}

function RecipeCard({ recipe, onEdit, onDelete }: any) {
  return (
    <div className="bg-stone-800 border-2 border-stone-700 rounded-lg p-4 hover:border-green-500 transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {/* Result Item */}
            <div className="flex items-center gap-2">
              {getItemImage(recipe.resultItem?.spriteId, recipe.resultItem?.type) && (
                <img
                  src={getItemImage(recipe.resultItem?.spriteId, recipe.resultItem?.type)!}
                  alt={recipe.resultItem?.name}
                  className="w-12 h-12 object-contain"
                  style={{ imageRendering: "pixelated" }}
                />
              )}
              <div>
                <h3 className={`text-lg font-bold ${getRarityColor(recipe.resultItem?.rarity)}`}>
                  {recipe.resultItem?.name}
                </h3>
                <p className="text-xs text-gray-400">Result</p>
              </div>
            </div>
            <span className="text-2xl text-gray-500">→</span>
          </div>

          {/* Materials Required */}
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-2">Materials Required:</p>
            <div className="flex flex-wrap gap-2">
              {recipe.materials?.map((material: any, index: number) => (
                <div
                  key={index}
                  className="bg-gray-900 border border-gray-700 rounded px-2 py-1 flex items-center gap-2"
                >
                  {getItemImage(material.item?.spriteId, material.item?.type) && (
                    <img
                      src={getItemImage(material.item?.spriteId, material.item?.type)!}
                      alt={material.item?.name}
                      className="w-6 h-6 object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  )}
                  <span className="text-sm text-white">{material.item?.name}</span>
                  <span className="text-xs text-yellow-400">x{material.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-900 p-2 rounded">
              <div className="text-gray-400">Gold Cost</div>
              <div className="text-yellow-400 font-bold">{recipe.goldCost}g</div>
            </div>
            <div className="bg-gray-900 p-2 rounded">
              <div className="text-gray-400">Level Req</div>
              <div className="text-blue-400 font-bold">Lv {recipe.levelRequirement}</div>
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

function RecipeModal({ recipe, items, onClose }: any) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<RecipeFormData>({
    resultItemId: recipe?.resultItemId || "",
    materials: recipe?.materials?.map((m: any) => ({ itemId: m.itemId, quantity: m.quantity })) || [],
    goldCost: recipe?.goldCost || 100,
    levelRequirement: recipe?.levelRequirement || 1,
  });
  const [searchMaterial, setSearchMaterial] = useState("");

  const createRecipeMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/admin/crafting-recipes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create recipe");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Recipe created successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "crafting-recipes"] });
      onClose();
    },
  });

  const updateRecipeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/admin/crafting-recipes/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update recipe");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Recipe updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "crafting-recipes"] });
      onClose();
    },
  });

  const handleSubmit = () => {
    if (recipe?.id) {
      updateRecipeMutation.mutate({ id: recipe.id, data: formData });
    } else {
      createRecipeMutation.mutate(formData);
    }
  };

  const handleAddMaterial = (itemId: string) => {
    const existingMaterial = formData.materials.find((m) => m.itemId === itemId);
    if (existingMaterial) {
      toast.error("Material already added!");
      return;
    }
    setFormData({
      ...formData,
      materials: [...formData.materials, { itemId, quantity: 1 }],
    });
  };

  const handleRemoveMaterial = (itemId: string) => {
    setFormData({
      ...formData,
      materials: formData.materials.filter((m) => m.itemId !== itemId),
    });
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    setFormData({
      ...formData,
      materials: formData.materials.map((m) =>
        m.itemId === itemId ? { ...m, quantity: Math.max(1, quantity) } : m
      ),
    });
  };

  const filteredItems = useMemo(() => {
    return items.filter((item: any) =>
      item.name.toLowerCase().includes(searchMaterial.toLowerCase())
    );
  }, [items, searchMaterial]);

  const resultItem = items.find((i: any) => i.id === formData.resultItemId);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-green-500 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 flex items-center justify-between">
          <h3 className="text-white font-bold text-xl">
            {recipe ? "Edit Recipe" : "Create New Recipe"}
          </h3>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Recipe Details */}
            <div className="space-y-4">
              <h4 className="text-yellow-400 font-bold text-lg mb-3">
                Recipe Details
              </h4>

              {/* Result Item Selection */}
              <div>
                <label className="block text-gray-300 mb-2">Result Item *</label>
                <select
                  value={formData.resultItemId}
                  onChange={(e) =>
                    setFormData({ ...formData, resultItemId: e.target.value })
                  }
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                >
                  <option value="">Select result item...</option>
                  {items.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.type})
                    </option>
                  ))}
                </select>
                {resultItem && (
                  <div className="mt-2 flex items-center gap-2 bg-gray-900 p-2 rounded">
                    {getItemImage(resultItem.spriteId, resultItem.type) && (
                      <img
                        src={getItemImage(resultItem.spriteId, resultItem.type)!}
                        alt={resultItem.name}
                        className="w-12 h-12 object-contain"
                        style={{ imageRendering: "pixelated" }}
                      />
                    )}
                    <span className={`font-bold ${getRarityColor(resultItem.rarity)}`}>
                      {resultItem.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Gold Cost</label>
                  <input
                    type="number"
                    value={formData.goldCost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        goldCost: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                  />
                </div>
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
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Selected Materials */}
              <div>
                <label className="block text-gray-300 mb-2">
                  Materials Required ({formData.materials.length})
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {formData.materials.map((material) => {
                    const item = items.find((i: any) => i.id === material.itemId);
                    return (
                      <div
                        key={material.itemId}
                        className="bg-gray-900 border border-gray-700 rounded p-2 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          {item && getItemImage(item.spriteId, item.type) && (
                            <img
                              src={getItemImage(item.spriteId, item.type)!}
                              alt={item.name}
                              className="w-8 h-8 object-contain"
                              style={{ imageRendering: "pixelated" }}
                            />
                          )}
                          <span className="text-sm text-white">{item?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={material.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(
                                material.itemId,
                                parseInt(e.target.value) || 1
                              )
                            }
                            min="1"
                            className="w-16 bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-sm"
                          />
                          <button
                            onClick={() => handleRemoveMaterial(material.itemId)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {formData.materials.length === 0 && (
                    <p className="text-sm text-gray-400 italic">No materials added yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Material Selection */}
            <div className="space-y-4">
              <h4 className="text-yellow-400 font-bold text-lg mb-3">
                Add Materials
              </h4>

              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchMaterial}
                  onChange={(e) => setSearchMaterial(e.target.value)}
                  className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none text-sm"
                />
              </div>

              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {filteredItems.map((item: any) => {
                  const isSelected = formData.materials.some((m) => m.itemId === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => !isSelected && handleAddMaterial(item.id)}
                      disabled={isSelected}
                      className={`w-full p-2 rounded flex items-center gap-2 text-left transition ${
                        isSelected
                          ? "bg-gray-800 opacity-50 cursor-not-allowed"
                          : "bg-gray-900 hover:bg-gray-800"
                      }`}
                    >
                      {getItemImage(item.spriteId, item.type) && (
                        <img
                          src={getItemImage(item.spriteId, item.type)!}
                          alt={item.name}
                          className="w-8 h-8 object-contain"
                          style={{ imageRendering: "pixelated" }}
                        />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${getRarityColor(item.rarity)}`}>
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-400">{item.type}</p>
                      </div>
                      {isSelected && (
                        <span className="text-xs text-green-400">✓ Added</span>
                      )}
                    </button>
                  );
                })}
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
              !formData.resultItemId ||
              formData.materials.length === 0 ||
              createRecipeMutation.isPending ||
              updateRecipeMutation.isPending
            }
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
          >
            <Save size={18} />
            {createRecipeMutation.isPending || updateRecipeMutation.isPending
              ? recipe
                ? "Updating..."
                : "Creating..."
              : recipe
              ? "Update Recipe"
              : "Create Recipe"}
          </button>
        </div>
      </div>
    </div>
  );
}
