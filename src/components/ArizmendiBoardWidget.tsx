import { Card, CardContent } from "@/components/ui/card";
import { useTodaysMenus } from "@/hooks/useDailyMenus";
import { Skeleton } from "@/components/ui/skeleton";

const ArizmendiBoardWidget = () => {
  const { data: menus, isLoading } = useTodaysMenus();
  
  const arizmendi = menus?.find(menu => 
    menu.restaurant.toLowerCase().includes('arizmendi')
  );

  if (isLoading) {
    return (
      <Card className="bg-paper border-cork shadow-bulletin transform rotate-[-0.5deg] w-fit mx-auto">
        <CardContent className="p-3">
          <div className="flex items-center mb-1">
            <span className="text-sm">🍕</span>
            <h3 className="text-sm font-bold text-foreground ml-2 font-bulletin">
              Arizmendi Today
            </h3>
          </div>
          <Skeleton className="h-12 w-64" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-paper border-cork shadow-bulletin transform rotate-[-0.5deg] w-fit mx-auto">
      <CardContent className="p-3">
        <div className="flex items-center mb-1">
          <span className="text-sm">🍕</span>
          <h3 className="text-sm font-bold text-foreground ml-2 font-bulletin">
            Arizmendi Today
          </h3>
        </div>
        <p className="text-xs text-muted-foreground font-handwritten leading-relaxed max-w-64">
          {arizmendi?.special_item || "No pizza today"}
        </p>
      </CardContent>
    </Card>
  );
};

export default ArizmendiBoardWidget;