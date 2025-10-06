import { Card, CardContent } from "@/components/ui/card";
import { useWeather } from "@/hooks/useWeather";
import { useBestBlueDay } from "@/hooks/useBestBlueDay";
import { Cloud, CloudRain, Sun, CloudSnow, Wind, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const getWeatherIcon = (forecast: string) => {
  const lower = forecast.toLowerCase();
  if (lower.includes('rain') || lower.includes('shower')) {
    return <CloudRain className="h-5 w-5" />;
  }
  if (lower.includes('snow')) {
    return <CloudSnow className="h-5 w-5" />;
  }
  if (lower.includes('cloud') || lower.includes('overcast')) {
    return <Cloud className="h-5 w-5" />;
  }
  if (lower.includes('wind')) {
    return <Wind className="h-5 w-5" />;
  }
  return <Sun className="h-5 w-5" />;
};

export const WeatherWidget = () => {
  const { data: weather, isLoading } = useWeather();
  const { data: isBestBlueDay, isLoading: isLoadingBlueDay } = useBestBlueDay();

  if (isLoading) {
    return (
      <Card className="bg-paper border-cork shadow-bulletin transform rotate-[0.5deg]">
        <CardContent className="p-4">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!weather) return null;

  return (
    <Card className="bg-paper border-cork shadow-bulletin transform rotate-[0.5deg]">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-primary mt-1">
            {getWeatherIcon(weather.shortForecast)}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-foreground mb-1 font-bulletin">
              Today's Weather
            </h3>
            <p className="text-xs text-muted-foreground font-handwritten mb-1">
              High: {weather.highTemp}° / Low: {weather.lowTemp}°
            </p>
            <p className="text-xs text-muted-foreground font-handwritten">
              {weather.shortForecast}
            </p>
            {isBestBlueDay && !isLoadingBlueDay && (
              <div className="mt-2 pt-2 border-t border-cork">
                <p className="text-xs font-bold text-primary font-bulletin flex items-center gap-1">
                  Best Blue Score!
                  <a 
                    href="https://sfsunset.today/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-0.5"
                  >
                    (more info)
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
