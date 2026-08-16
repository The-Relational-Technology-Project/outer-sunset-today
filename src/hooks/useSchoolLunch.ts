import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatInTimeZone } from 'date-fns-tz';

export interface SchoolLunch {
  menu_date: string;
  special_item: string;
  isToday: boolean;
}

/**
 * Next SFUSD school lunch. Before 5pm PT we show today's (if any);
 * from 5pm PT onward we look ahead to the next school day.
 */
export function useSchoolLunch() {
  return useQuery({
    queryKey: ['school_lunch', 'next'],
    queryFn: async (): Promise<SchoolLunch | null> => {
      const now = new Date();
      const today = formatInTimeZone(now, 'America/Los_Angeles', 'yyyy-MM-dd');
      const hourPT = parseInt(formatInTimeZone(now, 'America/Los_Angeles', 'H'), 10);

      // After 5pm PT, roll forward to tomorrow
      const from =
        hourPT >= 17
          ? formatInTimeZone(
              new Date(new Date(`${today}T12:00:00`).getTime() + 24 * 60 * 60 * 1000),
              'America/Los_Angeles',
              'yyyy-MM-dd'
            )
          : today;

      const { data, error } = await supabase
        .from('daily_menus')
        .select('menu_date, special_item')
        .eq('category', 'school')
        .gte('menu_date', from)
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
