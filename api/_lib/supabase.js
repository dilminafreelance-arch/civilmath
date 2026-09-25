import { createClient } from "@supabase/supabase-js";

let supabase;

export function getSupabase() {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-side only — never expose to client

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.");
  }

  supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  return supabase;
}

export default getSupabase;
