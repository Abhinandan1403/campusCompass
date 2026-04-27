import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-app flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="relative mb-8">
          <div className="text-[120px] font-display font-black text-gray-100 dark:text-gray-800 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-campus-500 rounded-3xl flex items-center justify-center shadow-xl">
              <Compass size={36} className="text-white animate-spin" style={{ animationDuration: '4s' }} />
            </div>
          </div>
        </div>

        <h1 className="font-display font-bold text-2xl text-primary mb-3">
          Lost on Campus?
        </h1>
        <p className="text-secondary text-sm leading-relaxed mb-8">
          This page doesn't exist. Maybe it moved, or maybe you took a wrong turn near the main gate.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={() => window.history.back()} className="btn-secondary flex items-center gap-2 px-6">
            <ArrowLeft size={16} /> Go Back
          </button>
          <Link to="/" className="btn-primary flex items-center gap-2 px-6">
            <Home size={16} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
