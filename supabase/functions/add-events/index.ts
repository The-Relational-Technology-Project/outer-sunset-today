import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventInput {
  title: string;
  location: string;
  event_date: string;
  start_time: string;
  end_time?: string;
  description?: string;
  event_type: string;
  status?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { events } = await req.json();
    
    if (!events || !Array.isArray(events)) {
      return new Response(
        JSON.stringify({ error: 'events array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = { inserted: 0, skipped: 0, errors: [] as string[] };

    for (const event of events as EventInput[]) {
      try {
        // Check for duplicates
        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('title', event.title)
          .eq('event_date', event.event_date)
          .eq('location', event.location)
          .maybeSingle();

        if (existing) {
          results.skipped++;
          console.log(`Skipped duplicate: ${event.title} on ${event.event_date}`);
          continue;
        }

        // Parse times
        const startTime = `${event.event_date}T${event.start_time}:00-08:00`;
        const endTime = event.end_time ? `${event.event_date}T${event.end_time}:00-08:00` : null;

        const { error } = await supabase
          .from('events')
          .insert({
            title: event.title,
            location: event.location,
            event_date: event.event_date,
            start_time: startTime,
            end_time: endTime,
            description: event.description || null,
            event_type: event.event_type,
            status: event.status || 'approved',
            archived: false
          });

        if (error) throw error;
        results.inserted++;
        console.log(`Inserted: ${event.title}`);
      } catch (error) {
        results.errors.push(`${event.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('Event import results:', results);
    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
