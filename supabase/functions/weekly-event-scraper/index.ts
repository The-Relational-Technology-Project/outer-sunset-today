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
  { name: "Case for Making", url: "https://caseformaking.com/pages/cfm-art-room" },
  { name: "Sunset Commons", url: "https://www.eventbrite.com/o/sunset-commons-91470249863" },
];

const PIZZA_SOURCES = [
  { name: "Arizmendi Bakery", url: "https://www.arizmendibakery.com/pizza", type: "menu" },
];

// Search sources - run with primary batch
const SEARCH_SOURCES = [
  { name: "Outer Sunset Farmers Market", query: "Outer Sunset Farmers Market San Francisco schedule" },
  { name: "Funcheap SF Sunset Events", query: "Funcheap SF Outer Sunset community events this week" },
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
async function scrapeUrl(url: string, apiKey: string, waitFor = 3000, formats: string[] = ['markdown']): Promise<string | null> {
  try {
    console.log(`Scraping: ${url} (waitFor: ${waitFor}ms, formats: ${formats.join(',')})`);
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats,
        onlyMainContent: true,
        waitFor,
      }),
    });

    if (!response.ok) {
      console.error(`Failed to scrape ${url}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    // Prefer HTML for pages with JS-rendered content (like Arizmendi calendar)
    const html = data.data?.html || data.html;
    const markdown = data.data?.markdown || data.markdown;
    return html || markdown || null;
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

// Extract EVENTS with AI
async function extractEventsWithAI(content: string, weekStart: string, weekEnd: string): Promise<any[]> {
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return [];
    }
    
    const prompt = `You are extracting EVENTS from web content for the Outer Sunset, Outer Richmond, and Inner Sunset neighborhoods of San Francisco.

DATE RANGE: ${weekStart} to ${weekEnd} (Sunday through the following Sunday)
CURRENT YEAR: 2026

For each EVENT, extract:
- title: Event name (clean, concise)
- location: Venue name (e.g., "Sealevel", "Ortega Library", "Java Beach Cafe"). IMPORTANT: Use "Sealevel" NOT "Sealevel Studio"
- event_date: YYYY-MM-DD format
- start_time: HH:MM (24-hour, Pacific Time)
- end_time: HH:MM if available (optional)
- description: 1-2 sentence description
- event_type: One of: community, food, music, wellness, outdoor, art, family, market, volunteer

IMPORTANT:
- Skip any events outside the date range
- Skip duplicates (same event appearing multiple times)
- Use 24-hour time format (e.g., 14:00 not 2pm)

Return ONLY valid JSON array (no markdown, no explanation):
[{"title": "...", "location": "...", "event_date": "YYYY-MM-DD", ...}, ...]

If no events found, return: []

CONTENT TO ANALYZE:
${content}`;

    console.log('Calling AI for event extraction...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You extract events from web content. Always respond with valid JSON array only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      console.error('AI event extraction failed:', await response.text());
      return [];
    }

    const data = await response.json();
    let jsonStr = data.choices?.[0]?.message?.content?.trim() || '[]';
    
    // Clean markdown code blocks
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();

    const events = JSON.parse(jsonStr);
    console.log(`AI extracted: ${events.length} events`);
    return Array.isArray(events) ? events : [];
  } catch (error) {
    console.error('Error in AI event extraction:', error);
    return [];
  }
}

// Extract PIZZA MENUS with AI - dedicated function for reliable extraction
async function extractPizzaMenusWithAI(pizzaContent: string, weekStart: string, weekEnd: string): Promise<any[]> {
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return [];
    }

    // Parse the date range to know which dates we need
    const startDate = new Date(weekStart);
    const endDate = new Date(weekEnd);
    
    // Dynamically determine month/year from the week start date
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const wsDate = new Date(weekStart + 'T00:00:00');
    const monthName = monthNames[wsDate.getMonth()];
    const year = wsDate.getFullYear();
    
    const prompt = `Extract Arizmendi Bakery pizza menu for the week of ${weekStart} to ${weekEnd}.

The content below shows a calendar table. Each cell contains a date number followed by pizza toppings.
Format: "DAY_NUMBER<br>pizza toppings" (e.g., "27<br>roasted yellow potatoes with basil pesto")

RULES:
1. Arizmendi is CLOSED on Mondays only - skip Monday
2. Extract pizzas for Tuesday through Sunday
3. Dates are in ${monthName} ${year} (or the month shown in the calendar header)
4. You should find approximately 6 pizzas (Tue-Sun) within the date range

For EACH pizza day within ${weekStart} to ${weekEnd}, create an entry:
{
  "restaurant": "Arizmendi Bakery",
  "location": "1331 9th Ave, San Francisco",
  "menu_date": "YYYY-MM-DD",
  "special_item": "the pizza toppings exactly as written",
  "category": "pizza",
  "hours": "11am until sold out"
}

Return ONLY a JSON array. No explanations.
Example: [{"restaurant": "Arizmendi Bakery", "location": "1331 9th Ave, San Francisco", "menu_date": "${weekStart}", "special_item": "roasted yellow potatoes with basil pesto", "category": "pizza", "hours": "11am until sold out"}, ...]

CALENDAR CONTENT:
${pizzaContent}`;

    console.log('Calling AI for pizza menu extraction...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You extract pizza menu data from calendar content. Return ONLY valid JSON array.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      console.error('AI pizza extraction failed:', await response.text());
      return [];
    }

    const data = await response.json();
    let jsonStr = data.choices?.[0]?.message?.content?.trim() || '[]';
    
    // Clean markdown code blocks
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();

    const menus = JSON.parse(jsonStr);
    console.log(`AI extracted: ${menus.length} pizza menus`);
    
    // Validate dates are within range
    const validMenus = (Array.isArray(menus) ? menus : []).filter((m: any) => {
      const menuDate = new Date(m.menu_date);
      return menuDate >= startDate && menuDate <= endDate;
    });
    
    console.log(`Valid pizza menus in range: ${validMenus.length}`);
    return validMenus;
  } catch (error) {
    console.error('Error in AI pizza extraction:', error);
    return [];
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
  waitFor = 3000,
  formats: string[] = ['markdown']
): Promise<{ name: string; content: string | null }[]> {
  const results = await Promise.all(
    sources.map(async (source) => {
      const content = await scrapeUrl(source.url, apiKey, waitFor, formats);
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

    // Collect scraped content separately for events and pizza
    const eventContent: string[] = [];
    let pizzaContent: string = '';
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
        eventContent.push(`=== ${name} ===\n${content}`);
        sourceResults.push({ name, success: true });
      } else {
        sourceResults.push({ name, success: false });
      }
    }

    // Process pizza results - keep separate for dedicated extraction
    for (const { name, content } of pizzaResults) {
      if (content) {
        pizzaContent = content; // Store pizza content separately
        sourceResults.push({ name, success: true });
        console.log(`Pizza content length: ${content.length} chars`);
      } else {
        sourceResults.push({ name, success: false });
      }
    }

    // Process search results
    for (const { name, content } of searchResults) {
      if (content) {
        eventContent.push(`=== ${name} (Search Results) ===\n${content}`);
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
        eventContent.push(`=== ${name} ===\n${content}`);
        sourceResults.push({ name, success: true });
      } else {
        sourceResults.push({ name, success: false });
      }
    }

    const successfulSources = sourceResults.filter(s => s.success).length;
    const totalSources = sourceResults.length;
    console.log(`Scraped ${successfulSources}/${totalSources} sources successfully`);

    // Extract events and pizza menus SEPARATELY with AI
    console.log('--- Extracting with AI ---');
    
    // Combine event content (truncate if needed)
    let combinedEventContent = eventContent.join('\n\n========================================\n\n');
    if (combinedEventContent.length > 60000) {
      console.log(`Truncating event content from ${combinedEventContent.length} to 60000 chars`);
      combinedEventContent = combinedEventContent.slice(0, 60000);
    }
    
    // Run event and pizza extraction in parallel
    const [events, menus] = await Promise.all([
      extractEventsWithAI(combinedEventContent, weekStart, weekEnd),
      pizzaContent ? extractPizzaMenusWithAI(pizzaContent, weekStart, weekEnd) : Promise.resolve([]),
    ]);
    
    console.log(`Total extracted: ${events.length} events, ${menus.length} pizza menus`);

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
