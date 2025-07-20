import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, Upload, Mail } from "lucide-react";

export default function Submit() {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
    link: "",
    category: "",
    isRecurring: false,
    contactEmail: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would normally submit to your backend
    toast({
      title: "Event submitted!",
      description: "Thank you for contributing to the community. We'll review and add your event soon.",
    });
    
    // Reset form
    setFormData({
      title: "",
      date: "",
      time: "",
      location: "",
      description: "",
      link: "",
      category: "",
      isRecurring: false,
      contactEmail: ""
    });
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
            Help your neighbors discover what's happening! Share community events, local business happenings, or volunteer opportunities.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Community Garden Workday"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Ocean Beach at Judah St"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="community">Community Event</SelectItem>
                    <SelectItem value="business">Local Business Event</SelectItem>
                    <SelectItem value="music">Live Music & Shows</SelectItem>
                    <SelectItem value="volunteer">Volunteer Opportunity</SelectItem>
                    <SelectItem value="family">Family-Friendly</SelectItem>
                    <SelectItem value="art">Art & Culture</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell people what to expect, what to bring, and why they should come!"
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Website or Link (optional)</Label>
                <Input
                  id="link"
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Your Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="your@email.com"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  We'll use this to contact you if we have questions about your event.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isRecurring: checked as boolean }))
                  }
                />
                <Label htmlFor="recurring" className="text-sm">
                  This is a recurring event
                </Label>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Have a flyer?
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Email us your flyer at{" "}
                  <a href="mailto:events@outersunset.today" className="text-primary hover:underline">
                    events@outersunset.today
                  </a>
                  {" "}or text it to{" "}
                  <span className="font-medium">(415) 555-SUNSET</span>
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-coral hover:bg-coral/90 text-coral-foreground"
              >
                Submit Event
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}