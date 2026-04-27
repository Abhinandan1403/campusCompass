import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState([]);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('cc_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authAPI.getMe();
      const userData = res.data.data.user;
      setUser(userData);
      setBookmarks(userData.bookmarks?.map(b => b._id || b) || []);
    } catch {
      localStorage.removeItem('cc_token');
      localStorage.removeItem('cc_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback((userData, token) => {
    localStorage.setItem('cc_token', token);
    localStorage.setItem('cc_user', JSON.stringify(userData));
    setUser(userData);
    setBookmarks(userData.bookmarks?.map(b => b._id || b) || []);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    setUser(null);
    setBookmarks([]);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleBookmark = useCallback(async (placeId) => {
    if (!user) return false;
    try {
      const res = await authAPI.toggleBookmark(placeId);
      const { isBookmarked } = res.data.data;
      setBookmarks(prev =>
        isBookmarked ? [...prev, placeId] : prev.filter(id => id !== placeId)
      );
      return isBookmarked;
    } catch {
      return false;
    }
  }, [user]);

  const isBookmarked = useCallback((placeId) => {
    return bookmarks.includes(placeId);
  }, [bookmarks]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      updateUser,
      toggleBookmark,
      isBookmarked,
      bookmarks,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
