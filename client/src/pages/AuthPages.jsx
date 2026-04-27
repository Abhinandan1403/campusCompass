import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Eye, EyeOff, Search, ChevronDown, X, MapPin } from 'lucide-react';
import { authAPI, collegeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// ─── Login Page ───────────────────────────────────────────────────────────────
export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data.data.user, res.data.data.token);
      toast.success(res.data.message);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {Array(20).fill(0).map((_, i) => (
            <div key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 80 + 20}px`,
                height: `${Math.random() * 80 + 20}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5,
              }}
            />
          ))}
        </div>
        <div className="relative text-white text-center px-12">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Compass size={40} className="text-white" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-4">Campus Compass</h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-sm">
            Your campus, explored. Discover the best places through the eyes of fellow students.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[['🍜', 'Food & Cafés'], ['☕', 'Study Spots'], ['🛺', 'Street Food']].map(([icon, label]) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-3xl mb-1">{icon}</div>
                <div className="text-xs text-white/70 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Compass size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl">Campus<span className="text-gradient-primary">Compass</span></span>
          </div>

          <div className="mb-8">
            <h2 className="font-display font-bold text-2xl text-primary mb-1">Welcome back</h2>
            <p className="text-secondary text-sm">Sign in to your campus account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="section-label block mb-2">Email Address</label>
              <input
                type="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@college.ac.in"
                value={form.email}
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: '' })); }}
                autoComplete="email"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="section-label block mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input pr-12 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(er => ({ ...er, password: '' })); }}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary transition-colors">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
            <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">Demo credentials:</p>
            <button
              onClick={() => setForm({ email: 'arjun@iitd.ac.in', password: 'Student@123' })}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              arjun@iitd.ac.in / Student@123
            </button>
          </div>

          <p className="text-center text-sm text-secondary mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-500 hover:text-primary-700 font-semibold">
              Join your campus
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── College Selector ─────────────────────────────────────────────────────────
function CollegeSelector({ value, onChange, error }) {
  const [colleges, setColleges] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    collegeAPI.getAll()
      .then(res => setColleges(res.data.data.colleges))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = colleges.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.shortName.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  const select = (college) => {
    setSelected(college);
    onChange(college._id);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`input w-full flex items-center justify-between text-left ${error ? 'input-error' : ''}`}
      >
        {selected ? (
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-primary-500 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-primary">{selected.shortName}</div>
              <div className="text-xs text-tertiary">{selected.city}</div>
            </div>
          </div>
        ) : (
          <span className="text-tertiary">Search your college...</span>
        )}
        <ChevronDown size={16} className={`text-tertiary transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 card z-30 py-1 max-h-64 overflow-hidden flex flex-col animate-scale-in">
          <div className="p-2 border-b border-default">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
              <input
                type="text"
                className="input pl-8 py-2 text-sm"
                placeholder="Search colleges..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="text-center py-6 text-tertiary text-sm">Loading colleges...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-6 text-tertiary text-sm">No colleges found</div>
            ) : filtered.map(college => (
              <button
                key={college._id}
                type="button"
                onClick={() => select(college)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-campus-400 to-campus-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {college.shortName.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">{college.shortName}</p>
                  <p className="text-xs text-tertiary">{college.name} · {college.city}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />}
    </div>
  );
}

// ─── Register Page ────────────────────────────────────────────────────────────
export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    college: '', year: '1st Year', department: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Please enter a valid email';
    if (!form.password || form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.college) errs.college = 'Please select your college';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      const res = await authAPI.register(data);
      login(res.data.data.user, res.data.data.token);
      toast.success(res.data.message);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG', 'PhD', 'Alumni'];

  return (
    <div className="min-h-screen bg-app flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <Compass size={20} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl">Campus<span className="text-gradient-primary">Compass</span></span>
        </div>

        <div className="card p-7">
          <div className="mb-6">
            <h2 className="font-display font-bold text-2xl text-primary mb-1">Join your campus</h2>
            <p className="text-secondary text-sm">Create your student account to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="section-label block mb-2">Full Name</label>
              <input className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Arjun Sharma"
                value={form.name} onChange={e => update('name', e.target.value)} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* College */}
            <div>
              <label className="section-label block mb-2">Your College</label>
              <CollegeSelector
                value={form.college}
                onChange={val => update('college', val)}
                error={errors.college}
              />
              {errors.college && <p className="text-red-500 text-xs mt-1">{errors.college}</p>}
            </div>

            {/* Year & Department */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="section-label block mb-2">Year</label>
                <select className="input" value={form.year} onChange={e => update('year', e.target.value)}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="section-label block mb-2">Department</label>
                <input className="input" placeholder="e.g. CSE" value={form.department}
                  onChange={e => update('department', e.target.value)} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="section-label block mb-2">Email Address</label>
              <input type="email" className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@college.ac.in" value={form.email}
                onChange={e => update('email', e.target.value)} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="section-label block mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'}
                  className={`input pr-12 ${errors.password ? 'input-error' : ''}`}
                  placeholder="At least 6 characters" value={form.password}
                  onChange={e => update('password', e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="section-label block mb-2">Confirm Password</label>
              <input type="password" className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="••••••••" value={form.confirmPassword}
                onChange={e => update('confirmPassword', e.target.value)} />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-secondary mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-500 hover:text-primary-700 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
