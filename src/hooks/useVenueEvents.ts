import { useQuery } from '@tanstack/react-query';
import { fetchVenueEvents, VenueEvent } from '@/utils/csvParser';
import { formatInTimeZone } from 'date-fns-tz';

interface UseVenueEventsOptions {
  csvUrl: string;
  venueName: string;
  enabled?: boolean;
}

export function useVenueEvents({ csvUrl, venueName, enabled = true }: UseVenueEventsOptions) {
  return useQuery({
    queryKey: ['venue-events', csvUrl, venueName],
    queryFn: () => fetchVenueEvents(csvUrl, venueName),
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchInterval: 1000 * 60 * 60, // 1 hour
    enabled,
  });
}

export function formatVenueEventForCard(event: VenueEvent) {
  const todayPacific = formatInTimeZone(new Date(), 'America/Los_Angeles', 'yyyy-MM-dd');
  const eventDatePacific = formatInTimeZone(event.startTime, 'America/Los_Angeles', 'yyyy-MM-dd');
  const isToday = eventDatePacific === todayPacific;
  
  return {
    id: event.id,
    title: event.title,
    time: event.startTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }),
    date: event.startTime.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric' // Added year for better sorting
    }),
    location: event.venue,
    description: `Join us at ${event.venue} for this event.`,
    category: event.category,
    isToday: isToday
  };
}