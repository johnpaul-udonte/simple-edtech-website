import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function isValidSupabaseConfig(url, key) {
  if (!url || !key) return false;

  if (url.includes("your_supabase_project_url_here")) return false;
  if (key.includes("your_supabase_anon_key_here")) return false;

  if (!url.startsWith("https://")) return false;
  if (!url.includes(".supabase.co")) return false;

  return true;
}

const hasSupabaseConfig = isValidSupabaseConfig(supabaseUrl, supabaseAnonKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function getSupabaseConfigStatus() {
  return hasSupabaseConfig;
}