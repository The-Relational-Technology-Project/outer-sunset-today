import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatInTimeZone } from 'date-fns-tz';

export interface Event {
  id: string;
  title: string;
  location: string;
  start_time: string;
  end_time: string | null;
  event_date: string;
  event_type: string;
  description: string | null;
  isToday?: boolean;
}

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'approved')
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      const today = formatInTimeZone(new Date(), 'America/Los_Angeles', 'yyyy-MM-dd');
      
      return data.map(event => ({
        ...event,
        isToday: event.event_date === today
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useTodaysEvents() {
  return useQuery({
    queryKey: ['events', 'today'],
    queryFn: async () => {
      const today = formatInTimeZone(new Date(), 'America/Los_Angeles', 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_date', today)
        .eq('status', 'approved')
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      return data.map(event => ({
        ...event,
        isToday: true
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpcomingEvents() {
  return useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: async () => {
      const today = formatInTimeZone(new Date(), 'America/Los_Angeles', 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'approved')
        .gt('event_date', today)
        .order('start_time', { ascending: true })
        .limit(10);

      if (error) throw error;
      
      return data.map(event => ({
        ...event,
        isToday: false
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function formatEventForCard(event: Event) {
  const startTime = new Date(event.start_time);
  
  return {
    id: event.id,
    title: event.title,
    time: startTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }),
    date: startTime.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    }),
    location: event.location,
    description: event.description || `Join us at ${event.location} for this event.`,
    category: event.event_type,
    isToday: event.isToday
  };
}
