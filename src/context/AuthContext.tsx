"use client";
import type { User } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users
const mockUsers: User[] = [
  { id: '1', email: 'user@example.com', name: 'Test User', role: 'user' },
  { id: '2', email: 'admin@example.com', name: 'Admin User', role: 'admin' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Try to load user from localStorage
    try {
      const storedUser = localStorage.getItem('rivaayat-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('rivaayat-user');
    }
    setLoading(false);
  }, []);

  const login = (userData: User) => {
    // In a real app, this would involve an API call.
    // For mock, we find user by email.
    const foundUser = mockUsers.find(u => u.email === userData.email);
    if (foundUser) { // Simplified check, real app would check password
      setUser(foundUser);
      localStorage.setItem('rivaayat-user', JSON.stringify(foundUser));
      if (foundUser.role === 'admin') {
        router.push(ROUTES.ADMIN_DASHBOARD);
      } else {
        router.push(ROUTES.DASHBOARD);
      }
    } else {
      // Handle login failure (e.g., show error message)
      // For now, we'll just simulate a successful login for any provided email
      // to allow registration flow to "work".
      const newUser = { ...userData, id: String(Date.now()) }; // Create a mock ID
      setUser(newUser);
      localStorage.setItem('rivaayat-user', JSON.stringify(newUser));
      mockUsers.push(newUser); // Add to mock users for this session
       if (newUser.role === 'admin') { // Unlikely for registration but for completeness
        router.push(ROUTES.ADMIN_DASHBOARD);
      } else {
        router.push(ROUTES.DASHBOARD);
      }
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rivaayat-user');
    router.push(ROUTES.LOGIN);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
