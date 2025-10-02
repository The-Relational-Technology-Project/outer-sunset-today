import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Upload, Calendar, Mail, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Submit() {
  const [basicForm, setBasicForm] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
    email: "",
    eventType: "community"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: ""
  });

  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleBasicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Combine date and time into start_time
      const startTime = new Date(`${basicForm.date}T${basicForm.time}`);
      
      // Insert event into database
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          title: basicForm.title,
          location: basicForm.location,
          event_date: basicForm.date,
          start_time: startTime.toISOString(),
          description: basicForm.description,
          event_type: basicForm.eventType,
        })
        .select('id');

      if (eventError) throw eventError;

      // Store submitter email separately
      const eventId = eventData?.[0]?.id;
      if (eventId) {
        const { error: submissionError } = await supabase
          .from('event_submissions')
          .insert({
            event_id: eventId,
            submitter_email: basicForm.email,
          });

        if (submissionError) throw submissionError;
      }

      if (eventError) throw eventError;

      toast({
        title: "Event submitted!",
        description: "Thank you! Your event will be reviewed and posted soon.",
      });
      
      setBasicForm({ 
        title: "", 
        date: "", 
        time: "", 
        location: "", 
        description: "", 
        email: "",
        eventType: "community"
      });
    } catch (error) {
      console.error('Error submitting event:', error);
      toast({
        title: "Error submitting event",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedImage) {
      toast({
        title: "Please upload an image",
        description: "Add a flyer or screenshot of your event.",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Event submitted!",
      description: "Thanks for the flyer! We'll extract the details and add your event soon.",
    });
    setUploadedImage(null);
    setImagePreview(null);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert({
          name: contactForm.name,
          email: contactForm.email,
          message: contactForm.message,
          submission_type: 'recurring_event',
        });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "We'll get back to you about recurring events or calendar integration.",
      });
      setContactForm({ name: "", email: "", message: "" });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "Error sending message",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Submit an Event
          </h1>
          <p className="text-muted-foreground">
            Help your neighbors discover what's happening in the Outer Sunset!
          </p>
        </div>

        <Tabs defaultValue="quick" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick">Quick Submit</TabsTrigger>
            <TabsTrigger value="details">Add Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="quick">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Event Flyer
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Got a flyer or screenshot? Upload it and we'll extract the details for you.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleImageSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="image-upload">Event Flyer or Screenshot</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload or drag & drop
                        </span>
                      </label>
                      {imagePreview && (
                        <div className="mt-4">
                          <img src={imagePreview} alt="Preview" className="max-w-full h-48 object-contain mx-auto rounded" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quick-email">Your Email</Label>
                    <Input
                      id="quick-email"
                      type="email"
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Submit Event Flyer
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBasicSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                      id="title"
                      value={basicForm.title}
                      onChange={(e) => setBasicForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Community Garden Workday"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={basicForm.date}
                        onChange={(e) => setBasicForm(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={basicForm.time}
                        onChange={(e) => setBasicForm(prev => ({ ...prev, time: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={basicForm.location}
                      onChange={(e) => setBasicForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Ocean Beach at Judah St"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">What's happening?</Label>
                    <Textarea
                      id="description"
                      value={basicForm.description}
                      onChange={(e) => setBasicForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the event"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventType">Event Type</Label>
                    <Select
                      value={basicForm.eventType}
                      onValueChange={(value) => setBasicForm(prev => ({ ...prev, eventType: value }))}
                    >
                      <SelectTrigger id="eventType">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="community">Community</SelectItem>
                        <SelectItem value="arts">Arts & Culture</SelectItem>
                        <SelectItem value="food">Food & Drink</SelectItem>
                        <SelectItem value="sports">Sports & Recreation</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="family">Family & Kids</SelectItem>
                        <SelectItem value="music">Music</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Your Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={basicForm.email}
                      onChange={(e) => setBasicForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Event"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator className="my-8" />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Share a Recurring Event or Calendar
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Want to share a website, calendar feed, or recurring event series? Let's chat!
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Your Name</Label>
                <Input
                  id="contact-name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-email">Your Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">Tell us about it</Label>
                <Textarea
                  id="contact-message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="What kind of recurring events, website, or calendar would you like to share?"
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" variant="outline" className="w-full" disabled={isSubmitting}>
                <Mail className="h-4 w-4 mr-2" />
                {isSubmitting ? "Sending..." : "Get In Touch"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}