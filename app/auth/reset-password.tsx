import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { useResponsiveLayout } from "../../lib/useResponsiveLayout";

export default function ResetPassword() {
  const { contentContainerStyle } = useResponsiveLayout({ maxWidth: 520 });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        Alert.alert(
          "Session expired",
          "Please request a new password reset email.",
        );
        router.replace("/auth/ForgotPassword");
        return;
      }
      setChecking(false);
    };
    checkSession();
  }, []);

  const canSubmit = useMemo(() => {
    if (password.length < 8) return false;
    if (password !== confirm) return false;
    return true;
  }, [password, confirm]);

  const updatePassword = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      Alert.alert("Failed", error.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    Alert.alert("Password updated", "Please log in with your new password.");
    router.replace("/auth/Login");
  };

  if (checking) {
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
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F1A" }}>
      <View style={[contentContainerStyle, { flex: 1, justifyContent: "center" }]}>
        <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>
          Set new password
        </Text>
        <Text style={{ color: "#9AA6BD", marginTop: 6 }}>
          Choose a new password for your account.
        </Text>

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="New password (min 8 chars)"
          placeholderTextColor="#6B7690"
          secureTextEntry
          style={{
            marginTop: 18,
            height: 54,
            borderRadius: 14,
            paddingHorizontal: 14,
            color: "white",
            fontWeight: "800",
            borderWidth: 1.5,
            borderColor: "#FF4D2D",
          }}
        />

        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Confirm password"
          placeholderTextColor="#6B7690"
          secureTextEntry
          style={{
            marginTop: 12,
            height: 54,
            borderRadius: 14,
            paddingHorizontal: 14,
            color: "white",
            fontWeight: "800",
            borderWidth: 1.5,
            borderColor: "#FF4D2D",
          }}
        />

        <Pressable
          onPress={updatePassword}
          disabled={loading || !canSubmit}
          style={{
            marginTop: 16,
            height: 56,
            borderRadius: 16,
            backgroundColor: loading || !canSubmit ? "#2A3550" : "#FF4D2D",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
            {loading ? "Updating..." : "Update password"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
