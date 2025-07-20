import { useState } from "react";
import { Header } from "@/components/Header";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { sampleEvents } from "@/data/sampleEvents";
import { MapPin, Clock, Coffee, Sparkles, RotateCcw } from "lucide-react";

interface DayPlan {
  timeSlot: string;
  event: typeof sampleEvents[0] | null;
  suggestion: string;
}

export default function PlanMyDay() {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState({
    startTime: "",
    location: "",
    interests: [] as string[],
    energy: "",
    social: ""
  });
  const [dayPlan, setDayPlan] = useState<DayPlan[]>([]);

  const getCurrentTimeSlot = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  const handleInterestToggle = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const generatePlan = () => {
    const timeSlots = ["morning", "afternoon", "evening"];
    const currentSlot = getCurrentTimeSlot();
    const relevantSlots = timeSlots.slice(timeSlots.indexOf(currentSlot));
    
    const plan: DayPlan[] = relevantSlots.map(slot => {
      let event = null;
      let suggestion = "";

      if (slot === "morning") {
        suggestion = "Start your day with community connection";
        event = sampleEvents.find(e => 
          e.isToday && (e.category === "volunteer" || e.title.toLowerCase().includes("coffee"))
        ) || null;
      } else if (slot === "afternoon") {
        suggestion = "Perfect time for exploration and culture";
        event = sampleEvents.find(e => 
          e.isToday && (e.category === "art" || e.category === "community")
        ) || null;
      } else {
        suggestion = "Wind down with music and neighbors";
        event = sampleEvents.find(e => 
          e.isToday && (e.category === "music" || e.title.toLowerCase().includes("yoga"))
        ) || null;
      }

      return {
        timeSlot: slot,
        event,
        suggestion
      };
    });

    setDayPlan(plan);
    setStep(3);
  };

  const resetWizard = () => {
    setStep(1);
    setPreferences({
      startTime: "",
      location: "",
      interests: [],
      energy: "",
      social: ""
    });
    setDayPlan([]);
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center">
              <Sparkles className="h-8 w-8 mr-3 text-coral" />
              Plan My Day
            </h1>
            <p className="text-muted-foreground">
              Let us suggest the perfect Outer Sunset day just for you
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tell us about yourself</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>When are you starting your day?</Label>
                <Select 
                  value={preferences.startTime} 
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, startTime: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your starting time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (before 12pm)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12pm - 5pm)</SelectItem>
                    <SelectItem value="evening">Evening (after 5pm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Where in the Outer Sunset?</Label>
                <Select 
                  value={preferences.location} 
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, location: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your general area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beach">Near Ocean Beach</SelectItem>
                    <SelectItem value="judah">Judah Street corridor</SelectItem>
                    <SelectItem value="irving">Irving Street corridor</SelectItem>
                    <SelectItem value="dunes">Near the Dunes</SelectItem>
                    <SelectItem value="anywhere">I'm flexible!</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>What interests you? (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "community", label: "Community events" },
                    { id: "art", label: "Art & culture" },
                    { id: "music", label: "Live music" },
                    { id: "volunteer", label: "Volunteering" },
                    { id: "family", label: "Family activities" },
                    { id: "business", label: "Local businesses" }
                  ].map(interest => (
                    <div key={interest.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={interest.id}
                        checked={preferences.interests.includes(interest.id)}
                        onCheckedChange={() => handleInterestToggle(interest.id)}
                      />
                      <Label htmlFor={interest.id} className="text-sm">
                        {interest.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => setStep(2)} 
                className="w-full bg-coral hover:bg-coral/90 text-coral-foreground"
                disabled={!preferences.startTime || !preferences.location}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Almost there!
            </h1>
            <p className="text-muted-foreground">
              Just a couple more questions to perfect your day
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your vibe today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Energy level?</Label>
                <Select 
                  value={preferences.energy} 
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, energy: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="How are you feeling?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Chill and relaxed</SelectItem>
                    <SelectItem value="medium">Ready for some activity</SelectItem>
                    <SelectItem value="high">High energy, let's go!</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Social preference?</Label>
                <Select 
                  value={preferences.social} 
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, social: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="How social do you want to be?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solo">Solo adventures</SelectItem>
                    <SelectItem value="small">Small groups (2-10 people)</SelectItem>
                    <SelectItem value="large">Big community gatherings</SelectItem>
                    <SelectItem value="any">I'm open to anything</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={generatePlan} 
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={!preferences.energy || !preferences.social}
                >
                  Create My Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Step 3 - Show the plan
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center">
            <Coffee className="h-8 w-8 mr-3 text-primary" />
            Your Perfect Outer Sunset Day
          </h1>
          <p className="text-muted-foreground">
            Based on your preferences, here's what we recommend
          </p>
        </div>

        <div className="grid gap-8">
          {dayPlan.map((slot, index) => (
            <Card key={slot.timeSlot}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-coral" />
                    <span className="capitalize">{slot.timeSlot}</span>
                  </div>
                  <Badge variant="outline">
                    {slot.timeSlot === "morning" ? "9AM - 12PM" : 
                     slot.timeSlot === "afternoon" ? "12PM - 5PM" : "5PM - 9PM"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 italic">
                  {slot.suggestion}
                </p>
                
                {slot.event ? (
                  <EventCard event={slot.event} />
                ) : (
                  <Card className="bg-muted">
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground mb-2">
                        No specific events for this time, but perfect for:
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {slot.timeSlot === "morning" && (
                          <>
                            <Badge variant="outline">Beach walk</Badge>
                            <Badge variant="outline">Coffee at Day Moon</Badge>
                            <Badge variant="outline">Dunes exploration</Badge>
                          </>
                        )}
                        {slot.timeSlot === "afternoon" && (
                          <>
                            <Badge variant="outline">Browse Black Bird</Badge>
                            <Badge variant="outline">Lunch on Irving</Badge>
                            <Badge variant="outline">Art gallery hop</Badge>
                          </>
                        )}
                        {slot.timeSlot === "evening" && (
                          <>
                            <Badge variant="outline">Sunset watching</Badge>
                            <Badge variant="outline">Dinner with friends</Badge>
                            <Badge variant="outline">Cozy cafe time</Badge>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8 space-y-4">
          <p className="text-muted-foreground">
            Want to try different preferences?
          </p>
          <Button 
            onClick={resetWizard} 
            variant="outline" 
            className="mr-4"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Start Over
          </Button>
          <Button asChild className="bg-coral hover:bg-coral/90 text-coral-foreground">
            <a href="/calendar">
              View All Events
            </a>
          </Button>
        </div>
      </main>
    </div>
  );
}