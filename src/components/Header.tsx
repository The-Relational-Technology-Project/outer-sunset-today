import { Button } from "@/components/ui/button";
import { Calendar, Plus, Bookmark } from "lucide-react";
import { Link } from "react-router-dom";
import { useMyPlan } from "@/contexts/MyPlanContext";

export function Header() {
  const { planEvents } = useMyPlan();
  return (
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="/favicon.png" 
              alt="Outer Sunset Today logo" 
              className="h-12 w-12 sm:h-14 sm:w-14 object-contain bg-card rounded-lg p-1"
            />
            <div className="flex flex-col items-start">
              <div className="text-3xl sm:text-4xl font-bold text-foreground font-bulletin leading-tight">
                outer sunset today
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground font-handwritten">
                what's going on
              </div>
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            {/* My Plan - Mobile Only */}
            <Button size="sm" asChild className="lg:hidden sticker-button bg-coral hover:bg-coral/90 text-coral-foreground">
              <Link to="/my-plan">
                <Bookmark className="h-4 w-4" />
                <span className="hidden xs:inline ml-1">My Plan</span>
              </Link>
            </Button>
            
            {/* Submit an Event - Desktop Only */}
            <Button size="sm" asChild className="hidden lg:inline-flex rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md px-4">
              <Link to="/submit">
                <Plus className="h-4 w-4 mr-1" />
                Submit an Event
              </Link>
            </Button>
            
            {/* Submit - Mobile Only */}
            <Button variant="outline" size="sm" asChild className="lg:hidden">
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