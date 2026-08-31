# Why the news section is empty — and how to fix it

## What I verified

- The twice-daily news jobs (1:00 and 15:00 UTC) have run and succeeded every day, including today.
- The last story saved to the database was on **Aug 29**. Five runs since then saved nothing.
- The feeds themselves are healthy: Mission Local published four articles today and two yesterday. Richmond Sunset News last posted Aug 26.
- The homepage only shows stories from the last 48 hours, so with nothing saved since Aug 29 the section renders empty.
- One real bug found: The Frisc feed URL now returns a redirect (`https://thefrisc.com/feed` → 301). Requests follow it, so it likely still works, but the URL should be updated to the final one.

Nothing is crashing. The most likely cause is that the curator step is rejecting every candidate article (the prompt demands a 0.6+ relevance score, force-ranks hyperlocal Sunset/Richmond angles, and hard-excludes most crime/court coverage — which is a large share of recent Mission Local output). I could not confirm this from logs because no execution logs are being retained for the news job, so step 1 is to make the run observable.

## Plan

1. **Make runs visible.** Add clear structured logging at each stage of the news job (articles fetched per feed, how many were new, how many the curator returned, each rejected title with its score and reason). Then trigger a run and read the output to confirm the rejection theory before changing curation behavior.

2. **Guarantee the section is never silently empty.** If the curator returns nothing above the bar, fall back to the single best-scoring candidate of the run (still skipping anything clearly irrelevant or excluded by the crime rules) so at least one neighborly item posts each day.

3. **Loosen the bar slightly where it's over-tight.** Lower the inclusion threshold from 0.6 to 0.55 and clarify in the prompt that city-wide SFUSD, transit, housing, and ballot stories count as relevant to Sunset/Richmond readers — matching stories already on the site (school board candidates, Prop. G, elevator repairs).

4. **Widen the display window.** Change the homepage news query from a strict 48-hour cutoff to "most recent stories, up to 7 days old," so a quiet news day never blanks the section. Keep the ordering by relevance and the 4-item cap.

5. **Fix the feed URL.** Point The Frisc source at its current, non-redirecting feed address.

6. **Add today's news.** After the fixes are deployed, run the job so today's Mission Local stories are curated and appear on the site.

## Technical notes

- Files: `supabase/functions/check-news/index.ts` (logging, threshold, fallback, feed URL), `src/hooks/useNewsItems.ts` (7-day window).
- No schema changes needed; `news_items` already dedupes on `article_hash`.
- The cron schedule (1:00 and 15:00 UTC daily) stays as-is.
