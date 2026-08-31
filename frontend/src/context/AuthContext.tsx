import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiRequest } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (code: string, pass: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (module: string, action: string) => boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user');
      }
    }
    setIsLoading(false);

    // Global session expiry listener
    const handleAuthExpired = (e: Event) => {
      const customEvent = e as CustomEvent;
      setUser(null);
      setToken(null);
      setError(customEvent.detail?.message || 'Your session has expired. Please log in again.');
    };
    
    window.addEventListener('auth-expired', handleAuthExpired);
    
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []);

  const login = async (code: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ employee_code: code, password: pass }),
    });

    setIsLoading(false);

    if (res.success && res.data) {
      setUser(res.data.user);
      setToken(res.data.accessToken);
      localStorage.setItem('access_token', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return true;
    } else {
      setError(res.message || 'Invalid credentials');
      return false;
    }
  };

  const logout = () => {
    apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!user) return false;
    // Admin / Super Admin has full permission
    if (user.role_name === 'Admin') return true;
    
    // Restrict Edit, Delete, and Status modification actions strictly to Admin / SuperAdmin
    if (action === 'update' || action === 'delete' || action === 'status') {
      return false;
    }

    // View actions: All employees get view access to their personal modules
    if (action === 'view') {
      if (['attendance', 'tasks', 'payments', 'reports', 'settings', 'support', 'profile', 'dashboard'].includes(module)) {
        return true;
      }
      if (module === 'projects' && user.role_name === 'Manager') return true;
      if (module === 'employees' && user.role_name === 'Manager') return true;
      return false;
    }
    
    return user.permissions ? user.permissions.includes(`${module}_${action}`) : false;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasPermission, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
