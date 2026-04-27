import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, MessageSquare, MapPin, Shield, Edit3, Save, X,
  Bookmark, ChevronRight, Award, Settings, Camera
} from 'lucide-react';
import { userAPI, reviewAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PlaceCard, PlaceCardSkeleton } from '../components/place/PlaceCard';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG', 'PhD', 'Alumni'];

function StatCard({ icon, value, label }) {
  return (
    <div className="card p-4 text-center">
      <div className="text-2xl mb-0.5">{icon}</div>
      <div className="font-display font-bold text-xl text-primary">{value}</div>
      <div className="text-xs text-tertiary mt-0.5">{label}</div>
    </div>
  );
}

function ReviewItem({ review }) {
  return (
    <Link to={`/places/${review.place?._id}`} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-2 transition-colors group">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
        {review.place?.images?.[0]?.url ? (
          <img src={review.place.images[0].url} className="w-full h-full object-cover" alt="" />
        ) : '📍'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-primary truncate group-hover:text-primary-600 transition-colors">
          {review.place?.name}
        </p>
        <div className="flex items-center gap-1 my-0.5">
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={11} className={i <= review.rating ? 'star-filled' : 'star-empty'} />
          ))}
        </div>
        <p className="text-xs text-secondary line-clamp-1">{review.body}</p>
      </div>
      <ChevronRight size={14} className="text-tertiary mt-1 flex-shrink-0 group-hover:text-primary transition-colors" />
    </Link>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user: authUser, updateUser, isAuthenticated } = useAuth();
  const toast = useToast();

  const isOwnProfile = !id || id === authUser?._id;
  const profileId = id || authUser?._id;

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reviews');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [profileId]);

  useEffect(() => {
    if (isOwnProfile && activeTab === 'bookmarks') loadBookmarks();
  }, [activeTab, isOwnProfile]);

  const loadProfile = async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const [profileRes, reviewRes] = await Promise.all([
        userAPI.getProfile(profileId),
        reviewAPI.getByUser(profileId)
      ]);
      setProfile(profileRes.data.data.user);
      setReviews(reviewRes.data.data.reviews);
      setEditForm({
        name: profileRes.data.data.user.name,
        bio: profileRes.data.data.user.bio || '',
        year: profileRes.data.data.user.year || '1st Year',
        department: profileRes.data.data.user.department || ''
      });
    } catch {
      toast.error('Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarks = async () => {
    try {
      const res = await userAPI.getBookmarks();
      setBookmarks(res.data.data.bookmarks);
    } catch {
      toast.error('Could not load bookmarks');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(editForm);
      updateUser(res.data.data.user);
      setProfile(prev => ({ ...prev, ...res.data.data.user }));
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="skeleton w-20 h-20 rounded-full" />
            <div className="space-y-2">
              <div className="skeleton h-6 w-36 rounded" />
              <div className="skeleton h-4 w-24 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const tabs = [
    { id: 'reviews', label: `Reviews (${reviews.length})` },
    ...(isOwnProfile ? [{ id: 'bookmarks', label: 'Bookmarks' }] : []),
    ...(isOwnProfile ? [{ id: 'settings', label: 'Settings' }] : []),
  ];

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {/* Profile header */}
        <div className="card p-6">
          <div className="flex items-start gap-4 mb-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-campus-500 flex items-center justify-center text-white text-3xl font-bold">
                {profile.name?.[0]?.toUpperCase()}
              </div>
              {profile.isStudentVerified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                  <Shield size={12} className="text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  className="input text-lg font-bold mb-1 py-1.5"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                />
              ) : (
                <h1 className="font-display font-bold text-xl text-primary">{profile.name}</h1>
              )}

              <div className="flex items-center gap-1.5 text-sm text-secondary mt-1">
                <MapPin size={13} />
                <span>{profile.college?.name}</span>
              </div>

              {editing ? (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <select className="input py-1.5 text-sm" value={editForm.year}
                    onChange={e => setEditForm(f => ({ ...f, year: e.target.value }))}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <input className="input py-1.5 text-sm" placeholder="Department"
                    value={editForm.department}
                    onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} />
                </div>
              ) : (
                <p className="text-sm text-tertiary mt-1">
                  {[profile.year, profile.department].filter(Boolean).join(' · ') || 'Student'}
                </p>
              )}
            </div>

            {/* Edit button */}
            {isOwnProfile && (
              editing ? (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="btn-ghost p-2 rounded-xl">
                    <X size={16} />
                  </button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary p-2 rounded-xl">
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditing(true)} className="btn-ghost p-2 rounded-xl">
                  <Edit3 size={16} />
                </button>
              )
            )}
          </div>

          {/* Bio */}
          {editing ? (
            <textarea
              className="input resize-none h-16 text-sm mb-4"
              placeholder="Write a short bio..."
              value={editForm.bio}
              onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
              maxLength={200}
            />
          ) : profile.bio ? (
            <p className="text-sm text-secondary mb-4">{profile.bio}</p>
          ) : null}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon="✍️" value={reviews.length} label="Reviews" />
            <StatCard icon="⭐" value={
              reviews.length > 0
                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                : '—'
            } label="Avg Rating" />
            <StatCard icon="🔥" value={profile.isStudentVerified ? '✓' : '—'} label="Verified" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-2 p-1 rounded-xl">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 text-sm py-2 px-3 rounded-lg font-medium transition-all duration-200
                ${activeTab === tab.id ? 'bg-app shadow-sm text-primary' : 'text-tertiary hover:text-secondary'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'reviews' && (
          <div className="card">
            {reviews.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">✍️</div>
                <h3 className="font-semibold text-primary mb-1">No reviews yet</h3>
                <p className="text-sm text-secondary mb-4">
                  {isOwnProfile ? 'Start exploring and share your experiences!' : 'This user hasn\'t reviewed any places yet.'}
                </p>
                {isOwnProfile && <Link to="/" className="btn-primary text-sm inline-flex">Discover Places</Link>}
              </div>
            ) : (
              <div className="divide-y divide-default">
                {reviews.map(review => (
                  <div key={review._id} className="p-1">
                    <ReviewItem review={review} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookmarks' && isOwnProfile && (
          <div>
            {bookmarks.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="text-4xl mb-3">🔖</div>
                <h3 className="font-semibold text-primary mb-1">No bookmarks yet</h3>
                <p className="text-sm text-secondary mb-4">Save places you want to visit later</p>
                <Link to="/" className="btn-primary text-sm inline-flex">Explore Places</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bookmarks.map(place => <PlaceCard key={place._id} place={place} />)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && isOwnProfile && (
          <div className="card p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-primary">Account Settings</h3>
            <div className="space-y-3">
              <Link to="/change-password" className="flex items-center justify-between p-4 rounded-xl hover:bg-surface-2 transition-colors border border-default">
                <div>
                  <p className="font-medium text-sm text-primary">Change Password</p>
                  <p className="text-xs text-tertiary mt-0.5">Update your account password</p>
                </div>
                <ChevronRight size={16} className="text-tertiary" />
              </Link>
              <Link to={user => `/feed/${authUser?.college?._id}`}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-surface-2 transition-colors border border-default">
                <div>
                  <p className="font-medium text-sm text-primary">Campus Feed</p>
                  <p className="text-xs text-tertiary mt-0.5">Visit your college feed</p>
                </div>
                <ChevronRight size={16} className="text-tertiary" />
              </Link>
            </div>
            <div className="pt-4 border-t border-default">
              <p className="text-xs text-tertiary">
                Member since {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
