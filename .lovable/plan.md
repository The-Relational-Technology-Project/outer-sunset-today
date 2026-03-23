

## News Pipeline for Outer Sunset Today

Adapting the proposed architecture to work natively within Lovable Cloud, replacing GitHub Actions + Python + Claude with a Supabase edge function + cron + Lovable AI.

### Why the adaptation

- Lovable Cloud already has a pre-configured AI gateway (Lovable AI) that covers the same analysis/summarization needs -- no Anthropic API key required
- Supabase edge functions + pg_cron replace GitHub Actions + Python, keeping everything in one system
- RSS parsing works fine in Deno/TypeScript

### What gets built

**1. Database: `news_items` table**

```text
news_items
├── id (uuid, PK)
├── title (text)
├── source_name (text)         -- "SFChronicle", "Sunset Beacon", etc.
├── source_url (text)          -- original article link
├── article_hash (text, unique) -- dedup key
├── summary (text)             -- AI-written neighbor-friendly summary
├── category (text)            -- housing, transit, business, etc.
├── relevance_score (numeric)  -- 0-1
├── is_actionable (boolean)
├── published_at (timestamptz)
├── created_at (timestamptz)
├── helpful_count (int, default 0)
├── not_helpful_count (int, default 0)
```

RLS: public SELECT, service-role INSERT/UPDATE only. Add a public UPDATE policy limited to incrementing helpful/not_helpful counts via a database function.

**2. Edge function: `check-news`**

Single Deno edge function that:
- Fetches RSS from the 4 sources (using built-in XML parsing or a lightweight parser)
- Filters to articles from the last 24 hours
- Sends batch to Lovable AI (gemini-3-flash-preview) with the relevance/categorization prompt
- Upserts results into `news_items` on `article_hash`

The relevance prompt follows the NF Hierarchy approach described in the plan: survival-level info first, actionable items prioritized, neighbor-friendly language.

**3. Cron schedule**

pg_cron job calling the edge function twice daily (7am and 5pm Pacific), matching the proposed GitHub Actions schedule.

**4. Frontend: News section on homepage**

New `TodaysNews` component inserted on the Index page above or alongside today's events. Displays:
- Curated stories sorted by relevance score
- Category badge, source attribution, actionable flag
- Link to full article
- "Helpful?" thumbs up/down (writes to helpful_count/not_helpful_count)

New `useNewsItems` hook querying the `news_items` table for today's stories.

### Implementation order

1. Create `news_items` table + RLS policies + feedback increment function (migration)
2. Build `check-news` edge function with RSS fetch + Lovable AI analysis
3. Set up pg_cron schedule
4. Build `useNewsItems` hook + `TodaysNews` component
5. Add news section to Index.tsx (above today's events, below weather)

### Technical details

- **AI model**: `google/gemini-3-flash-preview` via Lovable AI gateway -- fast, cheap, good enough for categorization/summarization
- **RSS parsing**: Use Deno's built-in DOMParser or a lightweight XML-to-JSON approach
- **Dedup**: SHA-256 hash of `source_name + article URL` stored as `article_hash`
- **Feedback function**: `increment_news_feedback(item_id uuid, feedback_type text)` as a SECURITY DEFINER function, callable by anon users but limited to incrementing counts

### What's deferred (Phase 2+)

- Instagram/newsletter sources (no RSS, needs different approach)
- Topic subscriptions / personalization
- "Save to my list" integration with MyPlan context
- Information hierarchy restructuring of the full page

