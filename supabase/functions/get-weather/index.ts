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

    // Get today's date for tide API
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    // Fetch weather and tides in parallel
    const [forecastResponse, tidesResponse] = await Promise.all([
      fetch(forecastUrl, {
        headers: {
          'User-Agent': '(OuterSunsetToday.com, hello@relationaltechproject.org)',
        },
      }),
      fetch(
        `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&station=9414275&datum=MLLW&time_zone=lst_ldt&units=english&format=json&interval=hilo&begin_date=${dateStr}&end_date=${dateStr}`,
        {
          headers: {
            'User-Agent': '(OuterSunsetToday.com, hello@relationaltechproject.org)',
          },
        }
      ),
    ]);

    if (!forecastResponse.ok) {
      throw new Error(`Failed to get forecast: ${forecastResponse.status}`);
    }

    const forecastData = await forecastResponse.json();
    const periods = forecastData.properties.periods;

    // Get today's forecast (first period)
    const todayForecast = periods[0];
    
    // Try to find tonight's forecast for low temp
    const tonight = periods.find((p: any) => p.isDaytime === false) || periods[1];

    // Parse tide data
    let tides: Array<{ time: string; type: 'H' | 'L'; height: string }> = [];
    
    if (tidesResponse.ok) {
      const tidesData = await tidesResponse.json();
      console.log('Raw tide data:', tidesData);
      
      if (tidesData.predictions && Array.isArray(tidesData.predictions)) {
        // Filter tides between 6am and 8pm
        tides = tidesData.predictions
          .filter((prediction: any) => {
            const time = prediction.t.split(' ')[1];
            const [hours] = time.split(':').map(Number);
            return hours >= 6 && hours < 20;
          })
          .map((prediction: any) => {
            const time = prediction.t.split(' ')[1];
            const [hours, minutes] = time.split(':').map(Number);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
            const formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
            
            return {
              time: formattedTime,
              type: prediction.type as 'H' | 'L',
              height: parseFloat(prediction.v).toFixed(1),
            };
          });
      }
    } else {
      console.error('Failed to fetch tides:', tidesResponse.status);
    }

    const weather = {
      temperature: todayForecast.temperature,
      temperatureUnit: todayForecast.temperatureUnit,
      shortForecast: todayForecast.shortForecast,
      detailedForecast: todayForecast.detailedForecast,
      icon: todayForecast.icon,
      lowTemp: tonight.temperature,
      highTemp: todayForecast.temperature,
      tides,
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
