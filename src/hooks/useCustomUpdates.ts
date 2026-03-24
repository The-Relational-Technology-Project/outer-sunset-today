import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCustomUpdates() {
  return useQuery({
    queryKey: ["custom-updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_updates")
        .select("*")
        .eq("is_public", true)
        .order("subscriber_count", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
