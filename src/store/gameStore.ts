import { create } from 'zustand';

interface Player {
  id: string;
  username: string;
  email: string;
  level: number;
  gold: number;
  gems: number;
  energy: number;
  maxEnergy: number;
  energyUpdatedAt?: string;
  isAdmin?: boolean;
}

interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  combatPower: number;
  spriteId: string;
  weapon?: any;
  armor?: any;
  accessory?: any;
  companion?: any;
  currentActivityType?: string;
  activityEndsAt?: string;
}

interface GameState {
  // Auth
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  
  // Player & Character
  player: Player | null;
  character: Character | null;
  
  // UI State
  activeTab: 'village' | 'adventure' | 'guild' | 'shop' | 'leaderboard' | 'admin' | 'settings';
  isLoading: boolean;
  
  // Actions
  setAuth: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setPlayer: (player: Player) => void;
  setCharacter: (character: Character) => void;
  setActiveTab: (tab: 'village' | 'adventure' | 'guild' | 'shop' | 'leaderboard' | 'admin' | 'settings') => void;
  setLoading: (loading: boolean) => void;
  updatePlayerGold: (amount: number) => void;
  updatePlayerEnergy: (amount: number) => void;
  updateCharacterExp: (amount: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  isAuthenticated: !!localStorage.getItem('accessToken'),
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  player: null,
  character: null,
  activeTab: 'adventure',
  isLoading: false,

  // Actions
  setAuth: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ isAuthenticated: true, accessToken, refreshToken });
  },

  clearAuth: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ 
      isAuthenticated: false, 
      accessToken: null, 
      refreshToken: null,
      player: null,
      character: null,
    });
  },

  setPlayer: (player) => set({ player }),
  
  setCharacter: (character) => set({ character }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  setLoading: (loading) => set({ isLoading: loading }),

  updatePlayerGold: (amount) =>
    set((state) => ({
      player: state.player
        ? { ...state.player, gold: state.player.gold + amount }
        : null,
    })),

  updatePlayerEnergy: (amount) =>
    set((state) => ({
      player: state.player
        ? { 
            ...state.player, 
            energy: Math.max(0, Math.min(state.player.maxEnergy, state.player.energy + amount))
          }
        : null,
    })),

  updateCharacterExp: (amount) =>
    set((state) => ({
      character: state.character
        ? { ...state.character, experience: state.character.experience + amount }
        : null,
    })),
}));
