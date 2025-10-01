import React from "react";
import { Header } from "@/components/Header";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useMyPlan } from "@/contexts/MyPlanContext";
import { TodaysMenus } from "@/components/TodaysMenus";
import { MyPlanSidebar } from "@/components/MyPlanSidebar";
import { useTodaysEvents, useUpcomingEvents, formatEventForCard } from "@/hooks/useEvents";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { planEvents } = useMyPlan();
  
  // Fetch events from database
  const { data: todaysEventsData = [], isLoading: isLoadingToday } = useTodaysEvents();
  const { data: upcomingEventsData = [], isLoading: isLoadingUpcoming } = useUpcomingEvents();
  
  // Format events for display
  const todaysEvents = todaysEventsData.map(formatEventForCard);
  const upcomingEvents = upcomingEventsData.map(formatEventForCard).slice(0, 8);
  
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
              {isLoadingToday ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <Skeleton className="h-4 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : todaysEvents.length > 0 ? (
                <div className="space-y-4">
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
                {isLoadingUpcoming ? (
                  <>
                    <div className="animate-pulse bulletin-card h-32 bg-muted/50 rounded-lg" />
                    <div className="animate-pulse bulletin-card h-32 bg-muted/50 rounded-lg" />
                  </>
                ) : (
                  upcomingEvents.map(event => <EventCard key={event.id} event={event} compact />)
                )}
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
            Made in the Sunset – by us, for us 🧡
          </p>
          <p className="text-muted-foreground mb-4">
            Contact:{" "}
            <a 
              href="mailto:hello@relationaltechproject.org" 
              className="text-primary hover:underline"
            >
              hello@relationaltechproject.org
            </a>
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 text-sm mb-4">
            <a 
              href="https://relationaltechproject.org/remix" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Remix this site for your neighborhood!
            </a>
            <Link to="/privacy-terms" className="text-primary hover:underline">
              Privacy and Terms
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;