import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { X, Save } from "lucide-react";

interface RewardConfig {
  day: number;
  rewardType: string;
  rewardData: any;
}

export default function DailyLoginRewardsEditor() {
  const queryClient = useQueryClient();
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    rewardType: 'enhancement_stone',
    itemId: '',
    itemName: '',
    quantity: 1,
    spriteId: '',
    enhancementLevel: 0
  });

  const { data: config } = useQuery({
    queryKey: ['admin-daily-login-config'],
    queryFn: async () => {
      const { data } = await api.get('/admin/daily-login-rewards/config');
      return data.config as RewardConfig[];
    }
  });

  const { data: itemsData } = useQuery({
    queryKey: ['admin-items-list'],
    queryFn: async () => {
      const { data } = await api.get('/admin/daily-login-rewards/items');
      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const updateRewardMutation = useMutation({
    mutationFn: async ({ day, rewardType, rewardData }: RewardConfig) => {
      const { data } = await api.put('/admin/daily-login-rewards/config', {
        day,
        rewardType,
        rewardData
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-daily-login-config'] });
      setEditingDay(null);
      (window as any).showToast?.('Reward updated! Restart server to apply.', 'success');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Failed to update', 'error');
    }
  });

  const handleEdit = (reward: RewardConfig) => {
    setEditingDay(reward.day);
    setFormData({
      rewardType: reward.rewardType,
      itemId: reward.rewardData.itemId || '',
      itemName: reward.rewardData.itemName || '',
      quantity: reward.rewardData.quantity || 1,
      spriteId: reward.rewardData.spriteId || '',
      enhancementLevel: reward.rewardData.enhancementLevel || 0
    });
  };

  const handleSave = () => {
    if (!editingDay) return;

    let rewardData: any = {};

    switch (formData.rewardType) {
      case 'enhancement_stone':
      case 'refining_item':
        rewardData = {
          itemName: formData.itemName,
          quantity: formData.quantity
        };
        break;
      case 'potion':
        rewardData = {
          spriteId: formData.spriteId,
          itemName: formData.itemName,
          quantity: formData.quantity
        };
        break;
      case 'enhanced_item':
        rewardData = {
          enhancementLevel: formData.enhancementLevel,
          itemName: formData.itemName
        };
        break;
    }

    updateRewardMutation.mutate({
      day: editingDay,
      rewardType: formData.rewardType,
      rewardData
    });
  };

  return (
    <div className="bg-stone-900 border-4 border-purple-600 p-6" style={{ borderRadius: '0', boxShadow: '0 6px 0 #7e22ce' }}>
      <h2 className="text-2xl font-bold text-purple-400 mb-6" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
        📅 DAILY LOGIN REWARDS EDITOR
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {config?.map((reward) => (
          <div
            key={reward.day}
            className="bg-stone-800 border-4 border-amber-600 p-4"
            style={{ borderRadius: '0', boxShadow: '0 4px 0 #92400e, inset 0 2px 0 rgba(255,255,255,0.1)' }}
          >
            <div className="flex justify-between items-center mb-3 pb-2 border-b-2 border-amber-700">
              <h3 className="text-lg font-bold text-amber-400" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
                DAY {reward.day}
              </h3>
              <button
                onClick={() => handleEdit(reward)}
                className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white text-sm font-bold border-2 border-blue-500"
                style={{ fontFamily: 'monospace', borderRadius: '0', boxShadow: '0 2px 0 #1e40af', textShadow: '1px 1px 0 #000' }}
              >
                EDIT
              </button>
            </div>

            <div className="text-sm text-gray-300 space-y-1" style={{ fontFamily: 'monospace' }}>
              <p><span className="text-gray-500">Type:</span> {reward.rewardType}</p>
              <p><span className="text-gray-500">Item:</span> {reward.rewardData.itemName}</p>
              {reward.rewardData.quantity && (
                <p><span className="text-gray-500">Qty:</span> {reward.rewardData.quantity}</p>
              )}
              {reward.rewardData.enhancementLevel && (
                <p><span className="text-gray-500">+Level:</span> {reward.rewardData.enhancementLevel}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingDay && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setEditingDay(null)}>
          <div className="bg-stone-800 border-4 border-purple-600 p-6 max-w-md w-full" style={{ borderRadius: '0', boxShadow: '0 8px 0 #7e22ce, 0 0 30px rgba(168, 85, 247, 0.3), inset 0 2px 0 rgba(255,255,255,0.1)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-purple-700">
              <h3 className="text-xl font-bold text-purple-400" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
                EDIT DAY {editingDay}
              </h3>
              <button onClick={() => setEditingDay(null)} className="text-gray-400 hover:text-white transition">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Reward Type */}
              <div>
                <label className="block text-sm font-bold text-amber-400 mb-2" style={{ fontFamily: 'monospace' }}>
                  Reward Type
                </label>
                <select
                  value={formData.rewardType}
                  onChange={(e) => setFormData({ ...formData, rewardType: e.target.value })}
                  className="w-full p-2 bg-stone-900 border-2 border-stone-600 text-white"
                  style={{ fontFamily: 'monospace' }}
                >
                  <option value="enhancement_stone">Enhancement Stone</option>
                  <option value="refining_item">Refining Item</option>
                  <option value="potion">Potion</option>
                  <option value="enhanced_item">Enhanced Item (+7)</option>
                </select>
              </div>

              {/* Item Selector */}
              <div>
                <label className="block text-sm font-bold text-amber-400 mb-2" style={{ fontFamily: 'monospace' }}>
                  Select Item
                </label>
                <select
                  value={formData.itemId}
                  onChange={(e) => {
                    const selectedItem = itemsData?.items?.find((i: any) => i.id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      itemId: e.target.value,
                      itemName: selectedItem?.name || '',
                      spriteId: selectedItem?.spriteId || ''
                    });
                  }}
                  className="w-full p-2 bg-stone-900 border-2 border-stone-600 text-white"
                  style={{ fontFamily: 'monospace' }}
                >
                  <option value="">Select an item...</option>
                  {itemsData?.items?.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.type}) - {item.rarity}
                    </option>
                  )) || []}
                </select>
              </div>

              {/* Quantity */}
              {(formData.rewardType === 'enhancement_stone' || formData.rewardType === 'refining_item' || formData.rewardType === 'potion') && (
                <div>
                  <label className="block text-sm font-bold text-amber-400 mb-2" style={{ fontFamily: 'monospace' }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    className="w-full p-2 bg-stone-900 border-2 border-stone-600 text-white"
                    style={{ fontFamily: 'monospace' }}
                    min="1"
                  />
                </div>
              )}

              {/* Enhancement Level */}
              {formData.rewardType === 'enhanced_item' && (
                <div>
                  <label className="block text-sm font-bold text-amber-400 mb-2" style={{ fontFamily: 'monospace' }}>
                    Enhancement Level
                  </label>
                  <input
                    type="number"
                    value={formData.enhancementLevel}
                    onChange={(e) => setFormData({ ...formData, enhancementLevel: parseInt(e.target.value) })}
                    className="w-full p-2 bg-stone-900 border-2 border-stone-600 text-white"
                    style={{ fontFamily: 'monospace' }}
                    min="0"
                    max="15"
                  />
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={updateRewardMutation.isPending}
                className="w-full py-3 bg-green-700 hover:bg-green-600 text-white font-bold transition border-2 border-green-500"
                style={{ fontFamily: 'monospace', borderRadius: '0', boxShadow: '0 4px 0 #15803d, inset 0 2px 0 rgba(255,255,255,0.2)', textShadow: '1px 1px 0 #000' }}
              >
                <Save size={16} className="inline mr-2" />
                {updateRewardMutation.isPending ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </div>

            <div className="mt-4 bg-yellow-900/30 border-2 border-yellow-600 p-3" style={{ borderRadius: '0' }}>
              <p className="text-xs text-yellow-400 font-bold" style={{ fontFamily: 'monospace', textShadow: '1px 1px 0 #000' }}>
                ⚠️ Note: You must restart the backend server for changes to take effect!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
