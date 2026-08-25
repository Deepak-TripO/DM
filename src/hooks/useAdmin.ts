import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/features/auth/AuthProvider';

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdmin = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const userEmail = user.email?.toLowerCase();
    const isDefaultAdminEmail = userEmail === 'admin@dm.com';

    try {
      // Primary security check: RPC is_admin function (SECURITY DEFINER)
      const { data: rpcAdmin, error: rpcError } = await supabase.rpc('is_admin', { uid: user.id });

      if (!rpcError && typeof rpcAdmin === 'boolean') {
        setIsAdmin(rpcAdmin);
        setLoading(false);
        return;
      }

      // Secondary check: query admin_users table directly
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Default email fallback (admin@dm.com)
      if (isDefaultAdminEmail) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      setIsAdmin(false);
    } catch {
      setIsAdmin(isDefaultAdminEmail);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    checkAdmin();
  }, [checkAdmin]);

  return { isAdmin, loading };
}
