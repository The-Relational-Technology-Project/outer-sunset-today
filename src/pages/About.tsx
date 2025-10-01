import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Heart, Mail, Users, Calendar } from "lucide-react";

export default function About() {
  const [email, setEmail] = useState("");

  const handleNewsletterSignup = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Thanks for signing up!",
      description: "You'll receive the Outer Sunset Weekly digest in your inbox.",
    });
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            About Outer Sunset Today
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A simple way to see what's happening around you — powered by neighbors who care.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Heart className="h-5 w-5 mr-2 text-coral" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We believe community happens when neighbors know what's going on. 
                Outer Sunset Today makes it easy to discover events, volunteer opportunities, 
                and ways to connect right in your neighborhood.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Users className="h-5 w-5 mr-2 text-primary" />
                Community Powered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Every event listing comes from neighbors like you. Local businesses, 
                community organizers, and residents all contribute to keep everyone 
                in the loop about what's happening.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Calendar className="h-5 w-5 mr-2 text-secondary" />
                Always Fresh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We focus on what's happening today and soon. No scrolling through 
                outdated listings — just the most current and relevant events for 
                our little corner of San Francisco.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Get Involved</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Want to help make Outer Sunset Today even better? We're always looking for neighbors who want to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Scout and share upcoming events
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-coral rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Help curate and verify event details
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-secondary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Spread the word about community happenings
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Connect local businesses with neighbors
              </li>
            </ul>
            <div className="pt-4">
              <Button className="bg-primary hover:bg-primary/90" asChild>
                <a href="mailto:hello@outersunset.today">
                  <Mail className="h-4 w-4 mr-2" />
                  Get in Touch
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}