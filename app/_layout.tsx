import { Stack, router, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  role: "USER" | "TRAINER" | "ADMIN" | null;
  trainer_approved: boolean | null;
};

// Retry logic for network requests
const retryWithBackoff = async (
  fn: () => any,
  maxRetries: number = 3,
  delay: number = 1000
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      console.log(`[_layout] Retry attempt ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};

export default function RootLayout() {
  const segments = useSegments();

  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    try {
      const { data, error } = await retryWithBackoff(
        () => {
          return supabase
            .from("profiles")
            .select("role, trainer_approved")
            .eq("id", userId)
            .single();
        }
      );

      if (error) {
        console.log("[_layout] Profile fetch error:", error.message);
        return null;
      }

      return data as Profile;
    } catch (e: any) {
      console.error("[_layout] Profile fetch failed after retries:", e?.message);
      return null;
    }
  }

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        console.log("[_layout] Bootstrapping session...");
        
        const { data } = await retryWithBackoff(() =>
          supabase.auth.getSession()
        );
        
        if (!mounted) return;

        const currentSession = data.session;
        setSession(currentSession);
        console.log("[_layout] Session loaded:", !!currentSession);

        if (currentSession?.user?.id) {
          const profileData = await loadProfile(currentSession.user.id);
          if (mounted) setProfile(profileData);
        } else {
          setProfile(null);
        }

        if (mounted) setLoading(false);
      } catch (e: any) {
        console.error("[_layout] Bootstrap failed:", e?.message);
        if (mounted) {
          setLoading(false);
          setSession(null);
          setProfile(null);
        }
      }
    };

    bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);

      if (newSession?.user?.id) {
        const profileData = await loadProfile(newSession.user.id);
        setProfile(profileData);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "auth";

    if (!session) {
      if (!inAuthGroup) router.replace("/onboarding");
      return;
    }

    if (!profile) return;

    // Pending trainer should not enter app
    if (profile.role === "TRAINER" && profile.trainer_approved === false) {
      if (segments[0] !== "auth" || segments[1] !== "trainer-pending") {
        router.replace("/auth/trainer-pending");
      }
      return;
    }

    // Approved trainer
    if (profile.role === "TRAINER" && profile.trainer_approved === true) {
      if (inAuthGroup) {
        router.replace("/trainerTabs/dashboard");
      }
      return;
    }

    // Normal user
    if (profile.role === "USER") {
      if (inAuthGroup) {
        router.replace("/userTabs/diet");
      }
      return;
    }
    // Admin
    if (profile.role === "ADMIN") {
      if (inAuthGroup) {
        router.replace("/admin/admin");
      }
      return;
    }
  }, [session, profile, segments, loading]);

  if (loading) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}