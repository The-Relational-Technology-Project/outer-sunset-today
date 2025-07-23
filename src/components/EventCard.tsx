import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Calendar as CalendarIcon, Plus, Check } from "lucide-react";
import { useMyPlan } from "@/contexts/MyPlanContext";
import { toast } from "sonner";

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
  
  const handleAddToPlan = () => {
    if (isInPlan(event.id)) {
      removeFromPlan(event.id);
      toast.success("Removed from My Plan");
    } else {
      addToPlan(event);
      toast.success("Added to My Plan");
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
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 space-y-2 sm:space-y-0">
          <div className="flex-1">
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
          <Badge 
            className={`sticker-button self-start sm:ml-3 text-sm font-medium ${categoryColors[event.category as keyof typeof categoryColors] || categoryColors.community}`}
          >
            {event.category}
          </Badge>
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
              className="sticker-button text-xs bg-coral hover:bg-coral/90 text-coral-foreground"
            >
              {isInPlan(event.id) ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Added to Plan
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3 mr-1" />
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