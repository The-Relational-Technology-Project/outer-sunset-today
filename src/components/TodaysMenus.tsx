import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin } from "lucide-react";

interface MenuItem {
  restaurant: string;
  location: string;
  hours: string;
  specialToday: string;
  category: string;
  price?: string;
}

const todaysMenus: MenuItem[] = [
  {
    restaurant: "Arizmendi Bakery",
    location: "1331 9th Ave",
    hours: "7am-7pm",
    specialToday: "Pizza of the Day: Roasted Veggie & Goat Cheese",
    category: "pizza",
    price: "$4.50/slice"
  },
  {
    restaurant: "Day Moon Bakery",
    location: "1329 9th Ave", 
    hours: "7am-3pm",
    specialToday: "Fresh Sourdough & Seasonal Fruit Tarts",
    category: "bakery"
  },
  {
    restaurant: "Braid Bakery",
    location: "1438 Irving St",
    hours: "8am-4pm", 
    specialToday: "Cardamom Buns & House-Made Granola",
    category: "bakery"
  },
  {
    restaurant: "Outerlands",
    location: "4001 Judah St",
    hours: "9am-9pm",
    specialToday: "Dutch Baby Pancake & Local Dungeness Crab Toast",
    category: "restaurant",
    price: "$18-28"
  }
];

const categoryColors: Record<string, string> = {
  pizza: "bg-coral/20 text-coral-foreground border-coral/30",
  bakery: "bg-sand/20 text-sand-foreground border-sand/30", 
  restaurant: "bg-ocean/20 text-ocean-foreground border-ocean/30"
};

export function TodaysMenus() {
  return (
    <section className="py-8">
      <h2 className="community-heading text-3xl sm:text-4xl text-foreground mb-6">
        Today's Menus
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {todaysMenus.map((menu, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
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
                {menu.specialToday}
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