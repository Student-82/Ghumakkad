// supabase/functions/create-trip/index.ts (FINAL, CORRECTED VERSION)

import { serve } from "std/http/server.ts";
import { createClient } from "supabase-js";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  try {
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("User not found. You must be logged in.");

    const { title, destination } = await req.json();
    if (!title) throw new Error("Trip title is required.");

    const { data: tripData, error: tripError } = await supabaseAdmin
      .from('trips')
      .insert({ title, destination, created_by: user.id })
      .select()
      .single();
    if (tripError) throw tripError;

    const { error: memberError } = await supabaseAdmin
      .from('trip_members')
      .insert({ trip_id: tripData.id, user_id: user.id });
    if (memberError) throw memberError;

    return new Response(JSON.stringify(tripData), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { "Content-Type": "application/json" }, status: 400 });
  }
});