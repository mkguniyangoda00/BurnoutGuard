import React, { createContext, useContext, useState, useEffect } from 'react';

// Defines the available roles in the system
export type Role = 'developer' | 'manager' | 'hr' | 'admin' | 'research_admin' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarInitials: string;
}

interface AuthContextType {
  user: User | null;
  role: Role;
  login: (email: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock Users for testing the role-based views
const mockUsers: Record<string, User> = {
  developer: { id: '1', name: 'Malithi Guniyangoda', email: 'malithi@company.com', role: 'developer', avatarInitials: 'MG' },
  manager: { id: '2', name: 'Alex Manager', email: 'alex.m@company.com', role: 'manager', avatarInitials: 'AM' },
  hr: { id: '3', name: 'Sarah HR', email: 'sarah.h@company.com', role: 'hr', avatarInitials: 'SH' },
  admin: { id: '4', name: 'System Admin', email: 'admin@company.com', role: 'admin', avatarInitials: 'SA' },
  research_admin: { id: '5', name: 'Research Admin', email: 'research@company.com', role: 'research_admin', avatarInitials: 'RA' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Load from localStorage on mount to persist login state across reloads
  useEffect(() => {
    const savedUser = localStorage.getItem('bg_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user from local storage');
      }
    }
  }, []);

  // Mock login function that authenticates a user based on their email address.
  // In a real application, this would make an API call to your backend (e.g. built with Prisma)
  // to verify the email and password.
  const login = (email: string): boolean => {
    // Search our mock user database for a matching email
    const foundUser = Object.values(mockUsers).find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('bg_user', JSON.stringify(foundUser));
      return true;
    }
    
    // Return false if the user was not found
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bg_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role || null,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume the AuthContext safely
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
