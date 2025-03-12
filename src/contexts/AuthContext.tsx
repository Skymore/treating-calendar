import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { setTreatingStoreUser } from '../stores/treatingStore';

// Define the context type
type AuthContextType = {
  loading: boolean;
  user: User | null;
  session: Session | null;
  signInWithGoogle: () => Promise<{
    error: Error | null;
    data: { provider: string; url: string | null } | null;
  }>;
  signInWithGithub: () => Promise<{
    error: Error | null;
    data: { provider: string; url: string | null } | null;
  }>;
  signInWithAzure: () => Promise<{
    error: Error | null;
    data: { provider: string; url: string | null } | null;
  }>;
  signOut: () => Promise<void>;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // 获取重定向URL的辅助函数
  const getRedirectUrl = () => {
    // 在生产环境中始终使用固定的URL
    if (import.meta.env.PROD) {
      return import.meta.env.VITE_APP_URL;
    }
    if (import.meta.env.DEV) {
      return import.meta.env.VITE_APP_DEV_URL;
    }
    return window.location.origin;
  };

  useEffect(() => {
    // Get the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // 更新treatingStore中的用户信息
      setTreatingStoreUser(session?.user ?? null, session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // 更新treatingStore中的用户信息
        setTreatingStoreUser(session?.user ?? null, session);
      }
    );

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getRedirectUrl(),
      },
    });
    
    return { data, error };
  };

  // Sign in with GitHub
  const signInWithGithub = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: getRedirectUrl(),
      },
    });
    
    return { data, error };
  };

  // Sign in with Azure (Microsoft)
  const signInWithAzure = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: getRedirectUrl(),
      },
    });
    
    return { data, error };
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    loading,
    signInWithGoogle,
    signInWithGithub,
    signInWithAzure,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 