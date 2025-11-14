// Deno Edge Function: submit-event
// Inserts a pending event and links submitter email securely, bypassing client RLS limitations
// CORS + minimal validation included

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { title, location, event_date, start_time, description, event_type, submitter_email } = await req.json();
    console.log("submit-event payload:", { title, location, event_date, start_time, event_type });

    // Basic server-side validation
    if (
      !title || !location || !event_date || !start_time || !event_type || !submitter_email
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Insert event with pending status (default)
    const { data: eventRows, error: eventError } = await supabase
      .from("events")
      .insert({
        title,
        location,
        event_date,
        start_time,
        description: description ?? null,
        event_type,
      })
      .select("id")
      .limit(1);

    if (eventError) {
      return new Response(JSON.stringify({ error: eventError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const eventId = eventRows?.[0]?.id as string | undefined;

    // Link submitter email if we have the id
    if (eventId) {
      const { error: submissionError } = await supabase
        .from("event_submissions")
        .insert({ event_id: eventId, submitter_email });

      if (submissionError) {
        return new Response(JSON.stringify({ error: submissionError.message }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    console.log("submit-event created eventId:", eventId);
    
    // Send notification email in background (don't await)
    if (eventId) {
      supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'event',
          data: {
            title,
            location,
            event_date,
            start_time,
            description,
            event_type,
            submitter_email,
          },
        },
      }).catch(err => console.error('Failed to send notification:', err));
    }
    
    return new Response(JSON.stringify({ success: true, eventId }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});