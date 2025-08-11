import React from "react";
import { Header } from "@/components/Header";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { sampleEvents } from "@/data/sampleEvents";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useMyPlan } from "@/contexts/MyPlanContext";
import { TodaysMenus } from "@/components/TodaysMenus";
import { MyPlanSidebar } from "@/components/MyPlanSidebar";
import { useVenueEvents, formatVenueEventForCard } from "@/hooks/useVenueEvents";

const Index = () => {
  const { planEvents } = useMyPlan();
  
  // Fetch Black Bird Bookstore events
  const { data: blackBirdEvents = [], isLoading: isLoadingVenueEvents } = useVenueEvents({
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQkcrpUFZT-ogRUzFTA0fPKILyXoIe-GG0Gw7ishgTVLad1gaLBRe744h89zE2ngJzMp5-Dr-F_Z4xO/pub?gid=1687511126&single=true&output=csv",
    venueName: "Black Bird Bookstore"
  });
  
  // Convert venue events to the format expected by EventCard
  const formattedBlackBirdEvents = blackBirdEvents.map(formatVenueEventForCard);
  console.log('Formatted Black Bird events:', formattedBlackBirdEvents);
  
  // Combine sample events with venue events
  const allEvents = [...sampleEvents, ...formattedBlackBirdEvents];
  console.log('All combined events:', allEvents.length, allEvents);
  
  const todaysEvents = allEvents.filter(event => event.isToday);
  
  // Sort upcoming events by date and show next week's events (or first 8)
  const upcomingEvents = allEvents
    .filter(event => !event.isToday)
    .sort((a, b) => {
      // Parse dates for proper chronological sorting
      const parseEventDate = (dateStr: string) => {
        // Handle various date formats
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? new Date('2099-12-31') : date; // Put unparseable dates at end
      };
      
      const dateA = parseEventDate(a.date || '');
      const dateB = parseEventDate(b.date || '');
      
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 8); // Show first 8 chronologically sorted events
  
  console.log('Today\'s events:', todaysEvents);
  console.log('Upcoming events:', upcomingEvents);
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Side - Events */}
          <div className="lg:col-span-2 space-y-8">
            {/* Today's Events */}
            <section>
              {todaysEvents.length > 0 ? (
                <div className="space-y-4">
                  {isLoadingVenueEvents && (
                    <div className="animate-pulse space-y-4">
                      <div className="bulletin-card h-32 bg-muted/50 rounded-lg" />
                    </div>
                  )}
                  {todaysEvents.map(event => <EventCard key={event.id} event={event} />)}
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

            {/* Today's Menus */}
            <TodaysMenus />

            {/* Coming Up Soon */}
            <section>
              <h2 className="community-heading text-3xl sm:text-4xl text-foreground mb-6">
                Coming Up Soon
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {isLoadingVenueEvents && (
                  <>
                    <div className="animate-pulse bulletin-card h-32 bg-muted/50 rounded-lg" />
                    <div className="animate-pulse bulletin-card h-32 bg-muted/50 rounded-lg" />
                  </>
                )}
                {upcomingEvents.map(event => <EventCard key={event.id} event={event} compact />)}
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
          </div>

          {/* Right Side - My Plan (Desktop only) */}
          <div className="hidden lg:block">
            <MyPlanSidebar />
          </div>
        </div>

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