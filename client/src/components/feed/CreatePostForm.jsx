import { useState } from 'react';
import { Send, EyeOff, Eye, ChevronDown, X, MapPin } from 'lucide-react';
import { postAPI, placeAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const POST_TYPES = [
  { value: 'question', label: '❓ Question', placeholder: 'Ask your campus community something...' },
  { value: 'recommendation', label: '⭐ Recommendation', placeholder: 'Recommend a great place...' },
  { value: 'tip', label: '💡 Tip', placeholder: 'Share a helpful tip...' },
  { value: 'alert', label: '⚠️ Alert', placeholder: 'Alert others about something...' },
  { value: 'event', label: '🎉 Event', placeholder: 'Share a campus event...' },
];

export default function CreatePostForm({ onPostCreated }) {
  const { user } = useAuth();
  const toast = useToast();
  const [content, setContent] = useState('');
  const [type, setType] = useState('question');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [placeSearch, setPlaceSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [linkedPlaces, setLinkedPlaces] = useState([]);
  const [searching, setSearching] = useState(false);

  const selectedType = POST_TYPES.find(t => t.value === type);

  const searchPlaces = async (q) => {
    setPlaceSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await placeAPI.getAll({ search: q, college: user?.college?._id, limit: 5 });
      setSearchResults(res.data.data.places);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addPlace = (place) => {
    if (!linkedPlaces.find(p => p._id === place._id)) {
      setLinkedPlaces(prev => [...prev, place]);
    }
    setPlaceSearch('');
    setSearchResults([]);
  };

  const removePlace = (id) => setLinkedPlaces(prev => prev.filter(p => p._id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || content.length < 5) {
      toast.error('Post must be at least 5 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await postAPI.create({
        content: content.trim(),
        type,
        isAnonymous,
        linkedPlaces: linkedPlaces.map(p => p._id)
      });
      setContent('');
      setLinkedPlaces([]);
      setExpanded(false);
      toast.success('Post shared with your campus! 🎉');
      onPostCreated?.(res.data.data.post);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4 animate-fade-in">
      <form onSubmit={handleSubmit}>
        {/* Trigger area */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-campus-400 to-campus-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <textarea
            className="flex-1 bg-transparent text-sm text-primary placeholder-tertiary focus:outline-none resize-none min-h-[52px] leading-relaxed"
            placeholder={selectedType?.placeholder || 'Ask your campus...'}
            value={content}
            onChange={e => { setContent(e.target.value); if (e.target.value.length > 0 && !expanded) setExpanded(true); }}
            onFocus={() => setExpanded(true)}
            rows={expanded ? 3 : 1}
            maxLength={500}
          />
        </div>

        {expanded && (
          <div className="mt-4 space-y-3 animate-slide-down">
            {/* Type selector */}
            <div className="flex gap-1.5 flex-wrap">
              {POST_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 font-medium
                    ${type === t.value
                      ? 'bg-campus-600 text-white shadow-sm'
                      : 'bg-surface-2 text-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Link places */}
            <div className="relative">
              <div className="flex items-center gap-2 input py-2">
                <MapPin size={14} className="text-tertiary flex-shrink-0" />
                <input
                  type="text"
                  className="flex-1 bg-transparent text-sm focus:outline-none text-primary placeholder-tertiary"
                  placeholder="Link a place (optional)..."
                  value={placeSearch}
                  onChange={e => searchPlaces(e.target.value)}
                />
              </div>
              {(searchResults.length > 0 || searching) && (
                <div className="absolute top-full left-0 right-0 mt-1 card py-1 z-20 max-h-40 overflow-y-auto">
                  {searching && (
                    <p className="text-xs text-tertiary text-center py-2">Searching…</p>
                  )}
                  {searchResults.map(place => (
                    <button
                      key={place._id}
                      type="button"
                      onClick={() => addPlace(place)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <MapPin size={12} className="text-primary-500 flex-shrink-0" />
                      <span className="text-sm text-primary truncate">{place.name}</span>
                      <span className="text-xs text-tertiary ml-auto">{place.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Linked places pills */}
            {linkedPlaces.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {linkedPlaces.map(place => (
                  <span key={place._id} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-900">
                    <MapPin size={10} />
                    {place.name}
                    <button type="button" onClick={() => removePlace(place._id)} className="hover:text-red-500 transition-colors">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all duration-200 font-medium
                    ${isAnonymous
                      ? 'bg-campus-100 dark:bg-campus-950/50 text-campus-700 dark:text-campus-400'
                      : 'text-tertiary hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  {isAnonymous ? <EyeOff size={12} /> : <Eye size={12} />}
                  {isAnonymous ? 'Anonymous' : 'Public'}
                </button>
                <span className={`text-xs ${content.length > 450 ? 'text-amber-500' : 'text-tertiary'}`}>
                  {content.length}/500
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setExpanded(false); setContent(''); setLinkedPlaces([]); }}
                  className="btn-ghost text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || content.length < 5}
                  className="btn-campus text-xs py-1.5 px-4"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Send size={13} /> Post</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
