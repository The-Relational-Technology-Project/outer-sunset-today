import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SubscribeRequest {
  email: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email }: SubscribeRequest = await req.json();
    console.log("Newsletter subscription request for:", email);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from("newsletter_subscribers")
      .select("email, status")
      .eq("email", email)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing subscriber:", checkError);
      throw checkError;
    }

    if (existing) {
      if (existing.status === "active") {
        return new Response(
          JSON.stringify({ message: "You're already subscribed!" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } else {
        // Reactivate subscription
        const { error: updateError } = await supabase
          .from("newsletter_subscribers")
          .update({ status: "active" })
          .eq("email", email);

        if (updateError) {
          console.error("Error reactivating subscription:", updateError);
          throw updateError;
        }

        return new Response(
          JSON.stringify({ message: "Welcome back! Your subscription has been reactivated." }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Insert new subscriber
    const { data: subscriber, error: insertError } = await supabase
      .from("newsletter_subscribers")
      .insert({ email })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting subscriber:", insertError);
      throw insertError;
    }

    console.log("New subscriber added:", subscriber.id);

    // Send welcome email
    const unsubscribeUrl = `https://outersunset.today/unsubscribe/${subscriber.unsubscribe_token}`;
    
    const { error: emailError } = await resend.emails.send({
      from: "Outer Sunset Today <notifications@relationaltechproject.org>",
      reply_to: "josh@relationaltechproject.org",
      to: [email],
      subject: "Welcome to Outer Sunset Today Newsletter!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c5282;">🌅 Welcome to Outer Sunset Today!</h1>
          <p>Thank you for subscribing to our weekly newsletter.</p>
          <p>Every Monday, you'll receive a curated guide of upcoming events and food highlights in the Outer Sunset neighborhood.</p>
          <p>Stay connected with your community!</p>
          <hr style="border: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #718096;">
            If you'd like to unsubscribe, <a href="${unsubscribeUrl}" style="color: #2c5282;">click here</a>.
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Don't throw - subscription was successful even if email failed
    } else {
      console.log("Welcome email sent to:", email);
    }

    return new Response(
      JSON.stringify({ message: "Successfully subscribed! Check your email for confirmation." }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("Error in subscribe-newsletter:", err);
    return new Response(
      JSON.stringify({ error: String(err?.message ?? err) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
