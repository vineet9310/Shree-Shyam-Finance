
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

// Mock users - ensure their IDs are distinct and recognizable if needed for debugging.
// For actual DB users, their IDs will be MongoDB ObjectIds.
const mockUsers: User[] = [
  { id: 'mockuser1', email: 'user@example.com', name: 'Test User', role: 'user' },
  { id: 'mockadmin1', email: 'admin@example.com', name: 'Admin User', role: 'admin' },
  // Added your specific admin email to the mock list for easier admin testing via mock login
  { id: 'mockadmin_vineet', email: 'vineetbeniwal9310@gmail.com', name: 'Vineet Beniwal (Admin)', role: 'admin' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
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
    // Check if the userData.id looks like a MongoDB ObjectId (24 char hex string)
    // This typically means it's coming from a successful registration flow.
    const isPotentiallyValidMongoId = userData.id && /^[0-9a-fA-F]{24}$/.test(userData.id);

    if (isPotentiallyValidMongoId) {
      setUser(userData);
      localStorage.setItem('rivaayat-user', JSON.stringify(userData));
      if (userData.role === 'admin') {
        router.push(ROUTES.ADMIN_DASHBOARD);
      } else {
        router.push(ROUTES.DASHBOARD);
      }
      return;
    }

    // If not a direct valid ID, check against the hardcoded mock users (for demo/testing)
    const foundMockUser = mockUsers.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (foundMockUser) {
      // Use the complete mock user object, including its predefined ID
      setUser(foundMockUser); 
      localStorage.setItem('rivaayat-user', JSON.stringify(foundMockUser));
      if (foundMockUser.role === 'admin') {
        router.push(ROUTES.ADMIN_DASHBOARD);
      } else {
        router.push(ROUTES.DASHBOARD);
      }
      return;
    }

    // If the user is not in the mock list and didn't come with a valid ID (e.g., from registration),
    // this login attempt is for a user potentially in the DB but not covered by mocks.
    // We should NOT create a new user or a fake ID (like Date.now()) here.
    // This requires a proper backend login API to verify credentials and fetch the user's real DB ID.
    console.warn(`Login attempt for ${userData.email}: User not found in mocks and no valid ID provided. A backend login API is required for these users. Login will not proceed for this session.`);
    // Optionally: Show a toast or message to the user indicating login failure.
    // For now, it effectively fails "silently" for this specific path to prevent bad ID propagation.
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
