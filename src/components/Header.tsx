import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMyPlan } from "@/contexts/MyPlanContext";

export function Header() {
  const navigate = useNavigate();
  const { planEvents } = useMyPlan();

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
            {/* My Plan - desktop nav */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/my-plan")}
              className="hidden lg:inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <div className="relative">
                <Calendar className="h-4 w-4" />
                {planEvents.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-4 w-4 rounded-full bg-coral text-coral-foreground text-[10px] font-bold flex items-center justify-center">
                    {planEvents.length}
                  </span>
                )}
              </div>
              <span className="ml-1">My Plan</span>
            </Button>

            {/* Get Custom Updates */}
            <Button size="sm" asChild className="rounded-full bg-sunset-orange hover:bg-sunset-orange/90 text-white shadow-md px-4">
              <Link to="/updates">
                <Bell className="h-4 w-4 mr-1" />
                Get Custom Updates
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
