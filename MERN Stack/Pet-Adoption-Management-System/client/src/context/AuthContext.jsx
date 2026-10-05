import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLoggedInUser();

    // Listen for 401 unauthorized session expiry
    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem('pawhomes_token');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const checkLoggedInUser = async () => {
    const token = localStorage.getItem('pawhomes_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await userAPI.getProfile();
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        localStorage.removeItem('pawhomes_token');
        setUser(null);
      }
    } catch (err) {
      console.error('Auth verification error:', err);
      localStorage.removeItem('pawhomes_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await userAPI.getProfile();
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  };

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    if (res.success && res.token) {
      localStorage.setItem('pawhomes_token', res.token);
      setUser(res.user);
    }
    return res;
  };


  const register = async (userData) => {
    const res = await authAPI.register(userData);
    if (res.success && res.token) {
      localStorage.setItem('pawhomes_token', res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('pawhomes_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      setUser: () => {},
      loading: false,
      login: async () => ({ success: false }),
      register: async () => ({ success: false }),
      logout: () => {},
      refreshUser: async () => {}
    };
  }
  return context;
};

