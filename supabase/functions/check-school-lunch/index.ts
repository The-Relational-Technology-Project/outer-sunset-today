import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MENU_PAGE = 'https://www.sfusd.edu/services/health-wellness/nutrition-school-meals/menus';
const NOTIFY_EMAIL = 'josh@relationaltechproject.org';

const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')!;
const lovableKey = Deno.env.get('LOVABLE_API_KEY')!;
const resendKey = Deno.env.get('RESEND_API_KEY')!;

async function firecrawlScrape(url: string, formats: string[]): Promise<any> {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, formats, parsePDF: true, waitFor: 4000 }),
  });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(`Firecrawl failed for ${url}: ${JSON.stringify(json).slice(0, 400)}`);
  }
  return json.data;
}

async function sendEmail(subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Outer Sunset Today <humans@relationaltechproject.org>',
      to: [NOTIFY_EMAIL],
      subject,
      html,
    }),
  });
  if (!res.ok) console.error('Resend error:', await res.text());
}

function targetMonth(): { year: number; month: number; label: string } {
  // Runs late in the month; load the NEXT month.
  const nowPT = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const d = new Date(nowPT.getFullYear(), nowPT.getMonth() + 1, 1);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const { year, month, label } = targetMonth();

  try {
    const body = await req.json().catch(() => ({}));
    const pdfOverride: string | undefined = body?.pdfUrl;

    // 1. Find the LunchMaster Breakfast & Lunch PDF link
    let pdfUrl = pdfOverride;
    if (!pdfUrl) {
      const page = await firecrawlScrape(MENU_PAGE, ['markdown', 'links']);
      const links: string[] = page.links || [];
      const markdown: string = page.markdown || '';

      const candidates = links.filter((l) => /\.pdf(\?|$)/i.test(l));
      // Prefer links whose text/url mentions lunch + the target month
      const monthName = new Date(year, month - 1, 1)
        .toLocaleDateString('en-US', { month: 'long' })
        .toLowerCase();

      pdfUrl =
        candidates.find((l) => l.toLowerCase().includes(monthName) && /lunch/i.test(l)) ||
        candidates.find((l) => l.toLowerCase().includes(monthName)) ||
        // fall back to the markdown link labelled "LunchMaster Breakfast & Lunch"
        markdown.match(/\[[^\]]*LunchMaster[^\]]*Breakfast\s*&\s*Lunch[^\]]*\]\((https?:\/\/[^)]+)\)/i)?.[1] ||
        candidates.find((l) => /lunch/i.test(l));
    }

    if (!pdfUrl) throw new Error('Could not locate the LunchMaster Breakfast & Lunch PDF link');

    // 2. Read the PDF
    const pdfDoc = await firecrawlScrape(pdfUrl, ['markdown']);
    const text: string = (pdfDoc.markdown || '').slice(0, 60000);
    if (text.length < 200) throw new Error('PDF text extraction returned almost nothing');

    // 3. Extract lunches with AI
    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content:
              'You extract SFUSD K-12 LUNCH menus from a monthly calendar. IGNORE the BREAKFAST calendar entirely. ' +
              `The lunch calendar is for ${label} (year ${year}, month ${month}). ` +
              'Return ONLY JSON: {"lunches":[{"date":"YYYY-MM-DD","items":["item","item"]}]}. ' +
              'Each calendar cell has a day number and 1-3 menu items; list them in order, verbatim, without vegetarian icons or footnotes. ' +
              'Skip empty days (no school). Do not invent days.',
          },
          { role: 'user', content: text },
        ],
      }),
    });
    const aiJson = await aiRes.json();
    if (!aiRes.ok) throw new Error(`AI error: ${JSON.stringify(aiJson).slice(0, 300)}`);
    const raw = aiJson.choices?.[0]?.message?.content ?? '';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    const lunches: { date: string; items: string[] }[] = (parsed.lunches || []).filter(
      (l: any) => typeof l?.date === 'string' && l.date.startsWith(`${year}-${String(month).padStart(2, '0')}`) && l.items?.length
    );

    if (lunches.length === 0) throw new Error('AI returned no lunches');

    // 4. Upsert into daily_menus
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let inserted = 0;
    let updated = 0;
    for (const l of lunches) {
      const special_item = l.items.join('; ');
      const { data: existing } = await supabase
        .from('daily_menus')
        .select('id')
        .eq('category', 'school')
        .eq('menu_date', l.date)
        .maybeSingle();

      if (existing) {
        await supabase.from('daily_menus').update({ special_item }).eq('id', existing.id);
        updated++;
      } else {
        await supabase.from('daily_menus').insert({
          restaurant: 'SFUSD School Lunch',
          location: 'San Francisco Unified School District',
          menu_date: l.date,
          special_item,
          category: 'school',
          hours: 'Lunch',
        });
        inserted++;
      }
    }

    const rows = lunches
      .map((l) => `<tr><td style="padding:4px 12px 4px 0">${l.date}</td><td>${l.items.join('; ')}</td></tr>`)
      .join('');

    await sendEmail(
      `🍽️ School lunches loaded for ${label}`,
      `<h1>${label} school lunches are live</h1>
       <p>${inserted} added, ${updated} updated. Source: <a href="${pdfUrl}">LunchMaster PDF</a></p>
       <table>${rows}</table>`
    );

    return new Response(JSON.stringify({ success: true, month: label, inserted, updated, pdfUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('check-school-lunch failed:', message);

    await sendEmail(
      `⚠️ Action needed: export ${label} school lunch menu`,
      `<h1>Couldn't auto-load ${label} school lunches</h1>
       <p>Reason: ${message}</p>
       <p>Please grab the <strong>LunchMaster Breakfast &amp; Lunch (Hot/Cold)</strong> PDF from
       <a href="${MENU_PAGE}">the SFUSD menus page</a> and send it over so ${label} lunches show on the site.</p>`
    );

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
