import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    let subscription: { unsubscribe: () => void } | null = null;

    const run = async () => {
      // Give Supabase a moment to process the URL fragment
      await new Promise((r) => setTimeout(r, 500));

      const { data } = await supabase.auth.getSession();

      if (data.session) {
        handled.current = true;
        router.replace("/auth/reset-password");
        return;
      }

      // Listen for the auth event to complete (recovery sets session async)
      const sub = supabase.auth.onAuthStateChange((event, session) => {
        if (handled.current) return;

        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
          handled.current = true;
          sub.data.subscription.unsubscribe();
          router.replace("/auth/reset-password");
        }
      });

      subscription = sub.data.subscription;

      // Fallback – redirect to login if nothing happens
      setTimeout(() => {
        if (handled.current) return;
        handled.current = true;
        sub.data.subscription.unsubscribe();
        router.replace("/auth/Login");
      }, 6000);
    };

    run();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0B0F1A",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator size="large" color="#FF4D2D" />
      <Text style={{ color: "#9AA6BD", marginTop: 12 }}>
        Verifying...
      </Text>
    </View>
  );
}
