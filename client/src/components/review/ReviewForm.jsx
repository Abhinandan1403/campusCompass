import { useState } from 'react';
import { Star, Eye, EyeOff, Send, X } from 'lucide-react';
import { reviewAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);

  const labels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent' };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              size={32}
              className={`transition-colors duration-100 ${
                i <= (hover || value) ? 'star-filled' : 'star-empty'
              }`}
            />
          </button>
        ))}
      </div>
      {(hover || value) > 0 && (
        <span className="text-sm font-semibold text-primary animate-fade-in">
          {labels[hover || value]}
        </span>
      )}
    </div>
  );
}

export default function ReviewForm({ placeId, placeName, onSuccess, onCancel }) {
  const toast = useToast();
  const [form, setForm] = useState({
    rating: 0,
    title: '',
    body: '',
    isAnonymous: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.rating) errs.rating = 'Please select a rating';
    if (!form.body.trim() || form.body.length < 10) errs.body = 'Review must be at least 10 characters';
    if (form.body.length > 1000) errs.body = 'Review cannot exceed 1000 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await reviewAPI.create(placeId, form);
      toast.success('Review posted! 🎉 Thank you for helping your campus community.');
      onSuccess?.(res.data.data.review);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to post review';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-bold text-lg text-primary">Write a Review</h3>
          {placeName && <p className="text-sm text-secondary mt-0.5">for {placeName}</p>}
        </div>
        {onCancel && (
          <button onClick={onCancel} className="btn-ghost p-2 rounded-xl">
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Star Rating */}
        <div>
          <label className="section-label block mb-3">Your Rating</label>
          <StarPicker value={form.rating} onChange={r => { setForm(f => ({ ...f, rating: r })); setErrors(e => ({ ...e, rating: '' })); }} />
          {errors.rating && <p className="text-red-500 text-xs mt-2 text-center">{errors.rating}</p>}
        </div>

        {/* Title */}
        <div>
          <label className="section-label block mb-2">Summary (optional)</label>
          <input
            type="text"
            className="input"
            placeholder="One line that captures your experience..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            maxLength={100}
          />
        </div>

        {/* Body */}
        <div>
          <label className="section-label block mb-2">Your Review *</label>
          <textarea
            className={`input resize-none h-32 ${errors.body ? 'input-error' : ''}`}
            placeholder="What made this place stand out? What should other students know? Be specific — mention what you ordered, the vibe, the price, anything that helps!"
            value={form.body}
            onChange={e => { setForm(f => ({ ...f, body: e.target.value })); setErrors(er => ({ ...er, body: '' })); }}
            maxLength={1000}
          />
          <div className="flex justify-between mt-1">
            {errors.body ? (
              <p className="text-red-500 text-xs">{errors.body}</p>
            ) : <span />}
            <span className={`text-xs ${form.body.length > 900 ? 'text-amber-500' : 'text-tertiary'}`}>
              {form.body.length}/1000
            </span>
          </div>
        </div>

        {/* Anonymous toggle */}
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, isAnonymous: !f.isAnonymous }))}
          className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-all duration-200 text-left
            ${form.isAnonymous
              ? 'border-campus-400 bg-campus-50 dark:bg-campus-950/30'
              : 'border-default bg-surface hover:border-gray-300 dark:hover:border-gray-600'
            }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
            ${form.isAnonymous ? 'bg-campus-500 text-white' : 'bg-surface-2 text-secondary'}`}>
            {form.isAnonymous ? <EyeOff size={15} /> : <Eye size={15} />}
          </div>
          <div>
            <p className="text-sm font-medium text-primary">
              {form.isAnonymous ? 'Posting anonymously' : 'Post with your name'}
            </p>
            <p className="text-xs text-secondary mt-0.5">
              {form.isAnonymous
                ? 'Your identity will be hidden from other students'
                : 'Your name and year will be visible to others'
              }
            </p>
          </div>
        </button>

        {/* Submit */}
        <div className="flex gap-3">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-secondary flex-1">
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !form.rating}
            className="btn-primary flex-1"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Posting…
              </span>
            ) : (
              <>
                <Send size={15} />
                Post Review
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
