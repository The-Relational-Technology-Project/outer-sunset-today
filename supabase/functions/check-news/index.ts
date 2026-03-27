import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// RSS sources for Outer Sunset / SF neighborhood news
const RSS_SOURCES = [
  { name: "Mission Local", url: "https://missionlocal.org/feed/" },
  { name: "Richmond Sunset News", url: "https://richmondsunsetnews.com/feed/" },
  { name: "The Frisc", url: "https://thefrisc.com/feed" },
];

interface ParsedArticle {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  sourceName: string;
}

async function hashString(str: string): Promise<string> {
  const data = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseRSSFeed(xml: string, sourceName: string): ParsedArticle[] {
  const articles: ParsedArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/)?.[1] ||
      itemXml.match(/<title>(.*?)<\/title>/)?.[1] || "";
    
    const link = itemXml.match(/<link><!\[CDATA\[(.*?)\]\]>|<link>(.*?)<\/link>/)?.[1] ||
      itemXml.match(/<link>(.*?)<\/link>/)?.[1] || "";
    
    const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]>/s)?.[1] ||
      itemXml.match(/<description>(.*?)<\/description>/s)?.[1] || "";
    
    const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

    if (title && link) {
      articles.push({
        title: title.replace(/<[^>]*>/g, "").trim(),
        link: link.trim(),
        description: description.replace(/<[^>]*>/g, "").substring(0, 500).trim(),
        pubDate,
        sourceName,
      });
    }
  }

  return articles;
}

async function fetchRSSArticles(hoursBack: number = 48): Promise<ParsedArticle[]> {
  const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const allArticles: ParsedArticle[] = [];

  for (const source of RSS_SOURCES) {
    try {
      const response = await fetch(source.url, {
        headers: { "User-Agent": "OuterSunsetToday/1.0 (community news aggregator)" },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch ${source.name}: ${response.status}`);
        continue;
      }

      const xml = await response.text();
      const articles = parseRSSFeed(xml, source.name);

      for (const article of articles) {
        if (article.pubDate) {
          const pubDate = new Date(article.pubDate);
          if (pubDate >= cutoff) {
            allArticles.push(article);
          }
        } else {
          allArticles.push(article);
        }
      }

      console.log(`Fetched ${articles.length} articles from ${source.name}`);
    } catch (err) {
      console.error(`Error fetching ${source.name}:`, err);
    }
  }

  return allArticles;
}

async function analyzeWithClaude(articles: ParsedArticle[]): Promise<any[]> {
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

  if (articles.length === 0) return [];

  const articlesText = articles
    .map((a, i) => `[${i}] "${a.title}" (${a.sourceName})\n${a.description}`)
    .join("\n\n");

  const systemPrompt = `You are a neighborhood news curator for the Outer Sunset and Richmond districts of San Francisco. Your audience lives in the foggy, beachy neighborhoods stretching from roughly 19th Avenue to Ocean Beach.

This site, Outer Sunset Today, exists to help neighbors stay informed about what matters most in their daily lives. It is NOT a news site — it is a community bulletin board. The tone is calm, helpful, and neighborly.

SELECTION: Choose between 1 and 4 stories — only include stories that genuinely matter to Outer Sunset / Richmond neighbors. It is BETTER to return 1 great story than 4 mediocre ones. Every story must score at least 0.6 relevance. Force-rank using the News Futures Hierarchy of Information Needs:

TIER 1 — BASIC NEEDS & SAFETY (highest priority):
Housing stability, rent/eviction policy, transit disruptions (N-Judah, L-Taraval, 5-Fulton, 28-19th Ave, 29-Sunset), food access, economic opportunity, safety alerts, school enrollment/closures, healthcare access. These stories matter even if they don't name the Sunset/Richmond — e.g., an SFUSD policy change affects Sunset families; a Great Highway decision has direct spillover.

TIER 2 — CIVIC PARTICIPATION:
City council votes, planning commission hearings, ballot measures, public comment periods, community meetings, neighborhood association actions. Prioritize items where a resident can actually participate or where a decision directly affects the Sunset/Richmond.

TIER 3 — COMMUNITY CONNECTION:
Local events, neighbor initiatives, business openings/closings, park and beach updates, community organizing, mutual aid.

TIER 4 — GENERAL INTEREST (lowest priority):
City-wide policy, environment, culture, health. Only include if there's a clear Sunset/Richmond angle.

FORCE-RANK by tier. A Tier 1 story always outranks a Tier 3 story regardless of other scores. Within a tier, prefer stories that are more hyperlocal to the Sunset and Richmond districts.

DEDUPLICATION: If multiple articles cover the same underlying story or event, select only ONE — the version with the most useful detail for neighbors. Do not return duplicate stories even if they come from different publications.

HEADLINE REWRITING:
For each selected article, rewrite the headline to be:
- Informative, not sensationalist or clickbait
- Focused on what happened and what it means for neighbors
- Free of alarm words ("SHOCKING", "OUTRAGE"), emotional triggers, or question-bait ("Is your neighborhood safe?")
- Written as if you're telling a neighbor over coffee
- Under 80 characters
- Plain language, no jargon

For each article, provide:
- index: article index from input
- display_title: your rewritten headline
- relevance_score: 0.0–1.0 (Tier 1 starts at 0.7; Tier 4 caps at 0.5). MINIMUM 0.6 to be included.
- category: housing | transit | business | community | government | education | environment | safety | health | culture
- is_actionable: true if a resident can DO something
- summary: 1–2 sentences for a neighbor. Plain language. What it means here, what they can do.

Return 1–4 articles. Only include stories scoring 0.6 or above. If only 1 story clears that bar, return just 1. Skip national news, sports, celebrity, arts/culture reviews with no neighborhood angle, and stories with no SF neighborhood relevance.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        { role: "user", content: `Analyze these articles for Outer Sunset/Richmond relevance:\n\n${articlesText}` },
      ],
      tools: [
        {
          name: "submit_curated_news",
          description: "Submit the curated list of relevant news articles",
          input_schema: {
            type: "object",
            properties: {
              articles: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    index: { type: "number" },
                    display_title: { type: "string" },
                    relevance_score: { type: "number" },
                    category: { type: "string", enum: ["housing", "transit", "business", "community", "government", "education", "environment", "safety", "health", "culture"] },
                    is_actionable: { type: "boolean" },
                    summary: { type: "string" },
                  },
                  required: ["index", "display_title", "relevance_score", "category", "is_actionable", "summary"],
                },
              },
            },
            required: ["articles"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "submit_curated_news" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Claude API error:", response.status, errText);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();

  // Claude returns tool use in content array
  const toolUseBlock = data.content?.find((block: any) => block.type === "tool_use");

  if (!toolUseBlock) {
    console.warn("No tool_use block in Claude response");
    return [];
  }

  return toolUseBlock.input?.articles || [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Fetching RSS articles...");
    const articles = await fetchRSSArticles(48);
    console.log(`Found ${articles.length} recent articles across all sources`);

    if (articles.length === 0) {
      return new Response(JSON.stringify({ message: "No recent articles found", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check which articles we already have
    const hashes = await Promise.all(
      articles.map(async (a) => ({
        article: a,
        hash: await hashString(a.sourceName + a.link),
      }))
    );

    const { data: existing } = await supabase
      .from("news_items")
      .select("article_hash")
      .in("article_hash", hashes.map((h) => h.hash));

    const existingHashes = new Set((existing || []).map((e: any) => e.article_hash));
    const newArticles = hashes.filter((h) => !existingHashes.has(h.hash));

    console.log(`${newArticles.length} new articles to analyze (${existingHashes.size} already in DB)`);

    if (newArticles.length === 0) {
      return new Response(JSON.stringify({ message: "No new articles to process", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send to Claude for analysis
    const claudeResults = await analyzeWithClaude(newArticles.map((h) => h.article));
    console.log(`Claude returned ${claudeResults.length} articles`);

    // Filter out articles below relevance threshold (server-side safety net)
    const relevantResults = claudeResults.filter((r: any) => r.relevance_score >= 0.6);
    console.log(`${relevantResults.length} articles passed 0.6 relevance threshold`);

    // Upsert relevant articles
    let insertedCount = 0;
    for (const result of relevantResults) {
      const source = newArticles[result.index];
      if (!source) continue;

      const { error } = await supabase.from("news_items").upsert(
        {
          title: source.article.title,
          display_title: result.display_title,
          source_name: source.article.sourceName,
          source_url: source.article.link,
          article_hash: source.hash,
          summary: result.summary,
          category: result.category,
          relevance_score: result.relevance_score,
          is_actionable: result.is_actionable,
          published_at: source.article.pubDate ? new Date(source.article.pubDate).toISOString() : new Date().toISOString(),
        },
        { onConflict: "article_hash" }
      );

      if (error) {
        console.error("Insert error:", error);
      } else {
        insertedCount++;
      }
    }

    const summary = {
      message: "News check complete",
      totalFetched: articles.length,
      newArticles: newArticles.length,
      claudeReturned: claudeResults.length,
      passedThreshold: relevantResults.length,
      inserted: insertedCount,
    };

    console.log("Summary:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("check-news error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
