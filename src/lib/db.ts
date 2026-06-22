import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let supabase: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabase() {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("Supabase credentials not configured");
    }

    supabase = createClient<Database>(url, key);
  }

  return supabase;
}

export function isSupabaseConfigured(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}
