import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/features/auth/AuthProvider';

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdmin = useCallback(async () => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const userEmail = user.email?.trim().toLowerCase();
    const isDefaultAdminEmail = userEmail === 'admin@dm.com';

    // Fast path for default admin email to eliminate UI flicker / race condition
    if (isDefaultAdminEmail) {
      setIsAdmin(true);
      setLoading(false);

      // Ensure backend admin_users and profile records exist in background
      try {
        await supabase.from('admin_users').upsert(
          { user_id: user.id, role: 'admin' },
          { onConflict: 'user_id' }
        );
      } catch {
        // Ignore background sync error
      }
      return;
    }

    try {
      // Check 1: RPC is_admin function (SECURITY DEFINER)
      const { data: rpcAdmin, error: rpcError } = await supabase.rpc('is_admin', { uid: user.id });

      if (!rpcError && rpcAdmin === true) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Check 2: query admin_users table directly
      const { data: adminRow, error: adminErr } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!adminErr && adminRow) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Check 3: query profiles table for role === 'admin'
      const { data: profileRow, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (!profileErr && profileRow && profileRow.role?.trim().toLowerCase() === 'admin') {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      setIsAdmin(false);
    } catch (err) {
      console.warn('Error verifying admin permissions:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    checkAdmin();
  }, [checkAdmin]);

  return { isAdmin, loading: loading || authLoading };
}

