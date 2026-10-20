// Dear Crisis Sunset Calendar (sunset.dearcrisis.com) — an aggregator iCal feed
// for the Inner/Outer Sunset, rebuilt daily. Clean structured data, but broad:
// we filter out worship services, online events, sales seminars, startup
// networking, and venues outside our coverage area. Overlap with our other
// sources is caught downstream by the shared fuzzy duplicate matcher.

import { parseBoardFeed, occurrences, type BoardEvent, type BoardSkip } from './sunset-board.ts';

export const DEAR_CRISIS_FEED = 'https://sunset.dearcrisis.com/sunset.ics';

const EXCLUDED_TITLE = /eucharist|worship|taiz[eé]|fellowship|prayer|祈禱|bible|sermon|mass\b|medicare|seminar|investor|pitch|startup|ai tech|real estate|open house|pilates|baby and me/i;
const EXCLUDED_LOCATION = /^(online|on zoom|zoom|virtual)|remax|realty|st\.? ignatius|lycee|lycée|ucsf dental|chosen people|ce building/i;
// Venues we already ingest more reliably from their own sites.
const COVERED_ELSEWHERE = /ortega branch library|richmond branch library/i;

function typeFor(category: string, text: string): string {
  const c = category.toLowerCase();
  const t = text.toLowerCase();
  if (/volunteer|cleanup|clean up|revegetation|workday/.test(t)) return 'volunteer';
  if (/storytime|kid|family|toddler|baby|teen/.test(t)) return 'family';
  if (c.includes('arts')) return /music|band|concert|jazz|open mic/.test(t) ? 'music' : 'art';
  if (c.includes('ocean') || c.includes('parks')) return 'outdoor';
  if (c.includes('food')) return /market/.test(t) ? 'market' : 'food';
  if (c.includes('body')) return 'wellness';
  return 'community';
}

export function normalizeDearCrisisFeed(ics: string, from: string, to: string): { events: BoardEvent[]; skipped: BoardSkip[] } {
  const events: BoardEvent[] = [];
  const skipped: BoardSkip[] = [];
  // parseBoardFeed drops CATEGORIES; re-read them by UID-less order match.
  const cats = [...ics.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '').matchAll(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g)]
    .filter((m) => /DTSTART/.test(m[0]) && /SUMMARY/.test(m[0]))
    .map((m) => (m[0].match(/^CATEGORIES:(.*)$/m)?.[1] ?? '').replace(/\\,/g, ','));
  parseBoardFeed(ics).forEach((raw, i) => {
    const dates = occurrences(raw, from, to);
    if (!dates.length) return;
    const title = raw.summary.replace(/\s*\([^)]*$/, '').trim();
    const venue = raw.location.split(',')[0].trim();
    const reason =
      EXCLUDED_TITLE.test(title) ? 'filtered topic' :
      EXCLUDED_LOCATION.test(venue) || !raw.location ? `filtered venue (${venue || 'none'})` :
      COVERED_ELSEWHERE.test(venue) ? 'covered by direct source' :
      !raw.start ? 'no start time' : null;
    if (reason) { skipped.push({ title, date: dates[0], reason }); return; }
    const description = raw.description
      .replace(/https:\/\/sunset\.dearcrisis\.com\S*/g, '')
      .replace(/^Hosted by [^\n]*\n*/i, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n{2,}/g, '\n').trim().slice(0, 500) || undefined;
    for (const d of dates) {
      events.push({
        title,
        location: raw.location.split(/,\s*San Francisco/i)[0].trim(),
        event_date: d,
        start_time: raw.start!,
        end_time: raw.end ?? undefined,
        description,
        event_type: typeFor(cats[i] ?? '', `${title} ${raw.description}`),
        source_url: raw.url || 'https://sunset.dearcrisis.com/',
      });
    }
  });
  return { events, skipped };
}

export async function fetchDearCrisis(from: string, to: string) {
  try {
    const res = await fetch(DEAR_CRISIS_FEED, { headers: { 'User-Agent': 'OuterSunsetToday/1.0 (outersunset.today)' } });
    if (!res.ok) return { name: 'Dear Crisis', events: [] as BoardEvent[], skipped: [] as BoardSkip[], success: false };
    const { events, skipped } = normalizeDearCrisisFeed(await res.text(), from, to);
    console.log(`Dear Crisis: ${events.length} in range, ${skipped.length} skipped`);
    return { name: 'Dear Crisis', events, skipped, success: true };
  } catch (err) {
    console.error('Dear Crisis error:', err);
    return { name: 'Dear Crisis', events: [] as BoardEvent[], skipped: [] as BoardSkip[], success: false };
  }
}
