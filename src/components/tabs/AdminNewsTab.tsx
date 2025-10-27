import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newsApi } from '@/lib/api';
import { Plus, Edit, Trash2, Eye, EyeOff, Pin, Save, X } from 'lucide-react';

export default function AdminNewsTab() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'General',
    imageUrl: '',
  });

  const { data: newsData } = useQuery({
    queryKey: ['news', 'all'],
    queryFn: async () => {
      const { data } = await newsApi.getAll(50, 0);
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => newsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      setIsCreating(false);
      resetForm();
      (window as any).showToast?.('Post created successfully!', 'success');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Failed to create post', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: any }) => newsApi.update(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      setEditingPost(null);
      resetForm();
      (window as any).showToast?.('Post updated successfully!', 'success');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Failed to update post', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => newsApi.delete(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      (window as any).showToast?.('Post deleted successfully!', 'success');
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ postId, isPublished }: { postId: string; isPublished: boolean }) =>
      newsApi.update(postId, { isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: ({ postId, isPinned }: { postId: string; isPinned: boolean }) =>
      newsApi.update(postId, { isPinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: 'General',
      imageUrl: '',
    });
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      category: post.category,
      imageUrl: post.imageUrl || '',
    });
    setIsCreating(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.content) {
      (window as any).showToast?.('Title and content are required', 'error');
      return;
    }

    if (editingPost) {
      updateMutation.mutate({ postId: editingPost.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingPost(null);
    resetForm();
  };

  if (isCreating) {
    return (
      <div className="p-3 pb-20">
        <h2 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'monospace' }}>
          {editingPost ? '✏️ EDIT POST' : '➕ CREATE NEW POST'}
        </h2>

        <div className="bg-stone-900 border-4 border-stone-700 p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-amber-400 text-sm font-bold mb-2" style={{ fontFamily: 'monospace' }}>
              TITLE *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-stone-800 border-2 border-stone-700 text-white focus:border-amber-500 outline-none"
              placeholder="Enter post title..."
              maxLength={200}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-amber-400 text-sm font-bold mb-2" style={{ fontFamily: 'monospace' }}>
              CATEGORY
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-stone-800 border-2 border-stone-700 text-white focus:border-amber-500 outline-none"
            >
              <option value="General">General</option>
              <option value="Update">Update</option>
              <option value="Event">Event</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-amber-400 text-sm font-bold mb-2" style={{ fontFamily: 'monospace' }}>
              EXCERPT (Short Summary)
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full px-3 py-2 bg-stone-800 border-2 border-stone-700 text-white focus:border-amber-500 outline-none"
              rows={2}
              placeholder="Brief summary..."
              maxLength={300}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-amber-400 text-sm font-bold mb-2" style={{ fontFamily: 'monospace' }}>
              CONTENT *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 bg-stone-800 border-2 border-stone-700 text-white focus:border-amber-500 outline-none"
              rows={12}
              placeholder="Write your post content..."
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-amber-400 text-sm font-bold mb-2" style={{ fontFamily: 'monospace' }}>
              IMAGE URL (Optional)
            </label>
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3 py-2 bg-stone-800 border-2 border-stone-700 text-white focus:border-amber-500 outline-none"
              placeholder="https://..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 py-3 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold transition flex items-center justify-center gap-2"
              style={{
                border: '3px solid #15803d',
                boxShadow: '0 3px 0 #166534',
                fontFamily: 'monospace',
              }}
            >
              <Save size={16} />
              {editingPost ? 'UPDATE POST' : 'CREATE POST'}
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-bold transition flex items-center justify-center gap-2"
              style={{
                border: '3px solid #7f1d1d',
                boxShadow: '0 3px 0 #991b1b',
                fontFamily: 'monospace',
              }}
            >
              <X size={16} />
              CANCEL
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 pb-20">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'monospace' }}>
          📰 NEWS DASHBOARD
        </h2>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white font-bold transition flex items-center gap-2"
          style={{
            border: '2px solid #15803d',
            fontFamily: 'monospace',
          }}
        >
          <Plus size={16} />
          NEW POST
        </button>
      </div>

      {/* Posts List */}
      <div className="space-y-2">
        {!newsData || newsData.posts.length === 0 ? (
          <div className="bg-stone-800 border-2 border-stone-700 p-8 text-center">
            <p className="text-gray-400">No posts yet. Create your first post!</p>
          </div>
        ) : (
          newsData.posts.map((post: any) => (
            <div
              key={post.id}
              className="bg-stone-800 border-2 border-stone-700 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {post.isPinned && <Pin size={14} className="text-amber-400" fill="currentColor" />}
                    <span className={`text-xs px-2 py-0.5 border font-bold ${
                      post.category === 'Update' ? 'text-blue-400 border-blue-600' :
                      post.category === 'Event' ? 'text-purple-400 border-purple-600' :
                      post.category === 'Maintenance' ? 'text-red-400 border-red-600' :
                      'text-amber-400 border-amber-600'
                    }`} style={{ fontFamily: 'monospace' }}>
                      {post.category}
                    </span>
                    <span className={`text-xs px-2 py-0.5 border font-bold ${
                      post.isPublished ? 'text-green-400 border-green-600' : 'text-gray-400 border-gray-600'
                    }`} style={{ fontFamily: 'monospace' }}>
                      {post.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </div>
                  <h3 className="text-white font-bold">{post.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => togglePublishMutation.mutate({ postId: post.id, isPublished: !post.isPublished })}
                    className="p-2 bg-stone-700 hover:bg-stone-600 text-white rounded"
                    title={post.isPublished ? 'Unpublish' : 'Publish'}
                  >
                    {post.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => togglePinMutation.mutate({ postId: post.id, isPinned: !post.isPinned })}
                    className="p-2 bg-stone-700 hover:bg-stone-600 text-white rounded"
                    title={post.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin size={14} className={post.isPinned ? 'text-amber-400' : ''} fill={post.isPinned ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => handleEdit(post)}
                    className="p-2 bg-blue-700 hover:bg-blue-600 text-white rounded"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this post?')) {
                        deleteMutation.mutate(post.id);
                      }
                    }}
                    className="p-2 bg-red-700 hover:bg-red-600 text-white rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
