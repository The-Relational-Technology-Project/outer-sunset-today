import { describe, expect, test } from 'bun:test';
import { backfillFields, canonicalVenue, dedupeEventList, isLikelyDuplicate, normalizeEventIdentity } from './event-identity';

const market = {
  title: 'Outer Sunset Farmers Market & Mercantile',
  location: '37th Avenue between Ortega and Quintara, 37th Ave & Ortega St',
  event_date: '2026-11-01', start_time: '2026-11-01T17:00:00Z',
  source_url: 'https://sunsetboard.org/listing/outer-sunset-farmers-market/',
};
const publisher = { ...market, title: "Sunset Farmer's Market", location: 'Sunset Chinese Cultural District (SCCD), 1400 Judah St', source_url: 'https://sfsccd.org/en/other-sunset-community-events/sunset-farmer-market-1793552400' };
const official = { ...market, location: "Outer Sunset Farmer's Market & Mercantile, 1994 37th Ave", source_url: 'https://sunsetmercantilesf.com/osfmm/' };
const celebration = { ...market, title: '5th Annual Día de los Muertos + Market in the Sunset', location: 'Sunset Mercantile', source_url: null, description: 'Music, dance, and community ofrendas.' };
const funcheap = { ...market, title: 'Día de los Muertos Outer Sunset', location: '37th Ave @ Ortega St', source_url: 'https://sf.funcheap.com/annual-da-de-los-muertos-sunset-sf/' };

describe('Outer Sunset farmers market cross-source identity', () => {
  test('matches named venues, apostrophes, and street-address variants', () => {
    expect(canonicalVenue(official.location)).toBe('Outer Sunset Farmers Market');
    expect(isLikelyDuplicate(market, official)).toBe(true);
  });
  test('uses verified listing provenance instead of publisher address', () => {
    expect(isLikelyDuplicate(market, publisher)).toBe(true);
    expect(normalizeEventIdentity(publisher).location).toBe('Outer Sunset Farmers Market, 37th Avenue between Ortega and Quintara');
  });
  test('combines all five listings and keeps celebration details', () => {
    const result = dedupeEventList([market, publisher, official, celebration, funcheap]);
    expect(result.unique).toHaveLength(1);
    expect(result.dropped).toBe(4);
    expect(result.unique[0].title).toBe('Outer Sunset Farmers Market & Mercantile — Día de los Muertos');
    expect(result.unique[0].description).toBe(celebration.description);
  });
  test('preserves celebration details regardless of import order', () => {
    expect(backfillFields(market, celebration).title).toBe('Outer Sunset Farmers Market & Mercantile — Día de los Muertos');
    expect(dedupeEventList([celebration, official]).unique[0].title).toContain('Día de los Muertos');
  });
  test('keeps a separate library activity and market workshop', () => {
    expect(isLikelyDuplicate(market, { ...celebration, title: 'Activity: Día de los Muertos Spoon Calaveras', location: 'Ortega Library' })).toBe(false);
    expect(isLikelyDuplicate(market, { ...market, title: 'Día de los Muertos Art Workshop' })).toBe(false);
  });
  test('does not guess an unknown publisher or conflate Inner Sunset', () => {
    expect(isLikelyDuplicate(market, { ...publisher, source_url: 'https://example.com/market' })).toBe(false);
    expect(isLikelyDuplicate(market, { ...market, title: 'Inner Sunset Farmers Market', location: 'Inner Sunset Farmers Market' })).toBe(false);
  });
  test('keeps separate Sundays and distinct time windows', () => {
    expect(isLikelyDuplicate(market, { ...official, event_date: '2026-11-08' })).toBe(false);
    expect(isLikelyDuplicate(market, { ...official, start_time: '12:00' })).toBe(false);
    expect(isLikelyDuplicate(market, { ...official, start_time: '09:00' })).toBe(true);
  });
  test('reimporting the five variants adds nothing', () => {
    const first = dedupeEventList([market, publisher, official, celebration, funcheap]);
    expect(dedupeEventList([...first.unique, market, publisher, official, celebration, funcheap]).unique).toHaveLength(1);
  });
});