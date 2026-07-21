import { create } from 'zustand';
import { queryClient } from '../lib/queryClient';

interface User {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  company?: string;
  isActive: boolean;
  emailNotificationsEnabled?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const getStoredToken = () => localStorage.getItem('bg_token') || localStorage.getItem('token');

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),

  login: (user, token) => {
    localStorage.setItem('bg_token', token);
    localStorage.setItem('token', token);
    queryClient.clear(); // wipe any cached data from a previous session/user
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('bg_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    queryClient.clear(); // prevent this user's cached data leaking to the next login
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user) => {
    set({ user });
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('bg_unauthorized', () => {
    useAuthStore.getState().logout();
  });
}