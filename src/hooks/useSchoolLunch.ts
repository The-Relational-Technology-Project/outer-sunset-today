import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatInTimeZone } from 'date-fns-tz';

export interface SchoolLunch {
  menu_date: string;
  special_item: string;
  isToday: boolean;
}

/**
 * Today's SFUSD school lunch, or the next upcoming one (weekends/holidays).
 */
export function useSchoolLunch() {
  return useQuery({
    queryKey: ['school_lunch', 'next'],
    queryFn: async (): Promise<SchoolLunch | null> => {
      const today = formatInTimeZone(new Date(), 'America/Los_Angeles', 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('daily_menus')
        .select('menu_date, special_item')
        .eq('category', 'school')
        .gte('menu_date', today)
        .order('menu_date', { ascending: true })
        .limit(1);

      if (error) throw error;
      const row = data?.[0];
      if (!row) return null;

      return {
        menu_date: row.menu_date,
        special_item: row.special_item,
        isToday: row.menu_date === today,
      };
    },
    staleTime: 1000 * 60 * 15,
  });
}
