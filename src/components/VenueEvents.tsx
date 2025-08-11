import { useQuery } from '@tanstack/react-query';
import { EventCard } from './EventCard';
import { fetchVenueEvents, VenueEvent } from '@/utils/csvParser';

interface VenueEventsProps {
  csvUrl: string;
  venueName: string;
  title?: string;
}

export function VenueEvents({ csvUrl, venueName, title }: VenueEventsProps) {
  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['venue-events', csvUrl, venueName],
    queryFn: () => fetchVenueEvents(csvUrl, venueName),
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchInterval: 1000 * 60 * 60, // 1 hour
  });

  const formatEventForCard = (event: VenueEvent) => ({
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
      day: 'numeric'
    }),
    location: event.venue,
    description: `Join us at ${event.venue} for this event.`,
    category: event.category,
    isToday: event.startTime.toDateString() === new Date().toDateString()
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {title && <h2 className="community-heading text-2xl text-foreground">{title}</h2>}
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bulletin-card h-32 bg-muted/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        {title && <h2 className="community-heading text-2xl text-foreground">{title}</h2>}
        <div className="bulletin-card p-6 text-center text-muted-foreground">
          Unable to load events from {venueName}. Please try again later.
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="space-y-4">
        {title && <h2 className="community-heading text-2xl text-foreground">{title}</h2>}
        <div className="bulletin-card p-6 text-center text-muted-foreground">
          No upcoming events at {venueName}.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && <h2 className="community-heading text-2xl text-foreground">{title}</h2>}
      <div className="space-y-4">
        {events.map((event) => (
          <EventCard 
            key={event.id}
            event={formatEventForCard(event)}
          />
        ))}
      </div>
    </div>
  );
}