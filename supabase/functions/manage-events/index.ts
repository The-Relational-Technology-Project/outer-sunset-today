import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { action, eventId, password, flyerId, updates } = requestBody;
    
    // Verify admin password
    const adminPassword = Deno.env.get('ADMIN_PASSWORD');
    if (!adminPassword || password !== adminPassword) {
      console.error('Invalid password attempt');
      return new Response(
        JSON.stringify({ error: 'Invalid password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let result;

    if (action === 'list') {
      // Get all pending, non-archived submissions
      const { data: events, error } = await supabase
        .from('events')
        .select('*, event_submissions(submitter_email)')
        .eq('status', 'pending')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get non-archived flyer submissions
      const { data: flyers, error: flyersError } = await supabase
        .from('flyer_submissions')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (flyersError) console.error('Error fetching flyers:', flyersError);

      // Generate signed URLs for flyer images
      const flyersWithUrls = await Promise.all(
        (flyers || []).map(async (flyer) => {
          try {
            const { data: signedUrlData } = await supabase.storage
              .from('event-flyers')
              .createSignedUrl(flyer.storage_path, 3600);
            
            return {
              ...flyer,
              imageUrl: signedUrlData?.signedUrl || null
            };
          } catch (error) {
            console.error('Error generating signed URL for flyer:', flyer.id, error);
            return { ...flyer, imageUrl: null };
          }
        })
      );

      // Get contact submissions
      const { data: contacts, error: contactsError } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (contactsError) console.error('Error fetching contacts:', contactsError);

      result = { events, flyers: flyersWithUrls, contacts: contacts || [] };
    } else if (action === 'approve' || action === 'reject') {
      // Update event status only (don't auto-archive)
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      
      const { data, error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;

      console.log(`Event ${eventId} ${action}ed successfully`);
      result = { event: data };
    } else if (action === 'archive-event') {
      // Archive event without changing status
      const { data, error } = await supabase
        .from('events')
        .update({ archived: true })
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;

      console.log(`Event ${eventId} archived successfully`);
      result = { event: data };
    } else if (action === 'archive-flyer') {
      // Archive flyer submission
      const { data, error } = await supabase
        .from('flyer_submissions')
        .update({ archived: true })
        .eq('id', flyerId)
        .select()
        .single();

      if (error) throw error;

      console.log(`Flyer ${flyerId} archived successfully`);
      result = { flyer: data };
    } else if (action === 'update-event') {
      // Update event fields
      if (!updates || typeof updates !== 'object') {
        return new Response(
          JSON.stringify({ error: 'Updates object required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;

      console.log(`Event ${eventId} updated successfully:`, updates);
      result = { event: data };
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in manage-events function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
