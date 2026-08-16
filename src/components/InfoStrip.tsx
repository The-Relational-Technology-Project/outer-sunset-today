import { Card } from "@/components/ui/card";
import { useWeather } from "@/hooks/useWeather";
import { useBestBlueDay } from "@/hooks/useBestBlueDay";
import { useTodaysMenus } from "@/hooks/useDailyMenus";
import { useSchoolLunch } from "@/hooks/useSchoolLunch";
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Pizza, Utensils, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const getWeatherIcon = (forecast: string) => {
  const lower = forecast.toLowerCase();
  if (lower.includes('rain') || lower.includes('shower')) return <CloudRain className="h-4 w-4 text-primary" />;
  if (lower.includes('snow')) return <CloudSnow className="h-4 w-4 text-primary" />;
  if (lower.includes('cloud') || lower.includes('overcast')) return <Cloud className="h-4 w-4 text-primary" />;
  if (lower.includes('wind')) return <Wind className="h-4 w-4 text-primary" />;
  return <Sun className="h-4 w-4 text-primary" />;
};

const weekdayLabel = (dateStr: string) =>
  new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' });

export const InfoStrip = () => {
  const { data: weather, isLoading: isLoadingWeather } = useWeather();
  const { data: isBestBlueDay } = useBestBlueDay();
  const { data: menus, isLoading: isLoadingMenus } = useTodaysMenus();
  const { data: lunch, isLoading: isLoadingLunch } = useSchoolLunch();

  const arizmendi = menus?.find(menu =>
    menu.restaurant.toLowerCase().includes('arizmendi')
  );


  return (
    <Card className="bg-paper border-cork shadow-bulletin">
      <div className="flex flex-col sm:flex-row sm:items-center sm:divide-x sm:divide-cork">
        {/* Weather */}
        <div className="flex items-center gap-2 px-4 py-3 min-w-0">
          {isLoadingWeather ? (
            <Skeleton className="h-4 w-32" />
          ) : weather ? (
            <>
              {getWeatherIcon(weather.shortForecast)}
              <span className="text-sm font-bulletin font-bold text-foreground whitespace-nowrap">
                {weather.highTemp}°/{weather.lowTemp}°
              </span>
              <span className="text-xs text-muted-foreground font-handwritten truncate">
                {weather.shortForecast}
              </span>
              {isBestBlueDay && (
                <a
                  href="https://sfsunset.today/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-primary font-bulletin whitespace-nowrap flex items-center gap-0.5 hover:underline"
                >
                  Best Blue!
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </>
          ) : null}
        </div>

        {/* School Lunch */}
        <div className="flex items-center gap-2 px-4 py-3 min-w-0">
          <Utensils className="h-4 w-4 text-primary flex-shrink-0" />
          {isLoadingLunch ? (
            <Skeleton className="h-4 w-40" />
          ) : (
            <span className="text-xs text-muted-foreground font-handwritten truncate">
              School Lunch{lunch && !lunch.isToday ? ` (${weekdayLabel(lunch.menu_date)})` : ''}:{' '}
              {lunch?.special_item || "No lunch listed"}
            </span>
          )}
        </div>

        {/* Arizmendi */}
        <div className="flex items-center gap-2 px-4 py-3 min-w-0">
          <Pizza className="h-4 w-4 text-primary flex-shrink-0" />
          {isLoadingMenus ? (
            <Skeleton className="h-4 w-28" />
          ) : (
            <span className="text-xs text-muted-foreground font-handwritten truncate">
              Arizmendi: {arizmendi?.special_item || "No pizza today"}
            </span>
          )}
        </div>

      </div>
    </Card>
  );
};
