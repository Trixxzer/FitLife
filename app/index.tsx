import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

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
            console.log(`Retry attempt ${i + 1}/${maxRetries} after ${delay}ms`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
        }
    }
};

export default function Index() {
    const [target, setTarget] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        init();
    }, []);

    async function init() {
        try {
            console.log("INDEX: Starting initialization...");
            
            const { data: sessionData } = await retryWithBackoff(() =>
                supabase.auth.getSession()
            );

            console.log("INDEX: Session retrieved");

            const user = sessionData?.session?.user;

            if (!user) {
                console.log("INDEX: No user found, redirecting to login");
                setTarget("/auth/Login");
                return;
            }

            console.log("INDEX: Loading profile for user:", user.id);

            const { data: profile, error: profileError } = await retryWithBackoff(
                () => {
                  return supabase
                      .from("profiles")
                      .select("role, trainer_approved")
                      .eq("id", user.id)
                      .single();
                }
            );

            if (profileError || !profile) {
                console.log("INDEX: Profile error:", profileError);
                setTarget("/auth/Login");
                return;
            }

            // 🔥 ROLE BASED ROUTING
            console.log("INDEX: Profile role:", profile.role);
            
            if (profile.role === "ADMIN") {
                setTarget("/admin/admin");
                return;
            }

            if (profile.role === "TRAINER" && profile.trainer_approved === false) {
                setTarget("/auth/trainer-pending");
                return;
            }

            if (profile.role === "TRAINER" && profile.trainer_approved === true) {
                setTarget("/trainerTabs/dashboard");
                return;
            }

            if (profile.role === "USER") {
                setTarget("/userTabs/diet");
                return;
            }

            // Fallback for no role
            setTarget("/onboarding");
        } catch (e: any) {
            const errorMsg = e?.message || JSON.stringify(e);
            console.error("INDEX ERROR:", errorMsg);
            setError(errorMsg);
            // Still redirect to login on error
            setTarget("/auth/Login");
        }
    }

    // 🔥 SAFE LOADING UI (prevents white screen)
    if (error) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: "#0B0F1A",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 20,
                }}
            >
                <Text style={{ color: "#FF4D2D", fontSize: 16, marginBottom: 10, fontWeight: "bold" }}>
                    Connection Error
                </Text>
                <Text style={{ color: "#9AA6BD", marginBottom: 20, textAlign: "center" }}>
                    {error}
                </Text>
                <Text style={{ color: "#9AA6BD", textAlign: "center" }}>
                    Retrying... Redirecting to login
                </Text>
                <ActivityIndicator size="large" color="#FF4D2D" style={{ marginTop: 10 }} />
            </View>
        );
    }

    if (!target) {
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
                <Text style={{ color: "#9AA6BD", marginTop: 10 }}>
                    Loading FitLife...
                </Text>
            </View>
        );
    }

    return <Redirect href={target as any} />;
}