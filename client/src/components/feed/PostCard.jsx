import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, MessageCircle, Shield, MapPin, ChevronRight, Trash2, Pin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { postAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const POST_TYPE_STYLES = {
  question: { label: '❓ Question', class: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' },
  recommendation: { label: '⭐ Rec', class: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' },
  tip: { label: '💡 Tip', class: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' },
  alert: { label: '⚠️ Alert', class: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400' },
  event: { label: '🎉 Event', class: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400' },
};

export default function PostCard({ post, onDelete }) {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [upvoteCount, setUpvoteCount] = useState(post.upvoteCount || post.upvotes?.length || 0);
  const [isUpvoted, setIsUpvoted] = useState(post.isUpvoted || false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = user?._id === (post.author?._id || post.author);
  const displayAuthor = post.isAnonymous
    ? { name: 'Anonymous Student', isStudentVerified: false }
    : post.author;

  const typeStyle = POST_TYPE_STYLES[post.type] || POST_TYPE_STYLES.question;

  const handleUpvote = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.info('Sign in to upvote'); return; }
    try {
      const res = await postAPI.toggleUpvote(post._id);
      setIsUpvoted(res.data.data.isUpvoted);
      setUpvoteCount(res.data.data.upvoteCount);
    } catch {
      toast.error('Could not register vote');
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      await postAPI.delete(post._id);
      toast.success('Post removed');
      onDelete?.(post._id);
    } catch {
      toast.error('Could not delete post');
      setDeleting(false);
    }
  };

  return (
    <div className={`card p-5 animate-fade-in ${post.isPinned ? 'border-primary-300 dark:border-primary-700' : ''}`}>
      {/* Pinned indicator */}
      {post.isPinned && (
        <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-primary-600 dark:text-primary-400">
          <Pin size={12} className="fill-current" />
          Pinned by admin
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0
            ${post.isAnonymous
              ? 'bg-gray-400 dark:bg-gray-600'
              : 'bg-gradient-to-br from-campus-400 to-campus-600'
            }`}>
            {displayAuthor?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-primary">{displayAuthor?.name}</span>
              {displayAuthor?.isStudentVerified && !post.isAnonymous && (
                <Shield size={11} className="text-green-500" />
              )}
            </div>
            <span className="text-xs text-tertiary">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
        <span className={`badge text-xs ${typeStyle.class} flex-shrink-0`}>
          {typeStyle.label}
        </span>
      </div>

      {/* Content */}
      <Link to={`/posts/${post._id}`}>
        <p className="text-sm text-primary leading-relaxed hover:text-primary-600 transition-colors mb-3">
          {post.content}
        </p>
      </Link>

      {/* Linked places */}
      {post.linkedPlaces?.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {post.linkedPlaces.map(place => (
            <Link
              key={place._id}
              to={`/places/${place._id}`}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-900 hover:border-primary-400 transition-colors group"
            >
              <MapPin size={13} className="text-primary-500 flex-shrink-0" />
              <span className="text-xs font-medium text-primary-700 dark:text-primary-300 flex-1 truncate">
                {place.name}
              </span>
              {place.averageRating > 0 && (
                <span className="text-xs text-primary-600 dark:text-primary-400 font-mono">
                  ★ {place.averageRating.toFixed(1)}
                </span>
              )}
              <ChevronRight size={13} className="text-primary-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-secondary">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-3 border-t border-default">
        <button
          onClick={handleUpvote}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
            ${isUpvoted
              ? 'bg-campus-100 dark:bg-campus-950/50 text-campus-700 dark:text-campus-400'
              : 'text-tertiary hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
        >
          <ArrowUp size={14} className={isUpvoted ? 'fill-current' : ''} />
          {upvoteCount > 0 ? upvoteCount : 'Upvote'}
        </button>

        <Link
          to={`/posts/${post._id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-tertiary hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
        >
          <MessageCircle size={14} />
          {post.commentCount > 0 ? `${post.commentCount} replies` : 'Reply'}
        </Link>

        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-tertiary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 ml-auto"
          >
            <Trash2 size={13} />
            {deleting ? 'Removing…' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  );
}

export function PostSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="skeleton w-9 h-9 rounded-full" />
        <div className="space-y-1.5">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-3 w-16 rounded" />
        </div>
      </div>
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-4/5 rounded" />
      <div className="flex gap-2 pt-2">
        <div className="skeleton h-7 w-20 rounded-lg" />
        <div className="skeleton h-7 w-24 rounded-lg" />
      </div>
    </div>
  );
}
