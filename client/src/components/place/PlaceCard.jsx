import { Link } from 'react-router-dom';
import { Star, MapPin, BookmarkPlus, BookmarkCheck, Wifi, Clock, Users, TrendingUp, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const CATEGORY_ICONS = {
  restaurant: '🍽️', cafe: '☕', 'street-food': '🥙', stationery: '📚',
  pharmacy: '💊', gym: '💪', library: '📖', hostel: '🏠',
  salon: '✂️', grocery: '🛒', entertainment: '🎭', printing: '🖨️',
  coaching: '👨‍🏫', other: '📍'
};

const CATEGORY_COLORS = {
  restaurant: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400',
  cafe: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
  'street-food': 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400',
  stationery: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
  pharmacy: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400',
  gym: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400',
  library: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400',
  other: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
};

const TAG_LABELS = {
  'cheap-eats-50-100': '₹50-100',
  'cheap-eats-100-200': '₹100-200',
  'good-for-study': '📖 Study Spot',
  'wifi-available': '📶 WiFi',
  'late-night-open': '🌙 Late Night',
  'group-hangout': '👥 Group Friendly',
  'outdoor-seating': '🌿 Outdoors',
  'ac-available': '❄️ AC',
  'vegetarian-friendly': '🥦 Veg Friendly',
  'quick-bites': '⚡ Quick',
  'exam-fuel': '📝 Exam Fuel',
  'chai-coffee': '☕ Chai/Coffee',
  'power-outlets': '🔌 Power Outlets',
  'street-food': '🛺 Street Food',
};

function StarRating({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? 'star-filled' : 'star-empty'}
        />
      ))}
    </div>
  );
}

export function PlaceCard({ place, compact = false }) {
  const { isAuthenticated, isBookmarked, toggleBookmark } = useAuth();
  const toast = useToast();
  const bookmarked = isBookmarked(place._id);

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Please sign in to bookmark places');
      return;
    }
    const result = await toggleBookmark(place._id);
    if (result) toast.success('Place bookmarked!');
    else toast.info('Bookmark removed');
  };

  const priorityTags = place.tags?.slice(0, 3) || [];
  const categoryColor = CATEGORY_COLORS[place.category] || CATEGORY_COLORS.other;

  return (
    <Link
      to={`/places/${place._id}`}
      className="card card-hover block group overflow-hidden"
    >
      {/* Image area */}
      <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
        {place.images?.[0]?.url ? (
          <img
            src={place.images[0].url}
            alt={place.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {CATEGORY_ICONS[place.category] || '📍'}
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className={`badge text-xs font-semibold ${categoryColor}`}>
            {CATEGORY_ICONS[place.category]} {place.category.replace('-', ' ')}
          </span>
          {place.isVerified && (
            <span className="badge badge-success">
              <Shield size={10} /> Verified
            </span>
          )}
        </div>

        {/* Bookmark button */}
        <button
          onClick={handleBookmark}
          className={`absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-sm transition-all duration-200
            ${bookmarked
              ? 'bg-primary-500 text-white shadow-sm'
              : 'bg-white/80 dark:bg-gray-900/80 text-gray-600 hover:bg-primary-500 hover:text-white'
            }`}
        >
          {bookmarked ? <BookmarkCheck size={15} /> : <BookmarkPlus size={15} />}
        </button>

        {/* Trending badge */}
        {place.trendingScore > 70 && (
          <div className="absolute bottom-3 left-3">
            <span className="badge bg-amber-500 text-white text-xs">
              <TrendingUp size={10} /> Trending
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-display font-bold text-base text-primary leading-tight group-hover:text-primary-600 transition-colors line-clamp-1">
            {place.name}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star size={13} className="star-filled" />
            <span className="text-sm font-semibold text-primary">
              {place.averageRating > 0 ? place.averageRating.toFixed(1) : '—'}
            </span>
          </div>
        </div>

        <p className="text-xs text-secondary mb-2.5 line-clamp-2 leading-relaxed">
          {place.description}
        </p>

        {/* Location */}
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin size={12} className="text-tertiary flex-shrink-0" />
          <span className="text-xs text-tertiary truncate">
            {place.distanceFromGate || place.address}
          </span>
        </div>

        {/* Tags */}
        {priorityTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {priorityTags.map(tag => (
              <span key={tag} className="tag text-xs">
                {TAG_LABELS[tag] || tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-default">
          <div className="flex items-center gap-1">
            <span className="text-xs text-tertiary">
              {place.reviewCount > 0
                ? `${place.reviewCount} review${place.reviewCount > 1 ? 's' : ''}`
                : 'No reviews yet'
              }
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-tertiary">
            {place.priceRange?.min > 0 && (
              <span className="font-mono">
                ₹{place.priceRange.min}–{place.priceRange.max}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function PlaceCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-44 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-5 w-3/4 rounded-lg" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-5/6 rounded" />
        <div className="flex gap-2">
          <div className="skeleton h-6 w-20 rounded-full" />
          <div className="skeleton h-6 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export { StarRating, TAG_LABELS, CATEGORY_ICONS };
