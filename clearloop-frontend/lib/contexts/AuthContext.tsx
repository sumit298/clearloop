'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  setWorkspace: (workspace: Workspace) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspaceState] = useState<Workspace | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const storedWorkspace = localStorage.getItem('workspace');

        if (storedToken) {
          setToken(storedToken);
          
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          
          if (storedWorkspace) {
            setWorkspaceState(JSON.parse(storedWorkspace));
          }

          try {
            const userData = await authApi.getCurrentUser();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } catch (error) {
            logout();
          }
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  const login = async (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);

    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setWorkspaceState(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('workspace');
  };

  const setWorkspace = (ws: Workspace) => {
    setWorkspaceState(ws);
    localStorage.setItem('workspace', JSON.stringify(ws));
  };

  const value: AuthContextType = {
    user,
    workspace,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    setWorkspace,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
