import { describe, expect, test } from 'bun:test';
import { feedMeta, pacificDate, parseFeedParams, transformMenu, transformNews } from './public-feeds';

describe('public Neighborhood feeds', () => {
  test('menus start on the Pacific date, not the UTC date', () => {
    const now = new Date('2026-11-08T03:24:00Z');
    expect(pacificDate(now)).toBe('2026-11-07');
    expect(parseFeedParams(new URLSearchParams(), 'pizza', now).startAfter).toBe('2026-11-07');
  });
  test('news defaults match four stories collected over seven days', () => {
    const filters = parseFeedParams(new URLSearchParams(), 'news', new Date('2026-11-08T03:24:00Z'));
    expect(filters.startAfter).toBe('2026-11-01T03:24:00.000Z');
    expect(filters.limit).toBe(4);
  });
  test('validates date ranges and bounded pagination', () => {
    for (const text of ['date=2026-02-30', 'limit=0', 'limit=101', 'offset=-1', 'start_after=2026-11-09&start_before=2026-11-08', 'date=2026-11-09&start_after=2026-11-08', 'limit=4&limit=5', 'unexpected=yes']) {
      expect(() => parseFeedParams(new URLSearchParams(text), 'school')).toThrow();
    }
    expect(parseFeedParams(new URLSearchParams('date=2026-11-09&limit=100&offset=100'), 'school').startBefore).toBe('2026-11-09');
  });
  test('preserves full vegetarian and cold lunch options', () => {
    const menu = transformMenu({ id: 'one', restaurant: 'SFUSD School Lunch', location: 'SFUSD',
      menu_date: '2026-11-09', special_item: 'Hot entree; Vegetarian option; Cold sandwich',
      category: 'school', price: null, hours: 'Lunch', created_at: '2026-11-01T00:00:00Z' }, 'school');
    expect(menu.items).toEqual(['Hot entree', 'Vegetarian option', 'Cold sandwich']);
    expect(menu.description).toBe('Hot entree; Vegetarian option; Cold sandwich');
  });
  test('news uses curated headline and original article attribution', () => {
    const item = transformNews({ id: 'one', title: 'Original', display_title: 'Curated', summary: 'Summary',
      category: 'Civic', is_actionable: true, published_at: null, created_at: '2026-11-01T00:00:00Z',
      source_name: 'Local paper', source_url: 'https://example.org/story' });
    expect(item.name).toBe('Curated');
    expect(item.url).toBe('https://example.org/story');
    expect(item.source.name).toBe('Local paper');
    expect(feedMeta().api_version).toBe('0.1');
  });
});