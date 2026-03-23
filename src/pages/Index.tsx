import React from "react";
import { Header } from "@/components/Header";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useMyPlan } from "@/contexts/MyPlanContext";
import { FloatingMyPlanButton } from "@/components/FloatingMyPlanButton";
import { useTodaysEvents, useUpcomingEvents, formatEventForCard } from "@/hooks/useEvents";
import { Skeleton } from "@/components/ui/skeleton";
import { WeatherWidget } from "@/components/WeatherWidget";
import ArizmendiBoardWidget from "@/components/ArizmendiBoardWidget";
import { TodaysNews } from "@/components/TodaysNews";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import { SiteFooter } from "@/components/SiteFooter";

const Index = () => {
  const { planEvents } = useMyPlan();
  
  const { data: todaysEventsData = [], isLoading: isLoadingToday } = useTodaysEvents();
  const { data: upcomingEventsData = [], isLoading: isLoadingUpcoming } = useUpcomingEvents();
  
  const todaysEvents = todaysEventsData.map(formatEventForCard);
  const upcomingEvents = upcomingEventsData.map(formatEventForCard).slice(0, 8);
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <FloatingMyPlanButton />
      
      <main className="container mx-auto px-4 py-6">
        <InfoStrip />

        {/* Today section: Events + News side by side */}
        <div className="grid gap-6 lg:grid-cols-2 mt-8">
          {/* Today's Events */}
          <section>
            <h2 className="community-heading text-2xl sm:text-3xl text-foreground mb-3">
              Today's Events
            </h2>
            {isLoadingToday ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i} className="bulletin-card">
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : todaysEvents.length > 0 ? (
              <div className="space-y-3">
                {todaysEvents.map(event => <EventCard key={event.id} event={event} />)}
              </div>
            ) : (
              <Card className="bulletin-card">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground mb-3 text-sm">
                    No events scheduled for today.
                  </p>
                  <Button asChild size="sm" className="bg-coral hover:bg-coral/90 text-coral-foreground">
                    <Link to="/submit">
                      <Plus className="h-4 w-4 mr-2" />
                      Submit an Event
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Today's News */}
          <section>
            <h2 className="community-heading text-2xl sm:text-3xl text-foreground mb-3">
              Today's News
            </h2>
            <TodaysNews />
          </section>
        </div>

        {/* Coming Up Soon — visually connected to events */}
        <section className="mt-6 pt-6 border-t border-border">
          <h2 className="community-heading text-xl sm:text-2xl text-muted-foreground mb-4">
            Coming Up Soon
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Newsletter */}
        <div className="flex justify-center mt-12 mb-0">
          <NewsletterSubscribe />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
