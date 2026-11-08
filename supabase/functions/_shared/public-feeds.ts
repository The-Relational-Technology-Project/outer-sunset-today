export const TIMEZONE = 'America/Los_Angeles';
export type FeedKind = 'pizza' | 'school' | 'news';

export function feedMeta(now = new Date()) {
  return {
    api_version: '0.1',
    publisher: 'outersunset.today',
    steward: { name: 'Relational Tech Project', contact: 'hello@relationaltechproject.org' },
    neighborhood: 'Outer Sunset, San Francisco',
    license: 'CC BY 4.0',
    timezone: TIMEZONE,
    updated_at: now.toISOString(),
  };
}

export function pacificDate(now: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

export function parseFeedParams(params: URLSearchParams, kind: FeedKind, now = new Date()) {
  const allowed = new Set(['id', 'date', 'start_after', 'start_before', 'q', 'limit', 'offset']);
  for (const key of params.keys()) {
    if (!allowed.has(key)) throw new Error(`Unknown parameter: ${key}`);
    if (params.getAll(key).length > 1) throw new Error(`Repeated parameter: ${key}`);
  }
  const id = params.get('id');
  if (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error('id must be a UUID');
  }
  for (const key of ['date', 'start_after', 'start_before']) {
    const value = params.get(key);
    if (value !== null && !validDate(value)) throw new Error(`${key} must be a valid YYYY-MM-DD date`);
  }
  const date = params.get('date');
  if (date && (params.has('start_after') || params.has('start_before'))) {
    throw new Error('Use date or a date range, not both');
  }
  const startAfter = date || params.get('start_after') || (kind === 'news'
    ? new Date(now.getTime() - 7 * 86400000).toISOString()
    : pacificDate(now));
  const startBefore = date || params.get('start_before');
  if (startBefore && startAfter.slice(0, 10) > startBefore) {
    throw new Error('start_before must not precede start_after');
  }
  const limitText = params.get('limit') ?? (kind === 'news' ? '4' : '50');
  const offsetText = params.get('offset') ?? '0';
  if (!/^\d+$/.test(limitText) || Number(limitText) < 1 || Number(limitText) > 100) {
    throw new Error('limit must be an integer from 1 to 100');
  }
  if (!/^\d+$/.test(offsetText) || Number(offsetText) > 10000) {
    throw new Error('offset must be an integer from 0 to 10000');
  }
  const q = params.get('q')?.trim() || null;
  if (q && (q.length > 200 || /[%_]/.test(q))) throw new Error('q must be at most 200 characters without wildcard characters');
  return { id, startAfter, startBefore, q, limit: Number(limitText), offset: Number(offsetText) };
}

export interface MenuRow {
  id: string; restaurant: string; location: string; menu_date: string;
  special_item: string; category: string; price: string | null; hours: string; created_at: string;
}

export function transformMenu(row: MenuRow, kind: 'pizza' | 'school') {
  return {
    id: row.id, name: row.restaurant, date: row.menu_date,
    description: row.special_item,
    items: row.special_item.split(';').map(item => item.trim()).filter(Boolean),
    category: [kind === 'school' ? 'school_lunch' : 'pizza'],
    location: { name: row.location, neighborhood: 'Outer Sunset, San Francisco' },
    price: row.price, hours: row.hours,
    url: kind === 'pizza' ? 'https://www.arizmendibakery.com/pizza'
      : 'https://www.sfusd.edu/services/health-wellness/nutrition-school-meals/menus',
    source: { publisher: 'outersunset.today', collected_at: row.created_at, license: 'CC BY 4.0' },
  };
}

export interface NewsRow {
  id: string; title: string; display_title: string | null; summary: string | null;
  category: string | null; is_actionable: boolean | null; published_at: string | null;
  created_at: string; source_name: string; source_url: string;
}

export function transformNews(row: NewsRow) {
  return {
    id: row.id, name: row.display_title || row.title, description: row.summary,
    category: row.category ? [row.category.toLowerCase()] : [],
    published_at: row.published_at, collected_at: row.created_at,
    is_actionable: row.is_actionable, url: row.source_url,
    source: { name: row.source_name, url: row.source_url, publisher: 'outersunset.today',
      collected_at: row.created_at, license: 'CC BY 4.0' },
  };
}