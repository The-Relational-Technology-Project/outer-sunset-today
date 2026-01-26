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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Starting weekly newsletter send...");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active subscribers
    const { data: subscribers, error: subsError } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("status", "active");

    if (subsError) {
      console.error("Error fetching subscribers:", subsError);
      throw subsError;
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("No active subscribers found");
      return new Response(
        JSON.stringify({ message: "No active subscribers" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${subscribers.length} active subscribers`);

    // Get date range for the next 7 days
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    // Fetch upcoming events
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .eq("status", "approved")
      .gte("event_date", todayStr)
      .lte("event_date", nextWeekStr)
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      throw eventsError;
    }

    // Fetch daily menus for the week
    const { data: menus, error: menusError } = await supabase
      .from("daily_menus")
      .select("*")
      .gte("menu_date", todayStr)
      .lte("menu_date", nextWeekStr)
      .order("menu_date", { ascending: true })
      .order("restaurant", { ascending: true });

    if (menusError) {
      console.error("Error fetching menus:", menusError);
      throw menusError;
    }

    console.log(`Found ${events?.length || 0} events and ${menus?.length || 0} menu items`);

    // Group events by day
    const eventsByDay: { [key: string]: any[] } = {};
    events?.forEach((event) => {
      const date = new Date(event.event_date);
      const dayKey = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      if (!eventsByDay[dayKey]) {
        eventsByDay[dayKey] = [];
      }
      eventsByDay[dayKey].push(event);
    });

    // Group menus by day
    const menusByDay: { [key: string]: any[] } = {};
    menus?.forEach((menu) => {
      const date = new Date(menu.menu_date);
      const dayKey = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      if (!menusByDay[dayKey]) {
        menusByDay[dayKey] = [];
      }
      menusByDay[dayKey].push(menu);
    });

    // Build email HTML
    const buildEventsHTML = () => {
      if (!events || events.length === 0) {
        return '<p style="color: #718096;">No events scheduled this week. Check back soon!</p>';
      }

      let html = '';
      for (const [day, dayEvents] of Object.entries(eventsByDay)) {
        html += `<h3 style="color: #2c5282; margin-top: 20px; margin-bottom: 10px;">${day}</h3>`;
        dayEvents.forEach((event: any) => {
          // Format time in Pacific Time
          const time = new Date(event.start_time).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/Los_Angeles'
          });
          html += `
            <div style="margin-bottom: 15px; padding: 10px; background-color: #f7fafc; border-left: 3px solid #4299e1;">
              <strong style="color: #2d3748;">${event.title}</strong><br/>
              <span style="color: #4a5568;">⏰ ${time} • 📍 ${event.location}</span><br/>
              ${event.description ? `<span style="color: #718096; font-size: 14px;">${event.description}</span>` : ''}
            </div>
          `;
        });
      }
      return html;
    };

    const buildMenusHTML = () => {
      if (!menus || menus.length === 0) {
        return '<p style="color: #718096;">No special menu items this week.</p>';
      }

      let html = '';
      for (const [day, dayMenus] of Object.entries(menusByDay)) {
        html += `<h3 style="color: #2c5282; margin-top: 20px; margin-bottom: 10px;">${day}</h3>`;
        dayMenus.forEach((menu: any) => {
          html += `
            <div style="margin-bottom: 15px; padding: 10px; background-color: #fffaf0; border-left: 3px solid #ed8936;">
              <strong style="color: #2d3748;">${menu.restaurant}</strong> - ${menu.location}<br/>
              <span style="color: #4a5568;">🍽️ ${menu.special_item}</span>
              ${menu.price ? ` • <span style="color: #718096;">${menu.price}</span>` : ''}<br/>
              <span style="color: #718096; font-size: 14px;">Hours: ${menu.hours}</span>
            </div>
          `;
        });
      }
      return html;
    };

    const dateRange = `${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${nextWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    // Send emails with rate limiting (2 per second max)
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < subscribers.length; i++) {
      const subscriber = subscribers[i];
      const unsubscribeUrl = `https://outersunset.today/unsubscribe/${subscriber.unsubscribe_token}`;
      
      const emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c5282; border-bottom: 2px solid #4299e1; padding-bottom: 10px;">
            🌅 Outer Sunset Today
          </h1>
          <p style="color: #4a5568; font-size: 16px;">Your weekly guide to the neighborhood • ${dateRange}</p>
          
          <h2 style="color: #2c5282; margin-top: 30px;">📅 This Week's Events</h2>
          ${buildEventsHTML()}
          
          <h2 style="color: #2c5282; margin-top: 30px;">🍽️ This Week's Food Highlights</h2>
          ${buildMenusHTML()}
          
          <hr style="border: 1px solid #e2e8f0; margin: 30px 0;" />
          
          <p style="color: #718096; font-size: 14px; text-align: center;">
            Visit <a href="https://outersunset.today" style="color: #4299e1;">outersunset.today</a> for the latest updates
          </p>
          
          <p style="color: #a0aec0; font-size: 12px; text-align: center;">
            <a href="${unsubscribeUrl}" style="color: #a0aec0;">Unsubscribe from this newsletter</a>
          </p>
        </div>
      `;

      try {
        const { error: emailError } = await resend.emails.send({
          from: "Outer Sunset Today <notifications@relationaltechproject.org>",
          reply_to: "josh@relationaltechproject.org",
          to: [subscriber.email],
          subject: "This Week in the Outer Sunset",
          html: emailHTML,
        });

        if (emailError) {
          console.error(`Error sending to ${subscriber.email}:`, emailError);
          errorCount++;
        } else {
          console.log(`Successfully sent to ${subscriber.email}`);
          successCount++;
        }
      } catch (err) {
        console.error(`Exception sending to ${subscriber.email}:`, err);
        errorCount++;
      }

      // Wait 600ms between emails to stay under 2 per second rate limit
      if (i < subscribers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    console.log(`Newsletter send complete: ${successCount} successful, ${errorCount} failed`);

    return new Response(
      JSON.stringify({ 
        message: "Weekly newsletter sent",
        success: successCount,
        failed: errorCount,
        total: subscribers.length
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("Error in send-weekly-newsletter:", err);
    return new Response(
      JSON.stringify({ error: String(err?.message ?? err) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
