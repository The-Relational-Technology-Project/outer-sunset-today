import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail } from "lucide-react";
import { HumanVerification } from "@/components/HumanVerification";

const NewsletterSubscribe = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    if (!isVerified) {
      toast({
        title: "Verification required",
        description: "Please complete the human verification",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("subscribe-newsletter", {
        body: { email },
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: data.message || "You've been subscribed to our weekly newsletter.",
      });
      
      setEmail("");
      setResetTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error("Newsletter subscription error:", error);
      toast({
        title: "Subscription failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bulletin font-bold text-foreground">
          Weekly Newsletter
        </h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4 font-handwritten">
        Get a weekly roundup of events and food highlights every Monday.
      </p>
      <form onSubmit={handleSubscribe} className="space-y-4">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className="font-handwritten"
        />
        <HumanVerification 
          onVerified={setIsVerified} 
          resetTrigger={resetTrigger}
        />
        <Button type="submit" disabled={isLoading || !isVerified} className="w-full">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Subscribe"
          )}
        </Button>
      </form>
    </div>
  );
};

export default NewsletterSubscribe;
