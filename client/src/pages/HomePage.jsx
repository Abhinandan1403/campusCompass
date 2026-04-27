import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, TrendingUp, MapPin, SlidersHorizontal, X,
  Coffee, Utensils, ShoppingBag, Dumbbell, BookOpen,
  Zap, Star, ChevronRight, Compass
} from 'lucide-react';
import { placeAPI, collegeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PlaceCard, PlaceCardSkeleton } from '../components/place/PlaceCard';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: <Compass size={16} /> },
  { id: 'restaurant', label: 'Restaurants', icon: <Utensils size={16} /> },
  { id: 'cafe', label: 'Cafés', icon: <Coffee size={16} /> },
  { id: 'street-food', label: 'Street Food', icon: <Zap size={16} /> },
  { id: 'stationery', label: 'Stationery', icon: <BookOpen size={16} /> },
  { id: 'gym', label: 'Gym', icon: <Dumbbell size={16} /> },
  { id: 'grocery', label: 'Grocery', icon: <ShoppingBag size={16} /> },
];

const TAGS = [
  { id: 'cheap-eats-50-100', label: '₹50–₹100' },
  { id: 'cheap-eats-100-200', label: '₹100–₹200' },
  { id: 'good-for-study', label: '📖 Study Spot' },
  { id: 'wifi-available', label: '📶 WiFi' },
  { id: 'late-night-open', label: '🌙 Late Night' },
  { id: 'group-hangout', label: '👥 Group Friendly' },
];

const SORT_OPTIONS = [
  { id: 'trending', label: '🔥 Trending' },
  { id: 'rating', label: '⭐ Top Rated' },
  { id: 'most-reviewed', label: '💬 Most Reviewed' },
  { id: 'newest', label: '✨ Newest' },
];

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [places, setPlaces] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sort, setSort] = useState('trending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [collegeStats, setCollegeStats] = useState(null);

  const collegeId = user?.college?._id;

  // Load trending places
  useEffect(() => {
    if (!collegeId) return;
    setTrendingLoading(true);
    placeAPI.getTrending(collegeId)
      .then(res => setTrending(res.data.data.places.slice(0, 5)))
      .catch(() => {})
      .finally(() => setTrendingLoading(false));
  }, [collegeId]);

  // Load college stats
  useEffect(() => {
    if (!collegeId) return;
    collegeAPI.getStats(collegeId)
      .then(res => setCollegeStats(res.data.data.stats))
      .catch(() => {});
  }, [collegeId]);

  // Load places
  const loadPlaces = useCallback(async (resetPage = true) => {
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 12,
        sort,
        ...(collegeId && { college: collegeId }),
        ...(category !== 'all' && { category }),
        ...(selectedTags.length > 0 && { tags: selectedTags.join(',') }),
        ...(search && { search }),
      };
      const res = await placeAPI.getAll(params);
      if (resetPage) {
        setPlaces(res.data.data.places);
      } else {
        setPlaces(prev => [...prev, ...res.data.data.places]);
      }
      setTotalPages(res.data.data.pagination.pages);
    } catch {
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [page, sort, category, selectedTags, search, collegeId]);

  useEffect(() => {
    loadPlaces(true);
  }, [sort, category, selectedTags, search, collegeId]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const clearFilters = () => {
    setCategory('all');
    setSelectedTags([]);
    setSort('trending');
    setSearch('');
    setSearchInput('');
  };

  const hasActiveFilters = category !== 'all' || selectedTags.length > 0 || sort !== 'trending' || search;

  return (
    <div className="min-h-screen bg-app">
      {/* Hero section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-amber-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-2xl">
            {isAuthenticated && user?.college ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="opacity-80" />
                  <span className="text-sm font-medium opacity-90">{user.college.name}</span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2 leading-tight">
                  Hey {user.name.split(' ')[0]}! 👋
                </h1>
                <p className="text-base opacity-90 mb-2">
                  Discover what your campus community is loving right now.
                </p>
                {collegeStats && (
                  <div className="flex items-center gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-2xl font-display font-bold">{collegeStats.placeCount}</p>
                      <p className="text-xs opacity-75">Places</p>
                    </div>
                    <div className="w-px h-8 bg-white/30" />
                    <div className="text-center">
                      <p className="text-2xl font-display font-bold">{collegeStats.studentCount}</p>
                      <p className="text-xs opacity-75">Students</p>
                    </div>
                    <div className="w-px h-8 bg-white/30" />
                    <div className="text-center">
                      <p className="text-2xl font-display font-bold">{collegeStats.postCount}</p>
                      <p className="text-xs opacity-75">Feed Posts</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3 leading-tight">
                  Your Campus,<br />Explored.
                </h1>
                <p className="text-base opacity-90 mb-6">
                  Student-powered discovery of the best places near your college. Honest reviews, zero fluff.
                </p>
                <div className="flex gap-3">
                  <Link to="/register" className="bg-white text-primary-600 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors text-sm">
                    Join your campus →
                  </Link>
                  <Link to="/login" className="bg-white/20 text-white font-medium px-6 py-3 rounded-xl hover:bg-white/30 transition-colors text-sm backdrop-blur-sm">
                    Sign in
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary" />
          <input
            type="text"
            className="input pl-11 pr-24 h-12 text-base rounded-2xl shadow-card"
            placeholder="Search chai spots, study cafés, momos..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearch(''); }}
              className="absolute right-20 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary"
            >
              <X size={15} />
            </button>
          )}
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-2 px-4 text-sm rounded-xl">
            Search
          </button>
        </form>

        {/* Quick actions row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {/* Sort selector */}
            <div className="flex gap-1.5 flex-shrink-0">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSort(opt.id)}
                  className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 flex-shrink-0
                    ${sort === opt.id
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-surface-2 text-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all flex-shrink-0 ml-2
              ${hasActiveFilters ? 'bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400' : 'btn-ghost'}`}
          >
            <SlidersHorizontal size={13} />
            Filters
            {hasActiveFilters && (
              <span className="bg-primary-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {selectedTags.length + (category !== 'all' ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="card p-4 mb-6 animate-slide-down space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-primary">Filters</h3>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-primary-500 hover:text-primary-700 font-medium">
                  Clear all
                </button>
              )}
            </div>

            {/* Category filter */}
            <div>
              <p className="section-label mb-2">Category</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200
                      ${category === cat.id
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'bg-surface-2 text-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag filter */}
            <div>
              <p className="section-label mb-2">Vibes & Features</p>
              <div className="flex flex-wrap gap-1.5">
                {TAGS.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200
                      ${selectedTags.includes(tag.id)
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900'
                      }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category pills (always visible) */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap text-sm px-4 py-2 rounded-full font-medium transition-all duration-200 flex-shrink-0
                ${category === cat.id
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-surface border border-default text-secondary hover:border-primary-300 dark:hover:border-primary-700'
                }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Trending section (only when not filtering) */}
        {!hasActiveFilters && trending.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-primary-500" />
                <h2 className="font-display font-bold text-lg text-primary">Trending This Week</h2>
              </div>
              <Link
                to={collegeId ? `/feed/${collegeId}` : '/'}
                className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-700 font-medium"
              >
                See feed <ChevronRight size={14} />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {trendingLoading
                ? Array(4).fill(0).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-64">
                      <PlaceCardSkeleton />
                    </div>
                  ))
                : trending.map((place, i) => (
                    <div key={place._id} className="flex-shrink-0 w-64">
                      <Link
                        to={`/places/${place._id}`}
                        className="card card-hover block overflow-hidden group"
                      >
                        <div className="relative h-36 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                          {place.images?.[0]?.url ? (
                            <img src={place.images[0].url} alt={place.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              {['🍜', '☕', '🥙', '🍱', '🧋'][i % 5]}
                            </div>
                          )}
                          <div className="absolute top-2 left-2">
                            <span className="badge bg-amber-500 text-white text-xs font-bold">
                              #{i + 1} Trending
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <h4 className="font-semibold text-sm text-primary truncate mb-1">{place.name}</h4>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Star size={11} className="star-filled" />
                              <span className="text-xs font-semibold text-primary">
                                {place.averageRating > 0 ? place.averageRating.toFixed(1) : '—'}
                              </span>
                              <span className="text-xs text-tertiary">({place.reviewCount})</span>
                            </div>
                            <span className="text-xs text-tertiary">{place.category}</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))
              }
            </div>
          </section>
        )}

        {/* Main grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-primary">
              {search ? `Results for "${search}"` : hasActiveFilters ? 'Filtered Places' : 'All Places'}
            </h2>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-primary-500 hover:text-primary-700 font-medium">
                Clear filters
              </button>
            )}
          </div>

          {loading && places.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => <PlaceCardSkeleton key={i} />)}
            </div>
          ) : places.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-display font-bold text-xl text-primary mb-2">No places found</h3>
              <p className="text-secondary text-sm mb-6">
                {search ? `No results for "${search}"` : "No places match your filters"}
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={clearFilters} className="btn-secondary text-sm py-2">
                  Clear filters
                </button>
                {isAuthenticated && (
                  <Link to="/places/add" className="btn-primary text-sm py-2">
                    Add the first place!
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {places.map(place => (
                  <PlaceCard key={place._id} place={place} />
                ))}
              </div>

              {/* Load more */}
              {page < totalPages && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => {
                      const nextPage = page + 1;
                      setPage(nextPage);
                      loadPlaces(false);
                    }}
                    disabled={loading}
                    className="btn-secondary px-8"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* CTA for non-auth users */}
        {!isAuthenticated && (
          <div className="mt-12 card p-8 text-center gradient-primary text-white rounded-2xl">
            <h2 className="font-display font-bold text-2xl mb-2">Join Your Campus Community</h2>
            <p className="text-white/80 text-sm mb-6">
              Get access to your college's exclusive feed, write reviews, and help fellow students discover the best spots.
            </p>
            <Link to="/register" className="bg-white text-primary-600 font-semibold px-8 py-3 rounded-xl hover:bg-primary-50 transition-colors inline-block">
              Create Free Account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
