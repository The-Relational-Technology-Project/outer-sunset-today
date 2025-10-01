import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Lock } from "lucide-react";

interface PendingEvent {
  id: string;
  title: string;
  location: string;
  start_time: string;
  event_date: string;
  event_type: string;
  description: string | null;
  created_at: string;
  event_submissions?: Array<{ submitter_email: string }>;
}

export default function Admin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if already authenticated
    const adminAuth = sessionStorage.getItem("admin_auth");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
      loadPendingEvents();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Verify password by trying to list events
      const { data, error } = await supabase.functions.invoke('manage-events', {
        body: { action: 'list', password }
      });

      if (error) throw error;

      sessionStorage.setItem("admin_auth", "true");
      setIsAuthenticated(true);
      setPendingEvents(data.events || []);
      
      toast({
        title: "Login successful",
        description: "Welcome to the admin panel",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-events', {
        body: { action: 'list', password }
      });

      if (error) throw error;
      setPendingEvents(data.events || []);
    } catch (error: any) {
      toast({
        title: "Error loading events",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (eventId: string, action: 'approve' | 'reject') => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manage-events', {
        body: { action, eventId, password }
      });

      if (error) throw error;

      toast({
        title: `Event ${action}d`,
        description: `The event has been ${action}d successfully`,
      });

      // Reload events
      await loadPendingEvents();
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    setIsAuthenticated(false);
    setPassword("");
    setPendingEvents([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sunset-50 to-sunset-100">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto mt-20">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Admin Login</CardTitle>
                <CardDescription>
                  Enter the admin password to access event management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter admin password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sunset-50 to-sunset-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Event Management</h1>
            <p className="text-muted-foreground">
              Review and approve pending event submissions
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        {isLoading && pendingEvents.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : pendingEvents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No pending events to review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingEvents.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{event.title}</CardTitle>
                      <CardDescription>
                        {new Date(event.event_date).toLocaleDateString()} at{" "}
                        {new Date(event.start_time).toLocaleTimeString()}
                      </CardDescription>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      Pending
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <div>
                      <strong>Location:</strong> {event.location}
                    </div>
                    <div>
                      <strong>Type:</strong> {event.event_type}
                    </div>
                    {event.description && (
                      <div>
                        <strong>Description:</strong> {event.description}
                      </div>
                    )}
                    {event.event_submissions && event.event_submissions[0] && (
                      <div>
                        <strong>Submitted by:</strong>{" "}
                        {event.event_submissions[0].submitter_email}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      Submitted: {new Date(event.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleAction(event.id, 'approve')}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleAction(event.id, 'reject')}
                      disabled={isLoading}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
