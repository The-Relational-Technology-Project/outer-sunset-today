import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTodaysMenus } from "@/hooks/useDailyMenus";

const categoryColors: Record<string, string> = {
  pizza: "bg-coral/20 text-coral-foreground border-coral/30",
  bakery: "bg-sand/20 text-sand-foreground border-sand/30", 
  restaurant: "bg-ocean/20 text-ocean-foreground border-ocean/30"
};

export function TodaysMenus() {
  const { data: menus, isLoading } = useTodaysMenus();

  if (isLoading) {
    return (
      <section className="py-8">
        <h2 className="community-heading text-3xl sm:text-4xl text-foreground mb-6">
          Today's Menus
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (!menus || menus.length === 0) {
    return (
      <section className="py-8">
        <h2 className="community-heading text-3xl sm:text-4xl text-foreground mb-6">
          Today's Menus
        </h2>
        <p className="text-muted-foreground">No menu specials available for today.</p>
      </section>
    );
  }

  return (
    <section className="py-8">
      <h2 className="community-heading text-3xl sm:text-4xl text-foreground mb-6">
        Today's Menus
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {menus.map((menu) => (
          <Card key={menu.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {menu.restaurant}
                  </CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {menu.location}
                  </div>
                </div>
                <Badge variant="outline" className={categoryColors[menu.category]}>
                  {menu.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-foreground font-medium mb-2">
                {menu.special_item}
              </p>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {menu.hours}
                </div>
                {menu.price && (
                  <span className="font-medium text-foreground">
                    {menu.price}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}