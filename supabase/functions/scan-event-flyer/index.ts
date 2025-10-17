import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submission_id } = await req.json();

    if (!submission_id) {
      return new Response(
        JSON.stringify({ error: 'Submission ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing flyer submission:', submission_id);

    // Get submission details
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('flyer_submissions')
      .select('*')
      .eq('id', submission_id)
      .single();

    if (fetchError || !submission) {
      return new Response(
        JSON.stringify({ error: 'Submission not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (submission.processed) {
      return new Response(
        JSON.stringify({ error: 'Submission already processed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download the image from storage
    const { data: imageData, error: downloadError } = await supabaseAdmin.storage
      .from('event-flyers')
      .download(submission.storage_path);

    if (downloadError || !imageData) {
      throw new Error('Failed to download image from storage');
    }

    // Convert blob to base64 (chunked to avoid stack overflow)
    const arrayBuffer = await imageData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let base64 = '';
    const chunkSize = 0x8000; // 32KB chunks
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      base64 += String.fromCharCode(...chunk);
    }
    base64 = btoa(base64);
    const mimeType = imageData.type || 'image/jpeg';
    const imageBase64 = `data:${mimeType};base64,${base64}`;

    console.log('Scanning event flyer with AI...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Call Lovable AI with vision to extract event details
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting event information from flyers and posters. Extract all relevant details accurately.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract the event details from this flyer. Provide the title, location (street address or venue name), date (in YYYY-MM-DD format), start time (in HH:MM format, 24-hour), end time if shown (in HH:MM format), description of what the event is about, and event type (choose from: community, arts, food, sports, education, family, music, or other).'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_event_details',
              description: 'Extract structured event information from a flyer',
              parameters: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'Event title or name' },
                  location: { type: 'string', description: 'Venue name or street address' },
                  event_date: { type: 'string', description: 'Event date in YYYY-MM-DD format' },
                  start_time: { type: 'string', description: 'Start time in HH:MM format (24-hour)' },
                  end_time: { type: 'string', description: 'End time in HH:MM format (24-hour), if available' },
                  description: { type: 'string', description: 'Brief description of the event' },
                  event_type: { 
                    type: 'string', 
                    enum: ['community', 'arts', 'food', 'sports', 'education', 'family', 'music', 'other'],
                    description: 'Category that best fits the event'
                  }
                },
                required: ['title', 'location', 'event_date', 'start_time', 'description', 'event_type'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_event_details' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData));

    // Extract the function call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      throw new Error('Failed to extract event details from image');
    }

    const eventDetails = JSON.parse(toolCall.function.arguments);
    console.log('Extracted event details:', eventDetails);

    // Create ISO timestamp for start_time
    const startDateTime = new Date(`${eventDetails.event_date}T${eventDetails.start_time}`);
    let endDateTime = null;
    if (eventDetails.end_time) {
      endDateTime = new Date(`${eventDetails.event_date}T${eventDetails.end_time}`);
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .insert({
        title: eventDetails.title,
        location: eventDetails.location,
        event_date: eventDetails.event_date,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime ? endDateTime.toISOString() : null,
        description: eventDetails.description,
        event_type: eventDetails.event_type,
        status: 'pending'
      })
      .select()
      .single();

    if (eventError) {
      console.error('Database error:', eventError);
      throw eventError;
    }

    // Update the submission as processed
    await supabaseAdmin
      .from('flyer_submissions')
      .update({
        processed: true,
        event_id: event.id,
        processing_notes: `Successfully extracted: ${eventDetails.title}`
      })
      .eq('id', submission_id);

    console.log('Event created:', event);

    // Convert the timestamps back to date and time strings for editing
    const eventForEditing = {
      ...eventDetails,
      id: event.id, // Include the database ID so it can be updated
      start_time: eventDetails.start_time,
      end_time: eventDetails.end_time || ''
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        event: eventForEditing,
        message: 'Event extracted and submitted for approval!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scan-event-flyer:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to scan flyer' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
