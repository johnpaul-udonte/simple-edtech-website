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

  if (!userId) {
    return {
      data: null,
      error: {
        message: "User ID is required.",
      },
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, status, portrait_path")
    .eq("id", userId)
    .single();

  return {
    data,
    error,
  };
}