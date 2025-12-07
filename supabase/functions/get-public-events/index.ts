import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_VERSION = '0.1';
const PUBLISHER = 'outersunset.today';
const NEIGHBORHOOD = 'Outer Sunset, San Francisco';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse query parameters
    const eventId = url.searchParams.get('id');
    const startAfter = url.searchParams.get('start_after');
    const startBefore = url.searchParams.get('start_before');
    const searchQuery = url.searchParams.get('q');
    const category = url.searchParams.get('category');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const includeWeather = url.searchParams.get('include')?.includes('weather');

    console.log('Public events API request:', {
      eventId,
      startAfter,
      startBefore,
      searchQuery,
      category,
      limit,
      includeWeather,
    });

    // Build meta object
    const meta = {
      api_version: API_VERSION,
      publisher: PUBLISHER,
      steward: {
        name: 'Relational Tech Project',
        contact: 'hello@relationaltechproject.org',
      },
      neighborhood: NEIGHBORHOOD,
      license: 'CC BY 4.0',
      updated_at: new Date().toISOString(),
    };

    // Single event lookup
    if (eventId) {
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('status', 'approved')
        .maybeSingle();

      if (error) {
        console.error('Error fetching event:', error);
        throw error;
      }

      if (!event) {
        return new Response(
          JSON.stringify({ error: 'Event not found', meta }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const transformedEvent = transformEvent(event);
      
      return new Response(
        JSON.stringify({ meta, event: transformedEvent }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query for events list
    let query = supabase
      .from('events')
      .select('*')
      .eq('status', 'approved')
      .order('start_time', { ascending: true })
      .limit(limit);

    // Apply filters
    if (startAfter) {
      query = query.gte('event_date', startAfter);
    } else {
      // Default: only future events (today onwards)
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('event_date', today);
    }

    if (startBefore) {
      query = query.lte('event_date', startBefore);
    }

    if (category) {
      query = query.ilike('event_type', `%${category}%`);
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      throw error;
    }

    const transformedEvents = (events || []).map(transformEvent);

    // Build response
    const response: Record<string, unknown> = {
      meta,
      events: transformedEvents,
      count: transformedEvents.length,
    };

    // Track applied filters
    const filtersApplied: Record<string, string> = {};
    if (startAfter) filtersApplied.start_after = startAfter;
    if (startBefore) filtersApplied.start_before = startBefore;
    if (category) filtersApplied.category = category;
    if (searchQuery) filtersApplied.q = searchQuery;
    if (Object.keys(filtersApplied).length > 0) {
      response.filters_applied = filtersApplied;
    }

    // Optionally include weather
    if (includeWeather) {
      try {
        const weatherData = await fetchWeather();
        response.weather = weatherData;
      } catch (weatherError) {
        console.error('Error fetching weather:', weatherError);
        response.weather = null;
        response.weather_error = 'Weather data temporarily unavailable';
      }
    }

    console.log(`Returning ${transformedEvents.length} events`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-public-events:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Transform database event to Neighborhood API schema
function transformEvent(event: {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  description: string | null;
  event_type: string;
  location: string;
  created_at: string;
}) {
  return {
    id: event.id,
    name: event.title,
    start: event.start_time,
    end: event.end_time,
    description: event.description,
    category: [event.event_type.toLowerCase()],
    location: {
      name: event.location,
      neighborhood: NEIGHBORHOOD,
    },
    url: 'https://outersunset.today/calendar',
    source: {
      publisher: PUBLISHER,
      collected_at: event.created_at,
      license: 'CC BY 4.0',
    },
  };
}

// Fetch weather data (reusing existing weather logic)
async function fetchWeather() {
  const lat = 37.7599;
  const lon = -122.5065;
  
  // Fetch NWS grid point
  const pointsResponse = await fetch(
    `https://api.weather.gov/points/${lat},${lon}`,
    { headers: { 'User-Agent': 'outersunset.today' } }
  );
  
  if (!pointsResponse.ok) {
    throw new Error('Failed to fetch weather grid point');
  }
  
  const pointsData = await pointsResponse.json();
  const forecastUrl = pointsData.properties.forecast;
  
  // Fetch forecast
  const forecastResponse = await fetch(forecastUrl, {
    headers: { 'User-Agent': 'outersunset.today' }
  });
  
  if (!forecastResponse.ok) {
    throw new Error('Failed to fetch forecast');
  }
  
  const forecastData = await forecastResponse.json();
  const currentPeriod = forecastData.properties.periods[0];
  
  return {
    temperature: currentPeriod.temperature,
    temperature_unit: currentPeriod.temperatureUnit,
    short_forecast: currentPeriod.shortForecast,
    detailed_forecast: currentPeriod.detailedForecast,
  };
}
