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

// Local Storage Fallback Helpers
const LOCAL_USERS_KEY = 'resumearchitect_local_users';
const LOCAL_SESSION_KEY = 'resumearchitect_local_session';

const getLocalUsers = (): Array<{ id: string; identifier: string; password: string; name: string; isEmail: boolean }> => {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalUsers = (users: any[]) => {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Failed to save local users:", e);
  }
};

const getLocalSession = (): User | null => {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setLocalSession = (user: User | null) => {
  try {
    if (user) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
  } catch (e) {
    console.error("Failed to update local session:", e);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      const savedUser = getLocalSession();
      if (savedUser) {
        setUser(savedUser);
      }
      setLoading(false);
      return;
    }

    // Get initial session with Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureUserProfile(session.user);
      }
      setLoading(false);
    }).catch((err: any) => {
      console.error("Failed to get session from Supabase, falling back to local session:", err);
      const savedUser = getLocalSession();
      if (savedUser) {
        setUser(savedUser);
      }
      setLoading(false);
    });

    // Listen for auth changes
    let subscription: any;
    try {
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          ensureUserProfile(session.user);
        }
        setLoading(false);
      });
      subscription = data.subscription;
    } catch (e) {
      console.error("Failed to set auth state listener");
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const ensureUserProfile = async (currentUser: User) => {
    if (!supabase) return;
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
    if (!supabase) {
      const localUser: any = {
        id: 'local_google_user',
        email: 'user@example.com',
        user_metadata: {
          full_name: 'Google User',
          name: 'Google User'
        }
      };
      setUser(localUser);
      setLocalSession(localUser);
      return;
    }

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
    if (!supabase) {
      const localUsers = getLocalUsers();
      const existing = localUsers.find(u => u.identifier.toLowerCase() === identifier.toLowerCase());
      if (!existing) {
        throw new Error("No account found with this email/phone. Please create an account first.");
      }
      if (existing.password !== password) {
        throw new Error("Invalid password. Please check your credentials.");
      }
      const localUser: any = {
        id: existing.id,
        email: isEmail ? identifier : `${identifier}@local.resumearchitect.com`,
        phone: !isEmail ? identifier : undefined,
        user_metadata: {
          full_name: existing.name || 'User',
          name: existing.name || 'User'
        }
      };
      setUser(localUser);
      setLocalSession(localUser);
      return;
    }

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
    if (!supabase) {
      const localUsers = getLocalUsers();
      const existing = localUsers.find(u => u.identifier.toLowerCase() === identifier.toLowerCase());
      if (existing) {
        throw new Error("An account already exists with this email/phone. Please log in.");
      }
      const newId = 'local_user_' + Date.now();
      const newUserRecord = {
        id: newId,
        identifier,
        password,
        name,
        isEmail
      };
      localUsers.push(newUserRecord);
      saveLocalUsers(localUsers);

      const localUser: any = {
        id: newId,
        email: isEmail ? identifier : `${identifier}@local.resumearchitect.com`,
        phone: !isEmail ? identifier : undefined,
        user_metadata: {
          full_name: name,
          name: name
        }
      };
      setUser(localUser);
      setLocalSession(localUser);
      return;
    }

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
    setLocalSession(null);
    setUser(null);
    if (supabase) {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (error) {
        console.error("Error signing out from Supabase", error);
      }
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
