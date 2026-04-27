import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowLeft } from 'lucide-react';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PlaceCard, PlaceCardSkeleton } from '../components/place/PlaceCard';

export default function BookmarksPage() {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    userAPI.getBookmarks()
      .then(res => setBookmarks(res.data.data.bookmarks))
      .catch(() => toast.error('Could not load bookmarks'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="card p-8 text-center max-w-sm">
          <Bookmark size={40} className="text-primary-500 mx-auto mb-4" />
          <h2 className="font-display font-bold text-xl text-primary mb-2">Sign in to view bookmarks</h2>
          <Link to="/login" className="btn-primary mt-4 inline-flex">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="btn-ghost p-2 rounded-xl">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-primary flex items-center gap-2">
              <Bookmark size={22} className="text-primary-500" /> Bookmarks
            </h1>
            <p className="text-secondary text-sm mt-0.5">
              {bookmarks.length} saved place{bookmarks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => <PlaceCardSkeleton key={i} />)}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔖</div>
            <h3 className="font-display font-bold text-xl text-primary mb-2">No bookmarks yet</h3>
            <p className="text-secondary text-sm mb-6">
              Save places you want to visit later by clicking the bookmark icon on any place.
            </p>
            <Link to="/" className="btn-primary inline-flex">Explore Places</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {bookmarks.map(place => <PlaceCard key={place._id} place={place} />)}
          </div>
        )}
      </div>
    </div>
  );
}
