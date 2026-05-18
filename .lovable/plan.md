# Pizza menu scraper — diagnosis & hardening

## What I found

**This week's menus are now correct.** I manually re-ran `weekly-event-scraper` and it inserted 6 new pizza menus + updated the existing May 17 entry. All 7 entries (Tue May 19 → Sun May 24, plus the corrected May 17) match your screenshot of arizmendibakery.com/pizza exactly. Monday May 18 is correctly skipped.

So the **data is backfilled** — no further action needed there.

## Why Sunday's cron returned 0 menus

The Arizmendi page is actually **static HTML** (a plain `<table>`, no JavaScript rendering). Firecrawl scrapes it reliably on demand. The cron run almost certainly failed for one of these transient reasons:

1. **Firecrawl returned only `markdown` (not `html`)** on that request. Our scrape call asks for `formats: ['html']` only, and `scrapeUrl` then does `html || markdown` — but since markdown was never requested, there's no fallback if `html` is missing for any reason.
2. **Firecrawl rate-limit / 5xx / timeout** on that one call (we don't retry).
3. **AI extraction returned `[]`** silently — the only "no menus" log line is `AI extracted: 0` and we can't tell empty-content vs. empty-response apart.

There is currently no retry, no fallback format, and no visibility into which of the above happened.

## Proposed fix

Edit only `supabase/functions/weekly-event-scraper/index.ts`:

1. **Request both formats for pizza:** change the pizza scrape from `['html']` to `['html', 'markdown']`. `scrapeUrl` already prefers `html` and falls back to `markdown`, so we get a free safety net at no extra cost.

2. **Retry the pizza scrape once on failure.** If `scrapeUrl` returns `null` or content shorter than ~500 chars (a sign the table didn't load), wait 3s and retry once before giving up. Pizza is a single critical URL so a targeted retry is cheap.

3. **Log a clear failure signal.** If `pizzaContent` ends up empty OR `extractPizzaMenusWithAI` returns `[]`, log `PIZZA_SCRAPE_FAILED` with the content length and a snippet, and include a `pizza_status` field in the email notification (e.g. "Pizza scrape: 0 menus — source returned X chars"). This means next time it silently fails, your weekly email will tell you immediately instead of just showing "0".

4. **Sanity check the AI output:** if AI returns 0 menus but `pizzaContent` clearly contains the calendar (we can check for the string `yasp-item` in the html), log that as an AI-extraction failure specifically rather than a scrape failure.

No changes to the date-range logic, the AI prompt content, or the bulk-import function. Existing behavior for events is untouched.

## Deployment

Redeploy `weekly-event-scraper` after the edit. Next Sunday's cron run will use the hardened version; you'll also get a clearer signal in the weekly email if anything fails again.
