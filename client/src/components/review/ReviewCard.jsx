import { useState } from 'react';
import { Star, ThumbsUp, Flag, Shield, MoreVertical, Trash2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { reviewAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={13}
          className={i <= rating ? 'star-filled' : 'star-empty'}
        />
      ))}
    </div>
  );
}

export default function ReviewCard({ review, onDelete }) {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || review.helpfulVotes?.length || 0);
  const [isHelpful, setIsHelpful] = useState(
    review.helpfulVotes?.some(id => id === user?._id || id?._id === user?._id)
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleHelpful = async () => {
    if (!isAuthenticated) { toast.info('Sign in to vote'); return; }
    try {
      const res = await reviewAPI.toggleHelpful(review._id);
      setIsHelpful(res.data.data.isHelpful);
      setHelpfulCount(res.data.data.helpfulCount);
    } catch {
      toast.error('Could not register vote');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this review?')) return;
    setDeleting(true);
    try {
      await reviewAPI.delete(review._id);
      toast.success('Review deleted');
      onDelete?.(review._id);
    } catch {
      toast.error('Could not delete review');
    } finally {
      setDeleting(false);
    }
  };

  const isOwner = user?._id === (review.user?._id || review.user);
  const displayUser = review.isAnonymous
    ? { name: 'Anonymous Student', avatar: null, isStudentVerified: false }
    : review.user;

  const ratingColors = {
    5: 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400',
    4: 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400',
    3: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400',
    2: 'text-red-500 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
    1: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
  };

  return (
    <div className="card p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0
            ${review.isAnonymous
              ? 'bg-gray-400 dark:bg-gray-600'
              : 'bg-gradient-to-br from-primary-400 to-campus-500'
            }`}>
            {displayUser?.name?.[0]?.toUpperCase() || <User size={16} />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-primary">{displayUser?.name}</span>
              {displayUser?.isStudentVerified && !review.isAnonymous && (
                <span className="badge badge-success py-0.5">
                  <Shield size={9} /> Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={review.rating} />
              <span className="text-xs text-tertiary">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-1 rounded-lg text-sm font-bold ${ratingColors[review.rating]}`}>
            {review.rating}.0
          </div>
          {(isOwner) && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="btn-ghost p-1.5 rounded-lg"
              >
                <MoreVertical size={15} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 card animate-scale-in py-1 z-10">
                  {isOwner && (
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                  )}
                </div>
              )}
              {menuOpen && <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(false)} />}
            </div>
          )}
        </div>
      </div>

      {/* Review content */}
      {review.title && (
        <h4 className="font-semibold text-primary text-sm mb-1.5">{review.title}</h4>
      )}
      <p className="text-sm text-secondary leading-relaxed">{review.body}</p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-default">
        <button
          onClick={handleHelpful}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200
            ${isHelpful
              ? 'bg-campus-100 dark:bg-campus-950/50 text-campus-700 dark:text-campus-400'
              : 'text-tertiary hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
        >
          <ThumbsUp size={13} className={isHelpful ? 'fill-current' : ''} />
          Helpful {helpfulCount > 0 && `(${helpfulCount})`}
        </button>

        {displayUser?.year && !review.isAnonymous && (
          <span className="text-xs text-tertiary">{displayUser.year}</span>
        )}
      </div>
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="space-y-1.5">
          <div className="skeleton h-4 w-28 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </div>
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-5/6 rounded" />
    </div>
  );
}
