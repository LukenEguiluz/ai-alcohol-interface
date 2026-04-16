import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setOnUnauthorized, getMe, setViewAsRole } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    setViewAsRole('');
    setUser(null);
  }, []);

  useEffect(() => {
    const access = localStorage.getItem('access');
    const userStr = localStorage.getItem('user');
    if (access && userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (_) {
        logout();
      }
    }
    setLoading(false);
  }, [logout]);

  useEffect(() => {
    setOnUnauthorized(logout);
    return () => setOnUnauthorized(null);
  }, [logout]);

  const login = (data) => {
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const refreshUser = useCallback(async () => {
    const me = await getMe();
    localStorage.setItem('user', JSON.stringify(me));
    setUser(me);
    return me;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
