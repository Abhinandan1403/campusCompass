import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, TrendingUp, Zap, Lightbulb, AlertCircle, PartyPopper, Filter } from 'lucide-react';
import { postAPI, collegeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard, { PostSkeleton } from '../components/feed/PostCard';
import CreatePostForm from '../components/feed/CreatePostForm';

const POST_TYPE_FILTERS = [
  { value: 'all', label: 'All Posts', icon: <MessageCircle size={14} /> },
  { value: 'question', label: 'Questions', icon: <span>❓</span> },
  { value: 'recommendation', label: 'Recommendations', icon: <span>⭐</span> },
  { value: 'tip', label: 'Tips', icon: <Lightbulb size={14} /> },
  { value: 'alert', label: 'Alerts', icon: <AlertCircle size={14} /> },
  { value: 'event', label: 'Events', icon: <PartyPopper size={14} /> },
];

export default function FeedPage() {
  const { collegeId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  const effectiveCollegeId = collegeId || user?.college?._id;

  useEffect(() => {
    if (effectiveCollegeId) {
      collegeAPI.getOne(effectiveCollegeId)
        .then(res => setCollege(res.data.data.college))
        .catch(() => {});
    }
  }, [effectiveCollegeId]);

  const loadPosts = useCallback(async (reset = true) => {
    if (!effectiveCollegeId) return;
    const pg = reset ? 1 : page;
    if (reset) setPage(1);
    setLoading(true);
    try {
      const params = { page: pg, limit: 15, sort, ...(filter !== 'all' && { type: filter }) };
      const res = await postAPI.getFeed(effectiveCollegeId, params);
      if (reset) setPosts(res.data.data.posts);
      else setPosts(prev => [...prev, ...res.data.data.posts]);
      setTotalPages(res.data.data.pagination.pages);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveCollegeId, filter, sort, page]);

  useEffect(() => {
    loadPosts(true);
  }, [filter, sort, effectiveCollegeId]);

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  if (!effectiveCollegeId) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-5xl mb-4">🏫</div>
          <h2 className="font-display font-bold text-xl text-primary mb-2">Select your college</h2>
          <p className="text-secondary text-sm mb-6">Join Campus Compass to access your college's feed</p>
          <Link to="/register" className="btn-primary">Create Account</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      {/* Header */}
      <div className="bg-gradient-to-r from-campus-600 to-campus-800 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-campus-300 text-sm font-medium mb-1">Campus Feed</p>
              <h1 className="font-display font-bold text-2xl sm:text-3xl">
                {college?.shortName || college?.name || 'Your Campus'} 🎓
              </h1>
              {college?.city && (
                <p className="text-campus-300 text-sm mt-1">{college.name} · {college.city}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-display font-bold">{posts.length}</div>
              <div className="text-xs text-campus-300">discussions</div>
            </div>
          </div>

          {/* Tip banner */}
          <div className="mt-4 flex items-start gap-2.5 bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <Zap size={15} className="text-amber-300 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-campus-100 leading-relaxed">
              <strong>Ask anything!</strong> "Best chai near gate?", "Where to print before exam?"
              — your campus community has answers.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Create post */}
        {isAuthenticated ? (
          <CreatePostForm onPostCreated={handlePostCreated} />
        ) : (
          <div className="card p-4 flex items-center justify-between">
            <p className="text-sm text-secondary">Join the conversation with your campus community</p>
            <Link to="/login" className="btn-primary text-sm py-2 px-4 flex-shrink-0">Sign in</Link>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5 flex-1">
            {POST_TYPE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-1.5 whitespace-nowrap text-xs px-3 py-1.5 rounded-full font-medium transition-all flex-shrink-0
                  ${filter === f.value
                    ? 'bg-campus-600 text-white shadow-sm'
                    : 'bg-surface border border-default text-secondary hover:border-campus-400 dark:hover:border-campus-600'
                  }`}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => setSort('newest')}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all
                ${sort === 'newest' ? 'bg-surface-2 text-primary' : 'text-tertiary hover:text-primary'}`}
            >
              New
            </button>
            <button
              onClick={() => setSort('popular')}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1
                ${sort === 'popular' ? 'bg-surface-2 text-primary' : 'text-tertiary hover:text-primary'}`}
            >
              <TrendingUp size={11} /> Hot
            </button>
          </div>
        </div>

        {/* Posts */}
        {loading && posts.length === 0 ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => <PostSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-3">💬</div>
            <h3 className="font-display font-bold text-lg text-primary mb-2">No posts yet</h3>
            <p className="text-secondary text-sm mb-4">
              {filter !== 'all' ? `No ${filter}s found. Try a different filter.` : 'Be the first to start a conversation!'}
            </p>
            {isAuthenticated && filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="btn-secondary text-sm">
                Show all posts
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {posts.map(post => (
                <PostCard key={post._id} post={post} onDelete={handlePostDeleted} />
              ))}
            </div>

            {page < totalPages && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => { setPage(p => p + 1); loadPosts(false); }}
                  disabled={loading}
                  className="btn-secondary px-8"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : 'Load more posts'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
