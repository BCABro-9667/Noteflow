import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api, getStoredToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateHasPin: (hasPin: boolean) => void;
  checkPinStatus: () => Promise<boolean>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.auth.me();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.auth.register(name, email, password);
    setUser(res.user);
  };

  const demoLogin = async () => {
    const res = await api.auth.demoLogin();
    setUser(res.user);
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  const logoutAll = async () => {
    await api.auth.logoutAll();
    setUser(null);
  };

  const updateHasPin = (hasPin: boolean) => {
    setUser((prev) => (prev ? { ...prev, hasPin } : null));
  };

  const checkPinStatus = async (): Promise<boolean> => {
    try {
      const res = await api.auth.getPinStatus();
      updateHasPin(res.hasPin);
      return res.hasPin;
    } catch {
      return Boolean(user?.hasPin);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        demoLogin,
        logout,
        logoutAll,
        refreshUser,
        updateHasPin,
        checkPinStatus,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
