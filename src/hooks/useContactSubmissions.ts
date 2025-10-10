import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  submission_type: string;
  created_at: string;
}

export function useContactSubmissions() {
  return useQuery({
    queryKey: ['contact-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContactSubmission[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
