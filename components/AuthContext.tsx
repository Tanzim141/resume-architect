import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  login: (identifier: string, password: string, isEmail: boolean) => Promise<void>;
  signup: (identifier: string, password: string, name: string, isEmail: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureUserProfile(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureUserProfile(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureUserProfile = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', currentUser.id)
        .single();
      
      if (error && error.code === 'PGRST116') {
        const name = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || 'User';
        await supabase.from('users').insert([{
          uid: currentUser.id,
          email: currentUser.email || `${currentUser.id}@noemail.resumearchitect.com`,
          name: name
        }]);
      }
    } catch (error) {
      console.error("Failed to ensure user profile:", error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const login = async (identifier: string, password: string, isEmail: boolean) => {
    try {
      const authOptions: any = { password };
      if (isEmail) {
        authOptions.email = identifier;
      } else {
        authOptions.phone = identifier;
      }
      const { error } = await supabase.auth.signInWithPassword(authOptions);
      if (error) throw error;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  };

  const signup = async (identifier: string, password: string, name: string, isEmail: boolean) => {
    try {
      const authOptions: any = { password, options: { data: { full_name: name } } };
      if (isEmail) {
        authOptions.email = identifier;
      } else {
        authOptions.phone = identifier;
      }
      const { error } = await supabase.auth.signUp(authOptions);
      if (error) throw error;
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Error signing out", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
