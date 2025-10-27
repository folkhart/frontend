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
  start: (zoneId?: string) => api.post('/idle/start', { zoneId }),
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
