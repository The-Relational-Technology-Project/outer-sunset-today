import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DailyMenu {
  id: string;
  restaurant: string;
  location: string;
  menu_date: string;
  special_item: string;
  category: string;
  price: string | null;
  hours: string;
}

export function useTodaysMenus() {
  return useQuery({
    queryKey: ['daily_menus', 'today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_menus')
        .select('*')
        .eq('menu_date', today)
        .order('restaurant', { ascending: true });

      if (error) throw error;
      
      return data;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function useDailyMenus() {
  return useQuery({
    queryKey: ['daily_menus'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_menus')
        .select('*')
        .order('menu_date', { ascending: true })
        .order('restaurant', { ascending: true });

      if (error) throw error;
      
      return data;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}
