## 1. Add Far Out West to the weekly scraper

In `supabase/functions/weekly-event-scraper/index.ts`, append a new entry to `ICAL_SOURCES` using the proven Squarespace-discovery pattern (same shape as Sunset Dunes):

```ts
{
  name: "Far Out West Community",
  type: "squarespace-discovery",
  listUrl: "https://www.faroutwestcommunity.org/event-calendar",
  origin: "https://www.faroutwestcommunity.org",
  defaultLocation: "Far Out West Community Garden, 43rd Avenue",
  defaultEventType: "community",
},
```

Redeploy `weekly-event-scraper`. Then trigger it once and verify Far Out West events appear (check edge function logs for "Far Out West Community" and confirm inserts).

## 2. Insert upcoming Far Out West events now

From their calendar page, the currently-listed upcoming events (all at Far Out West Community Garden, 43rd Avenue, PDT):

- Sat Jul 25, 2026 — Tending the Garden Day — 10:00 AM–12:00 PM
- Sat Aug 1, 2026 — Tending the Garden Day — 10:00 AM–12:00 PM
- Sat Aug 1, 2026 — Coffee in the Garden — 10:00–11:00 AM
- Sat Sep 5, 2026 — Coffee in the Garden — 10:00–11:00 AM

Insert as approved events (event_type `community`, UTC = PT + 7h during PDT). Use duplicate check on (title, event_date, location) to avoid conflict with the scraper's future runs.

## 3. Insert Sunset Social Club kick-off

- Wed Jul 22, 2026 — Sunset Social Club Kick-Off Pizza Party — 6:00 PM PDT at Sunset Village, 4114 Judah St. Event type `community`, approved.

## Out of scope
No UI, display, or other backend changes.
