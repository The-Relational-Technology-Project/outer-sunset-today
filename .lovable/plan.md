## Problem

The `extractPizzaMenusWithAI` function in `supabase/functions/weekly-event-scraper/index.ts` has a **hardcoded month** in the AI prompt:

```
3. All dates are in January 2026
```

This was written when the scraper was first built in January. Now that it's May, the AI is told all dates are in January, so it either produces wrong dates or fails to match the actual calendar content, causing zero pizza menus to be extracted.

## Fix

**File:** `supabase/functions/weekly-event-scraper/index.ts` (lines ~219-228)

Update the `extractPizzaMenusWithAI` prompt to dynamically determine the month and year from the `weekStart`/`weekEnd` parameters instead of hardcoding "January 2026". The prompt will say something like:

```
3. Dates are in May 2026 (derive the month/year from the calendar content and date range)
```

This is derived at runtime from the `weekStart` date string (e.g. `2026-05-04` → "May 2026").

Additionally, the page content now shows the calendar header as "May 2026", so the AI has the right context — we just need to stop overriding it with incorrect instructions.

## Deployment

Redeploy the `weekly-event-scraper` edge function after the fix.