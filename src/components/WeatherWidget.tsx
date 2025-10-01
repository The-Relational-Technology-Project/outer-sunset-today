import { Card, CardContent } from "@/components/ui/card";
import { useWeather } from "@/hooks/useWeather";
import { Cloud, CloudRain, Sun, CloudSnow, Wind } from "lucide-react";
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
