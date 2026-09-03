import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { setupTaskPermissionsForUser } from '@/services/taskService';
import { getUserAccountState } from '@/services/profileService';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPendingApproval: boolean;
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
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  useEffect(() => {
    const validateSessionUser = async (currentSession: Session | null) => {
      if (!currentSession?.user) {
        setSession(null);
        setUser(null);
        setIsPendingApproval(false);
        setLoading(false);
        return;
      }

      // Verify user token on server to detect revoked/invalid sessions and prevent 403 loops
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        await supabase.auth.signOut().catch(() => {});
        setSession(null);
        setUser(null);
        setIsPendingApproval(false);
        setLoading(false);
        return;
      }

      const verifiedUser = userData.user;
      const { isDisabled, approvalStatus } = await getUserAccountState(verifiedUser.id);
      if (isDisabled) {
        await supabase.auth.signOut().catch(() => {});
        setSession(null);
        setUser(null);
        setIsPendingApproval(false);
        setLoading(false);
        toast.error('Your account has been disabled. Please contact an administrator.');
        return;
      }

      if (approvalStatus === 'pending') {
        setIsPendingApproval(true);
      } else {
        setIsPendingApproval(false);
      }

      setSession(currentSession);
      setUser(verifiedUser);

      if (verifiedUser.email?.trim().toLowerCase() === 'admin@dm.com') {
        setIsPendingApproval(false);
        try {
          await supabase.from('admin_users').upsert(
            { user_id: verifiedUser.id, role: 'admin' },
            { onConflict: 'user_id' }
          );
          await supabase.from('profiles').upsert(
            {
              id: verifiedUser.id,
              full_name: 'Administrator',
              username: 'admin',
              role: 'admin',
              approval_status: 'approved',
              is_disabled: false,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
          try {
            await supabase.rpc('is_admin', { uid: verifiedUser.id });
          } catch {
            // Ignore RPC error
          }
        } catch (err) {
          console.warn('Error syncing admin credentials on session validation:', err);
        }
      }

      if (verifiedUser.email?.trim().toLowerCase() === 'vishal@gmail.com') {
        setupTaskPermissionsForUser(verifiedUser.id, ['tripo', 'freelance']);
      }
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setUser(null);
        setLoading(false);
      } else {
        validateSessionUser(session);
      }
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      validateSessionUser(session);
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
          const { isDisabled } = await getUserAccountState(signInData.session.user.id);
          if (isDisabled) {
            await supabase.auth.signOut();
            return { error: new Error('Your account has been disabled. Please contact an administrator.') };
          }
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

    if (!error && data?.user) {
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: fullName,
            username: email.split('@')[0],
            approval_status: 'pending',
            is_disabled: false,
            updated_at: new Date().toISOString(),
          });
      } catch (e) {
        console.warn('Error setting pending approval status:', e);
      }
    }

    if (data.session) {
      const { isDisabled } = await getUserAccountState(data.session.user.id);
      if (isDisabled) {
        await supabase.auth.signOut();
        return { error: new Error('Your account has been disabled. Please contact an administrator.') };
      }
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

    // Auto-provision default vishal@gmail.com account with TripO Lead & Freelance Lead access
    if (email.trim().toLowerCase() === 'vishal@gmail.com') {
      if (error) {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: 'vishal@gmail.com',
          password: password || 'TRTDM001',
          options: { data: { full_name: 'Vishal' } },
        });

        if (!signUpErr && signUpData?.user) {
          await setupTaskPermissionsForUser(signUpData.user.id, ['tripo', 'freelance']);
          if (signUpData.session) {
            const { isDisabled } = await getUserAccountState(signUpData.session.user.id);
            if (isDisabled) {
              await supabase.auth.signOut();
              return { error: new Error('Your account has been disabled. Please contact an administrator.') };
            }
            return { error: null };
          }
          const { data: reData, error: reErr } = await supabase.auth.signInWithPassword({
            email: 'vishal@gmail.com',
            password: password || 'TRTDM001',
          });
          if (!reErr && reData?.user) {
            data = reData;
            error = null;
          }
        }
      } else if (data?.user) {
        await setupTaskPermissionsForUser(data.user.id, ['tripo', 'freelance']);
      }
    }

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

        const { data: reData, error: reErr } = await supabase.auth.signInWithPassword({ email, password });
        if (!reErr && reData?.user) {
          data = reData;
          error = null;
        }
      }
    }

    // Ensure admin role entry and approved profile exist if logged in as admin@dm.com
    if (!error && data?.user && email.trim().toLowerCase() === 'admin@dm.com') {
      try {
        await supabase.from('admin_users').upsert(
          { user_id: data.user.id, role: 'admin' },
          { onConflict: 'user_id' }
        );
        await supabase.from('profiles').upsert(
          {
            id: data.user.id,
            full_name: 'Administrator',
            username: 'admin',
            role: 'admin',
            approval_status: 'approved',
            is_disabled: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
        try {
          await supabase.rpc('is_admin', { uid: data.user.id });
        } catch {
          // Ignore RPC error
        }
      } catch (err) {
        console.warn('Error syncing admin record on sign in:', err);
      }
    }

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('invalid login credentials')) {
        return { error: new Error('Invalid email or password. If you do not have an account, please click "Sign up".') };
      }
      return { error: new Error(error.message) };
    }

    // Check if account is disabled before completing login
    if (data?.user) {
      const { isDisabled } = await getUserAccountState(data.user.id);
      if (isDisabled) {
        await supabase.auth.signOut();
        return { error: new Error('Your account has been disabled. Please contact an administrator.') };
      }
    }

    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsPendingApproval(false);
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
    <AuthContext.Provider value={{ user, session, loading, isPendingApproval, signUp, signIn, signOut, resetPassword, updatePassword, updateEmail }}>
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
