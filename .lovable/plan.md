# Add event provenance links

Give every event a "Source" link (opens in new tab) next to the "Add to My Plan" button so users can jump to the original listing or venue page.

## 1. Data model

Add a nullable `source_url` column to `public.events` (text). Migration only — no policy changes; existing RLS covers it.

Optional companion column `source_name` (text) is not needed for v1 — we'll show a generic "Source" label with an external-link icon and rely on the URL's domain being visible on hover via `title`.

## 2. Populate on ingest

- **`weekly-event-scraper`** — each `ICAL_SOURCES` entry already has a `listUrl` and each parsed iCal `VEVENT` often has a `URL:` property. When inserting, set `source_url` to the per-event `URL` if present, otherwise the source's `listUrl`.
- **`bulk-import-events`** — accept optional `source_url` field on each event and pass it through on insert.
- **`submit-event`** — accept optional `source_url` from the submission form (not adding to the form UI in this pass unless requested; field just becomes available).
- **`scan-event-flyer`** — leave null (no reliable source).
- **`add-events`** — accept optional `source_url`.

## 3. Backfill

One-time SQL update: for existing rows whose `location` or title clearly matches a known `ICAL_SOURCES` entry (e.g. "Far Out West Community Garden", "Sunset Dunes Park", "Riptide", etc.), set `source_url` to that source's `listUrl`. Rows we can't confidently attribute stay null and simply won't show a link.

## 4. UI

- **`src/hooks/useEvents.ts`** — include `source_url` in the `Event` type and in `formatEventForCard` output.
- **`src/components/EventCard.tsx`** — when `source_url` is present, render a small ghost-style link with `ExternalLink` icon (lucide) to the left of the "Add to My Plan" button. `target="_blank"`, `rel="noopener noreferrer"`, `title={new URL(source_url).hostname}`. Label: "Source". Hidden entirely when null so cards without provenance don't show a broken affordance.
- Applies automatically on Index (Today / Coming Up Soon), Calendar, and My Plan since they all render `EventCard`.

## 5. Public API

`get-public-events` already emits a hard-coded `url: 'https://outersunset.today/calendar'` per event. Update it to prefer `event.source_url` when present, falling back to the calendar URL, so federated consumers get the true provenance too.

## Out of scope

- No changes to the submit form UI (no new user-facing input field).
- No "source name" badge — icon + hostname tooltip is enough for v1.
- No admin editor field for `source_url` (can add later if useful).
