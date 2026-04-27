import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cc_token');
      localStorage.removeItem('cc_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ---- AUTH ----
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  toggleBookmark: (placeId) => api.post(`/auth/bookmark/${placeId}`),
};

// ---- COLLEGES ----
export const collegeAPI = {
  getAll: (params) => api.get('/colleges', { params }),
  getOne: (id) => api.get(`/colleges/${id}`),
  getStats: (id) => api.get(`/colleges/${id}/stats`),
  create: (data) => api.post('/colleges', data),
  update: (id, data) => api.put(`/colleges/${id}`, data),
};

// ---- PLACES ----
export const placeAPI = {
  getAll: (params) => api.get('/places', { params }),
  getOne: (id) => api.get(`/places/${id}`),
  getNearby: (params) => api.get('/places/nearby', { params }),
  getTrending: (collegeId) => api.get(`/places/trending/${collegeId}`),
  getCategories: (collegeId) => api.get(`/places/categories/${collegeId}`),
  create: (data) => api.post('/places', data),
  update: (id, data) => api.put(`/places/${id}`, data),
  delete: (id) => api.delete(`/places/${id}`),
  report: (id, reason) => api.post(`/places/${id}/report`, { reason }),
};

// ---- REVIEWS ----
export const reviewAPI = {
  getByPlace: (placeId, params) => api.get(`/reviews/place/${placeId}`, { params }),
  getByUser: (userId) => api.get(`/reviews/user/${userId}`),
  create: (placeId, data) => api.post(`/reviews/place/${placeId}`, data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  toggleHelpful: (id) => api.post(`/reviews/${id}/helpful`),
  report: (id, reason) => api.post(`/reviews/${id}/report`, { reason }),
};

// ---- POSTS ----
export const postAPI = {
  getFeed: (collegeId, params) => api.get(`/posts/${collegeId}`, { params }),
  getOne: (id) => api.get(`/posts/single/${id}`),
  create: (data) => api.post('/posts', data),
  delete: (id) => api.delete(`/posts/${id}`),
  toggleUpvote: (id) => api.post(`/posts/${id}/upvote`),
  addComment: (postId, data) => api.post(`/posts/${postId}/comments`, data),
  toggleCommentUpvote: (id) => api.post(`/posts/comments/${id}/upvote`),
  acceptComment: (id) => api.post(`/posts/comments/${id}/accept`),
  deleteComment: (id) => api.delete(`/posts/comments/${id}`),
};

// ---- USERS ----
export const userAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  getBookmarks: () => api.get('/users/bookmarks'),
  getLeaderboard: (collegeId) => api.get(`/users/leaderboard/${collegeId}`),
};

export default api;
