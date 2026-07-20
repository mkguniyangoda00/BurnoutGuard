/**
 * AuthContext.tsx
 * 
 * Provides a React Context wrapper around our Zustand auth store.
 * 
 * WHY we kept AuthContext even though we have Zustand:
 * The existing UI components (Navbar, PageWrapper, etc.) were built using
 * `useAuth()` from this context. Rather than refactoring every component,
 * we act as a "bridge" — the context reads from Zustand under the hood.
 * This is a common real-world pattern when migrating state management solutions.
 * 
 * WHY Zustand over Context alone:
 * React Context triggers re-renders in ALL consumers when any value changes.
 * Zustand uses shallow comparison and only re-renders components that
 * subscribe to the specific piece of state that changed — much more performant.
 */

import React, { createContext, useContext } from 'react';
import { useAuthStore } from '../store/auth.store';

// Role type matches the backend UserRole enum exactly
export type Role = 'Developer' | 'Manager' | 'HRofficer' | 'Admin' | 'ResearchAdmin' | null;

export interface User {
  userId: string;
  fullName: string;
  email: string;
  role: Role;
  company?: string;
  isActive: boolean;
  emailNotificationsEnabled?: boolean; 
  // Computed field for display in the navbar avatar
  avatarInitials?: string;
}

interface AuthContextType {
  user: User | null;
  role: Role;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider: Wraps the app and makes auth state available to all child components.
 * It bridges the Zustand store to the React Context API for backward compatibility.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pull everything from the central Zustand store
  const { user, isAuthenticated, logout } = useAuthStore();

  // Compute the avatar initials from the user's full name for the UI
  const enrichedUser: User | null = user
    ? {
        ...user,
        role: user.role as Role,
        avatarInitials: user.fullName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user: enrichedUser,
        role: enrichedUser?.role ?? null,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth: Custom hook to access auth state from any component.
 * Will throw an error if used outside of AuthProvider (defensive programming).
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
