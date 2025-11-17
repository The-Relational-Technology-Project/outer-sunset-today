import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Header } from "@/components/Header";

const Unsubscribe = () => {
  const { token } = useParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const handleUnsubscribe = async () => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid unsubscribe link");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("unsubscribe-newsletter", {
        body: { token },
      });

      if (error) throw error;

      setStatus("success");
      setMessage(data.message || "You've been unsubscribed from the newsletter");
    } catch (error: any) {
      console.error("Unsubscribe error:", error);
      setStatus("error");
      setMessage(error.message || "Failed to unsubscribe. Please try again later.");
    }
  };

  useEffect(() => {
    handleUnsubscribe();
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
              {status === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
              {status === "error" && <XCircle className="h-5 w-5 text-red-600" />}
              {status === "loading" && "Processing..."}
              {status === "success" && "Unsubscribed"}
              {status === "error" && "Error"}
            </CardTitle>
            <CardDescription>
              {status === "loading" && "Please wait while we process your request..."}
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "success" && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  You've been successfully unsubscribed from the Outer Sunset Today weekly newsletter.
                </p>
                <p className="text-sm text-muted-foreground">
                  We're sorry to see you go! You can always resubscribe anytime by visiting our homepage.
                </p>
                <Button asChild className="w-full">
                  <a href="/">Return to Homepage</a>
                </Button>
              </div>
            )}
            {status === "error" && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  If you continue to receive emails, please contact us at humans@relationaltechproject.org
                </p>
                <Button asChild className="w-full">
                  <a href="/">Return to Homepage</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Unsubscribe;
