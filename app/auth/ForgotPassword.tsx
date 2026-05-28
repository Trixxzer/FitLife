import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useResponsiveLayout } from "../../lib/useResponsiveLayout";

type Step = "email" | "code" | "password";

export default function ForgotPassword() {
  const { contentContainerStyle } = useResponsiveLayout({ maxWidth: 520 });

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  const cleanEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const canUpdatePassword = useMemo(() => {
    return password.length >= 8 && password === confirm;
  }, [password, confirm]);

  const sendVerificationCode = async () => {
    if (!cleanEmail) {
      Alert.alert("Enter email", "Please enter your registered email address.");
      return;
    }

    try {
      setLoading(true);

      // First check if the email exists in your database.
      const { data: exists, error: checkError } = await supabase.rpc(
        "check_email_exists",
        { p_email: cleanEmail },
      );

      if (checkError) throw checkError;

      if (!exists) {
        Alert.alert(
          "Email not found",
          "No account found with this email address.",
        );
        return;
      }

      // This sends Supabase password recovery email.
      // Make sure your Supabase Recovery email template shows {{ .Token }}.
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(cleanEmail);

      if (resetError) throw resetError;

      setCode("");
      setStep("code");
      Alert.alert(
        "Code sent",
        "Please check your email for the verification code.",
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    const cleanCode = code.trim();

    if (cleanCode.length !== 6) {
      Alert.alert(
        "Invalid code",
        "Please enter the 6 digit verification code.",
      );
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanCode,
        type: "recovery",
      });

      if (error) throw error;

      setPassword("");
      setConfirm("");
      setStep("password");
    } catch (e: any) {
      Alert.alert(
        "Verification failed",
        e?.message || "Code is invalid or expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      await supabase.auth.signOut();

      Alert.alert(
        "Password updated",
        "You can now log in with your new password.",
      );
      router.replace("/auth/Login");
    } catch (e: any) {
      Alert.alert("Update failed", e?.message || "Could not update password.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === "password") {
      setStep("code");
      return;
    }

    if (step === "code") {
      setStep("email");
      return;
    }

    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F1A" }}>
      <View
        style={[contentContainerStyle, { flex: 1, justifyContent: "center" }]}
      >
        <TouchableOpacity
          onPress={goBack}
          activeOpacity={0.85}
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#111A2C",
            borderWidth: 1,
            borderColor: "#1F2A44",
            marginBottom: 14,
          }}
        >
          <Ionicons name="arrow-back-outline" size={22} color="white" />
        </TouchableOpacity>

        {step === "email" && (
          <>
            <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>
              Reset password
            </Text>
            <Text style={{ color: "#9AA6BD", marginTop: 6 }}>
              Enter your registered email address.
            </Text>

            <TextInput
              placeholder="Enter email"
              placeholderTextColor="#6B7690"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                marginTop: 20,
                borderWidth: 1.5,
                borderColor: "#FF4D2D",
                borderRadius: 14,
                height: 54,
                paddingHorizontal: 14,
                color: "white",
                fontWeight: "800",
              }}
            />

            <Pressable
              onPress={sendVerificationCode}
              disabled={loading}
              style={{
                marginTop: 20,
                height: 56,
                borderRadius: 16,
                backgroundColor: loading ? "#2A3550" : "#FF4D2D",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{ color: "white", fontWeight: "900", fontSize: 16 }}
                >
                  Send verification code
                </Text>
              )}
            </Pressable>
          </>
        )}

        {step === "code" && (
          <>
            <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>
              Enter verification code
            </Text>
            <Text style={{ color: "#9AA6BD", marginTop: 6 }}>
              We sent a code to {cleanEmail}.
            </Text>

            <TextInput
              value={code}
              onChangeText={(value) => setCode(value.replace(/[^0-9]/g, ""))}
              keyboardType="numeric"
              maxLength={6}
              placeholder="Enter verification code"
              placeholderTextColor="#6B7690"
              style={{
                marginTop: 20,
                borderWidth: 1.5,
                borderColor: "#FF4D2D",
                borderRadius: 14,
                height: 54,
                paddingHorizontal: 14,
                color: "white",
                fontWeight: "900",
                letterSpacing: 4,
              }}
            />

            <Pressable
              onPress={verifyCode}
              disabled={loading}
              style={{
                marginTop: 20,
                height: 56,
                borderRadius: 16,
                backgroundColor: loading ? "#2A3550" : "#FF4D2D",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{ color: "white", fontWeight: "900", fontSize: 16 }}
                >
                  Verify code
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={sendVerificationCode}
              disabled={loading}
              style={{ marginTop: 16, alignItems: "center" }}
            >
              <Text style={{ color: "#FF4D2D", fontWeight: "900" }}>
                Resend code
              </Text>
            </Pressable>
          </>
        )}

        {step === "password" && (
          <>
            <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>
              Set new password
            </Text>
            <Text style={{ color: "#9AA6BD", marginTop: 6 }}>
              Create a new password for {cleanEmail}.
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1.5,
                borderColor: "#FF4D2D",
                borderRadius: 14,
                height: 54,
                paddingHorizontal: 14,
                marginTop: 20,
              }}
            >
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="New password (min 8 chars)"
                placeholderTextColor="#6B7690"
                secureTextEntry={!showPassword}
                style={{ flex: 1, color: "white", fontWeight: "800" }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9AA6BD"
                />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1.5,
                borderColor: "#FF4D2D",
                borderRadius: 14,
                height: 54,
                paddingHorizontal: 14,
                marginTop: 14,
              }}
            >
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Confirm password"
                placeholderTextColor="#6B7690"
                secureTextEntry={!showConfirm}
                style={{ flex: 1, color: "white", fontWeight: "800" }}
              />
              <TouchableOpacity onPress={() => setShowConfirm((prev) => !prev)}>
                <Ionicons
                  name={showConfirm ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9AA6BD"
                />
              </TouchableOpacity>
            </View>

            <Pressable
              onPress={updatePassword}
              disabled={loading || !canUpdatePassword}
              style={{
                marginTop: 20,
                height: 56,
                borderRadius: 16,
                backgroundColor:
                  loading || !canUpdatePassword ? "#2A3550" : "#FF4D2D",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{ color: "white", fontWeight: "900", fontSize: 16 }}
                >
                  Change password
                </Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
