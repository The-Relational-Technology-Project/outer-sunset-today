import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// RSS sources for Outer Sunset / SF neighborhood news
const RSS_SOURCES = [
  { name: "Mission Local", url: "https://missionlocal.org/feed/" },
  { name: "Richmond Sunset News", url: "https://richmondsunsetnews.com/feed/" },
  { name: "SF Standard", url: "https://sfstandard.com/feed/" },
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

  // Simple regex-based XML parsing for RSS items
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
          // No date? Include it (might be recent)
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

async function analyzeWithAI(articles: ParsedArticle[]): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  if (articles.length === 0) return [];

  const articlesText = articles
    .map((a, i) => `[${i}] "${a.title}" (${a.sourceName})\n${a.description}`)
    .join("\n\n");

  const systemPrompt = `You are a neighborhood news curator for the Outer Sunset district of San Francisco — the foggy, beachy neighborhood stretching from roughly 19th Avenue to Ocean Beach, between Golden Gate Park and Sloat Boulevard.

Your job is to identify the 4–6 most important stories for residents, force-ranked using the News Futures Hierarchy of Information Needs:

TIER 1 — SURVIVAL (highest priority): Housing stability, transit disruptions, food access, economic opportunity, safety alerts, school enrollment/closures. These stories matter even if they don't mention "Outer Sunset" by name — e.g., an SFUSD lottery change affects Sunset families, a Great Highway decision has direct spillover.

TIER 2 — COMMUNITY CONNECTION: Local events, neighbor initiatives, business openings/closings, park and beach updates, community organizing.

TIER 3 — GENERAL INTEREST (lowest priority): City-wide policy, environment, culture, health. Only include if there's a clear Outer Sunset angle.

FORCE-RANK by this hierarchy. A Tier 1 story with a 0.5 relevance score outranks a Tier 3 story with 0.9.

For each relevant article, provide:
- index: the article index number from the input
- relevance_score: 0.0 to 1.0 reflecting both tier placement AND Outer Sunset specificity. Tier 1 stories start at 0.7 minimum. Tier 3 stories cap at 0.6 unless directly about the Outer Sunset.
- category: one of: housing, transit, business, community, government, education, environment, safety, health, culture
- is_actionable: true if a resident can DO something (attend a meeting, respond to a proposal, access a resource, prepare for a change)
- summary: 1-2 sentences written for a neighbor, not a journalist. Plain language. Focus on what it means for someone who lives here and what they can do about it.

ONLY include articles scoring 0.3 or above. Skip national news, sports scores, celebrity gossip, and stories with no SF neighborhood relevance. Return at most 6 articles.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze these articles for Outer Sunset relevance:\n\n${articlesText}` },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "submit_curated_news",
            description: "Submit the curated list of relevant news articles",
            parameters: {
              type: "object",
              properties: {
                articles: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      index: { type: "number" },
                      relevance_score: { type: "number" },
                      category: { type: "string", enum: ["housing", "transit", "business", "community", "government", "education", "environment", "safety", "health", "culture"] },
                      is_actionable: { type: "boolean" },
                      summary: { type: "string" },
                    },
                    required: ["index", "relevance_score", "category", "is_actionable", "summary"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["articles"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "submit_curated_news" } },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI gateway error:", response.status, errText);
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

  if (!toolCall) {
    console.warn("No tool call in AI response");
    return [];
  }

  const parsed = JSON.parse(toolCall.function.arguments);
  return parsed.articles || [];
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

    // Send to AI for analysis
    const aiResults = await analyzeWithAI(newArticles.map((h) => h.article));
    console.log(`AI flagged ${aiResults.length} relevant articles`);

    // Upsert relevant articles
    let insertedCount = 0;
    for (const result of aiResults) {
      const source = newArticles[result.index];
      if (!source) continue;

      const { error } = await supabase.from("news_items").upsert(
        {
          title: source.article.title,
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
      aiRelevant: aiResults.length,
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
