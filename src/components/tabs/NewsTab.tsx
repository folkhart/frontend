import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { newsApi } from '@/lib/api';
import { X, Calendar, User, Pin } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import newsIcon from "@/assets/ui/news/news.png";
import redGem from "@/assets/ui/news/red_gem.png";
import blueGem from "@/assets/ui/news/blue_gem.png";
import greenGem from "@/assets/ui/news/green_gem.png";
import goldAnchor from "@/assets/ui/news/goldanchor.png";
import '@/styles/news-markdown.css';

export default function NewsTab() {
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const { data: newsData } = useQuery({
    queryKey: ["news", "published"],
    queryFn: async () => {
      const { data } = await newsApi.getPublished(20, 0);
      return data;
    },
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Update":
        return "text-blue-400 border-blue-600";
      case "Event":
        return "text-purple-400 border-purple-600";
      case "Maintenance":
        return "text-red-400 border-red-600";
      default:
        return "text-amber-400 border-amber-600";
    }
  };

  const getCategoryGem = (category: string) => {
    switch (category) {
      case "Update":
        return blueGem;
      case "Event":
        return greenGem;
      case "Maintenance":
        return redGem;
      default:
        return goldAnchor;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const parseEmojis = (content: string) => {
    // Replace [emoji:fcXXX] with actual emoji images
    return content.split(/(\[emoji:fc\d+\])/).map((part, index) => {
      const match = part.match(/\[emoji:(fc\d+)\]/);
      if (match) {
        const emojiId = match[1];
        return (
          <img
            key={index}
            src={`/src/assets/ui/news/emojis/64x64/${emojiId}.png`}
            alt={emojiId}
            className="inline w-6 h-6 mx-0.5"
            style={{ imageRendering: "pixelated" }}
          />
        );
      }
      return part;
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
        <div
          className="bg-stone-900 border-4 border-stone-700 p-4"
          style={{
            boxShadow: "0 4px 0 #1c1917, inset 0 2px 0 rgba(255,255,255,0.1)",
          }}
        >
          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-3">
            <img
              src={getCategoryGem(selectedPost.category)}
              alt={selectedPost.category}
              className="w-6 h-6"
              style={{ imageRendering: "pixelated" }}
            />
            <div
              className={`inline-block px-3 py-1 border-2 font-bold text-xs ${getCategoryColor(
                selectedPost.category
              )}`}
              style={{ fontFamily: "monospace" }}
            >
              {selectedPost.category.toUpperCase()}
            </div>
          </div>

          {/* Title */}
          <h1
            className="text-2xl font-bold text-white mb-3"
            style={{
              textShadow: "2px 2px 0 #000",
              fontFamily: "monospace",
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
              <span>
                {formatDate(selectedPost.publishedAt || selectedPost.createdAt)}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="news-markdown">
            {(() => {
              console.log('Post content:', selectedPost.content);
              console.log('Content type:', typeof selectedPost.content);
              return (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: ({ node, ...props }) => {
                      console.log('Rendering image:', props.src);
                      return (
                        <img
                          {...props}
                          style={{ 
                            imageRendering: 'pixelated',
                            display: 'inline-block',
                            verticalAlign: 'middle',
                            margin: '0 2px',
                            width: '24px',
                            height: '24px'
                          }}
                          onError={() => {
                            console.error('Failed to load emoji:', props.src);
                          }}
                        />
                      );
                    }
                  }}
                >
                  {selectedPost.content}
                </ReactMarkdown>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 pb-20">
      <h2
        className="text-lg font-bold text-white mb-3 flex items-center gap-2"
        style={{ textShadow: "2px 2px 0 #000", fontFamily: "monospace" }}
      >
        <img
          src={newsIcon}
          alt="News"
          className="w-6 h-6"
          style={{ imageRendering: "pixelated" }}
        />
        NEWS & UPDATES
      </h2>

      {/* News List */}
      <div className="space-y-3">
        {!newsData || newsData.posts.length === 0 ? (
          <div className="bg-stone-800 border-2 border-stone-700 p-8 text-center">
            <img
              src={newsIcon}
              alt="News"
              className="w-12 h-12 mx-auto mb-2 opacity-50"
              style={{ imageRendering: "pixelated" }}
            />
            <p className="text-gray-400">No news posts yet. Check back soon!</p>
          </div>
        ) : (
          newsData.posts.map((post: any) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="bg-stone-800 border-2 border-stone-700 p-4 cursor-pointer hover:border-amber-600 transition relative"
              style={{
                boxShadow: "0 3px 0 #1c1917",
              }}
            >
              {/* Pinned Badge */}
              {post.isPinned && (
                <div className="absolute top-2 right-2">
                  <Pin
                    size={16}
                    className="text-amber-400"
                    fill="currentColor"
                  />
                </div>
              )}

              {/* Category */}
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={getCategoryGem(post.category)}
                  alt={post.category}
                  className="w-4 h-4"
                  style={{ imageRendering: "pixelated" }}
                />
                <div
                  className={`inline-block px-2 py-1 border-2 font-bold text-xs ${getCategoryColor(
                    post.category
                  )}`}
                  style={{ fontFamily: "monospace" }}
                >
                  {post.category.toUpperCase()}
                </div>
              </div>

              {/* Title */}
              <h3
                className="text-white font-bold text-lg mb-2"
                style={{
                  textShadow: "1px 1px 0 #000",
                  fontFamily: "monospace",
                }}
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
              <div
                className="mt-3 text-amber-400 text-xs font-bold"
                style={{ fontFamily: "monospace" }}
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
