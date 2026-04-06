import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      const map: Record<string, string> = {};
      (data ?? []).forEach((row: any) => { map[row.key] = row.value; });
      return map;
    },
  });
}

export function useSetting(key: string) {
  const { data: settings, ...rest } = useSettings();
  return { data: settings?.[key] ?? '', ...rest };
}

export function useUpsertSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      // Try update first, then insert
      const { data: existing } = await supabase.from('settings').select('id').eq('key', key).maybeSingle();
      if (existing) {
        const { error } = await supabase.from('settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('settings').insert({ key, value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
