import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; confirm_password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getStoredUser());
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pocketsmart_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (localStorage.getItem('pocketsmart_token')) {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (localStorage.getItem('pocketsmart_token')) {
        await refreshUser();
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await authService.login(credentials);
    if (res.success && res.data) {
      setUser(res.data.user);
      setToken(res.data.token);
    } else {
      throw new Error(res.message || 'Login failed');
    }
  };

  const register = async (data: { name: string; email: string; password: string; confirm_password: string }) => {
    const res = await authService.register(data);
    if (res.success && res.data) {
      setUser(res.data.user);
      setToken(res.data.token);
    } else {
      throw new Error(res.message || 'Registration failed');
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
