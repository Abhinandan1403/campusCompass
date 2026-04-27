import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Plus, X, Info, Clock, DollarSign, Tag, ChevronDown } from 'lucide-react';
import { placeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CATEGORIES = [
  { value: 'restaurant', label: '🍽️ Restaurant' },
  { value: 'cafe', label: '☕ Café' },
  { value: 'street-food', label: '🥙 Street Food' },
  { value: 'stationery', label: '📚 Stationery' },
  { value: 'pharmacy', label: '💊 Pharmacy' },
  { value: 'gym', label: '💪 Gym' },
  { value: 'library', label: '📖 Library' },
  { value: 'hostel', label: '🏠 Hostel Services' },
  { value: 'salon', label: '✂️ Salon' },
  { value: 'grocery', label: '🛒 Grocery' },
  { value: 'entertainment', label: '🎭 Entertainment' },
  { value: 'printing', label: '🖨️ Printing' },
  { value: 'coaching', label: '👨‍🏫 Coaching' },
  { value: 'other', label: '📍 Other' },
];

const ALL_TAGS = [
  { value: 'cheap-eats-50-100', label: '₹50–100' },
  { value: 'cheap-eats-100-200', label: '₹100–200' },
  { value: 'good-for-study', label: '📖 Good for Study' },
  { value: 'wifi-available', label: '📶 WiFi Available' },
  { value: 'late-night-open', label: '🌙 Late Night Open' },
  { value: 'group-hangout', label: '👥 Group Hangout' },
  { value: 'outdoor-seating', label: '🌿 Outdoor Seating' },
  { value: 'ac-available', label: '❄️ AC Available' },
  { value: 'vegetarian-friendly', label: '🥦 Veg Friendly' },
  { value: 'quick-bites', label: '⚡ Quick Bites' },
  { value: 'delivery-available', label: '🛵 Delivery Available' },
  { value: 'exam-fuel', label: '📝 Exam Fuel' },
  { value: 'chai-coffee', label: '☕ Chai/Coffee' },
  { value: 'power-outlets', label: '🔌 Power Outlets' },
  { value: 'street-food', label: '🛺 Street Food' },
  { value: 'great-ambience', label: '✨ Great Ambience' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AddPlacePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    address: '',
    landmark: '',
    distanceFromGate: '',
    contactNumber: '',
    tags: [],
    location: { type: 'Point', coordinates: [0, 0] },
    priceRange: { min: 0, max: 200 },
    timings: { openTime: '09:00', closeTime: '22:00', closedOn: [], isOpen24Hours: false },
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [locationSet, setLocationSet] = useState(false);
  const [step, setStep] = useState(1);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const toggleTag = (tag) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }));
  };

  const toggleClosedDay = (day) => {
    setForm(prev => ({
      ...prev,
      timings: {
        ...prev.timings,
        closedOn: prev.timings.closedOn.includes(day)
          ? prev.timings.closedOn.filter(d => d !== day)
          : [...prev.timings.closedOn, day]
      }
    }));
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          location: { type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude] }
        }));
        setLocationSet(true);
        setGeoLoading(false);
        toast.success('Location captured!');
      },
      () => {
        setGeoLoading(false);
        toast.error('Could not get your location. Please enter coordinates manually.');
      },
      { timeout: 10000 }
    );
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.description.trim() || form.description.length < 10) errs.description = 'Description must be at least 10 characters';
    if (!form.category) errs.category = 'Please select a category';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (form.location.coordinates[0] === 0 && form.location.coordinates[1] === 0) {
      errs.location = 'Please set the location';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Please fix the errors before submitting');
      return;
    }
    setLoading(true);
    try {
      const res = await placeAPI.create({
        ...form,
        college: user.college._id
      });
      toast.success('Place added successfully! 🎉');
      navigate(`/places/${res.data.data.place._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add place');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="card p-8 text-center max-w-sm">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="font-display font-bold text-xl text-primary mb-2">Sign in Required</h2>
          <p className="text-secondary text-sm mb-6">You need to be signed in to add a place</p>
          <Link to="/login" className="btn-primary w-full">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mb-1">Add a Place</h1>
          <p className="text-secondary text-sm">
            Share a discovery with {user.college?.shortName} community
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${step >= s ? 'bg-primary-500 text-white' : 'bg-surface-2 text-tertiary'}`}>
                {s}
              </div>
              <div className="flex-1 h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className={`h-full bg-primary-500 transition-all duration-500 ${step > s ? 'w-full' : 'w-0'}`} />
              </div>
            </div>
          ))}
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
            ${step >= 3 ? 'bg-primary-500 text-white' : 'bg-surface-2 text-tertiary'}`}>
            ✓
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="card p-6 space-y-5 animate-fade-in">
              <h2 className="font-display font-bold text-lg text-primary flex items-center gap-2">
                <Info size={18} className="text-primary-500" /> Basic Information
              </h2>

              <div>
                <label className="section-label block mb-2">Place Name *</label>
                <input
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder="e.g. Sharma Ji Ki Chai"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  maxLength={100}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="section-label block mb-2">Category *</label>
                <div className="relative">
                  <select
                    className={`input appearance-none ${errors.category ? 'input-error' : ''}`}
                    value={form.category}
                    onChange={e => update('category', e.target.value)}
                  >
                    <option value="">Select a category...</option>
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" />
                </div>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="section-label block mb-2">Description *</label>
                <textarea
                  className={`input resize-none h-28 ${errors.description ? 'input-error' : ''}`}
                  placeholder="What makes this place special? What should students know? Be honest and specific..."
                  value={form.description}
                  onChange={e => update('description', e.target.value)}
                  maxLength={500}
                />
                <div className="flex justify-between mt-1">
                  {errors.description ? <p className="text-red-500 text-xs">{errors.description}</p> : <span />}
                  <span className="text-xs text-tertiary">{form.description.length}/500</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="section-label block mb-2">Min Price (₹)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0"
                    min={0}
                    value={form.priceRange.min}
                    onChange={e => setForm(prev => ({ ...prev, priceRange: { ...prev.priceRange, min: parseInt(e.target.value) || 0 } }))}
                  />
                </div>
                <div>
                  <label className="section-label block mb-2">Max Price (₹)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="500"
                    min={0}
                    value={form.priceRange.max}
                    onChange={e => setForm(prev => ({ ...prev, priceRange: { ...prev.priceRange, max: parseInt(e.target.value) || 0 } }))}
                  />
                </div>
              </div>

              <button type="button" onClick={() => setStep(2)} className="btn-primary w-full">
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: Location & Contact */}
          {step === 2 && (
            <div className="card p-6 space-y-5 animate-fade-in">
              <h2 className="font-display font-bold text-lg text-primary flex items-center gap-2">
                <MapPin size={18} className="text-primary-500" /> Location & Contact
              </h2>

              <div>
                <label className="section-label block mb-2">Address *</label>
                <input
                  className={`input ${errors.address ? 'input-error' : ''}`}
                  placeholder="e.g. Near Main Gate, Opposite LHC"
                  value={form.address}
                  onChange={e => update('address', e.target.value)}
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="section-label block mb-2">Landmark</label>
                  <input
                    className="input"
                    placeholder="Near hostel block B"
                    value={form.landmark}
                    onChange={e => update('landmark', e.target.value)}
                  />
                </div>
                <div>
                  <label className="section-label block mb-2">Distance from Gate</label>
                  <input
                    className="input"
                    placeholder="200m from Main Gate"
                    value={form.distanceFromGate}
                    onChange={e => update('distanceFromGate', e.target.value)}
                  />
                </div>
              </div>

              {/* GPS Location */}
              <div>
                <label className="section-label block mb-2">GPS Location *</label>
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={geoLoading}
                  className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all font-medium text-sm
                    ${locationSet
                      ? 'border-green-400 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400'
                      : 'border-dashed border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20'
                    }`}
                >
                  {geoLoading ? (
                    <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                  ) : locationSet ? (
                    <>✅ Location captured ({form.location.coordinates[1].toFixed(4)}, {form.location.coordinates[0].toFixed(4)})</>
                  ) : (
                    <><MapPin size={16} /> Use My Current Location</>
                  )}
                </button>
                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}

                {/* Manual coordinates */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    type="number"
                    step="any"
                    className="input text-xs py-2"
                    placeholder="Latitude (e.g. 28.5450)"
                    value={form.location.coordinates[1] || ''}
                    onChange={e => {
                      const lat = parseFloat(e.target.value);
                      setForm(prev => ({ ...prev, location: { ...prev.location, coordinates: [prev.location.coordinates[0], lat || 0] } }));
                      if (lat) setLocationSet(true);
                    }}
                  />
                  <input
                    type="number"
                    step="any"
                    className="input text-xs py-2"
                    placeholder="Longitude (e.g. 77.1935)"
                    value={form.location.coordinates[0] || ''}
                    onChange={e => {
                      const lng = parseFloat(e.target.value);
                      setForm(prev => ({ ...prev, location: { ...prev.location, coordinates: [lng || 0, prev.location.coordinates[1]] } }));
                      if (lng) setLocationSet(true);
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="section-label block mb-2">Contact Number (optional)</label>
                <input
                  className="input"
                  placeholder="e.g. +91 98765 43210"
                  value={form.contactNumber}
                  onChange={e => update('contactNumber', e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                  ← Back
                </button>
                <button type="button" onClick={() => setStep(3)} className="btn-primary flex-1">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Tags & Timings */}
          {step === 3 && (
            <div className="card p-6 space-y-5 animate-fade-in">
              <h2 className="font-display font-bold text-lg text-primary flex items-center gap-2">
                <Tag size={18} className="text-primary-500" /> Tags & Timings
              </h2>

              {/* Tags */}
              <div>
                <label className="section-label block mb-2">Tags (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_TAGS.map(tag => (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => toggleTag(tag.value)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200
                        ${form.tags.includes(tag.value)
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900 hover:border-orange-400'
                        }`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timings */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="section-label">Opening Hours</label>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, timings: { ...prev.timings, isOpen24Hours: !prev.timings.isOpen24Hours } }))}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full transition-all font-medium
                      ${form.timings.isOpen24Hours ? 'bg-green-500 text-white' : 'bg-surface-2 text-secondary hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    🕐 24 Hours
                  </button>
                </div>

                {!form.timings.isOpen24Hours && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-tertiary mb-1 block">Opens</label>
                      <input
                        type="time"
                        className="input"
                        value={form.timings.openTime}
                        onChange={e => setForm(prev => ({ ...prev, timings: { ...prev.timings, openTime: e.target.value } }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-tertiary mb-1 block">Closes</label>
                      <input
                        type="time"
                        className="input"
                        value={form.timings.closeTime}
                        onChange={e => setForm(prev => ({ ...prev, timings: { ...prev.timings, closeTime: e.target.value } }))}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-3">
                  <label className="text-xs text-tertiary mb-2 block">Closed on (select days)</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAYS.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleClosedDay(day)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all
                          ${form.timings.closedOn.includes(day)
                            ? 'bg-red-500 text-white'
                            : 'bg-surface-2 text-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">
                  ← Back
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Plus size={16} /> Add Place</>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
