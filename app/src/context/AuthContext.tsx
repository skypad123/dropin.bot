import { createContext, useCallback, useContext, useState } from 'react';
import type { AuthUser } from '../types';

const AuthContext = createContext<{
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (provider: string, email?: string, name?: string) => void;
  signUp: (data: { name: string; email: string; phone?: string; provider: string }) => void;
  logout: () => void;
}>({ isAuthenticated: false, user: null, login: () => {}, signUp: () => {}, logout: () => {} });

export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('dropin-auth') === 'true';
  });
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('dropin-auth-user');
    return saved ? JSON.parse(saved) : null;
  });

  const persistUser = (u: AuthUser) => {
    setUser(u);
    localStorage.setItem('dropin-auth-user', JSON.stringify(u));
  };

  const login = useCallback((provider: string, email = '', name = '') => {
    setIsAuthenticated(true);
    persistUser({ name: name || 'User', email: email || '', provider });
    localStorage.setItem('dropin-auth', 'true');
  }, []);

  const signUp = useCallback((data: { name: string; email: string; phone?: string; provider: string }) => {
    setIsAuthenticated(true);
    persistUser({ name: data.name, email: data.email, provider: data.provider });
    localStorage.setItem('dropin-auth', 'true');
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('dropin-auth');
    localStorage.removeItem('dropin-auth-user');
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
