import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { isLikelyDuplicate, titleSimilarity, backfillFields, canonicalVenue } from "../_shared/event-identity.ts";


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
    const { action, eventId, password, flyerId, updates, keepId, removeId } = requestBody;

    
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
    } else if (action === 'find-duplicates') {
      // Scan upcoming, non-archived events for likely duplicate pairs.
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date());

      const { data: events, error } = await supabase
        .from('events')
        .select('id, title, location, event_date, start_time, end_time, description, source_url, event_type, status, created_at')
        .gte('event_date', today)
        .eq('archived', false)
        .order('event_date', { ascending: true });

      if (error) throw error;

      const pairs: any[] = [];
      const list = events || [];
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          if (a.event_date !== b.event_date) continue;
          if (!isLikelyDuplicate(a, b)) continue;
          pairs.push({
            venue: canonicalVenue(a.location),
            similarity: Math.round(titleSimilarity(a.title, b.title, a.location, b.location) * 100),
            a,
            b,
          });
        }
      }

      console.log(`find-duplicates: ${pairs.length} suspected pair(s) across ${list.length} upcoming events`);
      result = { pairs, scanned: list.length };
    } else if (action === 'merge-duplicates') {
      if (!keepId || !removeId) {
        return new Response(
          JSON.stringify({ error: 'keepId and removeId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: rows, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .in('id', [keepId, removeId]);

      if (fetchError) throw fetchError;

      const keep = rows?.find((r) => r.id === keepId);
      const remove = rows?.find((r) => r.id === removeId);
      if (!keep || !remove) throw new Error('Both events must exist');

      const patch = backfillFields(keep, remove);
      if (Object.keys(patch).length > 0) {
        await supabase.from('events').update(patch).eq('id', keepId);
      }

      // Clear FK references before deleting the duplicate row.
      await supabase.from('event_submissions').delete().eq('event_id', removeId);
      await supabase.from('flyer_submissions').update({ event_id: null }).eq('event_id', removeId);

      const { error: deleteError } = await supabase.from('events').delete().eq('id', removeId);

      if (deleteError) throw deleteError;

      console.log(`Merged event ${removeId} into ${keepId}`, patch);
      result = { merged: true, keepId, removeId, patch };
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
