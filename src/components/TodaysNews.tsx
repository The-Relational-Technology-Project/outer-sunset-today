import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNewsItems, submitNewsFeedback, NewsItem } from "@/hooks/useNewsItems";
import { ExternalLink, ThumbsUp, ThumbsDown, Newspaper, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categoryColors: Record<string, string> = {
  housing: "bg-sunset-orange/20 text-sunset-orange-foreground border-sunset-orange/30",
  transit: "bg-ocean-blue/20 text-ocean-blue-foreground border-ocean-blue/30",
  business: "bg-dune-tan/20 text-dune-tan-foreground border-dune-tan/30",
  community: "bg-sage-green/20 text-sage-green-foreground border-sage-green/30",
  government: "bg-primary/20 text-primary-foreground border-primary/30",
  education: "bg-ocean-blue/20 text-ocean-blue-foreground border-ocean-blue/30",
  environment: "bg-sage-green/20 text-sage-green-foreground border-sage-green/30",
  safety: "bg-primary/20 text-primary-foreground border-primary/30",
  health: "bg-sage-green/20 text-sage-green-foreground border-sage-green/30",
  culture: "bg-sunset-pink/20 text-sunset-pink-foreground border-sunset-pink/30",
};

function NewsItemCard({ item }: { item: NewsItem }) {
  const { toast } = useToast();
  const [voted, setVoted] = useState<string | null>(null);

  const handleFeedback = async (type: "helpful" | "not_helpful") => {
    if (voted) return;
    try {
      await submitNewsFeedback(item.id, type);
      setVoted(type);
    } catch {
      toast({ title: "Couldn't save feedback", variant: "destructive" });
    }
  };

  const categoryClass = categoryColors[item.category || ""] || "bg-muted text-muted-foreground border-muted";

  return (
    <div className="flex gap-3 py-3 border-b border-cork last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {item.category && (
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${categoryClass}`}>
              {item.category}
            </Badge>
          )}
          {item.is_actionable && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-coral/20 text-coral-foreground border-coral/30">
              <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
              actionable
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground">{item.source_name}</span>
        </div>
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-foreground hover:text-primary transition-colors inline-flex items-start gap-1 group"
        >
          <span className="group-hover:underline">{item.title}</span>
          <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
        {item.summary && (
          <p className="text-xs text-muted-foreground mt-1 font-handwritten leading-relaxed">
            {item.summary}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => handleFeedback("helpful")}
            disabled={!!voted}
            className={`text-[10px] flex items-center gap-1 transition-colors ${
              voted === "helpful"
                ? "text-sage-green font-semibold"
                : voted
                ? "text-muted-foreground/50 cursor-not-allowed"
                : "text-muted-foreground hover:text-sage-green"
            }`}
          >
            <ThumbsUp className="h-3 w-3" />
            {item.helpful_count > 0 && item.helpful_count}
          </button>
          <button
            onClick={() => handleFeedback("not_helpful")}
            disabled={!!voted}
            className={`text-[10px] flex items-center gap-1 transition-colors ${
              voted === "not_helpful"
                ? "text-primary font-semibold"
                : voted
                ? "text-muted-foreground/50 cursor-not-allowed"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <ThumbsDown className="h-3 w-3" />
            {item.not_helpful_count > 0 && item.not_helpful_count}
          </button>
        </div>
      </div>
    </div>
  );
}

export const TodaysNews = () => {
  const { data: newsItems = [], isLoading } = useNewsItems();

  if (isLoading) {
    return (
      <Card className="bg-paper border-cork shadow-bulletin">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Newspaper className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground font-bulletin">Neighborhood News</h3>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (newsItems.length === 0) return null;

  return (
    <Card className="bg-paper border-cork shadow-bulletin">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Newspaper className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground font-bulletin">Neighborhood News</h3>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3 font-handwritten">
          Stories that matter to the Outer Sunset
        </p>
        <div>
          {newsItems.map((item) => (
            <NewsItemCard key={item.id} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
