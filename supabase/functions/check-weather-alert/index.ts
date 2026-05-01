import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hardcoded custom update ID for "Ocean Beach evening (likely over 65 at 5pm)"
const WARM_EVENING_UPDATE_ID = "994e993b-ef78-4293-9899-94731605bbbb";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("check-weather-alert: Starting 5pm temperature check...");

    // 1. Get NWS hourly forecast for Outer Sunset
    const lat = 37.7599;
    const lon = -122.5065;

    const pointRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, {
      headers: { "User-Agent": "(OuterSunsetToday.com, hello@relationaltechproject.org)" },
    });
    if (!pointRes.ok) throw new Error(`NWS points failed: ${pointRes.status}`);

    const pointData = await pointRes.json();
    const hourlyUrl = pointData.properties.forecastHourly;

    const hourlyRes = await fetch(hourlyUrl, {
      headers: { "User-Agent": "(OuterSunsetToday.com, hello@relationaltechproject.org)" },
    });
    if (!hourlyRes.ok) throw new Error(`NWS hourly forecast failed: ${hourlyRes.status}`);

    const hourlyData = await hourlyRes.json();
    const periods = hourlyData.properties.periods;

    // 2. Find today's 5pm period (Pacific Time)
    const now = new Date();
    const todayPT = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    // todayPT is "MM/DD/YYYY" → parse to YYYY-MM-DD
    const [mo, da, yr] = todayPT.split("/");
    const todayISO = `${yr}-${mo}-${da}`;

    console.log(`Looking for 5pm forecast on ${todayISO}...`);

    // Find the hourly period closest to 5pm today
    let temp5pm: number | null = null;
    for (const period of periods) {
      const startTime = new Date(period.startTime);
      // Convert to PT hour
      const ptHour = parseInt(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "America/Los_Angeles",
          hour: "numeric",
          hour12: false,
        }).format(startTime)
      );
      const ptDate = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(startTime);
      const [pmo, pda, pyr] = ptDate.split("/");
      const periodISO = `${pyr}-${pmo}-${pda}`;

      if (periodISO === todayISO && ptHour === 17) {
        temp5pm = period.temperature;
        console.log(`Found 5pm forecast: ${temp5pm}°${period.temperatureUnit}`);
        break;
      }
    }

    if (temp5pm === null) {
      console.log("Could not find 5pm forecast period for today. Skipping.");
      return new Response(JSON.stringify({ skipped: true, reason: "No 5pm period found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Check if 65°F+ threshold is met
    if (temp5pm < 65) {
      console.log(`5pm temp is ${temp5pm}°F — below 65°F threshold. No alert.`);
      return new Response(
        JSON.stringify({ skipped: true, reason: `5pm temp ${temp5pm}°F < 65°F`, temp5pm }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`5pm temp is ${temp5pm}°F — warm evening! Triggering alert.`);

    // 4. Trigger the alert via send-custom-alert
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const adminPassword = Deno.env.get("ADMIN_PASSWORD")!;

    const message = `🌅 It's looking like a beautiful evening at Ocean Beach! The forecast for 5pm is ${temp5pm}°F — perfect for a sunset walk or beach hangout. Enjoy the warmth, neighbor!`;

    const alertRes = await fetch(`${supabaseUrl}/functions/v1/send-custom-alert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
      },
      body: JSON.stringify({
        password: adminPassword,
        update_id: WARM_EVENING_UPDATE_ID,
        message,
      }),
    });

    const alertResult = await alertRes.json();
    console.log("Alert result:", alertResult);

    return new Response(
      JSON.stringify({ triggered: true, temp5pm, alertResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("Error in check-weather-alert:", err);
    return new Response(
      JSON.stringify({ error: String((err as Error)?.message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
