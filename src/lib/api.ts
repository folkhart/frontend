import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem('accessToken', data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (email: string, username: string, password: string) =>
    api.post('/auth/register', { email, username, password }),
  
  login: (emailOrUsername: string, password: string) =>
    api.post('/auth/login', { emailOrUsername, password }),
  
  getProfile: () => api.get('/auth/profile'),
};

// Character API
export const characterApi = {
  getClasses: () => api.get('/character/classes'),
  create: (name: string, classType: string) =>
    api.post('/character/create', { name, class: classType }),
  get: () => api.get('/character'),
  equip: (itemId: string, slot: string) =>
    api.post('/character/equip', { itemId, slot }),
  updateHP: (hp: number) =>
    api.post('/character/update-hp', { hp }),
};

// Idle API
export const idleApi = {
  start: (zoneId?: string, durationHours?: number) => api.post('/idle/start', { zoneId, durationHours }),
  claim: () => api.post('/idle/claim'),
  getStatus: () => api.get('/idle/status'),
};

// Dungeon API
export const dungeonApi = {
  getAll: () => api.get('/dungeon'),
  getByZone: (zoneId: string) => api.get(`/dungeon/zone/${zoneId}`),
  start: (dungeonId: string, mode: 'Idle' | 'Active') =>
    api.post('/dungeon/start', { dungeonId, mode }),
  getRun: (runId: string) => api.get(`/dungeon/run/${runId}`),
  getRuns: (limit?: number) => api.get('/dungeon/runs', { params: { limit } }),
  getActive: () => api.get('/dungeon/active'),
  complete: (runId: string) => api.post(`/dungeon/complete/${runId}`),
};

// Inventory API
export const inventoryApi = {
  get: () => api.get('/inventory'),
  use: (itemId: string) => api.post('/inventory/use', { itemId }),
};

// Leaderboard API
export const leaderboardApi = {
  getByLevel: (limit = 100) => api.get(`/leaderboard/level?limit=${limit}`),
  getByCP: (limit = 100) => api.get(`/leaderboard/cp?limit=${limit}`),
  getGuilds: (limit = 50) => api.get(`/leaderboard/guilds?limit=${limit}`),
};

// Crafting API
export const craftingApi = {
  getRecipes: () => api.get('/crafting/recipes'),
  craft: (recipeId: string) => api.post('/crafting/craft', { recipeId }),
  sell: (inventorySlotId: string, quantity: number) => api.post('/crafting/sell', { inventorySlotId, quantity }),
};

// Shop API
export const shopApi = {
  getItems: () => api.get('/shop/items'),
  refresh: () => api.post('/shop/refresh'),
  buy: (itemId: string, currency: 'gold' | 'gems', price: number) => api.post('/shop/buy', { itemId, currency, price }),
};

// Guild API
export const guildApi = {
  list: (page?: number, limit?: number) => api.get('/guild/list', { params: { page, limit } }),
  getMyGuild: () => api.get('/guild/my-guild'),
  getGuild: (guildId: string) => api.get(`/guild/${guildId}`),
  create: (name: string, tag: string, description?: string) =>
    api.post('/guild/create', { name, tag, description }),
  join: (guildId: string) => api.post(`/guild/join/${guildId}`),
  leave: () => api.post('/guild/leave'),
  kick: (playerId: string) => api.post(`/guild/kick/${playerId}`),
  updateRank: (playerId: string, rank: string) =>
    api.post(`/guild/rank/${playerId}`, { rank }),
  donate: (amount: number) => api.post('/guild/donate', { amount }),
  sendMessage: (message: string) => api.post('/guild/chat', { message }),
};

// Friend API
export const friendApi = {
  sendRequest: (username: string) => api.post('/friends/request', { username }),
  getRequests: () => api.get('/friends/requests'),
  acceptRequest: (requestId: string) => api.post(`/friends/request/${requestId}/accept`),
  rejectRequest: (requestId: string) => api.post(`/friends/request/${requestId}/reject`),
  getFriends: () => api.get('/friends'),
  removeFriend: (friendId: string) => api.delete(`/friends/${friendId}`),
};

// Message API
export const messageApi = {
  send: (receiverId: string, content: string) => api.post('/messages/send', { receiverId, content }),
  getConversation: (friendId: string, limit?: number) => api.get(`/messages/conversation/${friendId}`, { params: { limit } }),
  getUnreadCount: () => api.get('/messages/unread/count'),
  getUnread: () => api.get('/messages/unread'),
  markAsRead: (senderId: string) => api.post(`/messages/read/${senderId}`),
};

// News API
export const newsApi = {
  getPublished: (limit?: number, offset?: number) => api.get('/news/published', { params: { limit, offset } }),
  getPost: (postId: string) => api.get(`/news/${postId}`),
  getAll: (limit?: number, offset?: number) => api.get('/news', { params: { limit, offset } }),
  create: (data: { title: string; content: string; excerpt?: string; category?: string; imageUrl?: string }) =>
    api.post('/news', data),
  update: (postId: string, data: any) => api.put(`/news/${postId}`, data),
  delete: (postId: string) => api.delete(`/news/${postId}`),
};

// Blacksmith API
export const blacksmithApi = {
  enhance: (inventorySlotId: string, useProtectionScroll: boolean = false) =>
    api.post('/blacksmith/enhance', { inventorySlotId, useProtectionScroll }),
  refine: (inventorySlotId: string) =>
    api.post('/blacksmith/refine', { inventorySlotId }),
  addSocketSlot: (inventorySlotId: string) =>
    api.post('/blacksmith/socket/add', { inventorySlotId }),
  insertGem: (inventorySlotId: string, gemItemId: string) =>
    api.post('/blacksmith/socket/insert', { inventorySlotId, gemItemId }),
  removeGem: (inventorySlotId: string, gemIndex: number) =>
    api.post('/blacksmith/socket/remove', { inventorySlotId, gemIndex }),
  getHistory: (limit?: number) =>
    api.get('/blacksmith/history', { params: { limit } }),
};

// Achievement API
export const achievementApi = {
  getAll: () => api.get('/achievements'),
  getStats: () => api.get('/achievements/stats'),
  equipTitle: (achievementId: string) => api.post(`/achievements/equip/${achievementId}`),
  unequipTitle: () => api.post('/achievements/unequip'),
  claimStep: (achievementId: string, stepIndex: number) => api.post(`/achievements/claim-step/${achievementId}/${stepIndex}`),
  sync: () => api.post('/achievements/sync'),
};
