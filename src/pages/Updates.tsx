import React, { useState } from "react";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Bell, Users, Send } from "lucide-react";
import { useCustomUpdates } from "@/hooks/useCustomUpdates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { HumanVerification } from "@/components/HumanVerification";

const Updates = () => {
  const { data: updates = [], isLoading, refetch } = useCustomUpdates();

  // Request form state
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState<string>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  // Sign-up dialog state
  const [signUpUpdate, setSignUpUpdate] = useState<{ id: string; description: string } | null>(null);
  const [suChannel, setSuChannel] = useState<string>("email");
  const [suEmail, setSuEmail] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suOptIn, setSuOptIn] = useState(false);
  const [suSubmitting, setSuSubmitting] = useState(false);
  const [suIsVerified, setSuIsVerified] = useState(false);
  const [suResetTrigger, setSuResetTrigger] = useState(0);

  const sendNotificationEmail = async (type: "new_update" | "existing_update", updateDescription: string, contactEmail?: string, contactPhone?: string, contactChannel?: string) => {
    try {
      await supabase.functions.invoke("send-notification-email", {
        body: {
          type: "custom_update",
          data: {
            update_type: type,
            description: updateDescription,
            subscriber_email: contactEmail || null,
            subscriber_phone: contactPhone || null,
            preferred_channel: contactChannel || null,
          },
        },
      });
    } catch (err) {
      console.error("Failed to send notification email:", err);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    if ((channel === "email" || channel === "both") && !email.trim()) return;
    if ((channel === "phone" || channel === "both") && !phone.trim()) return;
    if (!optIn || !isVerified) return;

    setSubmitting(true);
    try {
      const { data: newUpdate, error: updateError } = await supabase
        .from("custom_updates")
        .insert({ description: description.trim(), is_public: isPublic, subscriber_count: 1 })
        .select()
        .single();
      if (updateError) throw updateError;

      const subEmail = (channel === "email" || channel === "both") ? email.trim() : null;
      const subPhone = (channel === "phone" || channel === "both") ? phone.trim() : null;

      const { error: subError } = await supabase
        .from("custom_update_subscriptions")
        .insert({
          custom_update_id: newUpdate.id,
          email: subEmail,
          phone: subPhone,
          preferred_channel: channel,
          messaging_opt_in: true,
          is_creator: true,
        });
      if (subError) throw subError;

      await sendNotificationEmail("new_update", description.trim(), subEmail || undefined, subPhone || undefined, channel);

      toast({ title: "Thanks for your request!", description: "We'll be in touch once your update is set up." });
      setDescription("");
      setEmail("");
      setPhone("");
      setChannel("email");
      setOptIn(false);
      setIsPublic(true);
      setIsVerified(false);
      setResetTrigger(t => t + 1);
      refetch();
    } catch (err) {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUpUpdate) return;
    if ((suChannel === "email" || suChannel === "both") && !suEmail.trim()) return;
    if ((suChannel === "phone" || suChannel === "both") && !suPhone.trim()) return;
    if (!suOptIn || !suIsVerified) return;

    setSuSubmitting(true);
    try {
      const subEmail = (suChannel === "email" || suChannel === "both") ? suEmail.trim() : null;
      const subPhone = (suChannel === "phone" || suChannel === "both") ? suPhone.trim() : null;

      const { error: subError } = await supabase
        .from("custom_update_subscriptions")
        .insert({
          custom_update_id: signUpUpdate.id,
          email: subEmail,
          phone: subPhone,
          preferred_channel: suChannel,
          messaging_opt_in: true,
          is_creator: false,
        });
      if (subError) throw subError;

      await supabase.rpc("increment_update_subscriber_count", { update_id: signUpUpdate.id });
      await sendNotificationEmail("existing_update", signUpUpdate.description, subEmail || undefined, subPhone || undefined, suChannel);

      toast({ title: "You're signed up!", description: "We'll get this update to you soon." });
      setSignUpUpdate(null);
      setSuEmail("");
      setSuPhone("");
      setSuChannel("email");
      setSuOptIn(false);
      setSuIsVerified(false);
      setSuResetTrigger(t => t + 1);
      refetch();
    } catch (err) {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally {
      setSuSubmitting(false);
    }
  };

  const ChannelFields = ({
    channel,
    setChannel,
    email,
    setEmail,
    phone,
    setPhone,
    optIn,
    setOptIn,
    formId,
  }: {
    channel: string;
    setChannel: (v: string) => void;
    email: string;
    setEmail: (v: string) => void;
    phone: string;
    setPhone: (v: string) => void;
    optIn: boolean;
    setOptIn: (v: boolean) => void;
    formId: string;
  }) => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-bulletin font-bold text-foreground">How should we reach you?</Label>
        <RadioGroup value={channel} onValueChange={setChannel} className="flex gap-4 mt-2">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="email" id={`ch-email-${formId}`} />
            <Label htmlFor={`ch-email-${formId}`} className="text-sm">Email</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="phone" id={`ch-phone-${formId}`} />
            <Label htmlFor={`ch-phone-${formId}`} className="text-sm">Text</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="both" id={`ch-both-${formId}`} />
            <Label htmlFor={`ch-both-${formId}`} className="text-sm">Both</Label>
          </div>
        </RadioGroup>
      </div>

      {(channel === "email" || channel === "both") && (
        <div>
          <Label htmlFor={`email-${formId}`} className="text-sm">Email</Label>
          <Input id={`email-${formId}`} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" />
        </div>
      )}

      {(channel === "phone" || channel === "both") && (
        <div>
          <Label htmlFor={`phone-${formId}`} className="text-sm">Phone number</Label>
          <Input id={`phone-${formId}`} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(415) 555-1234" className="mt-1" />
        </div>
      )}

      <div className="flex items-start gap-2">
        <Checkbox id={`opt-in-${formId}`} checked={optIn} onCheckedChange={v => setOptIn(v === true)} className="mt-0.5" />
        <Label htmlFor={`opt-in-${formId}`} className="text-sm text-muted-foreground leading-tight">
          I agree to receive updates via my selected channel(s)
        </Label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Intro */}
        <div className="text-center mb-8">
          <h1 className="community-heading text-3xl sm:text-4xl text-foreground mb-3">
            Outer Sunset Today Updates
          </h1>
          <p className="text-muted-foreground font-handwritten text-base sm:text-lg max-w-lg mx-auto">
            Get custom updates about the things that matter to you in the neighborhood. Street cleaning reminders, menu alerts, weather conditions — you name it, we'll set it up.
          </p>
        </div>

        {/* Request Form */}
        <Card className="bulletin-card mb-10">
          <CardContent className="p-6">
            <h2 className="font-bulletin font-bold text-lg text-foreground mb-4">Request a custom update</h2>
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <Label htmlFor="description" className="text-sm font-bulletin font-bold text-foreground">
                  What would you like to be updated on?
                </Label>
                <Input
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Street cleaning on my block, when Arizmendi has mushroom pizza..."
                  className="mt-1"
                  maxLength={500}
                />
              </div>

              <ChannelFields
                channel={channel} setChannel={setChannel}
                email={email} setEmail={setEmail}
                phone={phone} setPhone={setPhone}
                optIn={optIn} setOptIn={setOptIn}
                formId="request"
              />

              <div className="flex items-start gap-2">
                <Checkbox id="is-public" checked={isPublic} onCheckedChange={v => setIsPublic(v === true)} className="mt-0.5" />
                <Label htmlFor="is-public" className="text-sm text-muted-foreground leading-tight">
                  I'm happy for this update to be public as an example for others
                </Label>
              </div>

              <HumanVerification onVerified={setIsVerified} resetTrigger={resetTrigger} />

              <Button type="submit" disabled={submitting || !description.trim() || !optIn || !isVerified} className="w-full bg-sunset-orange hover:bg-sunset-orange/90 text-white">
                <Send className="h-4 w-4 mr-2" />
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Community Gallery */}
        <section>
          <h2 className="community-heading text-2xl text-foreground mb-4">Updates from the community</h2>
          <p className="text-sm text-muted-foreground font-handwritten mb-4">
            See what your neighbors are tracking. Sign up for any update that interests you.
          </p>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="bulletin-card">
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : updates.length > 0 ? (
            <div className="space-y-3">
              {updates.map(update => (
                <Card key={update.id} className="bulletin-card">
                  <CardContent className="p-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bulletin font-bold text-foreground">{update.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSignUpUpdate({ id: update.id, description: update.description });
                        setSuIsVerified(false);
                        setSuResetTrigger(t => t + 1);
                      }}
                      className="shrink-0"
                    >
                      Sign me up
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bulletin-card">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground text-sm">No community updates yet. Be the first to request one!</p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      {/* Sign-up Dialog */}
      <Dialog open={!!signUpUpdate} onOpenChange={open => !open && setSignUpUpdate(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bulletin">Sign up for this update</DialogTitle>
            <DialogDescription className="font-handwritten">
              {signUpUpdate?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <ChannelFields
              channel={suChannel} setChannel={setSuChannel}
              email={suEmail} setEmail={setSuEmail}
              phone={suPhone} setPhone={setSuPhone}
              optIn={suOptIn} setOptIn={setSuOptIn}
              formId="signup"
            />
            <HumanVerification onVerified={setSuIsVerified} resetTrigger={suResetTrigger} />
            <Button
              onClick={handleSignUp}
              disabled={suSubmitting || !suOptIn || !suIsVerified}
              className="w-full bg-sunset-orange hover:bg-sunset-orange/90 text-white"
            >
              {suSubmitting ? "Signing up..." : "Sign me up"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
};

export default Updates;
