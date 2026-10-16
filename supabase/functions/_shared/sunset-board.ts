// Sunset Board (sunsetboard.org) — a neighborhood flyer board that scans
// pole/café flyers and publishes a clean iCal feed. We read the feed directly
// (no AI) and normalize it so the shared fuzzy matcher can catch overlaps with
// events we already have from other sources.

import { titleSimilarity } from './event-identity.ts';

export const SUNSET_BOARD_FEED = 'https://sunsetboard.org/calendar.ics';

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

interface RawEvent {
  summary: string;
  location: string;
  description: string;
  url: string;
  date: string; // YYYY-MM-DD (Pacific)
  start: string | null; // HH:MM
  end: string | null;
  durationMin: number | null;
  rrule: Record<string, string> | null;
}

export interface BoardEvent {
  title: string;
  location: string;
  event_date: string;
  start_time: string;
  end_time?: string;
  description?: string;
  event_type: string;
  source_url: string;
}

export interface BoardSkip { title: string; date?: string; reason: string }

function unfold(raw: string): string[] {
  const out: string[] = [];
  for (const line of raw.replace(/\r\n/g, '\n').split('\n')) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && out.length) out[out.length - 1] += line.slice(1);
    else out.push(line);
  }
  return out;
}

function unescape(v: string): string {
  return v.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim();
}

function parseDt(value: string): { date: string; time: string | null } | null {
  const d = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (d) return { date: `${d[1]}-${d[2]}-${d[3]}`, time: null };
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})\d{2}(Z?)$/);
  if (!m) return null;
  if (m[6] === 'Z') {
    const utc = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00Z`);
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(utc).map((x) => [x.type, x.value]));
    return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour === '24' ? '00' : p.hour}:${p.minute}` };
  }
  return { date: `${m[1]}-${m[2]}-${m[3]}`, time: `${m[4]}:${m[5]}` };
}

function parseDuration(v: string): number | null {
  const m = v.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!m) return null;
  return (parseInt(m[1] || '0', 10) * 60) + parseInt(m[2] || '0', 10);
}

export function parseBoardFeed(ics: string): RawEvent[] {
  const events: RawEvent[] = [];
  let cur: Record<string, string> | null = null;
  for (const line of unfold(ics)) {
    if (line === 'BEGIN:VEVENT') { cur = {}; continue; }
    if (line === 'END:VEVENT') {
      if (cur?.DTSTART && cur.SUMMARY) {
        const s = parseDt(cur.DTSTART);
        const e = cur.DTEND ? parseDt(cur.DTEND) : null;
        if (s) {
          events.push({
            summary: unescape(cur.SUMMARY),
            location: unescape(cur.LOCATION || ''),
            description: unescape(cur.DESCRIPTION || ''),
            url: unescape(cur.URL || ''),
            date: s.date,
            start: s.time,
            end: e?.time ?? null,
            durationMin: cur.DURATION ? parseDuration(cur.DURATION) : null,
            rrule: cur.RRULE
              ? Object.fromEntries(cur.RRULE.split(';').map((kv) => kv.split('=') as [string, string]))
              : null,
          });
        }
      }
      cur = null;
      continue;
    }
    if (!cur) continue;
    const i = line.indexOf(':');
    if (i === -1) continue;
    cur[line.slice(0, i).split(';')[0].toUpperCase()] = line.slice(i + 1);
  }
  return events;
}

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function dow(date: string): number { return new Date(`${date}T12:00:00Z`).getUTCDay(); }

/** Dates of a (possibly recurring) event that fall in [from, to). */
export function occurrences(ev: RawEvent, from: string, to: string): string[] {
  if (!ev.rrule) return ev.date >= from && ev.date < to ? [ev.date] : [];
  const until = ev.rrule.UNTIL ? parseDt(ev.rrule.UNTIL)?.date ?? null : null;
  const out: string[] = [];
  for (let d = from; d < to; d = addDays(d, 1)) {
    if (d < ev.date || (until && d > until)) continue;
    const byday = (ev.rrule.BYDAY || DAY_CODES[dow(ev.date)]).split(',');
    if (ev.rrule.FREQ === 'WEEKLY') {
      if (byday.includes(DAY_CODES[dow(d)])) out.push(d);
    } else if (ev.rrule.FREQ === 'MONTHLY') {
      for (const b of byday) {
        const m = b.match(/^(-?\d)?([A-Z]{2})$/);
        if (!m || DAY_CODES[dow(d)] !== m[2]) continue;
        const nth = m[1] ? parseInt(m[1], 10) : 0;
        const day = parseInt(d.slice(8), 10);
        if (nth === 0 || Math.ceil(day / 7) === nth) out.push(d);
      }
    } else if (d === ev.date) out.push(d);
  }
  return out;
}

// Words after the em dash that describe the schedule, not the event itself.
const NON_TITLE_SUFFIX = /^(doors|every|weekly|monthly|mondays|tuesdays|wednesdays|thursdays|fridays|saturdays|sundays|weekends)\b/i;

/** "Movies in McCoppin 2026 — Bad Guys 2" → "Bad Guys 2"; keep "After School Drama — Wednesdays" as "After School Drama". */
export function cleanBoardTitle(summary: string): { title: string; umbrella: boolean } {
  const parts = summary.split(/\s+[—–]\s+/);
  if (parts.length < 2) return { title: summary.trim(), umbrella: false };
  const prefix = parts[0].trim();
  const rest = parts.slice(1).join(' — ').trim();
  if (NON_TITLE_SUFFIX.test(rest)) return { title: prefix, umbrella: false };
  // Drop a dangling "(" left by the feed's own truncation.
  return { title: rest.replace(/\s*\([^)]*$/, '').trim(), umbrella: true };
}

// Outer/Inner Sunset + Outer Richmond. Location must be in San Francisco and
// mention a neighborhood street, landmark, or ZIP.
const IN_AREA = /\b(9411[68]|9412[12]|judah|irving|noriega|taraval|ortega|quintara|kirkham|lawton|moraga|pacheco|santiago|rivera|vicente|wawona|lincoln|great highway|ocean beach|sunset|mccoppin|clement|balboa|cabrillo|fulton|anza|geary|golden gate park|(?:[89]|[1-4]\d)(?:st|nd|rd|th) ave)/i;

export function inCoverageArea(location: string): boolean {
  const l = location.toLowerCase();
  if (/berkeley|oakland|daly city|pacifica|market st/.test(l)) return false;
  return IN_AREA.test(l);
}

// Listings the editor asked us not to carry.
const EXCLUDED_TITLES = /baby and me pilates/i;

function guessType(text: string): string {
  const t = text.toLowerCase();
  if (/kid|family|trick or treat|toddler|baby|after school|movie/.test(t)) return 'family';
  if (/music|band|dj|concert|jam|open mic|dance/.test(t)) return 'music';
  if (/pilates|yoga|fitness|wellness/.test(t)) return 'wellness';
  if (/art|craft|pottery|paint|drama|theater|studio/.test(t)) return 'art';
  if (/market|food|flea|farmers/.test(t)) return 'food';
  return 'community';
}

function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = Math.min(h * 60 + m + mins, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Turn the feed into import-ready events for [from, to), with reasons for anything dropped. */
export function normalizeBoardFeed(ics: string, from: string, to: string): { events: BoardEvent[]; skipped: BoardSkip[] } {
  const skipped: BoardSkip[] = [];
  const candidates: (BoardEvent & { umbrella: boolean })[] = [];

  for (const raw of parseBoardFeed(ics)) {
    const dates = occurrences(raw, from, to);
    if (dates.length === 0) continue;
    const { title, umbrella } = cleanBoardTitle(raw.summary);
    if (EXCLUDED_TITLES.test(title)) {
      skipped.push({ title, date: dates[0], reason: 'excluded by editor' });
      continue;
    }
    if (!inCoverageArea(raw.location)) {
      skipped.push({ title, date: dates[0], reason: `outside coverage area (${raw.location.split(',')[0]})` });
      continue;
    }
    if (!raw.start) {
      skipped.push({ title, date: dates[0], reason: 'no start time (ongoing listing)' });
      continue;
    }
    const end = raw.end ?? (raw.durationMin ? addMinutes(raw.start, raw.durationMin) : undefined);
    const description = raw.description.replace(/\nDetails:.*$/s, '').slice(0, 500) || undefined;
    for (const d of dates) {
      candidates.push({
        title,
        // Drop the city/state tail; keep "Venue, street".
        location: raw.location.split(/,\s*San Francisco/i)[0].trim(),
        event_date: d,
        start_time: raw.start,
        end_time: end,
        description,
        event_type: guessType(`${raw.summary} ${raw.description}`),
        source_url: raw.url || 'https://sunsetboard.org/calendar/',
        umbrella,
      });
    }
  }

  // The board also posts "round-up" flyers (e.g. a shop listing other venues'
  // events under its own address). Collapse same-day, same-title pairs even
  // when venues differ, preferring the standalone listing.
  const events: BoardEvent[] = [];
  const sorted = [...candidates].sort((a, b) => Number(a.umbrella) - Number(b.umbrella));
  for (const c of sorted) {
    const dup = events.find((e) => e.event_date === c.event_date && titleSimilarity(e.title, c.title) >= 0.7);
    if (dup) {
      skipped.push({ title: c.title, date: c.event_date, reason: `repeat of "${dup.title}" within Sunset Board` });
      continue;
    }
    const { umbrella: _u, ...ev } = c;
    events.push(ev);
  }
  return { events, skipped };
}

export async function fetchSunsetBoard(from: string, to: string) {
  try {
    const res = await fetch(SUNSET_BOARD_FEED, { headers: { 'User-Agent': 'OuterSunsetToday/1.0 (outersunset.today)' } });
    if (!res.ok) return { name: 'Sunset Board', events: [] as BoardEvent[], skipped: [] as BoardSkip[], success: false };
    const { events, skipped } = normalizeBoardFeed(await res.text(), from, to);
    console.log(`Sunset Board: ${events.length} in range, ${skipped.length} skipped`, JSON.stringify(skipped));
    return { name: 'Sunset Board', events, skipped, success: true };
  } catch (err) {
    console.error('Sunset Board error:', err);
    return { name: 'Sunset Board', events: [] as BoardEvent[], skipped: [] as BoardSkip[], success: false };
  }
}
