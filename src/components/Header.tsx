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
          <Link to="/" className="flex flex-col items-start">
            <div className="text-2xl sm:text-4xl font-bold text-foreground font-bulletin">
              outer sunset today
            </div>
            <div className="text-sm text-muted-foreground font-handwritten">
              what's going on
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/calendar" className="text-foreground hover:text-primary transition-colors text-lg">
              Calendar
            </Link>
            <Link to="/about" className="text-foreground hover:text-primary transition-colors text-lg">
              About
            </Link>
          </nav>

          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Mobile: Show My Plan button prominently */}
            <Button size="sm" asChild className="sticker-button bg-coral hover:bg-coral/90 text-coral-foreground md:hidden">
              <Link to="/my-plan">
                <Bookmark className="h-4 w-4 mr-1" />
                My Plan
              </Link>
            </Button>
            
            {/* Desktop: Show all buttons */}
            <Button variant="outline" size="sm" asChild className="hidden md:flex">
              <Link to="/calendar">
                <Calendar className="h-4 w-4 mr-1" />
                Calendar
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/submit">
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Submit Event</span>
                <span className="sm:hidden">Submit</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}