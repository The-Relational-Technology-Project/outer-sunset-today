import { Card, CardContent } from "@/components/ui/card";
import { useTodaysMenus } from "@/hooks/useDailyMenus";
import { Skeleton } from "@/components/ui/skeleton";
import { Pizza } from "lucide-react";

const ArizmendiBoardWidget = () => {
  const { data: menus, isLoading } = useTodaysMenus();
  
  const arizmendi = menus?.find(menu => 
    menu.restaurant.toLowerCase().includes('arizmendi')
  );

  if (isLoading) {
    return (
      <Card className="bg-paper border-cork shadow-bulletin transform rotate-[-0.5deg]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Pizza className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-paper border-cork shadow-bulletin transform rotate-[-0.5deg]">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Pizza className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground font-bulletin mb-1">
              Arizmendi Today
            </h3>
            <p className="text-xs text-muted-foreground font-handwritten leading-relaxed">
              {arizmendi?.special_item || "No pizza today"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ArizmendiBoardWidget;
