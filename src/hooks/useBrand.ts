import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Brand {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string;
  created_at: string;
}

export function useBrandBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['brand', slug],
    enabled: !!slug,
    queryFn: async (): Promise<Brand | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data as Brand | null;
    },
  });
}

export function useMyBrand() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-brand', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Brand | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Brand | null;
    },
  });
}

export function useAllBrands() {
  return useQuery({
    queryKey: ['all-brands'],
    queryFn: async (): Promise<Brand[]> => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Brand[];
    },
  });
}
