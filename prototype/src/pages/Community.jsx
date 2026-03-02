import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Heart, MessageCircle, Send, Image as ImageIcon, X } from 'lucide-react';
import { getItem, setItem, STORAGE_KEYS } from '../utils/localStorage';

const Community = () => {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState('');

  // Load posts from LocalStorage on mount
  useEffect(() => {
    const savedPosts = getItem(STORAGE_KEYS.COMMUNITY_POSTS, []);
    setPosts(savedPosts);
  }, []);

  // Save posts to LocalStorage whenever they change
  useEffect(() => {
    if (posts.length > 0) {
      setItem(STORAGE_KEYS.COMMUNITY_POSTS, posts);
    }
  }, [posts]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostImage(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim() && !newPostImage) return;

    const userProfile = getItem(STORAGE_KEYS.USER_PROFILE, {});
    const newPost = {
      id: Date.now().toString(),
      authorId: userProfile.phone || 'user123',
      authorName: userProfile.name || 'Rajesh Kumar',
      content: newPostContent,
      image: newPostImage,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setNewPostImage(null);
    setImagePreview(null);
  };

  const handleToggleLike = (postId) => {
    const userProfile = getItem(STORAGE_KEYS.USER_PROFILE, {});
    const userId = userProfile.phone || 'user123';

    setPosts(posts.map(post => {
      if (post.id === postId) {
        const likes = post.likes || [];
        const hasLiked = likes.includes(userId);
        return {
          ...post,
          likes: hasLiked
            ? likes.filter(id => id !== userId)
            : [...likes, userId]
        };
      }
      return post;
    }));
  };

  const handleAddComment = (postId) => {
    if (!commentText.trim()) return;

    const userProfile = getItem(STORAGE_KEYS.USER_PROFILE, {});
    const newComment = {
      id: Date.now().toString(),
      authorId: userProfile.phone || 'user123',
      authorName: userProfile.name || 'Rajesh Kumar',
      content: commentText,
      createdAt: new Date().toISOString(),
    };

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...(post.comments || []), newComment]
        };
      }
      return post;
    }));

    setCommentText('');
    setActiveCommentPost(null);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`min-h-screen pb-20 transition-theme duration-300 ${isDark ? 'bg-dark-bg' : 'bg-neutral-bg'
      }`}>
      <Header showBack={true} title="Community" />

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Post Creator */}
        <div className={`rounded-lg p-4 mb-6 ${isDark ? 'bg-dark-surface' : 'bg-white'
          }`}>
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Share your farming experience..."
            className={`w-full p-3 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-primary ${isDark
                ? 'bg-dark-bg border-dark-border text-dark-text placeholder-dark-text-secondary'
                : 'bg-white border-neutral-border text-neutral-text placeholder-neutral-text-secondary'
              }`}
            rows="3"
          />

          {imagePreview && (
            <div className="relative mt-3">
              <img src={imagePreview} alt="Preview" className="w-full rounded-lg" />
              <button
                onClick={() => {
                  setNewPostImage(null);
                  setImagePreview(null);
                }}
                className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded-full text-white"
              >
                <X size={20} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="flex items-center text-primary">
                <ImageIcon size={20} className="mr-2" />
                <span className="text-sm font-medium">Add Photo</span>
              </div>
            </label>

            <button
              onClick={handleCreatePost}
              disabled={!newPostContent.trim() && !newPostImage}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${newPostContent.trim() || newPostImage
                  ? 'bg-primary text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              Post
            </button>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className={`rounded-lg p-8 text-center ${isDark ? 'bg-dark-surface' : 'bg-white'
              }`}>
              <p className={isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}>
                No posts yet. Be the first to share!
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className={`rounded-lg p-4 ${isDark ? 'bg-dark-surface' : 'bg-white'
                }`}>
                {/* Post Header */}
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    {post.authorName.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className={`font-semibold ${isDark ? 'text-dark-text' : 'text-neutral-text'
                      }`}>
                      {post.authorName}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                      }`}>
                      {formatTime(post.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Post Content */}
                <p className={`mb-3 ${isDark ? 'text-dark-text' : 'text-neutral-text'
                  }`}>
                  {post.content}
                </p>

                {/* Post Image */}
                {post.image && (
                  <img src={post.image} alt="Post" className="w-full rounded-lg mb-3" />
                )}

                {/* Post Actions */}
                <div className="flex items-center space-x-6 pt-3 border-t border-opacity-20">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className="flex items-center space-x-2"
                  >
                    <Heart
                      size={20}
                      className={`${post.likes?.includes(getItem(STORAGE_KEYS.USER_PROFILE, {}).phone || 'user123')
                          ? 'fill-red-500 text-red-500'
                          : isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                        }`}
                    />
                    <span className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                      }`}>
                      {post.likes?.length || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                    className="flex items-center space-x-2"
                  >
                    <MessageCircle size={20} className={
                      isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                    } />
                    <span className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                      }`}>
                      {post.comments?.length || 0}
                    </span>
                  </button>
                </div>

                {/* Comments Section */}
                {post.comments && post.comments.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className={`p-3 rounded-lg ${isDark ? 'bg-dark-bg' : 'bg-neutral-bg'
                        }`}>
                        <div className="flex items-start">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {comment.authorName.charAt(0)}
                          </div>
                          <div className="ml-3 flex-1">
                            <p className={`font-semibold text-sm ${isDark ? 'text-dark-text' : 'text-neutral-text'
                              }`}>
                              {comment.authorName}
                            </p>
                            <p className={`text-sm mt-1 ${isDark ? 'text-dark-text' : 'text-neutral-text'
                              }`}>
                              {comment.content}
                            </p>
                            <p className={`text-xs mt-1 ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                              }`}>
                              {formatTime(comment.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment Input */}
                {activeCommentPost === post.id && (
                  <div className="mt-4 flex items-center space-x-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className={`flex-1 p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary ${isDark
                          ? 'bg-dark-bg border-dark-border text-dark-text placeholder-dark-text-secondary'
                          : 'bg-white border-neutral-border text-neutral-text placeholder-neutral-text-secondary'
                        }`}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      disabled={!commentText.trim()}
                      className={`p-2 rounded-lg ${commentText.trim()
                          ? 'bg-primary text-white'
                          : 'bg-gray-300 text-gray-500'
                        }`}
                    >
                      <Send size={20} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Community;
