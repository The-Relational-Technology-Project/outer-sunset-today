import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { EventCard } from "@/components/EventCard";
import { ArrowLeft, Download, Share2, Trash2, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { useMyPlan } from "@/contexts/MyPlanContext";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const PlanMyDay = () => {
  const { planEvents, removeFromPlan, updateEventNotes, clearPlan } = useMyPlan();

  const exportPlan = () => {
    const planText = planEvents.map(event => {
      const notes = event.notes ? `\nNotes: ${event.notes}` : '';
      return `${event.title}\n${event.time} - ${event.location}\n${event.description}${notes}`;
    }).join('\n\n---\n\n');

    const blob = new Blob([`My Outer Sunset Plan\n${'='.repeat(20)}\n\n${planText}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-outer-sunset-plan.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Plan exported!");
  };

  const sharePlan = async () => {
    const planText = planEvents.map(event => {
      const notes = event.notes ? ` (${event.notes})` : '';
      return `${event.title} - ${event.time} at ${event.location}${notes}`;
    }).join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Outer Sunset Plan',
          text: `Check out my plan for the Outer Sunset:\n\n${planText}`,
        });
        toast.success("Plan shared!");
      } catch (error) {
        // Fall back to clipboard
        fallbackShare(planText);
      }
    } else {
      fallbackShare(planText);
    }
  };

  const fallbackShare = (planText: string) => {
    navigator.clipboard.writeText(`My Outer Sunset Plan:\n\n${planText}`);
    toast.success("Plan copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-primary hover:underline mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Link>
          <h1 className="text-3xl font-bold mb-2">My Plan</h1>
          <p className="text-muted-foreground">
            Your saved events and itinerary for the Outer Sunset.
          </p>
        </div>

        {planEvents.length === 0 ? (
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="p-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Your plan is empty</h3>
              <p className="text-muted-foreground mb-6">
                Start adding events from the homepage to build your personalized itinerary.
              </p>
              <Button asChild>
                <Link to="/">
                  Browse Events
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {planEvents.length} {planEvents.length === 1 ? 'Event' : 'Events'} in Your Plan
                </h2>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={sharePlan} size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" onClick={exportPlan} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" onClick={clearPlan} size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {planEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-6">
                    <div className="grid lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <EventCard event={event} showAddToPlan={false} />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`notes-${event.id}`} className="text-sm font-medium">
                            Personal Notes
                          </Label>
                          <Textarea
                            id={`notes-${event.id}`}
                            placeholder="Add your thoughts, reminders, or notes about this event..."
                            value={event.notes || ''}
                            onChange={(e) => updateEventNotes(event.id, e.target.value)}
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromPlan(event.id)}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove from Plan
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8 p-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">
                Your plan is saved for this session only. Export or share it to keep a permanent copy.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={sharePlan}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Plan
                </Button>
                <Button onClick={exportPlan}>
                  <Download className="h-4 w-4 mr-2" />
                  Download as Text
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PlanMyDay;