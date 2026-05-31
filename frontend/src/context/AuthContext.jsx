import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { STORAGE_KEYS } from '../config/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        try {
          const freshUser = await api.get('/auth/me');
          
          setUser(freshUser);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(freshUser));
        } catch (error) {
          console.error('Auth check failed:', error);
          // If 401, api utility handles redirect. For other errors (offline), keep current user.
          if (error.status !== 401) {
            setUser(JSON.parse(storedUser));
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.post('/auth/login', { email, password });
      setUser(data);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data));
      return data;
    } catch (error) {
      throw error; // Re-throw to be handled by UI
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await api.post('/auth/register', { name, email, password });
      setUser(data);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data));
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    window.location.href = '/login';
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
