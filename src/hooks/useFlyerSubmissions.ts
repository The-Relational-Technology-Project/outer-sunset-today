import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FlyerSubmission {
  id: string;
  storage_path: string;
  submitter_email: string | null;
  created_at: string;
  processed: boolean;
  processing_notes: string | null;
  event_id: string | null;
}

export function useFlyerSubmissions() {
  return useQuery({
    queryKey: ['flyer-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flyer_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FlyerSubmission[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export async function getFlyerImageUrl(storagePath: string): Promise<string | null> {
  try {
    const { data } = await supabase.storage
      .from('event-flyers')
      .createSignedUrl(storagePath, 3600); // 1 hour expiry
    
    return data?.signedUrl || null;
  } catch (error) {
    console.error('Error getting flyer image URL:', error);
    return null;
  }
}
