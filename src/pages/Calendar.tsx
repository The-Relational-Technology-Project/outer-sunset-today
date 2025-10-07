import { useState } from "react";
import { Header } from "@/components/Header";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import { useEvents, formatEventForCard } from "@/hooks/useEvents";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInTimeZone } from "date-fns-tz";

export default function Calendar() {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  
  const { data: eventsData = [], isLoading } = useEvents();
  const today = formatInTimeZone(new Date(), 'America/Los_Angeles', 'yyyy-MM-dd');
  
  // Filter to only show today and future events
  const todayAndFutureEvents = eventsData.filter(event => event.event_date >= today);
  const allEvents = todayAndFutureEvents.map(formatEventForCard);
  
  const filters = [
    { id: "all", label: "All Events" },
    { id: "community", label: "Community" },
    { id: "business", label: "Local Business" },
    { id: "music", label: "Live Music" },
    { id: "volunteer", label: "Volunteer" },
    { id: "family", label: "Family-Friendly" },
    { id: "art", label: "Art & Culture" }
  ];

  const filteredEvents = selectedFilter === "all" 
    ? allEvents 
    : allEvents.filter(event => event.category.toLowerCase().includes(selectedFilter.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Events Calendar
          </h1>
          <p className="text-muted-foreground">
            Discover what's happening in the Outer Sunset
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filter by:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap gap-2">
            {filters.map(filter => (
              <Button
                key={filter.id}
                variant={selectedFilter === filter.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter(filter.id)}
                className={`${selectedFilter === filter.id ? "bg-primary text-primary-foreground" : ""} text-center justify-center`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bulletin-card p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {!isLoading && filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No events found for the selected filter.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}