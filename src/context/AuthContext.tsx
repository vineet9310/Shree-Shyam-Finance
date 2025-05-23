
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
  { id: 'mockadmin_vineet', email: 'vineetbeniwal9310@gmail.com', name: 'Vineet Beniwal (Admin)', role: 'admin' },
];

const isValidMongoDbObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const isMockUserId = (id: string): boolean => {
  return mockUsers.some(mockUser => mockUser.id === id);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUserString = localStorage.getItem('rivaayat-user');
      if (storedUserString) {
        const storedUser = JSON.parse(storedUserString) as User;
        // Validate the ID from localStorage
        if (storedUser && storedUser.id && (isValidMongoDbObjectId(storedUser.id) || isMockUserId(storedUser.id))) {
          setUser(storedUser);
        } else {
          console.warn("[AuthContext] Invalid user data in localStorage, clearing. Stored ID:", storedUser?.id);
          localStorage.removeItem('rivaayat-user');
        }
      }
    } catch (error) {
      console.error("[AuthContext] Failed to parse user from localStorage", error);
      localStorage.removeItem('rivaayat-user');
    }
    setLoading(false);
  }, []);

  const login = (userData: User) => {
    console.log('[AuthContext] login function called with userData:', JSON.stringify(userData, null, 2));

    if (!userData || !userData.id) {
      console.error('[AuthContext] Login attempt with invalid userData (missing id):', JSON.stringify(userData, null, 2));
      // Optionally, set an error state or show a toast to the user
      return;
    }

    // Validate the ID of the incoming userData
    const isIdValidMongo = isValidMongoDbObjectId(userData.id);
    console.log(`[AuthContext] Validating userData.id: "${userData.id}". Is valid Mongo ObjectId? ${isIdValidMongo}`);

    if (isIdValidMongo) {
      console.log('[AuthContext] Logging in with validated MongoDB ID:', userData.id);
      setUser(userData);
      localStorage.setItem('rivaayat-user', JSON.stringify(userData));
      if (userData.role === 'admin') {
        router.push(ROUTES.ADMIN_DASHBOARD);
      } else {
        router.push(ROUTES.DASHBOARD);
      }
      return;
    }

    // Check against hardcoded mock users (for demo/testing) ONLY if ID wasn't a valid Mongo ID
    console.log('[AuthContext] userData.id not a valid MongoID, checking mock users.');
    if (typeof userData.email === 'string' && userData.email.length > 0) {
      const foundMockUser = mockUsers.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
      if (foundMockUser) {
        console.log('[AuthContext] Found mock user:', JSON.stringify(foundMockUser, null, 2));
        setUser(foundMockUser);
        localStorage.setItem('rivaayat-user', JSON.stringify(foundMockUser));
        if (foundMockUser.role === 'admin') {
          router.push(ROUTES.ADMIN_DASHBOARD);
        } else {
          router.push(ROUTES.DASHBOARD);
        }
        return;
      }
    } else {
      console.warn('[AuthContext] userData.email is not a valid string for mock user lookup:', userData.email);
    }

    console.warn(`[AuthContext] Login attempt for email "${userData.email}" (ID: "${userData.id}"): User not found in mocks and ID was not a valid MongoDB ObjectId. Login will not proceed for this session. A backend login API is required for these users if they are registered.`);
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
