import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, MapPin, ArrowUp, MessageCircle, Clock, Shield, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { postAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import CommentSection from '../components/feed/CommentSection';

const POST_TYPE_STYLES = {
  question: { label: '❓ Question', class: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' },
  recommendation: { label: '⭐ Recommendation', class: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' },
  tip: { label: '💡 Tip', class: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' },
  alert: { label: '⚠️ Alert', class: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400' },
  event: { label: '🎉 Event', class: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400' },
};

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [isUpvoted, setIsUpvoted] = useState(false);

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const res = await postAPI.getOne(id);
      const { post: p, comments: c } = res.data.data;
      setPost(p);
      setComments(c);
      setUpvoteCount(p.upvoteCount || p.upvotes?.length || 0);
      setIsUpvoted(p.isUpvoted || false);
    } catch {
      toast.error('Post not found');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!isAuthenticated) { toast.info('Sign in to upvote'); return; }
    try {
      const res = await postAPI.toggleUpvote(post._id);
      setIsUpvoted(res.data.data.isUpvoted);
      setUpvoteCount(res.data.data.upvoteCount);
    } catch { toast.error('Could not vote'); }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="skeleton h-6 w-24 rounded mb-6" />
        <div className="card p-6 space-y-3">
          <div className="flex gap-3">
            <div className="skeleton w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-28 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          </div>
          <div className="skeleton h-5 w-full rounded" />
          <div className="skeleton h-4 w-4/5 rounded" />
        </div>
      </div>
    );
  }

  if (!post) return null;

  const typeStyle = POST_TYPE_STYLES[post.type] || POST_TYPE_STYLES.question;
  const displayAuthor = post.isAnonymous
    ? { name: 'Anonymous Student', isStudentVerified: false }
    : post.author;

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-secondary hover:text-primary text-sm font-medium mb-5 transition-colors"
        >
          <ChevronLeft size={18} /> Back to Feed
        </button>

        {/* Post card */}
        <div className="card p-5 mb-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0
                ${post.isAnonymous ? 'bg-gray-400 dark:bg-gray-600' : 'bg-gradient-to-br from-campus-400 to-campus-600'}`}>
                {displayAuthor?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm text-primary">{displayAuthor?.name}</span>
                  {displayAuthor?.isStudentVerified && !post.isAnonymous && (
                    <Shield size={12} className="text-green-500" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-tertiary mt-0.5">
                  <Clock size={11} />
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
            <span className={`badge text-xs flex-shrink-0 ${typeStyle.class}`}>
              {typeStyle.label}
            </span>
          </div>

          <p className="text-primary text-base leading-relaxed mb-4">{post.content}</p>

          {/* Linked places */}
          {post.linkedPlaces?.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="section-label">Related Places</p>
              {post.linkedPlaces.map(place => (
                <Link
                  key={place._id}
                  to={`/places/${place._id}`}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-900 hover:border-primary-400 transition-colors group"
                >
                  <MapPin size={14} className="text-primary-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary-700 dark:text-primary-300 truncate">{place.name}</p>
                    <p className="text-xs text-primary-500 dark:text-primary-400">{place.category}</p>
                  </div>
                  {place.averageRating > 0 && (
                    <div className="text-xs font-mono font-semibold text-primary-600 dark:text-primary-400">
                      ★ {place.averageRating.toFixed(1)}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-secondary">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Vote bar */}
          <div className="flex items-center gap-3 pt-3 border-t border-default">
            <button
              onClick={handleUpvote}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${isUpvoted
                  ? 'bg-campus-100 dark:bg-campus-950/50 text-campus-700 dark:text-campus-400'
                  : 'btn-ghost'
                }`}
            >
              <ArrowUp size={16} className={isUpvoted ? 'fill-current' : ''} />
              {upvoteCount > 0 ? `${upvoteCount} upvotes` : 'Upvote'}
            </button>

            <div className="flex items-center gap-1.5 text-sm text-tertiary">
              <MessageCircle size={15} />
              {comments.length} {comments.length === 1 ? 'reply' : 'replies'}
            </div>
          </div>
        </div>

        {/* Comments */}
        <CommentSection
          comments={comments}
          postId={post._id}
          postAuthorId={post.author?._id || post.author}
        />
      </div>
    </div>
  );
}
