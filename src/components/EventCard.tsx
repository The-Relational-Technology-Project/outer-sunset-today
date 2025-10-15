import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Calendar as CalendarIcon, Plus, Check } from "lucide-react";
import { useMyPlan } from "@/contexts/MyPlanContext";
import { toast } from "sonner";
import { getVibeTag } from "@/utils/vibesTags";

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
  showAddToPlan?: boolean;
}

export function EventCard({ event, compact = false, showAddToPlan = true }: EventCardProps) {
  const { addToPlan, removeFromPlan, isInPlan } = useMyPlan();
  const vibeTag = getVibeTag(event);
  
  const handleAddToPlan = () => {
    const isMobile = window.innerWidth < 768;
    
    if (isInPlan(event.id)) {
      removeFromPlan(event.id);
      if (!isMobile) {
        toast.success("Removed from My Plan");
      }
    } else {
      addToPlan(event);
      if (!isMobile) {
        toast.success("Added to My Plan");
      }
    }
  };
  const categoryColors = {
    "community": "bg-primary text-primary-foreground",
    "business": "bg-coral text-coral-foreground", 
    "music": "bg-secondary text-secondary-foreground",
    "volunteer": "bg-accent text-accent-foreground",
    "family": "bg-muted text-muted-foreground",
    "art": "bg-primary text-primary-foreground"
  };

  return (
    <Card className={`bulletin-card transition-all duration-200 ${event.isToday ? 'ring-2 ring-primary/20' : ''}`}>
      <CardContent className={compact ? "p-4" : "p-4 sm:p-6"}>
        <div className="mb-3">
          <h3 className={`community-heading text-foreground ${compact ? 'text-xl sm:text-lg' : 'text-2xl'} mb-1 leading-tight`}>
            {event.title}
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center text-muted-foreground text-base space-y-1 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
              {event.time}
            </div>
            {event.date && !event.isToday && (
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                {event.date}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center text-muted-foreground text-base mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          {event.location}
        </div>
        
        {!compact && (
          <p className="text-foreground text-base leading-relaxed mb-4">
            {event.description}
          </p>
        )}
        
        {showAddToPlan && (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant={isInPlan(event.id) ? "default" : "outline"}
              onClick={handleAddToPlan}
              className="sticker-button text-sm bg-coral hover:bg-coral/90 text-coral-foreground"
            >
              {isInPlan(event.id) ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Added to Plan
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Add to My Plan
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}