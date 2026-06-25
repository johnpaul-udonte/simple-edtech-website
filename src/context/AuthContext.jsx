import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

function getDashboardPath(role) {
  const cleanRole = String(role || "").toLowerCase();

  if (cleanRole === "admin") return "/admin/dashboard";
  if (cleanRole === "tutor") return "/tutor/dashboard";
  if (cleanRole === "student") return "/student/dashboard";

  return "/login";
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  async function loadProfile(userId) {
    if (!supabase || !userId) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.log("Profile loading error:", error);
      setProfile(null);
      return null;
    }

    setProfile(data || null);
    return data || null;
  }

  async function refreshAuth() {
    if (!supabase) {
      setSession(null);
      setProfile(null);
      setIsAuthLoading(false);
      return;
    }

    setIsAuthLoading(true);

    const { data, error } = await supabase.auth.getSession();

    if (error || !data?.session) {
      setSession(null);
      setProfile(null);
      setIsAuthLoading(false);
      return;
    }

    setSession(data.session);
    await loadProfile(data.session.user.id);
    setIsAuthLoading(false);
  }

  async function login(email, password) {
    if (!supabase) {
      return {
        data: null,
        error: { message: "Supabase is not configured yet." },
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { data: null, error };
    }

    setSession(data.session);

    const userProfile = await loadProfile(data.user.id);

    return {
      data: {
        session: data.session,
        user: data.user,
        profile: userProfile,
        redirectTo: getDashboardPath(userProfile?.role),
      },
      error: null,
    };
  }

  async function logout() {
    if (supabase) {
      await supabase.auth.signOut();
    }

    setSession(null);
    setProfile(null);
  }

  useEffect(() => {
    refreshAuth();

    if (!supabase) return undefined;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);

      if (currentSession?.user?.id) {
        await loadProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }

      setIsAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      profile,
      isAuthLoading,
      isLoggedIn: Boolean(session?.user),
      login,
      logout,
      refreshAuth,
      loadProfile,
      getDashboardPath,
    }),
    [session, profile, isAuthLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}