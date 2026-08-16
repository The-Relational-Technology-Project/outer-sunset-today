// Shared event identity helpers used by every ingest path (scraper, bulk import,
// add-events, submit-event) and the admin duplicate review tool.
//
// Duplicates used to slip through because the only check was an exact
// `title + event_date + location` string match. Titles and venue strings drift
// between sources, so the same event lands twice. These helpers canonicalize the
// venue, normalize the title, and compare fuzzily.

interface VenueAlias {
  canonical: string;
  patterns: RegExp[];
}

const VENUE_ALIASES: VenueAlias[] = [
  { canonical: 'Sealevel', patterns: [/sealevel/] },
  { canonical: 'Black Bird Bookstore', patterns: [/black\s*bird/, /blackbird/] },
  { canonical: 'Outer Village (1314 8th Ave)', patterns: [/outer\s*village/] },
  { canonical: 'Sunset Dunes', patterns: [/sunset\s*dunes/, /great\s*highway\s*park/] },
  { canonical: 'Ortega Library', patterns: [/ortega\s*(branch\s*)?library/] },
  { canonical: 'Richmond Library', patterns: [/richmond\s*(branch\s*)?library/] },
  { canonical: 'Java Beach Cafe', patterns: [/java\s*beach/] },
  { canonical: 'Outer Sunset Farmers Market', patterns: [/outer\s*sunset\s*farmers?\s*market/, /37th\s*ave.*ortega/] },
  { canonical: 'Inner Sunset Farmers Market', patterns: [/inner\s*sunset\s*farmers?\s*market/] },
  { canonical: 'Sunset Village (4114 Judah St)', patterns: [/sunset\s*village/, /4114\s*judah/] },
  { canonical: 'Case for Making', patterns: [/case\s*for\s*making/] },
  { canonical: 'Ocean Beach', patterns: [/^ocean\s*beach/] },
  { canonical: 'Far Out West Community Garden', patterns: [/far\s*out\s*west/] },
  { canonical: '4-Star Theater', patterns: [/4[-\s]?star/] },
  { canonical: 'Ocean Plant', patterns: [/ocean\s*plant/] },
  { canonical: 'Riptide', patterns: [/riptide/] },
  { canonical: 'Golden Gate Bandshell', patterns: [/bandshell/] },
  { canonical: 'SF Botanical Garden', patterns: [/botanical\s*garden/] },
  { canonical: 'Green Apple Books', patterns: [/green\s*apple/] },
  { canonical: 'Arizmendi Bakery', patterns: [/arizmendi/] },
];

/** Collapse a free-form location string onto a canonical venue name. */
export function canonicalVenue(location: string): string {
  const raw = (location || '').toLowerCase().trim().replace(/\s+/g, ' ');
  for (const alias of VENUE_ALIASES) {
    if (alias.patterns.some((p) => p.test(raw))) return alias.canonical;
  }
  // No alias: strip a trailing street address so "X, 4541 Irving St" === "X".
  const withoutAddress = raw.replace(/,\s*\d+.*$/, '').trim();
  return withoutAddress || raw;
}

/** Key used for grouping/comparison (lowercase canonical venue). */
export function venueKey(location: string): string {
  return canonicalVenue(location).toLowerCase();
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'at', 'in', 'on', 'of', 'for', 'with', 'to', 'by',
  'presents', 'present', 'night', 'event', 'sf', 'san', 'francisco', 'free',
  'weekly', 'monthly', 'annual', 'w', 'featuring', 'feat',
]);

/** Normalize a title into comparable tokens (venue name removed). */
export function titleTokens(title: string, location = ''): string[] {
  const venue = canonicalVenue(location).toLowerCase().replace(/\(.*?\)/g, '');
  let t = (title || '').toLowerCase();
  // Drop bracketed/starred admin markers like ***Cancelled***
  t = t.replace(/\*+/g, ' ');
  for (const word of venue.split(/[^a-z0-9]+/).filter((w) => w.length > 3)) {
    t = t.split(word).join(' ');
  }
  return t
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

export function normalizeTitle(title: string, location = ''): string {
  return titleTokens(title, location).sort().join(' ');
}

/** Token overlap (Szymkiewicz–Simpson style) between two titles: 0..1. */
export function titleSimilarity(aTitle: string, bTitle: string, aLoc = '', bLoc = ''): number {
  const a = new Set(titleTokens(aTitle, aLoc));
  const b = new Set(titleTokens(bTitle, bLoc));
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  // Overlap coefficient: "Open Mic" vs "Poetry + Prose Open Mic" scores 1.0
  return shared / Math.min(a.size, b.size);
}

export interface ComparableEvent {
  title: string;
  location: string;
  event_date: string;
  start_time?: string | null;
}

function minutesOfDay(startTime?: string | null): number | null {
  if (!startTime) return null;
  // Accepts "HH:MM" or a full ISO timestamp with offset.
  const short = /^(\d{1,2}):(\d{2})$/.exec(startTime);
  if (short) return parseInt(short[1], 10) * 60 + parseInt(short[2], 10);
  const d = new Date(startTime);
  if (isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const h = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const m = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  return h * 60 + m;
}

export const TIME_WINDOW_MINUTES = 90;
export const TITLE_MATCH_THRESHOLD = 0.7;

/**
 * True when two events are almost certainly the same listing:
 * same date, same canonical venue, start times within 90 minutes,
 * and strongly overlapping normalized titles.
 */
export function isLikelyDuplicate(a: ComparableEvent, b: ComparableEvent): boolean {
  if (a.event_date !== b.event_date) return false;
  if (venueKey(a.location) !== venueKey(b.location)) return false;

  const aMin = minutesOfDay(a.start_time);
  const bMin = minutesOfDay(b.start_time);
  if (aMin !== null && bMin !== null && Math.abs(aMin - bMin) > TIME_WINDOW_MINUTES) return false;

  const exact = normalizeTitle(a.title, a.location) === normalizeTitle(b.title, b.location);
  if (exact) return true;

  return titleSimilarity(a.title, b.title, a.location, b.location) >= TITLE_MATCH_THRESHOLD;
}

/** Fields worth backfilling onto an existing row from a duplicate incoming one. */
export function backfillFields(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const field of ['source_url', 'description', 'end_time']) {
    const current = existing[field];
    const next = incoming[field];
    if ((current === null || current === undefined || current === '') && next) {
      patch[field] = next;
    }
  }
  return patch;
}

/** In-batch dedupe using the fuzzy matcher. */
export function dedupeEventList<T extends ComparableEvent>(events: T[]): { unique: T[]; dropped: number } {
  const unique: T[] = [];
  let dropped = 0;
  for (const e of events) {
    const match = unique.find((u) => isLikelyDuplicate(u, e));
    if (match) {
      dropped++;
      // Keep the richer record's optional fields.
      const patch = backfillFields(match as Record<string, unknown>, e as Record<string, unknown>);
      Object.assign(match, patch);
      continue;
    }
    unique.push(e);
  }
  return { unique, dropped };
}
