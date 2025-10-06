import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-3 sm:py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="/favicon.png" 
              alt="Outer Sunset Today logo" 
              className="h-12 w-12 sm:h-14 sm:w-14 object-contain bg-card rounded-lg p-1"
            />
            <div className="hidden sm:flex flex-col items-start">
              <div className="text-3xl sm:text-4xl font-bold text-foreground font-bulletin leading-tight">
                outer sunset today
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground font-handwritten">
                what's going on
              </div>
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            {/* Submit an Event - All Screens */}
            <Button size="sm" asChild className="rounded-full bg-sunset-orange hover:bg-sunset-orange/90 text-white shadow-md px-4">
              <Link to="/submit">
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden xs:inline">Submit an Event</span>
                <span className="xs:hidden">Submit</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}