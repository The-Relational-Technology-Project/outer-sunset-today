import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Source configurations - split into primary (fast) and secondary (additional) batches
// PRIMARY: High-priority sources that consistently have events
const PRIMARY_EVENT_PAGES = [
  { name: "Blackbird Cafe", url: "https://blackbirdsf.com/pages/events" },
  { name: "Sealevel Studio", url: "https://sealevelsf.com/pages/events" },
  { name: "Sunset Dunes Park", url: "https://sunsetdunes.org/events" },
  { name: "Outer Village", url: "https://www.outervillagesf.com/classes-events" },
  { name: "Ortega Library", url: "https://sfpl.org/events/#!/filters?field_event_location_target_id=46" },
];

// SECONDARY: Additional sources, run after primary completes
const SECONDARY_EVENT_PAGES = [
  { name: "Outer Sunset Neighbors", url: "https://sunsetneighbors.org/events/" },
  { name: "Java Beach Cafe", url: "https://www.javabeachcafe.com/events" },
  { name: "Ocean Plant", url: "https://www.oceanplantsf.com/events" },
  { name: "Case for Making", url: "https://caseformaking.com/events" },
];

const PIZZA_SOURCES = [
  { name: "Arizmendi Bakery", url: "https://www.arizmendibakery.com/pizza", type: "menu" },
];

// Search sources - run with primary batch
const SEARCH_SOURCES = [
  { name: "Outer Sunset Farmers Market", query: "Outer Sunset Farmers Market San Francisco schedule" },
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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return { events: [], menus: [] };
    }
    
    const prompt = `You are extracting events and pizza menus from web content for the Outer Sunset, Outer Richmond, and Inner Sunset neighborhoods of San Francisco.

DATE RANGE: ${weekStart} to ${weekEnd} (Sunday through the following Sunday)
CURRENT YEAR: 2026

INSTRUCTIONS:
1. Extract ALL events that fall within the date range
2. For Arizmendi pizza content, extract EACH DAY's pizza from the calendar grid
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

PIZZA MENU EXTRACTION (Arizmendi Bakery):
The Arizmendi calendar is a markdown table with columns: Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.
- IMPORTANT: Arizmendi is CLOSED on Sundays and Mondays - skip those days
- Each cell has the format: "DAY_NUMBER<br>pizza toppings description"
- Extract EVERY pizza for dates within our date range (${weekStart} to ${weekEnd})

For EACH pizza day, create a menu entry with:
- restaurant: "Arizmendi Bakery"
- location: "1331 9th Ave, San Francisco"
- menu_date: YYYY-MM-DD format (January 2026)
- special_item: The pizza toppings (e.g., "mushrooms, spinach, feta, garlic oil, p&p")
- category: "Pizza"
- hours: "11am until sold out"

CRITICAL FOR PIZZA EXTRACTION:
- Look for dates like "18<br>marinated artichoke hearts..." meaning Jan 18
- Skip cells that say "closed for the holidays" or similar
- You should find 5-6 pizza entries per week (Tue-Sat)
- Double-check you extracted ALL pizzas in the date range

IMPORTANT:
- Skip any events outside the date range
- Skip duplicates (same event appearing multiple times)

Return ONLY valid JSON in this format (no markdown, no explanation):
{"events": [...], "menus": [...]}

If no events or menus found, return: {"events": [], "menus": []}

CONTENT TO ANALYZE:
${content}`;

    console.log('Calling Lovable AI for extraction...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'You are an expert at extracting structured event and menu data from web content. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI extraction failed:', errorText);
      return { events: [], menus: [] };
    }

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content || '';
    
    console.log('AI raw response length:', aiText.length);
    
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

    // Run PRIMARY sources in parallel first (critical sources)
    console.log('--- Scraping Primary Sources ---');
    
    const [primaryEventResults, pizzaResults, searchResults] = await Promise.all([
      scrapeBatch(PRIMARY_EVENT_PAGES, firecrawlApiKey, 2000),
      scrapeBatch(PIZZA_SOURCES, firecrawlApiKey, 4000),
      searchBatch(SEARCH_SOURCES, firecrawlApiKey),
    ]);

    // Process primary event results
    for (const { name, content } of primaryEventResults) {
      if (content) {
        allContent.push(`=== ${name} ===\n${content}`);
        sourceResults.push({ name, success: true });
      } else {
        sourceResults.push({ name, success: false });
      }
    }

    // Process pizza results
    for (const { name, content } of pizzaResults) {
      if (content) {
        allContent.push(`=== ${name} (PIZZA MENU) ===\n${content}`);
        sourceResults.push({ name, success: true });
      } else {
        sourceResults.push({ name, success: false });
      }
    }

    // Process search results
    for (const { name, content } of searchResults) {
      if (content) {
        allContent.push(`=== ${name} (Search Results) ===\n${content}`);
        sourceResults.push({ name, success: true });
      } else {
        sourceResults.push({ name, success: false });
      }
    }

    // Run SECONDARY sources after primary completes
    console.log('--- Scraping Secondary Sources ---');
    const secondaryEventResults = await scrapeBatch(SECONDARY_EVENT_PAGES, firecrawlApiKey, 2000);
    
    for (const { name, content } of secondaryEventResults) {
      if (content) {
        allContent.push(`=== ${name} ===\n${content}`);
        sourceResults.push({ name, success: true });
      } else {
        sourceResults.push({ name, success: false });
      }
    }

    const successfulSources = sourceResults.filter(s => s.success).length;
    const totalSources = sourceResults.length;
    console.log(`Scraped ${successfulSources}/${totalSources} sources successfully`);

    // Extract events and menus with AI (truncate to avoid timeout)
    console.log('--- Extracting with AI ---');
    let combinedContent = allContent.join('\n\n========================================\n\n');
    // Truncate to ~60k chars for faster processing
    if (combinedContent.length > 60000) {
      console.log(`Truncating content from ${combinedContent.length} to 60000 chars`);
      combinedContent = combinedContent.slice(0, 60000);
    }
    const { events, menus } = await extractWithAI(combinedContent, weekStart, weekEnd);

    // Import to database
    console.log('--- Importing to Database ---');
    const importResults = await importToDatabase(events, menus);

    // Send notification email
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
