## Root cause

`bulk-import-events/index.ts` and `add-events/index.ts` both hardcode the Pacific offset as `-08:00` when building the ISO timestamp:

```ts
const startTime = `${eventDate}T${event.start_time}:00-08:00`;
```

That's correct in PST (winter) but wrong in PDT (daylight saving, ~Mar 8 – Nov 1). Any event ingested for a summer date is stored 1 hour late.

Example (both currently in DB):
- **Children's Music with Toby** (Sat Jul 11) — stored `17:30 UTC` (10:30 PDT). Source: 9:30 AM PDT → should be `16:30 UTC`.
- **Zumba and Shake the Fog!** (Sat Jul 11) — stored `18:30 UTC` (11:30 PDT). Source: 10:30 AM PDT → should be `17:30 UTC`.

The scraper (`weekly-event-scraper`) posts through `bulk-import-events`, so its output has the same bug. Same for the manual admin import path via `add-events`. `submit-event`, `scan-event-flyer`, and the iCal path in the scraper already handle Pacific correctly (they don't hardcode `-08:00`).

Impact: 325 approved events fall in the DST window (Mar 8 – Nov 1, 2026); the majority ingested via bulk import are affected.

## Fix

1. **Fix the two reported events** with a direct update:
   - Toby Jul 11 → `start_time = 2026-07-11 16:30 UTC`, `end_time = 2026-07-11 17:10 UTC`.
   - Zumba Jul 11 → `start_time = 2026-07-11 17:30 UTC`, `end_time = 2026-07-11 18:15 UTC`.

2. **Fix the ingest bug** in `bulk-import-events/index.ts` and `add-events/index.ts`. Replace the hardcoded `-08:00` with a helper that returns the correct offset for the given `event_date` in `America/Los_Angeles`:

   ```ts
   // Returns "-07:00" or "-08:00" for the given YYYY-MM-DD in Pacific Time.
   function pacificOffset(dateStr: string): string {
     const probe = new Date(`${dateStr}T12:00:00Z`);
     const parts = new Intl.DateTimeFormat('en-US', {
       timeZone: 'America/Los_Angeles',
       timeZoneName: 'shortOffset',
     }).formatToParts(probe);
     const tz = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT-8';
     const m = tz.match(/GMT([+-]\d+)/);
     const hours = m ? parseInt(m[1], 10) : -8;
     const sign = hours < 0 ? '-' : '+';
     return `${sign}${String(Math.abs(hours)).padStart(2, '0')}:00`;
   }
   ```

   Then: `const offset = pacificOffset(event.event_date); const startTime = \`${event.event_date}T${event.start_time}:00${offset}\`;`

3. **Backfill the existing off-by-one events.** Shift `start_time` and `end_time` back by 1 hour for every approved event whose date is in the DST window AND whose stored offset is UTC (`+00`) — matches the 325 events created via the two buggy endpoints. Scope guard: only rows where the local time in the stored UTC value falls on the wrong side of what PDT would produce. Concretely: `event_date BETWEEN '2026-03-08' AND '2026-11-01'` and stored as UTC via the buggy path.

   Because iCal-scraped rows and the two DST-safe endpoints (`submit-event`, `scan-event-flyer`) also store UTC, we can't distinguish them from the offset alone. To avoid shifting correct rows, restrict the backfill to events created by the bulk pipelines. Two safe options — pick one when implementing:
   - **(a) narrow by created_at:** shift only rows in the DST window whose `created_at` predates the code fix deploy timestamp AND that were inserted by bulk import (identifiable by lack of `submitter_email`, since submit-event always sets one and scan-event-flyer flows through submit path).
   - **(b) spot-check + targeted list:** query a sample by venue/source, confirm the 1-hour offset visually against a couple of source pages, and run the shift only for the confirmed cohort.

   Recommend (a) with a dry-run `SELECT` first so the exact row count and a sample are reviewed before the `UPDATE` runs.

4. **Redeploy** `bulk-import-events` and `add-events`. Scraper doesn't need redeploy (unchanged), but next Sunday's cron will now insert correctly.

## Out of scope

- No change to display code (`useEvents`, `EventCard`) — data will be correct after the fix.
- No change to `weekly-event-scraper` logic, `submit-event`, `scan-event-flyer`, or iCal parsing (already correct).
- Winter (PST) events are unaffected.

## Verification

- After fix + backfill, re-check the two example events show 9:30 AM and 10:30 AM in the UI.
- Spot-check Farmers Market (should be 9:00 AM PDT, currently 10:00 AM), and a couple of scraper-ingested events against their source pages.
