import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Calendar as CalendarIcon } from "lucide-react";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    time: string;
    location: string;
    description: string;
    category: string;
    date?: string;
    isToday?: boolean;
  };
  compact?: boolean;
}

export function EventCard({ event, compact = false }: EventCardProps) {
  const categoryColors = {
    "community": "bg-primary text-primary-foreground",
    "business": "bg-coral text-coral-foreground", 
    "music": "bg-secondary text-secondary-foreground",
    "volunteer": "bg-accent text-accent-foreground",
    "family": "bg-muted text-muted-foreground",
    "art": "bg-primary text-primary-foreground"
  };

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 ${event.isToday ? 'ring-2 ring-primary/20' : ''}`}>
      <CardContent className={compact ? "p-4" : "p-6"}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className={`font-semibold text-foreground ${compact ? 'text-sm' : 'text-lg'} mb-1`}>
              {event.title}
            </h3>
            <div className="flex items-center text-muted-foreground text-sm space-x-4">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {event.time}
              </div>
              {event.date && !event.isToday && (
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {event.date}
                </div>
              )}
            </div>
          </div>
          <Badge 
            className={`ml-3 ${categoryColors[event.category as keyof typeof categoryColors] || categoryColors.community}`}
          >
            {event.category}
          </Badge>
        </div>
        
        <div className="flex items-center text-muted-foreground text-sm mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          {event.location}
        </div>
        
        {!compact && (
          <p className="text-foreground text-sm leading-relaxed">
            {event.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}