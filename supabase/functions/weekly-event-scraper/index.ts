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
  { name: "Richmond Sunset News Announcements", url: "https://richmondsunsetnews.com/" },
  { name: "Civic Joy Fund Cleanups", url: "https://www.mobilize.us/civicjoyfund/" },
  { name: "Blackbird Cafe", url: "https://blackbirdsf.com/pages/events" },
  { name: "Sealevel Studio", url: "https://sealevelsf.com/pages/events" },
  { name: "Outer Village", url: "https://www.outervillagesf.com/classes-events" },
  { name: "Ortega Library", url: "https://sfpl.org/events/#!/filters?field_event_location_target_id=46" },
  { name: "Richmond Library", url: "https://sfpl.org/locations/richmond" },
  { name: "Inner Sunset Park Neighbors", url: "https://www.inner-sunset.org/events-2/" },
];

// iCal sources - parsed directly, no AI, no truncation. For Squarespace, the
// page-level `?format=ical` returns HTML, but each individual event exposes a
// real .ics at `/events/<slug>?format=ical`. We discover those links from the
// events listing page, then fetch each ical in parallel.
const ICAL_SOURCES = [
  {
    name: "Sunset Dunes Park",
    type: "squarespace-discovery" as const,
    listUrl: "https://sunsetdunes.org/events/",
    origin: "https://sunsetdunes.org",
    defaultLocation: "Sunset Dunes",
    defaultEventType: "outdoor",
  },
  {
    name: "Far Out West Community",
    type: "squarespace-discovery" as const,
    listUrl: "https://www.faroutwestcommunity.org/event-calendar",
    origin: "https://www.faroutwestcommunity.org",
    defaultLocation: "Far Out West Community Garden, 43rd Avenue",
    defaultEventType: "community",
  },
];

// SECONDARY: Additional sources, run after primary completes
const SECONDARY_EVENT_PAGES = [
  { name: "Outer Sunset Neighbors", url: "https://sunsetneighbors.org/events/" },
  { name: "Java Beach Cafe", url: "https://www.javabeachcafe.com/events" },
  { name: "Ocean Plant", url: "https://www.oceanplantsf.com/events" },
  { name: "Case for Making", url: "https://caseformaking.com/pages/cfm-art-room" },
  { name: "Sunset Commons", url: "https://www.eventbrite.com/o/sunset-commons-91470249863" },
  { name: "Sunset Mercantile", url: "https://sunsetmercantilesf.com/" },
  { name: "4-Star Theater Popcorn Palace", url: "https://4-star-movies.com/popcorn-palace" },
  { name: "Dance Garden SF", url: "https://www.dancegardensf.com/" },
  { name: "SF Nature Education", url: "https://www.sfnature.org/" },
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

// Extract EVENTS with AI — called per-source so individual venues don't get
// drowned out in a giant aggregate prompt, and so relative dates ("Today",
// "Tomorrow") can be anchored to the actual scrape date.
async function extractEventsWithAI(
  content: string,
  weekStart: string,
  weekEnd: string,
  sourceName = 'mixed',
  sourceUrl = ''
): Promise<any[]> {
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return [];
    }

    // Pacific-time "today" for relative-date resolution (Eventbrite uses
    // "Today • 7:00 PM" / "Tomorrow" instead of absolute dates).
    const todayPT = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date()); // YYYY-MM-DD

    // Per-source hints help with quirky calendar formats.
    const sourceHints: Record<string, string> = {
      'Blackbird Cafe':
        'Layout pattern: a day-of-month number (e.g. "17") on one line, then "Jun" on the next, then later "Wed, 17 Jun" followed by a time range and a "### Event Title". Pair each title with the nearest preceding date/time block. Capture ALL events in range, even if multiple events share the same date. Default location is "Black Bird Bookstore".',
      'Sunset Commons':
        'This is an Eventbrite organizer page. Dates appear as "Today • 7:00 PM", "Tomorrow • ...", or "Sat, Jun 14 • ...". Resolve "Today" to the SCRAPE DATE below and "Tomorrow" to scrape date + 1 day. Default location is "Sunset Commons, 1600 Irving St". A "Sales Ended" badge does NOT mean the event is over — only skip if the event_date itself is outside the date range.',
      'Outer Sunset Farmers Market':
        'The Outer Sunset Farmers Market & Mercantile happens ONLY on SUNDAYS, 10:00–15:00 Pacific Time, at 37th Avenue between Ortega and Quintara. When emitting the recurring event for a week, the event_date MUST be a Sunday, start_time MUST be 10:00, end_time 15:00. Never emit it on any other day of the week. Emit exactly ONE entry per Sunday in range; drop any trademark symbols (™) from the title so it reads "Outer Sunset Farmers Market & Mercantile".',
    };
    const hint = sourceHints[sourceName] || '';

    const prompt = `You are extracting EVENTS from web content for the Outer Sunset, Outer Richmond, and Inner Sunset neighborhoods of San Francisco.

SOURCE: ${sourceName}${sourceUrl ? ` (${sourceUrl})` : ''}
SCRAPE DATE (Pacific Time): ${todayPT}
DATE RANGE (only return events whose date falls inside): ${weekStart} to ${weekEnd}
CURRENT YEAR: ${todayPT.slice(0, 4)}

${hint ? `SOURCE-SPECIFIC HINT: ${hint}\n` : ''}For each EVENT, extract:
- title: Event name (clean, concise)
- location: Venue name (e.g., "Sealevel", "Ortega Library", "Java Beach Cafe"). IMPORTANT: Use "Sealevel" NOT "Sealevel Studio"
- event_date: YYYY-MM-DD format (resolve "Today"/"Tomorrow" using the SCRAPE DATE above)
- start_time: HH:MM (24-hour, Pacific Time)
- end_time: HH:MM if available (optional)
- description: 1-2 sentence description
- event_type: One of: community, food, music, wellness, outdoor, art, family, market, volunteer

IMPORTANT:
- Skip any events outside the date range
- Skip duplicates within this source
- Use 24-hour time format (e.g., 14:00 not 2pm)
- For recurring events described by weekday (e.g. "every Sunday", "Wednesdays 6pm"), the event_date you emit MUST fall on that exact weekday. Double-check the day-of-week of event_date before returning it — never place a "Sunday" event on a Monday.
- Be exhaustive: do not summarize. Return every distinct event in range, even small ones.

Return ONLY valid JSON array (no markdown, no explanation):
[{"title": "...", "location": "...", "event_date": "YYYY-MM-DD", ...}, ...]

If no events found, return: []

CONTENT TO ANALYZE:
${content}`;

    console.log(`Calling AI for event extraction [${sourceName}, ${content.length} chars]...`);

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
      console.error(`AI event extraction failed [${sourceName}]:`, await response.text());
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
    console.log(`AI extracted [${sourceName}]: ${Array.isArray(events) ? events.length : 0} events`);
    return Array.isArray(events) ? events : [];
  } catch (error) {
    console.error(`Error in AI event extraction [${sourceName}]:`, error);
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
async function sendNotificationEmail(
  results: any,
  weekStart: string,
  weekEnd: string,
  pizzaStatus?: string,
  sourceBreakdown?: { name: string; count: number }[]
): Promise<void> {
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

    const breakdownHtml = sourceBreakdown && sourceBreakdown.length > 0
      ? `<h3>Per-source extraction</h3>
         <ul>
           ${sourceBreakdown
             .slice()
             .sort((a, b) => b.count - a.count)
             .map(s => `<li${s.count === 0 ? ' style="color:#b00"' : ''}>${s.name}: <strong>${s.count}</strong>${s.count === 0 ? ' ⚠️ no events extracted' : ''}</li>`)
             .join('')}
         </ul>`
      : '';

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

      ${breakdownHtml}

      ${pizzaStatus ? `<p><strong>Pizza scrape status:</strong> ${pizzaStatus}</p>` : ''}
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

// --- iCal (RFC 5545) support ---------------------------------------------------

// Unfold RFC 5545 line continuations: lines beginning with a space or tab
// continue the previous line.
function unfoldIcal(raw: string): string[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

// Unescape RFC 5545 text values (\n, \, ,, ;)
function unescapeIcalText(v: string): string {
  return v
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

// Parse a DTSTART/DTEND value. Returns { date: 'YYYY-MM-DD', time: 'HH:MM' | null }
// in America/Los_Angeles. Handles:
//   DTSTART;VALUE=DATE:20260524
//   DTSTART;TZID=America/Los_Angeles:20260524T090000
//   DTSTART:20260524T160000Z   (UTC -> convert to LA)
function parseIcalDateTime(rawKey: string, value: string): { date: string; time: string | null } | null {
  const params = rawKey.split(';').slice(1).reduce<Record<string, string>>((acc, p) => {
    const [k, v] = p.split('=');
    if (k && v) acc[k.toUpperCase()] = v;
    return acc;
  }, {});

  // Date-only
  if (params.VALUE === 'DATE' || /^\d{8}$/.test(value)) {
    const m = value.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (!m) return null;
    return { date: `${m[1]}-${m[2]}-${m[3]}`, time: null };
  }

  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return null;
  const [, y, mo, d, hh, mm, _ss, z] = m;

  // If UTC, convert to America/Los_Angeles via Intl
  if (z === 'Z') {
    const utc = new Date(`${y}-${mo}-${d}T${hh}:${mm}:00Z`);
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const parts = Object.fromEntries(fmt.formatToParts(utc).map(p => [p.type, p.value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
  }

  // Floating or TZID=America/Los_Angeles → treat as Pacific local (matches our standard)
  return { date: `${y}-${mo}-${d}`, time: `${hh}:${mm}` };
}

// Parse an iCal feed into structured events for our import format.
function parseIcalFeed(
  ics: string,
  source: { name: string; defaultLocation?: string; defaultEventType?: string; listUrl?: string }
): any[] {
  const lines = unfoldIcal(ics);
  const events: any[] = [];
  let cur: Record<string, string> | null = null;
  let curKeys: Record<string, string> | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { cur = {}; curKeys = {}; continue; }
    if (line === 'END:VEVENT') {
      if (cur && curKeys) {
        const start = cur.DTSTART ? parseIcalDateTime(curKeys.DTSTART, cur.DTSTART) : null;
        const end = cur.DTEND ? parseIcalDateTime(curKeys.DTEND, cur.DTEND) : null;
        if (start && cur.SUMMARY) {
          events.push({
            title: unescapeIcalText(cur.SUMMARY),
            location: cur.LOCATION ? unescapeIcalText(cur.LOCATION) : (source.defaultLocation || ''),
            event_date: start.date,
            start_time: start.time || '09:00',
            end_time: end?.time || undefined,
            description: cur.DESCRIPTION ? unescapeIcalText(cur.DESCRIPTION).slice(0, 500) : undefined,
            event_type: source.defaultEventType || 'community',
            source_url: cur.URL ? unescapeIcalText(cur.URL) : (source.listUrl || undefined),
          });
        }
      }
      cur = null; curKeys = null;
      continue;
    }
    if (!cur || !curKeys) continue;

    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const rawKey = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const baseKey = rawKey.split(';')[0].toUpperCase();
    cur[baseKey] = value;
    curKeys[baseKey] = rawKey;
  }

  return events;
}


async function fetchIcalSource(
  source: {
    name: string;
    type: "squarespace-discovery";
    listUrl: string;
    origin: string;
    defaultLocation?: string;
    defaultEventType?: string;
  },
  weekStart: string,
  weekEnd: string
): Promise<{ name: string; events: any[]; success: boolean }> {
  try {
    console.log(`Discovering iCal links: ${source.listUrl}`);
    const listRes = await fetch(source.listUrl, {
      headers: { 'User-Agent': 'OuterSunsetToday/1.0 (outersunset.today)' },
    });
    if (!listRes.ok) {
      console.error(`iCal listing fetch failed ${source.name}: ${listRes.status}`);
      return { name: source.name, events: [], success: false };
    }
    const html = await listRes.text();

    // Extract unique per-event iCal paths from the listing page.
    const paths = Array.from(html.matchAll(/href="(\/events\/[^"?#]+\?format=ical)"/g))
      .map(m => m[1]);
    const uniquePaths = Array.from(new Set(paths)).slice(0, 80); // safety cap
    console.log(`iCal ${source.name}: discovered ${uniquePaths.length} event links`);

    if (uniquePaths.length === 0) {
      return { name: source.name, events: [], success: false };
    }

    // Fetch each event's ical in parallel.
    const fetched = await Promise.all(uniquePaths.map(async (p) => {
      try {
        const r = await fetch(source.origin + p, {
          headers: { 'User-Agent': 'OuterSunsetToday/1.0 (outersunset.today)' },
        });
        if (!r.ok) return '';
        return await r.text();
      } catch { return ''; }
    }));

    const all: any[] = [];
    for (const ics of fetched) {
      if (ics && ics.includes('BEGIN:VEVENT')) {
        all.push(...parseIcalFeed(ics, source));
      }
    }

    const inRange = all.filter(e => e.event_date >= weekStart && e.event_date < weekEnd);
    console.log(`iCal ${source.name}: parsed ${all.length}, in-range ${inRange.length}`);
    return { name: source.name, events: inRange, success: true };
  } catch (err) {
    console.error(`iCal error ${source.name}:`, err);
    return { name: source.name, events: [], success: false };
  }
}

// --- Run-wide dedupe ----------------------------------------------------------
// Matches our import dedupe key (title + date + location), case/whitespace
// insensitive, plus location normalization mirrored from bulk-import-events.
function normalizeLocationForKey(loc: string): string {
  const l = (loc || '').toLowerCase();
  if (l.includes('sealevel')) return 'sealevel';
  return l.trim().replace(/\s+/g, ' ');
}
function dedupeEvents(events: any[]): { unique: any[]; dropped: number } {
  const seen = new Set<string>();
  const unique: any[] = [];
  let dropped = 0;
  for (const e of events) {
    const key = `${(e.title || '').toLowerCase().trim()}|${e.event_date}|${normalizeLocationForKey(e.location || '')}`;
    if (seen.has(key)) { dropped++; continue; }
    seen.add(key);
    unique.push(e);
  }
  return { unique, dropped };
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

    // Pizza content is collected separately; per-source event content is
    // collected inline below for per-source AI extraction.
    let pizzaContent: string = '';
    const sourceResults: { name: string; success: boolean }[] = [];

    // Run PRIMARY sources in parallel first (critical sources)
    console.log('--- Scraping Primary Sources ---');
    
    // Pizza scrape with retry — single critical URL, cheap to retry
    const scrapePizzaWithRetry = async () => {
      let results = await scrapeBatch(PIZZA_SOURCES, firecrawlApiKey, 10000, ['html', 'markdown']);
      const first = results[0];
      const tooShort = !first?.content || first.content.length < 500;
      if (tooShort) {
        console.warn(`PIZZA_SCRAPE_RETRY: first attempt returned ${first?.content?.length ?? 0} chars, retrying in 3s...`);
        await new Promise((r) => setTimeout(r, 3000));
        results = await scrapeBatch(PIZZA_SOURCES, firecrawlApiKey, 10000, ['html', 'markdown']);
      }
      return results;
    };

    const [primaryEventResults, pizzaResults, searchResults, icalResults] = await Promise.all([
      scrapeBatch(PRIMARY_EVENT_PAGES, firecrawlApiKey, 2000),
      scrapePizzaWithRetry(),
      searchBatch(SEARCH_SOURCES, firecrawlApiKey),
      Promise.all(ICAL_SOURCES.map(s => fetchIcalSource(s, weekStart, weekEnd))),
    ]);

    // Collected per-source { name, url, content } so we can extract per source
    // (no aggregate truncation, focused prompts, per-source visibility).
    const perSourceContent: { name: string; url: string; content: string }[] = [];

    // Collect iCal events directly (no AI). Track source success.
    const icalEvents: any[] = [];
    for (const r of icalResults) {
      sourceResults.push({ name: `${r.name} (iCal)`, success: r.success });
      icalEvents.push(...r.events);
    }
    console.log(`iCal sources contributed ${icalEvents.length} events`);

    // Process primary event results
    for (let i = 0; i < primaryEventResults.length; i++) {
      const { name, content } = primaryEventResults[i];
      const url = PRIMARY_EVENT_PAGES[i].url;
      if (content) {
        perSourceContent.push({ name, url, content });
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

    // Process search results (web search aggregates — keep grouped under the search name)
    for (let i = 0; i < searchResults.length; i++) {
      const { name, content } = searchResults[i];
      if (content) {
        perSourceContent.push({ name: `${name} (search)`, url: '', content });
        sourceResults.push({ name, success: true });
      } else {
        sourceResults.push({ name, success: false });
      }
    }

    // Run SECONDARY sources after primary completes
    console.log('--- Scraping Secondary Sources ---');
    const secondaryEventResults = await scrapeBatch(SECONDARY_EVENT_PAGES, firecrawlApiKey, 2000);

    for (let i = 0; i < secondaryEventResults.length; i++) {
      const { name, content } = secondaryEventResults[i];
      const url = SECONDARY_EVENT_PAGES[i].url;
      if (content) {
        perSourceContent.push({ name, url, content });
        sourceResults.push({ name, success: true });
      } else {
        sourceResults.push({ name, success: false });
      }
    }

    const successfulSources = sourceResults.filter(s => s.success).length;
    const totalSources = sourceResults.length;
    console.log(`Scraped ${successfulSources}/${totalSources} sources successfully`);

    // Extract events PER SOURCE in parallel — eliminates the aggregate-truncation
    // bottleneck that was causing individual venues (Black Bird, Sunset Commons)
    // to get lost in a 60k-char blob. Each call gets a focused prompt with
    // source-specific hints + the scrape date for relative-date resolution.
    console.log('--- Extracting with AI (per-source) ---');

    // Cap each source's content to keep individual prompts reasonable.
    const PER_SOURCE_CAP = 30000;

    const [perSourceExtractions, menus] = await Promise.all([
      Promise.all(perSourceContent.map(async (s) => {
        const trimmed = s.content.length > PER_SOURCE_CAP ? s.content.slice(0, PER_SOURCE_CAP) : s.content;
        const events = await extractEventsWithAI(trimmed, weekStart, weekEnd, s.name, s.url);
        return { name: s.name, events };
      })),
      pizzaContent ? extractPizzaMenusWithAI(pizzaContent, weekStart, weekEnd) : Promise.resolve([]),
    ]);

    // Flatten + build per-source breakdown for visibility
    const aiEvents: any[] = [];
    const sourceBreakdown: { name: string; count: number }[] = [];
    for (const r of perSourceExtractions) {
      sourceBreakdown.push({ name: r.name, count: r.events.length });
      aiEvents.push(...r.events);
      if (r.events.length === 0) {
        console.warn(`EXTRACTION_EMPTY: source "${r.name}" returned 0 events`);
      }
    }
    // Add iCal breakdown
    for (const r of icalResults) {
      sourceBreakdown.push({ name: `${r.name} (iCal)`, count: r.events.length });
    }

    // Merge AI-extracted events with iCal-derived events, then dedupe in-batch
    const mergedEvents = [...icalEvents, ...aiEvents];
    const { unique: events, dropped: dedupedInRun } = dedupeEvents(mergedEvents);
    if (dedupedInRun > 0) {
      console.log(`In-run dedupe removed ${dedupedInRun} duplicate event(s) across iCal + AI sources`);
    }

    // Diagnose pizza failures with a clear signal
    let pizzaStatus = `OK — ${menus.length} menus extracted`;
    if (!pizzaContent) {
      pizzaStatus = `PIZZA_SCRAPE_FAILED — Firecrawl returned no content for arizmendibakery.com/pizza`;
      console.error(pizzaStatus);
    } else if (menus.length === 0) {
      const hasCalendar = pizzaContent.includes('yasp-item') || pizzaContent.includes('yasp-num');
      if (hasCalendar) {
        pizzaStatus = `PIZZA_AI_EXTRACTION_FAILED — page scraped (${pizzaContent.length} chars, calendar markup present) but AI returned 0 menus`;
      } else {
        pizzaStatus = `PIZZA_SCRAPE_INCOMPLETE — page scraped (${pizzaContent.length} chars) but calendar markup missing; snippet: ${pizzaContent.slice(0, 300)}`;
      }
      console.error(pizzaStatus);
    }

    console.log(`Total to import: ${events.length} events (${icalEvents.length} iCal + ${aiEvents.length} AI − ${dedupedInRun} duplicate), ${menus.length} pizza menus`);

    // Import to database
    console.log('--- Importing to Database ---');
    const importResults = await importToDatabase(events, menus);

    // Send notification email (include pizza diagnostic + per-source breakdown)
    await sendNotificationEmail(importResults, weekStart, weekEnd, pizzaStatus, sourceBreakdown);

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
