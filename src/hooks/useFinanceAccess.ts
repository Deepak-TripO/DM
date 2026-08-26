import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/lib/supabase/client';
import { getLocalUserFinanceAccessMap } from '@/services/adminService';

export function useFinanceAccess() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const { data: userPermission, isLoading: permLoading } = useQuery({
    queryKey: ['userFinancePermission', user?.id],
    queryFn: async () => {
      if (!user) return 'unlocked';
      try {
        const { data, error } = await supabase
          .from('user_permissions')
          .select('finance_entry_access')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error || !data) {
          const localMap = getLocalUserFinanceAccessMap();
          return localMap[user.id] === 'locked' ? 'locked' : 'unlocked';
        }
        return data.finance_entry_access === 'locked' ? 'locked' : 'unlocked';
      } catch {
        const localMap = getLocalUserFinanceAccessMap();
        return localMap[user.id] === 'locked' ? 'locked' : 'unlocked';
      }
    },
    enabled: !!user,
  });

  const isLoading = adminLoading || (!!user && permLoading);

  // Admin users ALWAYS retain access
  if (isAdmin) {
    return {
      canAddEntry: true,
      accessStatus: 'unlocked' as const,
      isLoading,
    };
  }

  // Normal users check finance_entry_access
  const isLocked = userPermission === 'locked';

  return {
    canAddEntry: !isLocked,
    accessStatus: isLocked ? ('locked' as const) : ('unlocked' as const),
    isLoading,
  };
}
