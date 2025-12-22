import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Source configurations
const EVENT_PAGES = [
  { name: "Blackbird Cafe", url: "https://blackbirdsf.com/pages/events" },
  { name: "Ortega Library", url: "https://sfpl.org/events/#!/filters?field_event_location_target_id=46" },
  { name: "Ocean Plant", url: "https://www.oceanplant.com/" },
  { name: "Java Beach Cafe", url: "https://javabeachcafe.com/events" },
  { name: "Case for Making", url: "https://caseformaking.com/pages/cfm-art-room" },
  { name: "Sunset Mercantile", url: "https://sunsetmercantilesf.com/" },
  { name: "Sunset Dunes Park", url: "https://sunsetdunes.org/events" },
  { name: "Outer Sunset Neighbors", url: "https://sunsetneighbors.org/events/" },
  { name: "Sealevel Studio", url: "https://sealevelsf.com/pages/events" },
  { name: "Outer Village", url: "https://www.outervillagesf.com/classes-events" },
  { name: "Golden Gate Jams", url: "https://goldengatejams.com/" },
  { name: "Braid Bakery", url: "https://braidbakery.com/" },
  { name: "SF Zoo", url: "https://www.sfzoo.org/calendar/" },
];

const PIZZA_SOURCES = [
  { name: "Arizmendi Bakery", url: "https://www.arizmendibakery.com/pizza", type: "menu" },
];

const SEARCH_SOURCES = [
  { name: "Daymoon Bakery", query: "Daymoon Bakery San Francisco events 2025" },
  { name: "Third Realm", query: "Third Realm Inner Sunset San Francisco events" },
  { name: "Outer Sunset Farmers Market", query: "Outer Sunset Farmers Market San Francisco schedule" },
  { name: "Golden Gate Park events", query: "Golden Gate Park San Francisco free events this week" },
];

// Get date range: This Sunday through next Sunday
function getDateRange(): { weekStart: string; weekEnd: string; weekStartDate: Date; weekEndDate: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  
  // Get this Sunday (today if Sunday, or the upcoming Sunday)
  const weekStartDate = new Date(now);
  if (dayOfWeek !== 0) {
    // If not Sunday, this should be "this Sunday" which is the start
    // But since we run ON Sunday, dayOfWeek should be 0
    weekStartDate.setDate(now.getDate() - dayOfWeek);
  }
  weekStartDate.setHours(0, 0, 0, 0);
  
  // Get next Sunday (7 days later)
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 7);
  
  const weekStart = weekStartDate.toISOString().split('T')[0];
  const weekEnd = weekEndDate.toISOString().split('T')[0];
  
  return { weekStart, weekEnd, weekStartDate, weekEndDate };
}

// Scrape a single URL using Firecrawl
async function scrapeUrl(url: string, apiKey: string, waitFor = 3000): Promise<string | null> {
  try {
    console.log(`Scraping: ${url}`);
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor,
      }),
    });

    if (!response.ok) {
      console.error(`Failed to scrape ${url}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.data?.markdown || data.markdown || null;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

// Search using Firecrawl
async function searchQuery(query: string, apiKey: string): Promise<string | null> {
  try {
    console.log(`Searching: ${query}`);
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit: 3,
        lang: 'en',
        country: 'us',
        scrapeOptions: { formats: ['markdown'] },
      }),
    });

    if (!response.ok) {
      console.error(`Failed to search ${query}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    // Combine all search results into one string
    const results = data.data || [];
    return results.map((r: any) => `Source: ${r.url}\n${r.markdown || r.description || ''}`).join('\n\n---\n\n');
  } catch (error) {
    console.error(`Error searching ${query}:`, error);
    return null;
  }
}

// Process content with Lovable AI (Gemini)
async function extractWithAI(content: string, weekStart: string, weekEnd: string): Promise<{ events: any[]; menus: any[] }> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const prompt = `You are extracting events and pizza menus from web content for the Outer Sunset, Outer Richmond, and Inner Sunset neighborhoods of San Francisco.

DATE RANGE: ${weekStart} to ${weekEnd} (Sunday through the following Sunday)

INSTRUCTIONS:
1. Extract ALL events that fall within the date range
2. For Arizmendi pizza content, extract the FULL WEEK of pizza menus (each day's pizza)
3. Only include events in SF's Sunset/Richmond neighborhoods
4. Use 24-hour time format (e.g., 14:00 not 2pm)
5. If a time is not specified, use reasonable defaults based on event type

For each EVENT, extract:
- title: Event name (clean, concise)
- location: Venue name (e.g., "Sealevel Studio", "Ortega Library", "Java Beach Cafe")
- event_date: YYYY-MM-DD format
- start_time: HH:MM (24-hour, Pacific Time)
- end_time: HH:MM if available (optional)
- description: 1-2 sentence description
- event_type: One of: community, food, music, wellness, outdoor, art, family, market, volunteer

For PIZZA MENUS (Arizmendi), extract EACH DAY:
- restaurant: "Arizmendi Bakery"
- location: "1331 9th Ave, San Francisco"
- menu_date: YYYY-MM-DD
- special_item: Full pizza description for that day
- category: "pizza"
- hours: "11am until sold out"

IMPORTANT:
- Extract ALL days of pizza menus shown, not just one
- Skip any events outside the date range
- Skip duplicates (same event appearing multiple times)

Return ONLY valid JSON in this format (no markdown, no explanation):
{"events": [...], "menus": [...]}

If no events or menus found, return: {"events": [], "menus": []}

CONTENT TO ANALYZE:
${content}`;

    console.log('Calling Lovable AI for extraction...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/proxy/google/gemini-2.5-flash`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI extraction failed:', errorText);
      return { events: [], menus: [] };
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON from response (handle potential markdown code blocks)
    let jsonStr = aiText.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const result = JSON.parse(jsonStr);
    console.log(`AI extracted: ${result.events?.length || 0} events, ${result.menus?.length || 0} menus`);
    return result;
  } catch (error) {
    console.error('Error in AI extraction:', error);
    return { events: [], menus: [] };
  }
}

// Import to database via bulk-import-events
async function importToDatabase(events: any[], menus: any[]): Promise<any> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const importApiKey = Deno.env.get('IMPORT_API_KEY')!;
    
    console.log(`Importing ${events.length} events and ${menus.length} menus...`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/bulk-import-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: importApiKey,
        events,
        menus,
      }),
    });

    const result = await response.json();
    console.log('Import result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error importing to database:', error);
    return { error: error instanceof Error ? error.message : 'Import failed' };
  }
}

// Send notification email
async function sendNotificationEmail(results: any, weekStart: string, weekEnd: string): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    
    const eventsInserted = results.events?.inserted || 0;
    const eventsSkipped = results.events?.skipped || 0;
    const menusInserted = results.menus?.inserted || 0;
    const menusUpdated = results.menus?.updated || 0;
    const errors = [
      ...(results.events?.errors || []),
      ...(results.menus?.errors || [])
    ];

    const html = `
      <h2>Weekly Event Import Complete</h2>
      <p><strong>Date Range:</strong> ${weekStart} to ${weekEnd}</p>
      
      <h3>Summary</h3>
      <ul>
        <li>Events added: <strong>${eventsInserted}</strong></li>
        <li>Events skipped (duplicates): ${eventsSkipped}</li>
        <li>Pizza menus inserted: <strong>${menusInserted}</strong></li>
        <li>Pizza menus updated: ${menusUpdated}</li>
      </ul>
      
      ${errors.length > 0 ? `
        <h3>⚠️ Errors</h3>
        <ul>
          ${errors.map((e: string) => `<li>${e}</li>`).join('')}
        </ul>
      ` : ''}
      
      <p><a href="https://outersunset.today/calendar">View Calendar</a></p>
    `;

    await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'import',
        data: { subject: `Weekly Import: ${eventsInserted} events, ${menusInserted + menusUpdated} menus`, html }
      }),
    });
    
    console.log('Notification email sent');
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Helper to run scrapes in parallel batches
async function scrapeBatch(
  sources: { name: string; url: string; type?: string }[],
  apiKey: string,
  waitFor = 3000
): Promise<{ name: string; content: string | null }[]> {
  const results = await Promise.all(
    sources.map(async (source) => {
      const content = await scrapeUrl(source.url, apiKey, waitFor);
      return { name: source.name, content };
    })
  );
  return results;
}

// Helper to run searches in parallel
async function searchBatch(
  sources: { name: string; query: string }[],
  apiKey: string
): Promise<{ name: string; content: string | null }[]> {
  const results = await Promise.all(
    sources.map(async (source) => {
      const content = await searchQuery(source.query, apiKey);
      return { name: source.name, content };
    })
  );
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== Weekly Event Scraper Started ===');
  
  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const { weekStart, weekEnd } = getDateRange();
    console.log(`Processing week: ${weekStart} to ${weekEnd}`);

    // Collect all scraped content
    const allContent: string[] = [];
    const sourceResults: { name: string; success: boolean }[] = [];

    // Run all scraping in PARALLEL for speed
    console.log('--- Scraping All Sources in Parallel ---');
    
    // Batch 1: First 7 event pages + pizza menu
    const batch1Sources = EVENT_PAGES.slice(0, 7);
    const batch1 = scrapeBatch(batch1Sources, firecrawlApiKey, 2000);
    
    // Batch 2: Remaining event pages
    const batch2Sources = EVENT_PAGES.slice(7);
    const batch2 = scrapeBatch(batch2Sources, firecrawlApiKey, 2000);
    
    // Batch 3: Pizza sources (need longer wait)
    const batch3 = scrapeBatch(PIZZA_SOURCES, firecrawlApiKey, 4000);
    
    // Batch 4: All search queries
    const batch4 = searchBatch(SEARCH_SOURCES, firecrawlApiKey);

    // Wait for all batches to complete in parallel
    const [results1, results2, results3, results4] = await Promise.all([
      batch1, batch2, batch3, batch4
    ]);

    // Process batch 1 results
    for (const { name, content } of results1) {
      if (content) {
        allContent.push(`=== ${name} ===\n${content}`);
        sourceResults.push({ name, success: true });
      } else {
        sourceResults.push({ name, success: false });
      }
    }

    // Process batch 2 results
    for (const { name, content } of results2) {
      if (content) {
        allContent.push(`=== ${name} ===\n${content}`);
        sourceResults.push({ name, success: true });
      } else {
        sourceResults.push({ name, success: false });
      }
    }

    // Process batch 3 results (pizza)
    for (const { name, content } of results3) {
      if (content) {
        allContent.push(`=== ${name} (PIZZA MENU) ===\n${content}`);
        sourceResults.push({ name, success: true });
      } else {
        sourceResults.push({ name, success: false });
      }
    }

    // Process batch 4 results (searches)
    for (const { name, content } of results4) {
      if (content) {
        allContent.push(`=== ${name} (Search Results) ===\n${content}`);
        sourceResults.push({ name, success: true });
      } else {
        sourceResults.push({ name, success: false });
      }
    }

    const successfulSources = sourceResults.filter(s => s.success).length;
    const totalSources = sourceResults.length;
    console.log(`Scraped ${successfulSources}/${totalSources} sources successfully`);

    // 4. Extract events and menus with AI
    console.log('--- Extracting with AI ---');
    const combinedContent = allContent.join('\n\n========================================\n\n');
    const { events, menus } = await extractWithAI(combinedContent, weekStart, weekEnd);

    // 5. Import to database
    console.log('--- Importing to Database ---');
    const importResults = await importToDatabase(events, menus);

    // 6. Send notification email
    await sendNotificationEmail(importResults, weekStart, weekEnd);

    const response = {
      success: true,
      dateRange: { weekStart, weekEnd },
      sources: {
        total: totalSources,
        successful: successfulSources,
        details: sourceResults,
      },
      extracted: {
        events: events.length,
        menus: menus.length,
      },
      imported: importResults,
    };

    console.log('=== Weekly Event Scraper Complete ===');
    console.log(JSON.stringify(response, null, 2));

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Weekly scraper error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
