import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star, MapPin, Clock, Phone, BookmarkPlus, BookmarkCheck,
  ChevronLeft, Shield, TrendingUp, Share2, Flag, Plus,
  Wifi, Moon, Users, DollarSign, Tag, Edit, Trash2
} from 'lucide-react';
import { placeAPI } from '../services/api';
import { reviewAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ReviewCard, { ReviewSkeleton } from '../components/review/ReviewCard';
import ReviewForm from '../components/review/ReviewForm';
import { TAG_LABELS, CATEGORY_ICONS } from '../components/place/PlaceCard';

function RatingBar({ label, count, total, rating }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const colors = { 5: 'bg-green-500', 4: 'bg-green-400', 3: 'bg-amber-400', 2: 'bg-orange-400', 1: 'bg-red-500' };
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5 w-12 flex-shrink-0">
        <span className="text-xs text-secondary">{rating}</span>
        <Star size={11} className="star-filled" />
      </div>
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[rating]} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-tertiary w-6 text-right">{count}</span>
    </div>
  );
}

export default function PlaceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isBookmarked, toggleBookmark } = useAuth();
  const toast = useToast();

  const [place, setPlace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [userReview, setUserReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSort, setReviewSort] = useState('newest');
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [activeImage, setActiveImage] = useState(0);

  const bookmarked = place ? isBookmarked(place._id) : false;

  useEffect(() => {
    loadPlace();
  }, [id]);

  useEffect(() => {
    if (place) loadReviews(true);
  }, [place, reviewSort]);

  const loadPlace = async () => {
    setLoading(true);
    try {
      const res = await placeAPI.getOne(id);
      setPlace(res.data.data.place);
      setUserReview(res.data.data.userReview);
    } catch {
      toast.error('Place not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async (reset = false) => {
    const pg = reset ? 1 : reviewPage;
    if (reset) setReviewPage(1);
    setReviewsLoading(true);
    try {
      const res = await reviewAPI.getByPlace(id, { page: pg, limit: 8, sort: reviewSort });
      if (reset) {
        setReviews(res.data.data.reviews);
      } else {
        setReviews(prev => [...prev, ...res.data.data.reviews]);
      }
      setDistribution(res.data.data.distribution || []);
      setReviewTotal(res.data.data.pagination.total);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) { toast.info('Sign in to bookmark'); return; }
    const result = await toggleBookmark(place._id);
    toast.success(result ? 'Bookmarked!' : 'Bookmark removed');
  };

  const handleReviewAdded = (newReview) => {
    setReviews(prev => [newReview, ...prev]);
    setUserReview(newReview);
    setReviewTotal(prev => prev + 1);
    setShowReviewForm(false);
    loadPlace(); // refresh rating
  };

  const handleReviewDeleted = (reviewId) => {
    setReviews(prev => prev.filter(r => r._id !== reviewId));
    if (userReview?._id === reviewId) setUserReview(null);
    setReviewTotal(prev => prev - 1);
    loadPlace();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: place.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="skeleton h-72 rounded-2xl mb-6" />
        <div className="space-y-3">
          <div className="skeleton h-8 w-2/3 rounded-xl" />
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="skeleton h-4 w-full rounded" />
        </div>
      </div>
    );
  }

  if (!place) return null;

  const distMap = {};
  distribution.forEach(d => { distMap[d._id] = d.count; });

  return (
    <div className="min-h-screen bg-app">
      {/* Image gallery */}
      <div className="relative h-64 sm:h-80 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
        {place.images?.length > 0 ? (
          <>
            <img
              src={place.images[activeImage].url}
              alt={place.name}
              className="w-full h-full object-cover"
            />
            {place.images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {place.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === activeImage ? 'bg-white w-4' : 'bg-white/60'}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">
            {CATEGORY_ICONS[place.category] || '📍'}
          </div>
        )}

        {/* Action buttons overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center hover:bg-white dark:hover:bg-gray-900 transition-colors"
          >
            <ChevronLeft size={18} className="text-primary" />
          </button>
          <div className="flex gap-2">
            <button onClick={handleShare} className="w-10 h-10 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center hover:bg-white dark:hover:bg-gray-900 transition-colors">
              <Share2 size={16} className="text-primary" />
            </button>
            <button
              onClick={handleBookmark}
              className={`w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center transition-all
                ${bookmarked ? 'bg-primary-500 text-white' : 'bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 text-primary'}`}
            >
              {bookmarked ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          {place.isVerified && (
            <span className="badge badge-success text-xs backdrop-blur-sm">
              <Shield size={10} /> Verified
            </span>
          )}
          {place.trendingScore > 70 && (
            <span className="badge bg-amber-500 text-white text-xs backdrop-blur-sm">
              <TrendingUp size={10} /> Trending
            </span>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Rating */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-1">
                <h1 className="font-display font-bold text-2xl text-primary leading-tight">{place.name}</h1>
                <span className={`badge text-sm flex-shrink-0 mt-0.5
                  ${place.averageRating >= 4 ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400' :
                    place.averageRating >= 3 ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400' :
                    'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400'}`}
                >
                  <Star size={12} className="fill-current" />
                  {place.averageRating > 0 ? place.averageRating.toFixed(1) : 'No rating'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-secondary mb-3">
                <span className="capitalize">{place.category.replace('-', ' ')}</span>
                <span>·</span>
                <span>{place.reviewCount} review{place.reviewCount !== 1 ? 's' : ''}</span>
                {place.distanceFromGate && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1"><MapPin size={13} /> {place.distanceFromGate}</span>
                  </>
                )}
              </div>

              <p className="text-secondary leading-relaxed">{place.description}</p>
            </div>

            {/* Tags */}
            {place.tags?.length > 0 && (
              <div>
                <p className="section-label mb-2">Vibes & Features</p>
                <div className="flex flex-wrap gap-2">
                  {place.tags.map(tag => (
                    <span key={tag} className="tag">{TAG_LABELS[tag] || tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg text-primary">
                  Student Reviews
                </h2>
                <div className="flex gap-1.5">
                  {['newest', 'helpful', 'highest', 'lowest'].map(s => (
                    <button
                      key={s}
                      onClick={() => setReviewSort(s)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all capitalize
                        ${reviewSort === s ? 'bg-primary-500 text-white' : 'bg-surface-2 text-secondary hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add review button */}
              {isAuthenticated && !userReview && !showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-primary-300 dark:border-primary-800 rounded-xl text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all mb-4 font-medium text-sm"
                >
                  <Plus size={16} />
                  Write a Review
                </button>
              )}

              {showReviewForm && (
                <div className="mb-4">
                  <ReviewForm
                    placeId={place._id}
                    placeName={place.name}
                    onSuccess={handleReviewAdded}
                    onCancel={() => setShowReviewForm(false)}
                  />
                </div>
              )}

              {userReview && (
                <div className="mb-4">
                  <p className="section-label mb-2">Your Review</p>
                  <ReviewCard review={userReview} onDelete={handleReviewDeleted} />
                </div>
              )}

              {reviews.length === 0 && !reviewsLoading ? (
                <div className="text-center py-12 card">
                  <div className="text-4xl mb-3">✍️</div>
                  <h3 className="font-semibold text-primary mb-1">No reviews yet</h3>
                  <p className="text-sm text-secondary mb-4">
                    Be the first to share your experience!
                  </p>
                  {!isAuthenticated && (
                    <Link to="/login" className="btn-primary text-sm inline-flex">
                      Sign in to review
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {reviewsLoading && reviews.length === 0
                    ? Array(3).fill(0).map((_, i) => <ReviewSkeleton key={i} />)
                    : reviews
                        .filter(r => r._id !== userReview?._id)
                        .map(r => (
                          <ReviewCard key={r._id} review={r} onDelete={handleReviewDeleted} />
                        ))
                  }
                  {reviews.length < reviewTotal && (
                    <button
                      onClick={() => { setReviewPage(p => p + 1); loadReviews(false); }}
                      className="w-full btn-secondary text-sm"
                    >
                      Load more reviews
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Rating overview */}
            <div className="card p-4">
              <div className="text-center mb-4">
                <div className="font-display font-bold text-4xl text-primary">
                  {place.averageRating > 0 ? place.averageRating.toFixed(1) : '—'}
                </div>
                <div className="flex justify-center gap-0.5 my-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={14} className={i <= Math.round(place.averageRating) ? 'star-filled' : 'star-empty'} />
                  ))}
                </div>
                <p className="text-xs text-tertiary">{reviewTotal} review{reviewTotal !== 1 ? 's' : ''}</p>
              </div>
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map(r => (
                  <RatingBar key={r} rating={r} count={distMap[r] || 0} total={reviewTotal} />
                ))}
              </div>
            </div>

            {/* Place info */}
            <div className="card p-4 space-y-3">
              <h3 className="font-semibold text-sm text-primary">Details</h3>

              <div className="flex items-start gap-2.5 text-sm">
                <MapPin size={15} className="text-tertiary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-secondary">{place.address}</p>
                  {place.landmark && <p className="text-tertiary text-xs mt-0.5">{place.landmark}</p>}
                </div>
              </div>

              {place.timings && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Clock size={15} className="text-tertiary mt-0.5 flex-shrink-0" />
                  <div>
                    {place.timings.isOpen24Hours ? (
                      <p className="text-green-600 dark:text-green-400 font-medium">Open 24 hours</p>
                    ) : (
                      <p className="text-secondary">{place.timings.openTime} – {place.timings.closeTime}</p>
                    )}
                    {place.timings.closedOn?.length > 0 && (
                      <p className="text-tertiary text-xs mt-0.5">Closed: {place.timings.closedOn.join(', ')}</p>
                    )}
                  </div>
                </div>
              )}

              {place.contactNumber && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone size={15} className="text-tertiary flex-shrink-0" />
                  <span className="text-secondary">{place.contactNumber}</span>
                </div>
              )}

              {place.priceRange?.min > 0 && (
                <div className="flex items-center gap-2.5 text-sm">
                  <DollarSign size={15} className="text-tertiary flex-shrink-0" />
                  <span className="text-secondary font-mono">₹{place.priceRange.min} – ₹{place.priceRange.max} per person</span>
                </div>
              )}
            </div>

            {/* Added by */}
            {place.addedBy && (
              <div className="card p-4">
                <p className="section-label mb-2">Added by</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-campus-500 flex items-center justify-center text-white text-sm font-bold">
                    {place.addedBy.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary">{place.addedBy.name}</p>
                    {place.addedBy.isStudentVerified && (
                      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <Shield size={10} /> Verified Student
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {isAuthenticated && !userReview && (
                <button onClick={() => setShowReviewForm(true)} className="btn-primary w-full text-sm">
                  <Star size={15} /> Write a Review
                </button>
              )}
              <button onClick={handleBookmark} className={`w-full text-sm flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all font-medium
                ${bookmarked ? 'bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400' : 'btn-secondary'}`}>
                {bookmarked ? <BookmarkCheck size={15} /> : <BookmarkPlus size={15} />}
                {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
