import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FlyerSubmission {
  id: string;
  storage_path: string;
  submitter_email: string | null;
  created_at: string;
  processed: boolean;
  event_id: string | null;
  processing_notes: string | null;
}

export function useFlyerSubmissions(processedFilter?: boolean) {
  return useQuery({
    queryKey: ['flyer-submissions', processedFilter],
    queryFn: async () => {
      let query = supabase
        .from('flyer_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (processedFilter !== undefined) {
        query = query.eq('processed', processedFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FlyerSubmission[];
    },
  });
}

export async function getFlyerImageUrl(storagePath: string): Promise<string> {
  const { data } = await supabase.storage
    .from('event-flyers')
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (!data?.signedUrl) {
    throw new Error('Failed to get signed URL for flyer image');
  }

  return data.signedUrl;
}

export async function processFlyerSubmission(submissionId: string) {
  const { data, error } = await supabase.functions.invoke('scan-event-flyer', {
    body: { submission_id: submissionId }
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return data;
}
