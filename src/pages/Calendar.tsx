import { useState } from "react";
import { Header } from "@/components/Header";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sampleEvents } from "@/data/sampleEvents";
import { Filter } from "lucide-react";

export default function Calendar() {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  
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
    ? sampleEvents 
    : sampleEvents.filter(event => event.category === selectedFilter);

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
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {filteredEvents.length === 0 && (
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