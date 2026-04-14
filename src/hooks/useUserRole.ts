import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'customer' | 'restaurant_owner' | 'super_admin';

export function useUserRole() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-role', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AppRole | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.role as AppRole) ?? 'customer';
    },
  });
}
