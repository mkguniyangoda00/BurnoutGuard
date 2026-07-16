import { create } from 'zustand';

interface User {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  company?: string;
  isActive: boolean;
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

/**
 * Zustand global store for managing authentication state.
 * Syncs the JWT token with localStorage to persist logins across refreshes.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),

  login: (user, token) => {
    localStorage.setItem('bg_token', token);
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('bg_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user) => {
    set({ user });
  },
}));

// Listen for the custom unauthorized event from the axios interceptor
if (typeof window !== 'undefined') {
  window.addEventListener('bg_unauthorized', () => {
    useAuthStore.getState().logout();
  });
}
