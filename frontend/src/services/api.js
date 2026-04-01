import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// Add token to all requests
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// ========== AUTH APIs ==========
export const register = (formData) => API.post('/auth/register', formData);
export const login = (formData) => API.post('/auth/login', formData);
export const getMe = () => API.get('/auth/me');

// ========== POST APIs ==========
export const getPosts = () => API.get('/posts');
export const createPost = (content, imageFile) => {
  const formData = new FormData();
  formData.append('content', content);
  if (imageFile) {
    formData.append('image', imageFile);
  }
  return API.post('/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};
export const editPost = (postId, content) => API.put(`/posts/${postId}`, { content });
export const likePost = (postId) => API.put(`/posts/${postId}/like`);
export const addComment = (postId, text) => API.post(`/posts/${postId}/comments`, { text });
export const deletePost = (postId) => API.delete(`/posts/${postId}`);
export const deleteComment = (postId, commentId) => API.delete(`/posts/${postId}/comments/${commentId}`);
export const sharePost = (postId, content = '') => API.post(`/posts/${postId}/share`, { content });

// ========== USER APIs ==========
export const getUserProfile = (userId) => API.get(`/users/${userId}`);
export const followUser = (userId) => API.put(`/users/${userId}/follow`);
export const searchUsers = (query) => API.get(`/users/search?q=${query}`);
export const updateProfile = (formData) => API.put('/users/profile', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

// ========== CHAT APIs ==========
export const getUserChats = (config) => API.get('/chats', config);
export const getOrCreateChat = (userId) => API.post(`/chats/${userId}`);
export const sendMessage = (chatId, text, replyTo = null) => 
  API.post(`/chats/${chatId}/messages`, { text, replyTo });
export const sendMediaMessage = (chatId, formData) => 
  API.post(`/chats/${chatId}/media`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
export const deleteMessage = (chatId, messageId) => API.delete(`/chats/${chatId}/messages/${messageId}`);
export const saveCallLog = (chatId, callType, duration, status) => 
  API.post(`/chats/${chatId}/call-log`, { callType, duration, status });
export const markMessagesAsRead = (chatId) => API.put(`/chats/${chatId}/read`);
export const toggleReaction = (chatId, messageId, type) => 
  API.post(`/chats/${chatId}/messages/${messageId}/reactions`, { type });
export const getReactions = (chatId, messageId) => 
  API.get(`/chats/${chatId}/messages/${messageId}/reactions`);

// ========== STORY APIs ==========
export const createStory = (media, caption) => {
  const formData = new FormData();
  formData.append('media', media);
  if (caption) formData.append('caption', caption);
  return API.post('/stories', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};
export const getStories = () => API.get('/stories');
export const viewStory = (storyId) => API.post(`/stories/${storyId}/view`);
export const deleteStory = (storyId) => API.delete(`/stories/${storyId}`);

// ========== NOTIFICATION APIs ==========
export const getNotifications = () => API.get('/notifications');
export const markNotificationAsRead = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotificationsAsRead = () => API.put('/notifications/read-all');
export const deleteNotification = (id) => API.delete(`/notifications/${id}`);
export const updateNotificationSettings = (settings) => API.put('/notifications/settings', settings);
export const saveFCMToken = (token) => API.post('/notifications/token', { token });

// ========== ANALYTICS APIs ==========
export const getAnalyticsDashboard = () => API.get('/analytics/dashboard');
export const trackProfileView = (userId) => API.post(`/analytics/profile/${userId}/view`);
export const trackPostView = (postId) => API.post(`/analytics/post/${postId}/view`);

// ========== SEARCH APIs ==========
export const advancedSearch = (params) => API.get('/search', { params });
export const getSearchSuggestions = (q) => API.get('/search/suggestions', { params: { q } });

// ========== REEL APIs ==========
export const getReels = (page = 1, limit = 10, trending = false) => 
  API.get(`/reels?page=${page}&limit=${limit}${trending ? '&trending=true' : ''}`);
export const getTrendingReels = () => API.get('/reels/trending');
export const getUserReels = (userId) => API.get(`/reels/user/${userId}`);
export const getReelById = (id) => API.get(`/reels/${id}`);
export const createReel = (video, caption, music, duration) => {
  const formData = new FormData();
  formData.append('video', video);
  if (caption) formData.append('caption', caption);
  if (music) formData.append('music', music);
  if (duration) formData.append('duration', duration);
  return API.post('/reels', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};
export const likeReel = (id) => API.put(`/reels/${id}/like`);
export const addReelComment = (id, text) => API.post(`/reels/${id}/comments`, { text });
export const deleteReel = (id) => API.delete(`/reels/${id}`);
export const deleteReelComment = (reelId, commentId) => API.delete(`/reels/${reelId}/comments/${commentId}`);
export const shareReel = (id) => API.post(`/reels/${id}/share`);

export default API;