import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getFlyerImageUrl, type FlyerSubmission } from "@/hooks/useFlyerSubmissions";
import { type ContactSubmission } from "@/hooks/useContactSubmissions";
import { CheckCircle, XCircle, Lock, Image as ImageIcon, Mail, Archive, Sparkles, Eye } from "lucide-react";
import { FlyerImageDialog } from "@/components/FlyerImageDialog";
import { EventConfirmationDialog } from "@/components/EventConfirmationDialog";

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
  const [flyerSubmissions, setFlyerSubmissions] = useState<FlyerSubmission[]>([]);
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [flyerImageUrls, setFlyerImageUrls] = useState<Record<string, string>>({});
  const [selectedFlyerImage, setSelectedFlyerImage] = useState<string | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [scannedEventData, setScannedEventData] = useState<any>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isScanning, setIsScanning] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if already authenticated
    const adminAuth = sessionStorage.getItem("admin_auth");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
      loadPendingEvents();
    }
  }, []);

  // Extract image URLs from flyer submissions
  useEffect(() => {
    const loadImageUrls = async () => {
      if (isAuthenticated && flyerSubmissions.length > 0) {
        const urls: Record<string, string> = {};
        await Promise.all(
          flyerSubmissions.map(async (submission: any) => {
            if (submission.storage_path) {
              const url = await getFlyerImageUrl(submission.storage_path);
              if (url) urls[submission.id] = url;
            }
          })
        );
        setFlyerImageUrls(urls);
      }
    };
    loadImageUrls();
  }, [isAuthenticated, flyerSubmissions]);

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
      sessionStorage.setItem("admin_password", password);
      setIsAuthenticated(true);
      setPendingEvents(data.events || []);
      setFlyerSubmissions(data.flyers || []);
      setContactSubmissions(data.contacts || []);
      
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
      const storedPassword = sessionStorage.getItem("admin_password") || password;
      const { data, error } = await supabase.functions.invoke('manage-events', {
        body: { action: 'list', password: storedPassword }
      });

      if (error) throw error;
      setPendingEvents(data.events || []);
      setFlyerSubmissions(data.flyers || []);
      setContactSubmissions(data.contacts || []);
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
      const storedPassword = sessionStorage.getItem("admin_password") || password;
      const { error } = await supabase.functions.invoke('manage-events', {
        body: { action, eventId, password: storedPassword }
      });

      if (error) throw error;

      toast({
        title: `Event ${action}d`,
        description: `The event has been ${action}d and archived`,
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

  const handleArchiveEvent = async (eventId: string) => {
    setIsLoading(true);
    try {
      const storedPassword = sessionStorage.getItem("admin_password") || password;
      const { error } = await supabase.functions.invoke('manage-events', {
        body: { action: 'archive-event', eventId, password: storedPassword }
      });

      if (error) throw error;

      toast({
        title: "Event archived",
        description: "The event has been archived without approval/rejection",
      });

      await loadPendingEvents();
    } catch (error: any) {
      toast({
        title: "Archive failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveFlyer = async (flyerId: string) => {
    setIsLoading(true);
    try {
      const storedPassword = sessionStorage.getItem("admin_password") || password;
      const { error } = await supabase.functions.invoke('manage-events', {
        body: { action: 'archive-flyer', flyerId, password: storedPassword }
      });

      if (error) throw error;

      toast({
        title: "Flyer archived",
        description: "The flyer has been archived",
      });

      await loadPendingEvents();
    } catch (error: any) {
      toast({
        title: "Archive failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanFlyer = async (submissionId: string) => {
    setIsScanning(submissionId);
    try {
      const { data, error } = await supabase.functions.invoke('scan-event-flyer', {
        body: { submission_id: submissionId }
      });

      if (error) throw error;

      if (data?.event) {
        setScannedEventData(data.event);
        setIsConfirmDialogOpen(true);
        toast({
          title: "Flyer scanned!",
          description: "Review the extracted details",
        });
      }
    } catch (error: any) {
      toast({
        title: "Scan failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsScanning(null);
    }
  };

  const handleConfirmScannedEvent = async (eventData: any) => {
    setIsLoading(true);
    try {
      // The event is already created by the scan function, just reload
      await loadPendingEvents();
      setIsConfirmDialogOpen(false);
      toast({
        title: "Event submitted!",
        description: "The event has been added to pending events for approval",
      });
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewFullImage = (imageUrl: string) => {
    setSelectedFlyerImage(imageUrl);
    setIsImageDialogOpen(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    sessionStorage.removeItem("admin_password");
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
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage events, flyers, and contact submissions
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="events">Pending Events</TabsTrigger>
            <TabsTrigger value="flyers">
              <ImageIcon className="w-4 h-4 mr-2" />
              Flyers ({flyerSubmissions.length})
            </TabsTrigger>
            <TabsTrigger value="contacts">
              <Mail className="w-4 h-4 mr-2" />
              Messages ({contactSubmissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-6">
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
                        <Button
                          onClick={() => handleArchiveEvent(event.id)}
                          disabled={isLoading}
                          variant="outline"
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="flyers" className="mt-6">
            {isLoading && flyerSubmissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Loading flyers...</p>
            ) : flyerSubmissions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No flyer submissions yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {flyerSubmissions.map((flyer) => (
                  <Card key={flyer.id}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {flyer.processed ? "✓ Processed" : "Pending Review"}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {new Date(flyer.created_at).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {flyerImageUrls[flyer.id] && (
                        <div className="relative group">
                          <img 
                            src={flyerImageUrls[flyer.id]} 
                            alt="Event flyer"
                            className="w-full h-48 object-cover rounded-md cursor-pointer"
                            onClick={() => handleViewFullImage(flyerImageUrls[flyer.id])}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                            <Eye className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      )}
                      {flyer.submitter_email && (
                        <p className="text-sm">
                          <strong>From:</strong> {flyer.submitter_email}
                        </p>
                      )}
                      {flyer.processing_notes && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Notes:</strong> {flyer.processing_notes}
                        </p>
                      )}
                      <div className="flex gap-2 pt-2">
                        {!flyer.processed && (
                          <Button
                            onClick={() => handleScanFlyer(flyer.id)}
                            disabled={isScanning === flyer.id}
                            className="flex-1"
                            size="sm"
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            {isScanning === flyer.id ? "Scanning..." : "Scan with AI"}
                          </Button>
                        )}
                        <Button
                          onClick={() => handleArchiveFlyer(flyer.id)}
                          disabled={isLoading}
                          variant="outline"
                          size="sm"
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contacts" className="mt-6">
            {isLoading && contactSubmissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Loading messages...</p>
            ) : contactSubmissions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No contact submissions yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {contactSubmissions.map((contact) => (
                  <Card key={contact.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{contact.name}</CardTitle>
                          <CardDescription>{contact.email}</CardDescription>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {contact.submission_type}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm whitespace-pre-wrap">{contact.message}</p>
                      <p className="text-xs text-muted-foreground">
                        Received: {new Date(contact.created_at).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <FlyerImageDialog 
        open={isImageDialogOpen}
        onOpenChange={setIsImageDialogOpen}
        imageUrl={selectedFlyerImage}
      />
      
      <EventConfirmationDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        eventData={scannedEventData}
        onConfirm={handleConfirmScannedEvent}
        isLoading={isLoading}
      />
    </div>
  );
}
