import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem } from '@/store/cartStore';

export function useMenuItems() {
  return useQuery({
    queryKey: ['menu-items'],
    queryFn: async (): Promise<MenuItem[]> => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        price: row.price,
        image: row.image,
        images: row.images || [],
        category: row.category,
        brand_id: row.brand_id,
      }));
    },
  });
}

export function useMenuItemsByBrand(brandId: string | undefined) {
  return useQuery({
    queryKey: ['menu-items', brandId],
    enabled: !!brandId,
    queryFn: async (): Promise<MenuItem[]> => {
      if (!brandId) return [];
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        price: row.price,
        image: row.image,
        images: row.images || [],
        category: row.category,
        brand_id: row.brand_id,
      }));
    },
  });
}
