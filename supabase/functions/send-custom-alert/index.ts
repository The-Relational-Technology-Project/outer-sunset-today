import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
const JOSH_EMAIL = "joshuanesbit@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { password, update_id, message } = await req.json();

    if (!password || password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!update_id || !message) {
      return new Response(JSON.stringify({ error: "update_id and message are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get the custom update details
    const { data: update, error: updateError } = await supabase
      .from("custom_updates")
      .select("*")
      .eq("id", update_id)
      .single();

    if (updateError || !update) {
      return new Response(JSON.stringify({ error: "Update not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get all subscribers for this update
    const { data: subscribers, error: subError } = await supabase
      .from("custom_update_subscriptions")
      .select("*")
      .eq("custom_update_id", update_id);

    if (subError) throw subError;

    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ success: true, summary: "No subscribers found for this update." }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Separate email and SMS subscribers
    const emailSubscribers = subscribers.filter(
      (s) => s.email && (s.preferred_channel === "email" || s.preferred_channel === "both")
    );
    const smsSubscribers = subscribers.filter(
      (s) => s.phone && (s.preferred_channel === "phone" || s.preferred_channel === "both")
    );

    let emailsSent = 0;
    let smsDigestSent = false;

    // Send direct emails to email subscribers
    for (const sub of emailSubscribers) {
      try {
        await resend.emails.send({
          from: "Outer Sunset Today <humans@relationaltechproject.org>",
          reply_to: "humans@relationaltechproject.org",
          to: [sub.email],
          subject: `🔔 Update: ${update.description.slice(0, 60)}`,
          html: `
            <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 8px;">Outer Sunset Today</h2>
              <p style="color: #666; font-size: 13px; margin-bottom: 20px;">Custom Update Alert</p>
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" />
              <p style="color: #333; font-size: 15px; font-weight: 600; margin-bottom: 8px;">${update.description}</p>
              <p style="color: #444; font-size: 14px; line-height: 1.6;">${message}</p>
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0 16px;" />
              <p style="color: #999; font-size: 11px;">You signed up for this update at outersunset.today/updates</p>
            </div>
          `,
        });
        emailsSent++;
        // 600ms delay for rate limiting
        if (emailSubscribers.indexOf(sub) < emailSubscribers.length - 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      } catch (emailErr: unknown) {
        console.error(`Failed to send to ${sub.email}:`, emailErr);
      }
    }

    // Build SMS digest email for Josh
    if (smsSubscribers.length > 0) {
      const smsRows = smsSubscribers
        .map((s) => {
          const encodedMessage = encodeURIComponent(message);
          const smsLink = `sms:${s.phone}?body=${encodedMessage}`;
          return `
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                <p style="margin: 0 0 6px; font-size: 15px; font-weight: 600; color: #333;">${s.phone}</p>
                <a href="${smsLink}" style="display: inline-block; background: #F97316; color: white; padding: 8px 18px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">
                  📱 Text this number
                </a>
                <p style="margin: 8px 0 0; font-size: 12px; color: #888;">Or copy the message below and text them manually</p>
              </td>
            </tr>
          `;
        })
        .join("");

      const digestHtml = `
        <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 4px;">📱 SMS Alert Ready to Send</h2>
          <p style="color: #666; font-size: 13px; margin-bottom: 20px;">Personal outreach for: <strong>${update.description}</strong></p>
          
          <div style="background: #FFF7ED; border: 1px solid #FDBA74; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 4px; font-size: 12px; color: #9A3412; font-weight: 600;">MESSAGE TO SEND:</p>
            <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.5;">${message}</p>
          </div>

          <h3 style="color: #333; font-size: 16px; margin-bottom: 12px;">${smsSubscribers.length} subscriber${smsSubscribers.length > 1 ? "s" : ""} to text:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${smsRows}
          </table>

          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0 16px;" />
          <p style="color: #999; font-size: 11px;">This email was generated by Outer Sunset Today's custom alert system.</p>
        </div>
      `;

      try {
        await resend.emails.send({
          from: "Outer Sunset Today <humans@relationaltechproject.org>",
          reply_to: "humans@relationaltechproject.org",
          to: [JOSH_EMAIL],
          subject: `📱 Text ${smsSubscribers.length} subscriber${smsSubscribers.length > 1 ? "s" : ""}: ${update.description.slice(0, 50)}`,
          html: digestHtml,
        });
        smsDigestSent = true;
      } catch (digestErr: unknown) {
        console.error("Failed to send SMS digest email:", digestErr);
      }
    }

    const summary = [
      emailsSent > 0 ? `${emailsSent} email${emailsSent > 1 ? "s" : ""} sent directly` : null,
      smsDigestSent ? `SMS digest with ${smsSubscribers.length} number${smsSubscribers.length > 1 ? "s" : ""} sent to your inbox` : null,
      !emailsSent && !smsDigestSent ? "No messages sent (check subscriber data)" : null,
    ]
      .filter(Boolean)
      .join(". ");

    return new Response(JSON.stringify({ success: true, summary }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: unknown) {
    console.error("Error in send-custom-alert:", err);
    return new Response(
      JSON.stringify({ error: String((err as Error)?.message ?? err) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
