import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-foreground">
              Outer Sunset Today
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Today
            </Link>
            <Link to="/calendar" className="text-foreground hover:text-primary transition-colors">
              Calendar
            </Link>
            <Link to="/about" className="text-foreground hover:text-primary transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <Link to="/calendar">
                <Calendar className="h-4 w-4 mr-1" />
                View Full Calendar
              </Link>
            </Button>
            <Button size="sm" asChild className="bg-coral hover:bg-coral/90 text-coral-foreground">
              <Link to="/submit">
                <Plus className="h-4 w-4 mr-1" />
                Submit Event
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}