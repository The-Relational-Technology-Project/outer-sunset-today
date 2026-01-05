import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { menus } = await req.json();
    
    if (!menus || !Array.isArray(menus)) {
      return new Response(
        JSON.stringify({ error: 'menus array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = { inserted: 0, updated: 0, errors: [] as string[] };

    for (const menu of menus) {
      try {
        // Check if exists
        const { data: existing } = await supabase
          .from('daily_menus')
          .select('id')
          .eq('restaurant', menu.restaurant)
          .eq('menu_date', menu.menu_date)
          .maybeSingle();

        if (existing) {
          // Update
          const { error } = await supabase
            .from('daily_menus')
            .update({ special_item: menu.special_item, hours: menu.hours })
            .eq('id', existing.id);
          
          if (error) throw error;
          results.updated++;
        } else {
          // Insert
          const { error } = await supabase
            .from('daily_menus')
            .insert(menu);
          
          if (error) throw error;
          results.inserted++;
        }
      } catch (error) {
        results.errors.push(`${menu.menu_date}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('Menu import results:', results);
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
