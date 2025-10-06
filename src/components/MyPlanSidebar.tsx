import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMyPlan } from "@/contexts/MyPlanContext";
import { Trash2, Download, Share2, Calendar, Clock, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSurfCount } from "@/hooks/useSurfCount";

export function MyPlanSidebar() {
  const { planEvents, removeFromPlan, updateEventNotes } = useMyPlan();
  const { toast } = useToast();
  const { surfCount, incrementSurfCount } = useSurfCount();

  const handleSurfClick = () => {
    incrementSurfCount();
  };

  const exportPlan = () => {
    const planText = planEvents.map(event => {
      const datePrefix = event.date ? `Date: ${event.date}\n` : '';
      return `${event.title}\n${datePrefix}${event.time} - ${event.location}\n${event.description}\n${event.notes ? `Notes: ${event.notes}` : ''}\n---`;
    }).join('\n');
    
    const blob = new Blob([planText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-plan.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Plan exported!",
      description: "Your plan has been downloaded as a text file.",
    });
  };

  const sharePlan = async () => {
    const planText = planEvents.map(event => {
      const datePrefix = event.date ? `[${event.date}] ` : '';
      return `${datePrefix}${event.title} - ${event.time} at ${event.location}`;
    }).join('\n');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Outer Sunset Plan',
          text: planText,
        });
      } catch (err) {
        fallbackShare(planText);
      }
    } else {
      fallbackShare(planText);
    }
  };

  const fallbackShare = (planText: string) => {
    navigator.clipboard.writeText(planText);
    toast({
      title: "Plan copied!",
      description: "Your plan has been copied to clipboard.",
    });
  };

  if (planEvents.length === 0) {
    return (
      <Card className="h-fit sticky top-4">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-coral" />
            My Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Your plan is empty. Add events from the left to get started!
            </p>
          </div>
          
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full sticker-button bg-ocean hover:bg-ocean/90 text-ocean-foreground" 
              onClick={handleSurfClick}
            >
              🏄‍♂️ I'm surfing OB today ({surfCount})
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-coral" />
          My Plan ({planEvents.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {planEvents.map((event) => (
          <div key={event.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{event.title}</h4>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {event.time}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 mr-1" />
                  {event.location}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFromPlan(event.id)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <Badge variant="outline" className="text-xs">
              {event.category}
            </Badge>
            <Textarea
              placeholder="Add notes..."
              value={event.notes || ''}
              onChange={(e) => updateEventNotes(event.id, e.target.value)}
              className="text-xs min-h-[60px]"
            />
          </div>
        ))}
        
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            onClick={exportPlan} 
            variant="outline" 
            size="sm" 
            className="flex-1"
          >
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
          <Button 
            onClick={sharePlan} 
            variant="outline" 
            size="sm" 
            className="flex-1"
          >
            <Share2 className="h-3 w-3 mr-1" />
            Share
          </Button>
        </div>
        
        <div className="pt-4 border-t">
          <Button 
            variant="outline" 
            className="w-full sticker-button bg-ocean hover:bg-ocean/90 text-ocean-foreground" 
            onClick={handleSurfClick}
          >
            🏄‍♂️ Also, I'm surfing OB today ({surfCount})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}