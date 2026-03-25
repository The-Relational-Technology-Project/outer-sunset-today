

## Switch News Pipeline to Claude API

Replace the Lovable AI gateway with the Anthropic Claude API for news curation. Add headline rewriting to reduce sensationalism. Preserve and enhance the News Futures Hierarchy of Information Needs in the system prompt.

### 1. Add ANTHROPIC_API_KEY secret

Use `add_secret` to request your Claude API key. The edge function will use this instead of LOVABLE_API_KEY.

### 2. Add `display_title` column to `news_items`

Migration to add a nullable text column for Claude's rewritten headline. Original `title` stays for reference.

```sql
ALTER TABLE public.news_items ADD COLUMN display_title text;
```

### 3. Update `check-news/index.ts` — swap to Claude API

**Replace `analyzeWithAI` function entirely:**

- Call `https://api.anthropic.com/v1/messages` with `anthropic-version: 2023-06-01` header
- Use Claude's native tool-use format (not OpenAI-compatible)
- Model: `claude-sonnet-4-20250514` (strong reasoning, cost-effective)
- Add `display_title` to the tool schema output

**Updated system prompt** — enhanced with the full News Futures framework, hyperlocal bias, and headline rewriting rules:

```
You are a neighborhood news curator for the Outer Sunset and Richmond districts
of San Francisco. Your audience lives in the foggy, beachy neighborhoods
stretching from roughly 19th Avenue to Ocean Beach.

This site, Outer Sunset Today, exists to help neighbors stay informed about
what matters most in their daily lives. It is NOT a news site — it is a
community bulletin board. The tone is calm, helpful, and neighborly.

SELECTION: Choose exactly 4 stories, force-ranked using the News Futures
Hierarchy of Information Needs:

TIER 1 — BASIC NEEDS & SAFETY (highest priority):
Housing stability, rent/eviction policy, transit disruptions (N-Judah, L-Taraval,
5-Fulton, 28-19th Ave, 29-Sunset), food access, economic opportunity, safety
alerts, school enrollment/closures, healthcare access. These stories matter even
if they don't name the Sunset/Richmond — e.g., an SFUSD policy change affects
Sunset families; a Great Highway decision has direct spillover.

TIER 2 — CIVIC PARTICIPATION:
City council votes, planning commission hearings, ballot measures, public comment
periods, community meetings, neighborhood association actions. Prioritize items
where a resident can actually participate or where a decision directly affects
the Sunset/Richmond.

TIER 3 — COMMUNITY CONNECTION:
Local events, neighbor initiatives, business openings/closings, park and beach
updates, community organizing, mutual aid.

TIER 4 — GENERAL INTEREST (lowest priority):
City-wide policy, environment, culture, health. Only include if there's a clear
Sunset/Richmond angle.

FORCE-RANK by tier. A Tier 1 story always outranks a Tier 3 story regardless
of other scores. Within a tier, prefer stories that are more hyperlocal to the
Sunset and Richmond districts.

HEADLINE REWRITING:
For each selected article, rewrite the headline to be:
- Informative, not sensationalist or clickbait
- Focused on what happened and what it means for neighbors
- Free of alarm words ("SHOCKING", "OUTRAGE"), emotional triggers, or
  question-bait ("Is your neighborhood safe?")
- Written as if you're telling a neighbor over coffee
- Under 80 characters
- Plain language, no jargon

For each article, provide:
- index: article index from input
- display_title: your rewritten headline
- relevance_score: 0.0–1.0 (Tier 1 starts at 0.7; Tier 4 caps at 0.5)
- category: housing | transit | business | community | government | education |
  environment | safety | health | culture
- is_actionable: true if a resident can DO something
- summary: 1–2 sentences for a neighbor. Plain language. What it means here,
  what they can do.

Return exactly 4 articles. Skip national news, sports, celebrity, and stories
with no SF neighborhood relevance.
```

**Claude API call shape:**
```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 2048,
  "system": "<system prompt above>",
  "messages": [{ "role": "user", "content": "Analyze these articles..." }],
  "tools": [{
    "name": "submit_curated_news",
    "description": "Submit curated news articles",
    "input_schema": {
      "type": "object",
      "properties": {
        "articles": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "index": { "type": "number" },
              "display_title": { "type": "string" },
              "relevance_score": { "type": "number" },
              "category": { "type": "string" },
              "is_actionable": { "type": "boolean" },
              "summary": { "type": "string" }
            },
            "required": ["index", "display_title", "relevance_score", "category", "is_actionable", "summary"]
          }
        }
      },
      "required": ["articles"]
    }
  }],
  "tool_choice": { "type": "tool", "name": "submit_curated_news" }
}
```

Store `display_title` in the upsert alongside existing fields.

### 4. Frontend changes

**`useNewsItems.ts`**: Add `display_title: string | null` to the `NewsItem` interface.

**`TodaysNews.tsx`**: Render `item.display_title || item.title` in the headline link.

### 5. Fix build error

The current build error is about `@supabase/realtime-js` resolution in the edge function. This will be resolved by the redeployment of the updated `check-news` function.

### Implementation order

1. Request `ANTHROPIC_API_KEY` secret from you
2. Add `display_title` column via migration
3. Rewrite `check-news/index.ts` to use Claude API with enhanced hierarchy prompt + headline rewriting
4. Update `useNewsItems.ts` and `TodaysNews.tsx` for `display_title`

