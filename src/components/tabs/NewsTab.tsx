import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { newsApi } from '@/lib/api';
import { Newspaper, Calendar, User, Pin } from 'lucide-react';

export default function NewsTab() {
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const { data: newsData } = useQuery({
    queryKey: ['news', 'published'],
    queryFn: async () => {
      const { data } = await newsApi.getPublished(20, 0);
      return data;
    },
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Update': return 'text-blue-400 border-blue-600';
      case 'Event': return 'text-purple-400 border-purple-600';
      case 'Maintenance': return 'text-red-400 border-red-600';
      default: return 'text-amber-400 border-amber-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (selectedPost) {
    return (
      <div className="p-3 pb-20">
        {/* Back Button */}
        <button
          onClick={() => setSelectedPost(null)}
          className="mb-3 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white font-bold border-2 border-stone-700 transition"
        >
          ← Back to News
        </button>

        {/* Post Content */}
        <div className="bg-stone-900 border-4 border-stone-700 p-4"
          style={{
            boxShadow: '0 4px 0 #1c1917, inset 0 2px 0 rgba(255,255,255,0.1)',
          }}
        >
          {/* Category Badge */}
          <div className={`inline-block px-3 py-1 mb-3 border-2 font-bold text-xs ${getCategoryColor(selectedPost.category)}`}
            style={{ fontFamily: 'monospace' }}
          >
            {selectedPost.category.toUpperCase()}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-3"
            style={{
              textShadow: '2px 2px 0 #000',
              fontFamily: 'monospace',
            }}
          >
            {selectedPost.title}
          </h1>

          {/* Meta Info */}
          <div className="flex gap-4 text-xs text-gray-400 mb-4 pb-4 border-b-2 border-stone-700">
            <div className="flex items-center gap-1">
              <User size={12} />
              <span>{selectedPost.author.username}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{formatDate(selectedPost.publishedAt || selectedPost.createdAt)}</span>
            </div>
          </div>

          {/* Content */}
          <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
            {selectedPost.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 pb-20">
      <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"
        style={{ textShadow: '2px 2px 0 #000', fontFamily: 'monospace' }}
      >
        <Newspaper size={20} className="text-amber-400" />
        📰 NEWS & UPDATES
      </h2>

      {/* News List */}
      <div className="space-y-3">
        {!newsData || newsData.posts.length === 0 ? (
          <div className="bg-stone-800 border-2 border-stone-700 p-8 text-center">
            <Newspaper size={48} className="mx-auto mb-2 text-gray-600" />
            <p className="text-gray-400">No news posts yet. Check back soon!</p>
          </div>
        ) : (
          newsData.posts.map((post: any) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="bg-stone-800 border-2 border-stone-700 p-4 cursor-pointer hover:border-amber-600 transition relative"
              style={{
                boxShadow: '0 3px 0 #1c1917',
              }}
            >
              {/* Pinned Badge */}
              {post.isPinned && (
                <div className="absolute top-2 right-2">
                  <Pin size={16} className="text-amber-400" fill="currentColor" />
                </div>
              )}

              {/* Category */}
              <div className={`inline-block px-2 py-1 mb-2 border-2 font-bold text-xs ${getCategoryColor(post.category)}`}
                style={{ fontFamily: 'monospace' }}
              >
                {post.category.toUpperCase()}
              </div>

              {/* Title */}
              <h3 className="text-white font-bold text-lg mb-2"
                style={{ textShadow: '1px 1px 0 #000', fontFamily: 'monospace' }}
              >
                {post.title}
              </h3>

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                  {post.excerpt}
                </p>
              )}

              {/* Meta */}
              <div className="flex gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <User size={10} />
                  <span>{post.author.username}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={10} />
                  <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                </div>
              </div>

              {/* Read More Indicator */}
              <div className="mt-3 text-amber-400 text-xs font-bold"
                style={{ fontFamily: 'monospace' }}
              >
                → READ MORE
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
