import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMyPlan } from "@/contexts/MyPlanContext";

export function FloatingMyPlanButton() {
  const navigate = useNavigate();
  const { planEvents } = useMyPlan();
  
  return (
    <Button
      onClick={() => navigate("/my-plan")}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-coral hover:bg-coral/90 text-coral-foreground z-50 lg:hidden"
      size="icon"
    >
      <div className="relative">
        <Calendar className="h-6 w-6" />
        {planEvents.length > 0 && (
          <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-background text-foreground text-xs font-bold flex items-center justify-center border-2 border-coral">
            {planEvents.length}
          </span>
        )}
      </div>
    </Button>
  );
}
