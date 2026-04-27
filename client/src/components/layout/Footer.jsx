import { Link } from 'react-router-dom';
import { Compass, Heart, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-default mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <Compass size={15} className="text-white" />
            </div>
            <span className="font-display font-bold text-primary">
              Campus<span className="text-gradient-primary">Compass</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 text-xs text-tertiary">
            <Link to="/" className="hover:text-primary transition-colors">Discover</Link>
            <Link to="/places/add" className="hover:text-primary transition-colors">Add Place</Link>
            <span className="flex items-center gap-1">
              Made with <Heart size={11} className="text-red-500 fill-current" /> for students
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
