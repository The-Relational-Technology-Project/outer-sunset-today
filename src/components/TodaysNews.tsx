import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNewsItems, NewsItem } from "@/hooks/useNewsItems";
import { ExternalLink } from "lucide-react";

function NewsItemCard({ item }: { item: NewsItem }) {
  return (
    <Card className="bulletin-card">
      <CardContent className="p-4">
        <p className="text-[10px] text-muted-foreground mb-1">{item.source_name}</p>
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-foreground hover:text-primary transition-colors inline-flex items-start gap-1 group leading-snug"
        >
          <span className="group-hover:underline">{item.display_title || item.title}</span>
          <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
        {item.summary && (
          <p className="text-xs text-muted-foreground mt-1.5 font-handwritten leading-relaxed">
            {item.summary}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export const TodaysNews = () => {
  const { data: newsItems = [], isLoading } = useNewsItems();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i} className="bulletin-card">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (newsItems.length === 0) {
    return (
      <Card className="bulletin-card">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">No news stories today.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {newsItems.map((item) => (
        <NewsItemCard key={item.id} item={item} />
      ))}
    </div>
  );
};
