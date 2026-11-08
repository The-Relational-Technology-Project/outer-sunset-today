import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { feedMeta, parseFeedParams, transformMenu, transformNews, type FeedKind } from './public-feeds.ts';

const headers = {
  ...corsHeaders, 'Content-Type': 'application/json',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// Public data only: the anonymous key keeps existing read policies in force.
export function publicFeedHandler(kind: FeedKind) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response(null, { headers });
    const meta = feedMeta();
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
      status, headers: { ...headers, ...(status === 200 ? { 'Cache-Control': 'public, max-age=300' } : {}) },
    });
    if (req.method !== 'GET') return new Response(JSON.stringify({ meta, error: 'Only GET is supported' }), {
      status: 405, headers: { ...headers, Allow: 'GET, OPTIONS' },
    });
    let filters;
    try { filters = parseFeedParams(new URL(req.url).searchParams, kind); }
    catch (error) { return json({ meta, error: error instanceof Error ? error.message : 'Invalid parameters' }, 400); }
    try {
      const serviceUrl = Deno.env.get('SUPABASE_URL');
      const publicKey = Deno.env.get('SUPABASE_ANON_KEY');
      if (!serviceUrl || !publicKey) throw new Error('Public read configuration unavailable');
      const db = createClient(serviceUrl, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { id, startAfter, startBefore, q, limit, offset } = filters;
      if (kind === 'news') {
        let query = db.from('news_items').select('id,title,display_title,summary,category,is_actionable,published_at,created_at,source_name,source_url');
        if (id) query = query.eq('id', id);
        else {
          // Use collected_at, matching Today's News even when a publisher omits its timestamp.
          query = query.gte('created_at', startAfter);
          if (startBefore) query = query.lt('created_at', new Date(Date.parse(`${startBefore}T00:00:00Z`) + 86400000).toISOString());
          if (q) query = query.ilike('title', `%${q}%`);
        }
        const { data, error } = await query.order('created_at', { ascending: false })
          .order('relevance_score', { ascending: false }).order('id').range(offset, offset + limit - 1);
        if (error) throw error;
        const items = (data || []).map(transformNews);
        if (id) return items[0] ? json({ meta, news_item: items[0] }) : json({ meta, error: 'News item not found' }, 404);
        return json({ meta, news_items: items, count: items.length, filters_applied: filters });
      }
      let query = db.from('daily_menus').select('id,restaurant,location,menu_date,special_item,category,price,hours,created_at');
      if (kind === 'school') query = query.eq('category', 'school');
      else query = query.eq('category', 'pizza').ilike('restaurant', '%arizmendi%');
      if (id) query = query.eq('id', id);
      else {
        query = query.gte('menu_date', startAfter);
        if (startBefore) query = query.lte('menu_date', startBefore);
        if (q) query = query.ilike('special_item', `%${q}%`);
      }
      const { data, error } = await query.order('menu_date').order('id').range(offset, offset + limit - 1);
      if (error) throw error;
      const items = (data || []).map(row => transformMenu(row, kind));
      if (id) return items[0] ? json({ meta, menu: items[0] }) : json({ meta, error: 'Menu not found' }, 404);
      return json({ meta, menus: items, count: items.length, filters_applied: filters });
    } catch (error) {
      console.error(`Public ${kind} feed failed`, error instanceof Error ? error.message : 'Query failed');
      return json({ meta, error: 'Feed temporarily unavailable' }, 500);
    }
  };
}