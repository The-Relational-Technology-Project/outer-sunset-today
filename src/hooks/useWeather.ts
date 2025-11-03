import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WeatherData {
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  detailedForecast: string;
  icon: string;
  lowTemp: number;
  highTemp: number;
  tides: Array<{ time: string; type: 'H' | 'L'; height: string }>;
}

export function useWeather() {
  return useQuery({
    queryKey: ['weather'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-weather');
      
      if (error) throw error;
      return data as WeatherData;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchInterval: 1000 * 60 * 60, // 1 hour
  });
}
