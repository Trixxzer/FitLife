import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { supabase } from "../../lib/supabase";

type Gender = "male" | "female" | "na" | "others";
type GoalType = "lose_weight" | "gain_muscle" | "stay_fit" | "endurance";
type Unit = "kg" | "lb";
type Role = "USER" | "TRAINER";

export default function VerifyOtp() {
  const params = useLocalSearchParams<{
    email?: string;

    // Profile fields passed from Signup.tsx
    firstName?: string;
    gender?: Gender;
    age?: string;
    unit?: Unit;
    currentWeight?: string;
    goalWeight?: string;
    goalType?: GoalType;

    // role from signup (USER or TRAINER)
    role?: Role;
  }>();

  const safeEmail = useMemo(
    () => String(params.email || "").trim().toLowerCase(),
    [params.email]
  );

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    const cleanCode = code.replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      Alert.alert("Invalid code", "Enter the 6-digit code from your email.");
      return;
    }

    if (!safeEmail) {
      Alert.alert("Missing email", "Go back and enter your email again.");
      return;
    }

    setLoading(true);
    try {
      // 1) Verify OTP => session created
      const { data, error } = await supabase.auth.verifyOtp({
        email: safeEmail,
        token: cleanCode,
        type: "email",
      });

      if (error) throw error;

      const userId = data.session?.user?.id;
      if (!userId) throw new Error("No session returned");

      // 2) Save profile data (from params)
      const role: Role = params.role === "TRAINER" ? "TRAINER" : "USER";

      const toNum = (v?: string) => {
        const n = Number(String(v ?? "").replace(",", "."));
        return Number.isFinite(n) ? n : null;
      };

      const profilePayload: any = {
        first_name: params.firstName ? String(params.firstName).trim() : null,
        gender: params.gender ?? null,
        age: params.age ? Number(params.age) : null,
        unit: params.unit ?? null,
        current_weight: toNum(params.currentWeight),
        goal_weight: toNum(params.goalWeight),
        goal_type: params.goalType ?? null,

        role,
        // Normal user: doesn't need approval
        // Trainer: needs admin approval
        trainer_approved: role === "TRAINER" ? false : true,
      };

      const { error: profileErr } = await supabase
        .from("profiles")
        .update(profilePayload)
        .eq("id", userId);

      if (profileErr) throw profileErr;

      // 3) Route based on role
      if (role === "TRAINER") {
        Alert.alert(
          "Verification complete ✅",
          "Your trainer account is pending admin approval.",
          [{ text: "OK", onPress: () => router.replace("/auth/Login") }]
        );
        return;
      }

      // Normal user -> go home
      router.replace("/"); // change to "/(tabs)/home" if that's your real home route
    } catch (e: any) {
      Alert.alert("Verification failed", e?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!safeEmail) {
      Alert.alert("Missing email", "Go back and enter your email again.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: safeEmail,
        options: { shouldCreateUser: true },
      });

      if (error) throw error;
      Alert.alert("Code sent", "We sent a new 6-digit code.");
    } catch (e: any) {
      Alert.alert("Resend failed", e?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        backgroundColor: "#0B0F1A",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>
        Enter code
      </Text>

      <Text style={{ color: "#9AA6BD", marginTop: 6 }}>
        We sent a 6-digit code to{" "}
        <Text style={{ color: "white", fontWeight: "800" }}>{safeEmail}</Text>
      </Text>

      <TextInput
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
        placeholder="123456"
        placeholderTextColor="#6B7690"
        keyboardType="numeric"
        style={{
          marginTop: 18,
          height: 54,
          borderRadius: 14,
          paddingHorizontal: 14,
          color: "white",
          letterSpacing: 6,
          fontWeight: "900",
          borderWidth: 1.5,
          borderColor: "#FF4D2D",
        }}
      />

      <Pressable
        onPress={verify}
        disabled={loading}
        style={{
          marginTop: 16,
          height: 56,
          borderRadius: 16,
          backgroundColor: loading ? "#2A3550" : "#FF4D2D",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
          {loading ? "Verifying..." : "Verify & Continue"}
        </Text>
      </Pressable>

      <Pressable
        onPress={resend}
        disabled={loading}
        style={{ marginTop: 14, alignItems: "center" }}
      >
        <Text style={{ color: "#9AA6BD" }}>
          Didn’t receive a code?{" "}
          <Text style={{ color: "#FF4D2D", fontWeight: "900" }}>Resend</Text>
        </Text>
      </Pressable>
    </View>
  );
}
