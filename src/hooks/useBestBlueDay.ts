import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatInTimeZone } from 'date-fns-tz';

export function useBestBlueDay() {
  return useQuery({
    queryKey: ['best-blue-day'],
    queryFn: async () => {
      const today = formatInTimeZone(new Date(), 'America/Los_Angeles', 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('best_blue_days')
        .select('blue_date')
        .eq('blue_date', today)
        .maybeSingle();
      
      if (error) throw error;
      return !!data; // Returns true if today is a best blue day
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
