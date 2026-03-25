import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NewsItem {
  id: string;
  title: string;
  display_title: string | null;
  source_name: string;
  source_url: string;
  summary: string | null;
  category: string | null;
  relevance_score: number;
  is_actionable: boolean;
  published_at: string | null;
  created_at: string;
  helpful_count: number;
  not_helpful_count: number;
}

export function useNewsItems() {
  return useQuery({
    queryKey: ['news-items'],
    queryFn: async () => {
      // Get news from the last 48 hours
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .gte('created_at', cutoff)
        .order('relevance_score', { ascending: false })
        .limit(4);

      if (error) throw error;
      return (data || []) as NewsItem[];
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchInterval: 1000 * 60 * 30, // 30 minutes
  });
}

export async function submitNewsFeedback(itemId: string, feedbackType: 'helpful' | 'not_helpful') {
  const { error } = await supabase.rpc('increment_news_feedback', {
    item_id: itemId,
    feedback_type: feedbackType,
  });
  if (error) throw error;
}
