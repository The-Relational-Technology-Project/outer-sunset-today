# Why duplicates keep appearing — and how to stop them

## What I found

Duplicate protection today is a single exact-match key: `title + event_date + location`, compared as raw lowercased strings. It exists in two places (the scraper's in-run dedupe and the bulk-import insert check). Anything that varies by even one character gets through.

Real examples currently in the calendar:

- Aug 12, Black Bird: "Open Mic Night" @ `Black Bird Bookstore` vs "Poetry + Prose Open Mic Night" @ `Black Bird Bookstore, 4541 Irving St` — same event, different title wording *and* different venue string.
- Aug 13, Richmond food pantry: two rows with identical title/date/location that came in as separate shift times in one batch.

Four structural causes:

1. **Title drift** — the same event is worded differently by the venue page, an aggregator, and a manual add. Exact string match can't see they're the same.
2. **Venue string drift** — `Black Bird Bookstore` vs `Black Bird Bookstore, 4541 Irving St`; `Outer Village` vs `Outer Village - 8th Ave`. Only "Sealevel" has a normalization rule.
3. **Overlapping sources** — a single event can appear via iCal, an AI-scraped venue page, a search source, and a manual entry. Manual entries (like the Black Bird Wednesday recurring series) were inserted with different titles than the scraper later produces.
4. **Time is ignored** — genuinely distinct shifts at the same place/day (two food pantry windows) either collide or duplicate depending on wording, because start time isn't part of the key.

## The fix

**1. Shared venue alias map.** One canonical venue list (Black Bird Bookstore, Sealevel, Outer Village, Sunset Dunes, Ortega Library, Java Beach, Farmers Market, etc.) with alias patterns, used by both the scraper and the import endpoint so every event lands under one canonical location string.

**2. Fuzzy duplicate detection instead of exact match.** Two events are considered the same when: same date, same canonical venue, start times within 90 minutes, and titles that match after normalization (lowercase, strip punctuation/stopwords, drop venue name from the title) with a high token-overlap score. This runs both in-run (scraper) and against existing DB rows (import), replacing the current exact-key check.

**3. Prefer the better record.** When a near-duplicate is found, keep the existing row but backfill missing fields from the incoming one (`source_url`, `description`, `end_time`) instead of dropping the data silently.

**4. Admin "Possible duplicates" review.** A panel in `/admin` that runs the same fuzzy comparison over upcoming events and lists suspected pairs with a one-click merge/delete, so anything the automated pass misses is easy to clear without SQL.

**5. One-time cleanup pass** over upcoming events using the new matcher, so the current calendar starts clean.

## Technical notes

- New shared module `supabase/functions/_shared/event-identity.ts`: `canonicalVenue()`, `normalizeTitle()`, `titleSimilarity()`, `isLikelyDuplicate()`.
- Wire it into `weekly-event-scraper/index.ts` (`dedupeEvents`) and `bulk-import-events/index.ts` (replace the `.eq(title/date/location).maybeSingle()` lookup with a same-date-and-venue fetch plus fuzzy compare); `add-events` and `submit-event` get the same check.
- Admin panel: new component under `src/pages/Admin.tsx` calling a `find-duplicate-events` path in the existing admin edge function (service-role, so it can delete).
- No schema change required.
