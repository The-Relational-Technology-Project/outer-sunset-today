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

    const dayLabel = (dateStr: string) => {
      const d = new Date(`${dateStr}T12:00:00-07:00`);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'numeric',
        day: 'numeric',
        timeZone: 'America/Los_Angeles',
      });
    };

    const esc = (s: string) =>
      String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const fmtTime = (iso: string) => {
      const t = new Date(iso).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Los_Angeles',
      });
      return t.replace(':00', '').replace(' AM', 'am').replace(' PM', 'pm');
    };

    // Group by ISO date so ordering stays stable
    const groupByDate = <T extends Record<string, any>>(rows: T[] | null, key: string) => {
      const out: Record<string, T[]> = {};
      (rows ?? []).forEach((r) => {
        const k = r[key];
        (out[k] ||= []).push(r);
      });
      return out;
    };

    const eventsByDate = groupByDate(events, 'event_date');
    const menusByDate = groupByDate(menus, 'menu_date');

    const link = "color:#c2410c;text-decoration:none;";

    // Compact events list: one line per event, title links to its source
    const buildEventsHTML = () => {
      const dates = Object.keys(eventsByDate).sort();
      if (dates.length === 0) {
        return '<p style="color:#6b7280;margin:0;">No events on the calendar this week yet.</p>';
      }
      return dates
        .map((date) => {
          const lines = eventsByDate[date]
            .map((e: any) => {
              const title = e.source_url
                ? `<a href="${esc(e.source_url)}" style="${link}">${esc(e.title)}</a>`
                : esc(e.title);
              return `<li style="margin:0 0 4px;">${fmtTime(e.start_time)} — ${title} <span style="color:#6b7280;">· ${esc(e.location)}</span></li>`;
            })
            .join('');
          return `<p style="margin:14px 0 4px;font-weight:700;color:#111827;">${dayLabel(date)}</p>
            <ul style="margin:0;padding-left:18px;font-size:15px;line-height:1.45;color:#374151;">${lines}</ul>`;
        })
        .join('');
    };

    // Compact school lunch list (category = 'school')
    const buildLunchHTML = () => {
      const dates = Object.keys(menusByDate).sort();
      const rows = dates
        .map((date) => {
          const items = menusByDate[date]
            .filter((m: any) => m.category === 'school')
            .map((m: any) => esc(m.special_item))
            .join('; ');
          return items ? `<li style="margin:0 0 4px;"><strong>${dayLabel(date)}</strong> — ${items}</li>` : '';
        })
        .filter(Boolean)
        .join('');
      if (!rows) return '<p style="color:#6b7280;margin:0;">No SFUSD lunches listed this week.</p>';
      return `<ul style="margin:0;padding-left:18px;font-size:15px;line-height:1.45;color:#374151;">${rows}</ul>`;
    };

    // Compact Arizmendi pizza line per day
    const buildPizzaHTML = () => {
      const dates = Object.keys(menusByDate).sort();
      const rows = dates
        .map((date) => {
          const items = menusByDate[date]
            .filter((m: any) => m.category !== 'school')
            .map((m: any) => esc(m.special_item))
            .join('; ');
          return items ? `<li style="margin:0 0 4px;"><strong>${dayLabel(date)}</strong> — ${items}</li>` : '';
        })
        .filter(Boolean)
        .join('');
      if (!rows) return '';
      return `<h2 style="font-size:17px;color:#111827;margin:26px 0 8px;">🍕 Arizmendi pizza</h2>
        <ul style="margin:0;padding-left:18px;font-size:15px;line-height:1.45;color:#374151;">${rows}</ul>`;
    };

    const dateRange = `${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })}–${nextWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })}`;

    const eventsHTML = buildEventsHTML();
    const lunchHTML = buildLunchHTML();
    const pizzaHTML = buildPizzaHTML();

    // Send emails with rate limiting (2 per second max)
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < subscribers.length; i++) {
      const subscriber = subscribers[i];
      const unsubscribeUrl = `https://outersunset.today/unsubscribe/${subscriber.unsubscribe_token}`;

      const emailHTML = `
        <div style="font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;background:#F5F2ED;">
          <h1 style="font-size:20px;margin:0 0 2px;color:#111827;">🌅 Outer Sunset Today</h1>
          <p style="margin:0 0 18px;color:#6b7280;font-size:14px;">The week ahead · ${dateRange}</p>

          <h2 style="font-size:17px;color:#111827;margin:0 0 4px;">📅 Events</h2>
          ${eventsHTML}

          <h2 style="font-size:17px;color:#111827;margin:26px 0 8px;">🍽️ SFUSD school lunch</h2>
          ${lunchHTML}

          ${pizzaHTML}

          <p style="margin:26px 0 6px;font-size:14px;">
            <a href="https://outersunset.today" style="${link}">See the full calendar →</a>
          </p>
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            Event titles link to their source. <a href="${unsubscribeUrl}" style="color:#9ca3af;">Unsubscribe</a>
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
