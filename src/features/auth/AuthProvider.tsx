import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; autoLoggedIn?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  updateEmail: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        supabase.auth.signOut().catch(() => {});
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (!email || !email.includes('@')) {
      return { error: new Error('Please enter a valid email address.') };
    }
    if (!password || password.length < 6) {
      return { error: new Error('Password must be at least 6 characters long.') };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      const isAlreadyRegistered = msg.includes('already registered') || msg.includes('already exists') || msg.includes('user_already_exists');

      if (isAlreadyRegistered) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (!signInErr && signInData.session) {
          return { error: null, autoLoggedIn: true };
        }
        return { error: new Error('An account with this email already exists. Please sign in.') };
      }

      if (msg.includes('disabled') || msg.includes('not allowed')) {
        return {
          error: new Error(
            'Signups are disabled on your Supabase project. To enable signups, go to Supabase Dashboard -> Authentication -> Providers -> Email and turn on "Allow new users to sign up".'
          ),
        };
      }

      return { error: new Error(error.message) };
    }

    if (data.session) {
      return { error: null, autoLoggedIn: true };
    }

    return { error: null, autoLoggedIn: false };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!email || !email.includes('@')) {
      return { error: new Error('Please enter a valid email address.') };
    }
    if (!password || password.length < 6) {
      return { error: new Error('Password must be at least 6 characters long.') };
    }

    let { data, error } = await supabase.auth.signInWithPassword({ email, password });

    // Auto-provision default admin@dm.com account if not registered yet
    if (error && email.trim().toLowerCase() === 'admin@dm.com') {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: 'admin@dm.com',
        password,
        options: { data: { full_name: 'Administrator' } },
      });

      if (!signUpErr && signUpData?.user) {
        try {
          await supabase.rpc('is_admin', { uid: signUpData.user.id });
        } catch {
          // Ignore RLS check
        }

        if (signUpData.session) {
          return { error: null };
        }

        const { error: reErr } = await supabase.auth.signInWithPassword({ email, password });
        if (!reErr) return { error: null };
      }
    }

    // Ensure admin role entry exists if logged in as admin@dm.com
    if (!error && data?.user && email.trim().toLowerCase() === 'admin@dm.com') {
      try {
        await supabase.rpc('is_admin', { uid: data.user.id });
      } catch {
        // Ignore RLS check
      }
    }

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('invalid login credentials')) {
        return { error: new Error('Invalid email or password. If you do not have an account, please click "Sign up".') };
      }
      return { error: new Error(error.message) };
    }

    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const updateEmail = useCallback(async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    return { error: error ? new Error(error.message) : null };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword, updatePassword, updateEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
