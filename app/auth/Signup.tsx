
import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type Gender = "male" | "female" | "na" | "others";
type GoalType = "lose_weight" | "gain_muscle" | "stay_fit" | "endurance";
type Unit = "kg" | "lb";

export default function Signup() {
  const navigation = useNavigation();

  // ✅ Disable swipe-back ONLY for Signup
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
    });
  }, [navigation]);

  // Step control
  const [step, setStep] = useState(1); // 1..7
  const totalSteps = 7;

  // Data collected across steps
  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState("");
  const [unit, setUnit] = useState<Unit>("kg");
  const [currentWeight, setCurrentWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [goalType, setGoalType] = useState<GoalType>("lose_weight");

  // Account step
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ✅ Eye toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // ✅ Intercept ANY back action (gesture / header back / android back) to go previous step
  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e: any) => {
      if (step === 1) return; // allow leaving screen
      e.preventDefault();
      setStep((s) => Math.max(1, s - 1));
    });

    return unsub;
  }, [navigation, step]);

  // ✅ Optional: auto-hide eye when switching steps
  useEffect(() => {
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [step]);

  const goBack = () => {
    if (step === 1) router.back();
    else setStep((s) => s - 1);
  };

  const title = useMemo(() => {
    switch (step) {
      case 1:
        return "What would you like us to call you?";
      case 2:
        return "What’s your gender?";
      case 3:
        return "How old are you?";
      case 4:
        return "What’s your current weight?";
      case 5:
        return "What’s your goal weight?";
      case 6:
        return "What’s your primary fitness goal?";
      case 7:
        return "Create your account";
      default:
        return "";
    }
  }, [step]);

  const subtitle = useMemo(() => {
    switch (step) {
      case 1:
        return "We’ll use this to personalize your experience.";
      case 2:
        return "This helps us personalize training and calorie targets.";
      case 3:
        return "Age helps us recommend safe and effective plans.";
      case 4:
        return "We’ll track your progress starting from here.";
      case 5:
        return "This helps us set realistic milestones.";
      case 6:
        return "We’ll tailor workouts and nutrition to match your goal.";
      case 7:
        return "Add your email and password to save your profile.";
      default:
        return "";
    }
  }, [step]);

  const stepValid = useMemo(() => {
    const toNum = (v: string) => Number(v.replace(",", "."));

    if (step === 1) return firstName.trim().length >= 2;

    if (step === 2) return gender === "male" || gender === "female" || gender === "others" || gender === "na";

    if (step === 3) {
      const n = Number(age);
      return Number.isFinite(n) && n >= 10 && n <= 90;
    }

    if (step === 4) {
      const n = toNum(currentWeight);
      return Number.isFinite(n) && n > 20 && n < 400;
    }

    if (step === 5) {
      const n = toNum(goalWeight);
      return Number.isFinite(n) && n > 20 && n < 400;
    }

    if (step === 6) return !!goalType;

    if (step === 7) {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
      const passOk = password.length >= 8;
      const matchOk = password === confirmPassword;
      return emailOk && passOk && matchOk;
    }

    return false;
  }, [
    step,
    firstName,
    gender,
    age,
    currentWeight,
    goalWeight,
    goalType,
    email,
    password,
    confirmPassword,
  ]);

  const goNext = () => {
    if (!stepValid) {
      Alert.alert("Please fill this step", "Enter valid details to continue.");
      return;
    }
    if (step < totalSteps) setStep((s) => s + 1);
    else handleFinish();
  };

  const handleFinish = async () => {
  if (!stepValid) return;

  setLoading(true);

  try {
    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) throw error;
    router.push({
      pathname: "/auth/VerifyOtp",
      params: {
        email: cleanEmail,
        firstName,
        gender,
        age,
        unit,
        currentWeight,
        goalWeight,
        goalType,
      },
    });

  } catch (e: any) {
    Alert.alert("Failed to send code", e?.message ?? "Try again");
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0B0F1A" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={goBack}
            activeOpacity={0.85}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back-outline" size={25} color="white" />
          </TouchableOpacity>

          <Text style={styles.headerTitle} pointerEvents="none">
            Welcome to FitLife
          </Text>

          <View style={styles.progressPill}>
            <Text style={{ color: "#D7DEEA", fontWeight: "800" }}>
              {step}/{totalSteps}
            </Text>
          </View>
        </View>

        {/* Main heading */}
        <Text style={styles.bigTitle}>{title}</Text>
        <Text style={styles.subTitle}>{subtitle}</Text>

        {/* Step content */}
        <View style={{ marginTop: 24 }}>
          {step === 1 && (
            <>
              <Text style={styles.label}>preferred first name</Text>
              <TextInput
                placeholder="e.g., Prajwal"
                placeholderTextColor="#6B7690"
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
                autoCapitalize="words"
              />
            </>
          )}

          {step === 2 && (
            <View style={{ gap: 12 }}>
              <PillRow>
                <Pill
                  active={gender === "male"}
                  text="Male"
                  onPress={() => setGender("male")}
                />
                <Pill
                  active={gender === "female"}
                  text="Female"
                  onPress={() => setGender("female")}
                />
                <Pill
                  active={gender === "others"}
                  text="Others"
                  onPress={() => setGender("others")}
                />
              </PillRow>
              <Pill
                active={gender === "na"}
                text="Prefer not to say"
                onPress={() => setGender("na")}
                full
              />
            </View>
          )}

          {step === 3 && (
            <>
              <Text style={styles.label}>please enter your age</Text>
              <TextInput
                placeholder="e.g., 21"
                placeholderTextColor="#6B7690"
                value={age}
                onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ""))}
                style={styles.input}
                keyboardType="numeric"
              />
              <Text style={styles.helper}>Allowed range: 10–90</Text>
            </>
          )}

          {step === 4 && (
            <>
              <RowBetween>
                <Text style={styles.label}>current weight</Text>
                <UnitToggle unit={unit} setUnit={setUnit} />
              </RowBetween>
              <TextInput
                placeholder={unit === "kg" ? "e.g., 72" : "e.g., 160"}
                placeholderTextColor="#6B7690"
                value={currentWeight}
                onChangeText={(t) => setCurrentWeight(t.replace(/[^0-9.,]/g, ""))}
                style={styles.input}
                keyboardType="numeric"
              />
            </>
          )}

          {step === 5 && (
            <>
              <RowBetween>
                <Text style={styles.label}>goal weight</Text>
                <UnitToggle unit={unit} setUnit={setUnit} />
              </RowBetween>
              <TextInput
                placeholder={unit === "kg" ? "e.g., 65" : "e.g., 145"}
                placeholderTextColor="#6B7690"
                value={goalWeight}
                onChangeText={(t) => setGoalWeight(t.replace(/[^0-9.,]/g, ""))}
                style={styles.input}
                keyboardType="numeric"
              />
            </>
          )}

          {step === 6 && (
            <View style={{ gap: 12 }}>
              <Pill
                active={goalType === "lose_weight"}
                text="Lose weight"
                onPress={() => setGoalType("lose_weight")}
                full
              />
              <Pill
                active={goalType === "gain_muscle"}
                text="Gain muscle"
                onPress={() => setGoalType("gain_muscle")}
                full
              />
              <Pill
                active={goalType === "stay_fit"}
                text="Stay fit"
                onPress={() => setGoalType("stay_fit")}
                full
              />
              <Pill
                active={goalType === "endurance"}
                text="Improve endurance"
                onPress={() => setGoalType("endurance")}
                full
              />
            </View>
          )}

          {step === 7 && (
            <>
              <Text style={styles.label}>email</Text>
              <TextInput
                placeholder="e.g., you@gmail.com"
                placeholderTextColor="#6B7690"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={[styles.label, { marginTop: 16 }]}>password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  placeholder="Minimum 8 characters"
                  placeholderTextColor="#6B7690"
                  value={password}
                  onChangeText={setPassword}
                  style={[styles.input, { paddingRight: 44 }]}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#9AA6BD"
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { marginTop: 16 }]}>confirm password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  placeholder="Re-enter password"
                  placeholderTextColor="#6B7690"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={[styles.input, { paddingRight: 44 }]}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((v) => !v)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#9AA6BD"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.helper}>Password must be at least 8 characters.</Text>
            </>
          )}
        </View>
      </ScrollView>

      {/* Fixed bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={goNext}
          disabled={!stepValid || loading}
          activeOpacity={0.9}
          style={[
            styles.cta,
            { backgroundColor: !stepValid || loading ? "#2A3550" : "#FF4D2D" },
          ]}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>
              {step === totalSteps ? "Finish →" : "Continue →"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ---------- Small UI helpers ---------- */

function RowBetween({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      {children}
    </View>
  );
}

function PillRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", gap: 12 }}>{children}</View>;
}

function Pill({
  active,
  text,
  onPress,
  full,
}: {
  active: boolean;
  text: string;
  onPress: () => void;
  full?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.pill,
        {
          flex: full ? undefined : 1,
          borderColor: active ? "#FF4D2D" : "#24314E",
          backgroundColor: active ? "rgba(255,77,45,0.12)" : "transparent",
        },
      ]}
    >
      <Text style={{ color: active ? "#FFD3CA" : "#D7DEEA", fontWeight: "900" }}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

function UnitToggle({ unit, setUnit }: { unit: Unit; setUnit: (u: Unit) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <TouchableOpacity
        onPress={() => setUnit("kg")}
        activeOpacity={0.9}
        style={[styles.unitBtn, { backgroundColor: unit === "kg" ? "#FF4D2D" : "transparent" }]}
      >
        <Text style={{ color: unit === "kg" ? "white" : "#9AA6BD", fontWeight: "900" }}>kg</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setUnit("lb")}
        activeOpacity={0.9}
        style={[styles.unitBtn, { backgroundColor: unit === "lb" ? "#FF4D2D" : "transparent" }]}
      >
        <Text style={{ color: unit === "lb" ? "white" : "#9AA6BD", fontWeight: "900" }}>lb</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = {
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginTop: 30,
  },
  headerTitle: {
    position: "absolute" as const,
    left: 0,
    right: 0,
    textAlign: "center" as const,
    color: "#FF4D2D",
    fontWeight: "800" as const,
    fontSize: 18,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#111A2C",
    borderWidth: 1,
    borderColor: "#1F2A44",
    zIndex: 2,
  },
  progressPill: {
    minWidth: 56,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#111A2C",
    borderWidth: 1,
    borderColor: "#1F2A44",
    zIndex: 2,
  },
  bigTitle: {
    color: "white",
    fontSize: 34,
    fontWeight: "800" as const,
    marginTop: 18,
    lineHeight: 40,
  },
  subTitle: {
    color: "#9AA6BD",
    marginTop: 4,
    fontSize: 14,
  },
  helper: {
    color: "#6B7690",
    marginTop: 8,
    fontSize: 12,
  },
  label: {
    color: "#6B7690",
    fontWeight: "800" as const,
    textTransform: "lowercase" as const,
    marginBottom: 8,
  },
  input: {
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: "white",
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#FF4D2D",
  },
  passwordWrapper: {
    position: "relative" as const,
  },
  eyeBtn: {
    position: "absolute" as const,
    right: 14,
    top: 0,
    height: 54,
    justifyContent: "center" as const,
  },
  pill: {
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1.5,
  },
  unitBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#24314E",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  cta: {
    height: 58,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  bottomBar: {
    padding: 20,
    backgroundColor: "#0B0F1A",
    borderTopWidth: 1,
    borderTopColor: "#1F2A44",
  },
};
