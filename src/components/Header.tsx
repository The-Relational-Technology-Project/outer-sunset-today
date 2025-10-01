import { Button } from "@/components/ui/button";
import { Calendar, Plus, Bookmark } from "lucide-react";
import { Link } from "react-router-dom";
import { useMyPlan } from "@/contexts/MyPlanContext";

export function Header() {
  const { planEvents } = useMyPlan();
  return (
    <header className="bg-[hsl(var(--ocean-blue))] border-b border-border/20">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="/favicon.png" 
              alt="Outer Sunset Today logo" 
              className="h-12 w-12 sm:h-14 sm:w-14 object-contain"
            />
            <div className="flex flex-col items-start">
              <div className="text-3xl sm:text-4xl font-bold text-white font-bulletin leading-tight">
                outer sunset today
              </div>
              <div className="text-xs sm:text-sm text-white/80 font-handwritten">
                what's going on
              </div>
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            {/* My Plan - Mobile Only */}
            <Button size="sm" asChild className="lg:hidden rounded-full bg-white hover:bg-white/90 text-[hsl(var(--ocean-blue))] shadow-md">
              <Link to="/my-plan">
                <Bookmark className="h-4 w-4" />
                <span className="hidden xs:inline ml-1">My Plan</span>
              </Link>
            </Button>
            
            {/* Submit an Event - Desktop Only */}
            <Button size="sm" asChild className="hidden lg:inline-flex rounded-full bg-white hover:bg-white/90 text-[hsl(var(--ocean-blue))] shadow-md px-4 font-semibold">
              <Link to="/submit">
                <Plus className="h-4 w-4 mr-1" />
                Submit an Event
              </Link>
            </Button>
            
            {/* Submit - Mobile Only */}
            <Button variant="outline" size="sm" asChild className="lg:hidden border-white/30 text-white hover:bg-white/10">
              <Link to="/submit">
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline ml-1">Submit</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}