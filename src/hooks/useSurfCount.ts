import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from 'date-fns-tz';

export function useSurfCount() {
  const queryClient = useQueryClient();

  // Fetch today's surf count
  const { data: surfCount = 0, isLoading } = useQuery({
    queryKey: ["surf-count"],
    queryFn: async () => {
      const today = formatInTimeZone(new Date(), 'America/Los_Angeles', 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from("surf_counts")
        .select("count")
        .eq("surf_date", today)
        .maybeSingle();

      if (error) throw error;
      return data?.count || 0;
    },
  });

  // Increment surf count using database function
  const incrementMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("increment_surf_count");
      if (error) throw error;
      return data;
    },
    onSuccess: (newCount) => {
      queryClient.setQueryData(["surf-count"], newCount);
    },
  });

  return {
    surfCount,
    isLoading,
    incrementSurfCount: incrementMutation.mutate,
    isIncrementing: incrementMutation.isPending,
  };
}
