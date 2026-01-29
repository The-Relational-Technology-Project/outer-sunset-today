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
}

interface MenuInput {
  restaurant: string;
  location: string;
  menu_date: string;
  special_item: string;
  category: string;
  price?: string;
  hours: string;
}

interface ImportRequest {
  api_key: string;
  events?: EventInput[];
  menus?: MenuInput[];
}

// Normalize location names to ensure consistency
function normalizeLocation(location: string): string {
  const normalizations: Record<string, string> = {
    'Sealevel Studio': 'Sealevel',
    'sealevel studio': 'Sealevel',
    'SEALEVEL STUDIO': 'Sealevel',
  };
  
  // Check for exact matches first
  if (normalizations[location]) {
    return normalizations[location];
  }
  
  // Check for case-insensitive partial matches
  const lowerLocation = location.toLowerCase();
  if (lowerLocation.includes('sealevel studio')) {
    return location.replace(/sealevel studio/gi, 'Sealevel');
  }
  
  return location;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { api_key, events = [], menus = [] }: ImportRequest = await req.json();
    
    // Validate API key
    const validApiKey = Deno.env.get('IMPORT_API_KEY');
    if (!validApiKey || api_key !== validApiKey) {
      console.error('Invalid API key provided');
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Bulk import request: ${events.length} events, ${menus.length} menus`);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = {
      events: {
        inserted: 0,
        skipped: 0,
        errors: [] as string[],
        details: [] as { title: string; status: string; id?: string; reason?: string }[]
      },
      menus: {
        inserted: 0,
        updated: 0,
        errors: [] as string[],
        details: [] as { restaurant: string; menu_date: string; status: string; reason?: string }[]
      }
    };

    // Process events
    for (const event of events) {
      try {
        // Validate required fields
        if (!event.title || !event.location || !event.event_date || !event.start_time || !event.event_type) {
          results.events.errors.push(`Missing required fields for event: ${event.title || 'unknown'}`);
          results.events.details.push({ title: event.title || 'unknown', status: 'error', reason: 'missing required fields' });
          continue;
        }

        // Normalize location name
        const normalizedLocation = normalizeLocation(event.location);

        // Check for duplicates (same title + date + location)
        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('title', event.title)
          .eq('event_date', event.event_date)
          .eq('location', normalizedLocation)
          .maybeSingle();

        if (existing) {
          results.events.skipped++;
          results.events.details.push({ title: event.title, status: 'skipped', reason: 'duplicate' });
          console.log(`Skipped duplicate event: ${event.title} on ${event.event_date}`);
          continue;
        }

        // Parse times and create timestamps
        const eventDate = event.event_date;
        const startTime = `${eventDate}T${event.start_time}:00-08:00`;
        const endTime = event.end_time ? `${eventDate}T${event.end_time}:00-08:00` : null;

        // Insert event with auto-approved status
        const { data: inserted, error: insertError } = await supabase
          .from('events')
          .insert({
            title: event.title,
            location: normalizedLocation,
            event_date: eventDate,
            start_time: startTime,
            end_time: endTime,
            description: event.description || null,
            event_type: event.event_type,
            status: 'approved', // Auto-approve from n8n
            archived: false
          })
          .select('id')
          .single();

        if (insertError) {
          results.events.errors.push(`Failed to insert ${event.title}: ${insertError.message}`);
          results.events.details.push({ title: event.title, status: 'error', reason: insertError.message });
          console.error(`Error inserting event ${event.title}:`, insertError);
        } else {
          results.events.inserted++;
          results.events.details.push({ title: event.title, status: 'inserted', id: inserted.id });
          console.log(`Inserted event: ${event.title} (${inserted.id})`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        results.events.errors.push(`Error processing ${event.title}: ${errorMessage}`);
        results.events.details.push({ title: event.title || 'unknown', status: 'error', reason: errorMessage });
      }
    }

    // Process menus
    for (const menu of menus) {
      try {
        // Validate required fields
        if (!menu.restaurant || !menu.location || !menu.menu_date || !menu.special_item || !menu.category || !menu.hours) {
          results.menus.errors.push(`Missing required fields for menu: ${menu.restaurant || 'unknown'}`);
          results.menus.details.push({ restaurant: menu.restaurant || 'unknown', menu_date: menu.menu_date || 'unknown', status: 'error', reason: 'missing required fields' });
          continue;
        }

        // Check if menu already exists for this restaurant + date
        const { data: existing } = await supabase
          .from('daily_menus')
          .select('id')
          .eq('restaurant', menu.restaurant)
          .eq('menu_date', menu.menu_date)
          .maybeSingle();

        if (existing) {
          // Update existing menu
          const { error: updateError } = await supabase
            .from('daily_menus')
            .update({
              location: menu.location,
              special_item: menu.special_item,
              category: menu.category,
              price: menu.price || null,
              hours: menu.hours
            })
            .eq('id', existing.id);

          if (updateError) {
            results.menus.errors.push(`Failed to update ${menu.restaurant} for ${menu.menu_date}: ${updateError.message}`);
            results.menus.details.push({ restaurant: menu.restaurant, menu_date: menu.menu_date, status: 'error', reason: updateError.message });
          } else {
            results.menus.updated++;
            results.menus.details.push({ restaurant: menu.restaurant, menu_date: menu.menu_date, status: 'updated' });
            console.log(`Updated menu: ${menu.restaurant} for ${menu.menu_date}`);
          }
        } else {
          // Insert new menu
          const { error: insertError } = await supabase
            .from('daily_menus')
            .insert({
              restaurant: menu.restaurant,
              location: menu.location,
              menu_date: menu.menu_date,
              special_item: menu.special_item,
              category: menu.category,
              price: menu.price || null,
              hours: menu.hours
            });

          if (insertError) {
            results.menus.errors.push(`Failed to insert ${menu.restaurant} for ${menu.menu_date}: ${insertError.message}`);
            results.menus.details.push({ restaurant: menu.restaurant, menu_date: menu.menu_date, status: 'error', reason: insertError.message });
          } else {
            results.menus.inserted++;
            results.menus.details.push({ restaurant: menu.restaurant, menu_date: menu.menu_date, status: 'inserted' });
            console.log(`Inserted menu: ${menu.restaurant} for ${menu.menu_date}`);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        results.menus.errors.push(`Error processing ${menu.restaurant}: ${errorMessage}`);
        results.menus.details.push({ restaurant: menu.restaurant || 'unknown', menu_date: menu.menu_date || 'unknown', status: 'error', reason: errorMessage });
      }
    }

    const success = results.events.errors.length === 0 && results.menus.errors.length === 0;
    
    console.log(`Bulk import complete. Events: ${results.events.inserted} inserted, ${results.events.skipped} skipped. Menus: ${results.menus.inserted} inserted, ${results.menus.updated} updated.`);

    return new Response(
      JSON.stringify({ success, ...results }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (err) {
    console.error('Bulk import error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
