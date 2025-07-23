import { Header } from "@/components/Header";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { sampleEvents } from "@/data/sampleEvents";
import { Link } from "react-router-dom";
import { Calendar, Plus, Sun, Clock, Bookmark, MapPin } from "lucide-react";
import { useMyPlan } from "@/contexts/MyPlanContext";
import heroImage from "/lovable-uploads/a050e994-8519-4f19-b31d-225c2c982852.png";

const Index = () => {
  const { planEvents } = useMyPlan();
  const todaysEvents = sampleEvents.filter(event => event.isToday);
  const upcomingEvents = sampleEvents.filter(event => !event.isToday).slice(0, 4);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Los_Angeles'
    });
  };

  const getSunsetTime = () => {
    // Approximate sunset time for SF
    return "7:24 PM";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4">
        {/* Header and Status */}
        <div className="py-6 text-center">
          <h1 className="community-heading text-2xl sm:text-3xl text-foreground mb-2">
            Your neighborhood dashboard for community life
          </h1>
          <Card className="bg-muted w-full max-w-2xl mx-auto">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-sm">
                <div className="flex items-center">
                  <Sun className="h-4 w-4 mr-2 text-coral" />
                  <span className="font-medium">Sunset today:</span>
                  <span className="ml-1">{getSunsetTime()}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Info updated at:</span>
                  <span className="ml-1">8:42 AM</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Events */}
        <section className="py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
            <h2 className="community-heading text-3xl sm:text-4xl text-foreground">
              Happening Today
            </h2>
            <div className="flex items-center">
              <Button 
                variant="outline" 
                className="sticker-button bg-ocean hover:bg-ocean/90 text-ocean-foreground"
                onClick={() => {
                  // TODO: Implement counter logic
                  console.log('Surfing OB today!');
                }}
              >
                🏄‍♂️ I'm surfing OB today (42)
              </Button>
            </div>
          </div>
          
          {todaysEvents.length > 0 ? (
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                {todaysEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              <div className="lg:sticky lg:top-4">
                <Card className="h-fit">
                  <CardContent className="p-4">
                    <div className="flex items-center mb-3">
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      <h3 className="font-semibold">Event Locations</h3>
                    </div>
                    <div className="rounded-lg overflow-hidden">
                      <img 
                        src="/lovable-uploads/21d104dc-51c2-4b61-8fbe-b39e675315f0.png" 
                        alt="Outer Sunset neighborhood map"
                        className="w-full h-64 object-cover"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Interactive map coming soon! This shows the Outer Sunset area where today's events are happening.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No events scheduled for today. Check back tomorrow or add something yourself!
                </p>
                <Button asChild className="bg-coral hover:bg-coral/90 text-coral-foreground">
                  <Link to="/submit">
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Today's Event
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Coming Up Soon */}
        <section className="py-8">
          <h2 className="community-heading text-3xl sm:text-4xl text-foreground mb-6">
            Coming Up Soon
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {upcomingEvents.map(event => (
              <EventCard key={event.id} event={event} compact />
            ))}
          </div>
          {upcomingEvents.length > 0 && (
            <div className="text-center mt-6">
              <Button variant="outline" asChild>
                <Link to="/calendar">
                  View All Upcoming Events
                </Link>
              </Button>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="py-12 text-center border-t border-border mt-12">
          <p className="text-muted-foreground mb-4">
            Made with ❤️ by neighbors, for neighbors
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <Link to="/about" className="text-primary hover:underline">
              About
            </Link>
            <a href="mailto:hello@outersunset.today" className="text-primary hover:underline">
              Contact
            </a>
            <Link to="/submit" className="text-primary hover:underline">
              Submit Event
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;