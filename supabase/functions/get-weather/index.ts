import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Outer Sunset SF coordinates (west side of 94122)
    const lat = 37.7599;
    const lon = -122.5065;

    console.log('Fetching weather for Outer Sunset SF:', { lat, lon });

    // Get grid point
    const pointResponse = await fetch(
      `https://api.weather.gov/points/${lat},${lon}`,
      {
        headers: {
          'User-Agent': '(OuterSunsetToday.com, hello@relationaltechproject.org)',
        },
      }
    );

    if (!pointResponse.ok) {
      throw new Error(`Failed to get grid point: ${pointResponse.status}`);
    }

    const pointData = await pointResponse.json();
    const forecastUrl = pointData.properties.forecast;

    console.log('Fetching forecast from:', forecastUrl);

    // Get forecast
    const forecastResponse = await fetch(forecastUrl, {
      headers: {
        'User-Agent': '(OuterSunsetToday.com, hello@relationaltechproject.org)',
      },
    });

    if (!forecastResponse.ok) {
      throw new Error(`Failed to get forecast: ${forecastResponse.status}`);
    }

    const forecastData = await forecastResponse.json();
    const periods = forecastData.properties.periods;

    // Get today's forecast (first period)
    const today = periods[0];
    
    // Try to find tonight's forecast for low temp
    const tonight = periods.find((p: any) => p.isDaytime === false) || periods[1];

    const weather = {
      temperature: today.temperature,
      temperatureUnit: today.temperatureUnit,
      shortForecast: today.shortForecast,
      detailedForecast: today.detailedForecast,
      icon: today.icon,
      lowTemp: tonight.temperature,
      highTemp: today.temperature,
    };

    console.log('Weather data:', weather);

    return new Response(JSON.stringify(weather), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching weather:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
