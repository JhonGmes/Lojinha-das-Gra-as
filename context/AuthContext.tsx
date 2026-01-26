import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, isSupabaseConfigured, getUser, login as apiLogin, logout as apiLogout } from '../services/supabase';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: (e: string, p: string) => Promise<any>;
  signOut: () => Promise<void>;
  isMock: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: React.PropsWithChildren) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (isSupabaseConfigured) {
      getUser().then(u => {
        setUser(u);
        setLoading(false);
      });

      const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    } else {
      // Check local storage for mock session
      const mockSession = localStorage.getItem('zapshop_mock_user');
      if (mockSession) setUser(JSON.parse(mockSession));
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, pass: string) => {
    const { error } = await apiLogin(email, pass);
    if (!error) {
       if (!isSupabaseConfigured) {
          const mockUser = { id: 'mock-admin', email };
          setUser(mockUser);
          localStorage.setItem('zapshop_mock_user', JSON.stringify(mockUser));
       }
    }
    return { error };
  };

  const signOut = async () => {
    await apiLogout();
    if (!isSupabaseConfigured) {
        localStorage.removeItem('zapshop_mock_user');
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isMock }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};