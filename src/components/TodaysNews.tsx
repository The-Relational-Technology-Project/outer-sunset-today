import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNewsItems, NewsItem } from "@/hooks/useNewsItems";
import { ExternalLink, Newspaper } from "lucide-react";

function NewsItemCard({ item }: { item: NewsItem }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-cork last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
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
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
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
          What matters in the Outer Sunset today
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
