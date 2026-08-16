import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, RefreshCw, Trash2 } from "lucide-react";

interface DuplicateEvent {
  id: string;
  title: string;
  location: string;
  event_date: string;
  start_time: string;
  end_time: string | null;
  description: string | null;
  source_url: string | null;
  status: string;
  created_at: string;
}

interface DuplicatePair {
  venue: string;
  similarity: number;
  a: DuplicateEvent;
  b: DuplicateEvent;
}

const timeFmt = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
  });

export function DuplicateReview() {
  const [pairs, setPairs] = useState<DuplicatePair[] | null>(null);
  const [scanned, setScanned] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const password = () => sessionStorage.getItem("admin_password") || "";

  const scan = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-events", {
        body: { action: "find-duplicates", password: password() },
      });
      if (error) throw error;
      setPairs(data.pairs || []);
      setScanned(data.scanned || 0);
    } catch (error: any) {
      toast({ title: "Scan failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const merge = async (keepId: string, removeId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("manage-events", {
        body: { action: "merge-duplicates", keepId, removeId, password: password() },
      });
      if (error) throw error;
      toast({ title: "Merged", description: "Duplicate removed and details kept." });
      setPairs((prev) => (prev || []).filter((p) => p.a.id !== removeId && p.b.id !== removeId));
    } catch (error: any) {
      toast({ title: "Merge failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const renderSide = (event: DuplicateEvent, other: DuplicateEvent) => (
    <div className="flex-1 rounded-md border p-3 space-y-1">
      <p className="font-semibold">{event.title}</p>
      <p className="text-sm text-muted-foreground">{event.location}</p>
      <p className="text-sm text-muted-foreground">{timeFmt(event.start_time)}</p>
      <p className="text-xs text-muted-foreground break-all">{event.source_url || "no source link"}</p>
      <p className="text-xs text-muted-foreground">
        added {new Date(event.created_at).toLocaleDateString()} · {event.status}
      </p>
      <Button
        size="sm"
        variant="outline"
        className="mt-2 w-full"
        disabled={isLoading}
        onClick={() => merge(event.id, other.id)}
      >
        Keep this one
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Possible duplicates</CardTitle>
            <CardDescription>
              Upcoming events that share a date, venue, start time window, and a very similar title.
            </CardDescription>
          </div>
          <Button onClick={scan} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {pairs === null ? "Scan" : "Rescan"}
          </Button>
        </CardHeader>
        {pairs !== null && (
          <CardContent className="text-sm text-muted-foreground">
            Scanned {scanned} upcoming events — {pairs.length} suspected pair{pairs.length === 1 ? "" : "s"}.
          </CardContent>
        )}
      </Card>

      {pairs?.map((pair) => (
        <Card key={`${pair.a.id}-${pair.b.id}`}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Copy className="w-4 h-4" />
              {new Date(`${pair.a.event_date}T12:00:00`).toLocaleDateString()} · {pair.venue}
            </CardTitle>
            <CardDescription>{pair.similarity}% title match</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              {renderSide(pair.a, pair.b)}
              {renderSide(pair.b, pair.a)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Trash2 className="w-3 h-3" />
              Keeping one deletes the other and copies over any missing source link, description, or end time.
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
