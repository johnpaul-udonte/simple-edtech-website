import { supabase } from "../lib/supabaseClient";

export async function signInWithEmail(email, password) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message:
          "Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.",
      },
    };
  }

  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signOut() {
  if (!supabase) {
    return {
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  return await supabase.auth.signOut();
}

export async function getCurrentSession() {
  if (!supabase) {
    return {
      data: { session: null },
      error: null,
    };
  }

  return await supabase.auth.getSession();
}