'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

interface User {
  id: number;
  email: string;
  name?: string;
  issuerId?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Priority 1: Check NextAuth session (Google OAuth)
    if (session?.user) {
      console.log('NextAuth session found:', session);
      const sessionUser: User = {
        id: (session.user as any).issuerId || 0,
        email: session.user.email || '',
        name: session.user.name || '',
        issuerId: (session.user as any).issuerId,
      };
      setUser(sessionUser);
      setToken('nextauth_session'); // Placeholder token
      return;
    }

    // Priority 2: Check localStorage (email/password login)
    if (status !== 'loading') {
      const savedToken = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('auth_user');
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    }
  }, [session, status]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Login failed');
      }

      const data = await response.json();
      console.log('Login response:', data);
      
      // Updated to match API response structure
      const userData: User = {
        id: data.user?.id || data.issuer_id || data.id,
        email: data.user?.email || data.email || email,
        name: data.user?.name || data.name || email.split('@')[0],
        issuerId: data.user?.id || data.issuer_id,
      };
      
      const authToken = data.accessToken || data.token || data.access_token || 'demo_token';
      
      setToken(authToken);
      setUser(userData);
      
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      
      router.push('/portfolio');
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password,
          name: name || email.split('@')[0]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Registration error:', errorText);
        throw new Error(errorText || 'Registration failed');
      }

      const data = await response.json();
      console.log('Registration response:', data);
      
      // Updated to match API response structure
      const userData: User = {
        id: data.user?.id || data.issuer_id || data.id,
        email: data.user?.email || data.email || email,
        name: data.user?.name || data.name || name || email.split('@')[0],
        issuerId: data.user?.id || data.issuer_id,
      };
      
      const authToken = data.accessToken || data.token || data.access_token || 'demo_token';
      
      setToken(authToken);
      setUser(userData);
      
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      
      router.push('/portfolio');
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    // Clear local state
    setToken(null);
    setUser(null);
    
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('trustfolio_claims');
    
    // Sign out of NextAuth if Google OAuth session exists
    if (session) {
      signOut({ redirect: false });
    }
    
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user || !!session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}