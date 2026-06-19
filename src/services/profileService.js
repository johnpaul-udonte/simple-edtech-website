import { supabase } from "../lib/supabaseClient";

export async function getProfileByUserId(userId) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  return await supabase
    .from("profiles")
    .select("id, full_name, email, role, status")
    .eq("id", userId)
    .single();
}