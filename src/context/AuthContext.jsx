import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getCurrentSession, signOut } from "../services/authService";
import { getProfileByUserId } from "../services/profileService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  async function loadUserProfile(currentSession) {
    if (!currentSession?.user?.id) {
      setProfile(null);
      return;
    }

    const { data, error } = await getProfileByUserId(currentSession.user.id);

    if (error) {
      console.error("Profile fetch error:", error.message);
      setProfile(null);
      return;
    }

    setProfile(data);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const { data } = await getCurrentSession();
        const currentSession = data?.session || null;

        if (!isMounted) return;

        setSession(currentSession);
        await loadUserProfile(currentSession);
      } catch (error) {
        console.error("Auth loading error:", error);
        setSession(null);
        setProfile(null);
      } finally {
        if (isMounted) {
          setIsLoadingAuth(false);
        }
      }
    }

    loadSession();

    if (!supabase) {
      return () => {
        isMounted = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      await loadUserProfile(newSession);
      setIsLoadingAuth(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    await signOut();
    setSession(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        isLoadingAuth,
        isAuthenticated: Boolean(session),
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}