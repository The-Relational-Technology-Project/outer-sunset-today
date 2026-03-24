import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface NotificationRequest {
  type: "event" | "contact" | "flyer" | "import" | "custom_update";
  data: {
    title?: string;
    location?: string;
    event_date?: string;
    start_time?: string;
    description?: string;
    event_type?: string;
    submitter_email?: string;
    name?: string;
    email?: string;
    message?: string;
    submission_type?: string;
    storage_path?: string;
    subject?: string;
    html?: string;
    update_type?: string;
    subscriber_email?: string;
    subscriber_phone?: string;
    preferred_channel?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, data }: NotificationRequest = await req.json();
    console.log("send-notification-email payload:", { type, data });

    const notificationEmail = "josh@relationaltechproject.org";
    let subject = "";
    let html = "";

    switch (type) {
      case "event":
        subject = `🎉 New Event Submission: ${data.title}`;
        html = `
          <h1>New Event Submitted</h1>
          <p><strong>Title:</strong> ${data.title}</p>
          <p><strong>Location:</strong> ${data.location}</p>
          <p><strong>Date:</strong> ${data.event_date}</p>
          <p><strong>Time:</strong> ${new Date(data.start_time!).toLocaleTimeString()}</p>
          <p><strong>Type:</strong> ${data.event_type}</p>
          <p><strong>Description:</strong> ${data.description || "No description provided"}</p>
          <p><strong>Submitter Email:</strong> ${data.submitter_email}</p>
          <hr />
          <p><em>Visit your admin dashboard to review and approve this event.</em></p>
        `;
        break;

      case "contact":
        subject = `📩 New ${data.submission_type === 'recurring_event' ? 'Recurring Event' : 'Contact'} Submission`;
        html = `
          <h1>New ${data.submission_type === 'recurring_event' ? 'Recurring Event Request' : 'Contact Form Submission'}</h1>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Message:</strong></p>
          <p>${data.message}</p>
          <hr />
          <p><em>Visit your admin dashboard to review this submission.</em></p>
        `;
        break;

      case "flyer":
        subject = `🖼️ New Event Flyer Uploaded`;
        html = `
          <h1>New Event Flyer Submission</h1>
          <p><strong>Storage Path:</strong> ${data.storage_path}</p>
          <p><strong>Submitter Email:</strong> ${data.submitter_email || "Not provided"}</p>
          <hr />
          <p><em>Visit your admin dashboard to review the flyer and process the event.</em></p>
        `;
        break;

      case "import":
        subject = data.subject || "Weekly Event Import Complete";
        html = data.html || "<p>Import completed.</p>";
        break;

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    const { error: emailError } = await resend.emails.send({
      from: "Outer Sunset Today <humans@relationaltechproject.org>",
      reply_to: "humans@relationaltechproject.org",
      to: [notificationEmail],
      subject,
      html,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      throw emailError;
    }

    console.log("Notification email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("Error in send-notification-email:", err);
    return new Response(
      JSON.stringify({ error: String(err?.message ?? err) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
