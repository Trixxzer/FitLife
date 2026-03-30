import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

function getTrainerPhotoUrl(path?: string | null) {
  if (!path) return null;

  const cleanPath = path.trim().replace(/^\/+/, "");
  if (!cleanPath) return null;

  const { data } = supabase.storage
    .from(TRAINER_UPLOADS_BUCKET)
    .getPublicUrl(cleanPath);

  return data.publicUrl;
}

>>>>>>> e8600b5 (payment added)
export default function Home() {
  const [loading, setLoading] = useState(true);

  const [userName, setUserName] = useState("User");
  const [calorieGoal, setCalorieGoal] = useState(1800);

  const [consumed, setConsumed] = useState(0);
  const [foodCount, setFoodCount] = useState(0);

  const [exerciseMins, setExerciseMins] = useState(0);
  const [exerciseCalories, setExerciseCalories] = useState(0);

  const [trainerName, setTrainerName] = useState<string | null>(null);

  const [macros, setMacros] = useState({
    carbs: 0,
    protein: 0,
    fat: 0,
  });

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const startISO = todayStart.toISOString();
      const endISO = todayEnd.toISOString();

      // 🔹 PROFILE
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, calorie_goal")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserName(profile.first_name || "User");
        setCalorieGoal(profile.calorie_goal || 1800);
      }

      // 🔹 DIET LOGS
      const { data: diet } = await supabase
        .from("diet_logs")
        .select("calories, carbs, protein, fat, created_at")
        .eq("user_id", user.id)
        .gte("created_at", startISO)
        .lte("created_at", endISO);

      if (diet) {
        const totalCalories = diet.reduce((s, d) => s + (d.calories || 0), 0);
        const carbs = diet.reduce((s, d) => s + (d.carbs || 0), 0);
        const protein = diet.reduce((s, d) => s + (d.protein || 0), 0);
        const fat = diet.reduce((s, d) => s + (d.fat || 0), 0);

        setConsumed(totalCalories);
        setFoodCount(diet.length);
        setMacros({ carbs, protein, fat });
      }

      // 🔹 WORKOUT LOGS
      const { data: workouts } = await supabase
        .from("workout_logs")
        .select("total_duration_mins, calories_burned, created_at")
        .eq("user_id", user.id)
        .gte("created_at", startISO)
        .lte("created_at", endISO);

      if (workouts) {
        const mins = workouts.reduce((s, w) => s + (w.total_duration_mins || 0), 0);
        const burned = workouts.reduce((s, w) => s + (w.calories_burned || 0), 0);

        setExerciseMins(mins);
        setExerciseCalories(burned);
      }

      // 🔹 TRAINER
      const { data: relation } = await supabase
        .from("user_trainers")
        .select("trainer_id, status")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .maybeSingle();

      if (relation?.trainer_id) {
        const { data: trainer } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", relation.trainer_id)
          .single();

        setTrainerName(trainer?.first_name || "Trainer");
      } else {
        setTrainerName(null);
      }

    } catch (e) {
      console.log("Home error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0B0F1A", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#FF4D2D" />
      </View>
    );
  }

  const remaining = Math.max(0, calorieGoal - consumed);
  const pct = clamp(consumed / calorieGoal, 0, 1);

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F1A" }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Hello, {userName}</Text>
            <Text style={styles.welcome}>Welcome to FitLife</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.avatar}
            onPress={() => router.push("/settings")}
          />
        </View>

        <Text style={styles.sectionTitle}>Today</Text>

        {loading && (
          <View
            style={[
              styles.card,
              {
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              },
            ]}
          >
            <ActivityIndicator color="#FF4D2D" />
            <Text style={{ color: "#9AA6BD", fontWeight: "700" }}>
              Refreshing your dashboard...
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>CALORIES</Text>

          <View style={{ flexDirection: "row", marginTop: 12, gap: 14 }}>
            <View
              style={{
                width: 120,
                height: 120,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ProgressRing size={116} stroke={10} progress={caloriePct} />
              <View style={{ position: "absolute", alignItems: "center" }}>
                <Text
                  style={{ color: "white", fontWeight: "900", fontSize: 18 }}
                >
                  {caloriesRemaining}cal
                </Text>
                <Text style={{ color: "#9AA6BD", fontSize: 12 }}>
                  Remaining
                </Text>
              </View>
            </View>

            <View style={{ flex: 1, gap: 10 }}>
              <MacroRow
                label="Carbs"
                value={macros.carbs.value}
                max={macros.carbs.max}
              />
              <MacroRow
                label="Protein"
                value={macros.protein.value}
                max={macros.protein.max}
              />
              <MacroRow
                label="Fat"
                value={macros.fat.value}
                max={macros.fat.max}
              />
            </View>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
          <View style={[styles.card, { flex: 1 }]}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={styles.cardTitle}>TRAINER</Text>
              <TouchableOpacity activeOpacity={0.9} style={styles.chatIcon}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={16}
                  color="#FF4D2D"
                />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: "center", marginTop: 12 }}>
              <View style={styles.trainerAvatar}>
                {trainer.photoUrl ? (
                  <Image
                    source={{ uri: trainer.photoUrl }}
                    style={{ width: "100%", height: "100%", borderRadius: 999 }}
                    resizeMode="cover"
                  />
                ) : null}
              </View>

              <Text
                style={{ color: "white", fontWeight: "900", marginTop: 10 }}
              >
                {trainer.hasTrainer ? trainer.name : "No trainer yet"}
              </Text>

              <Text style={{ color: "#9AA6BD", fontSize: 12, marginTop: 2 }}>
                {trainer.hasTrainer
                  ? "Your coach today"
                  : trainer.time || "Hire a trainer to get guidance"}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "column",
                justifyContent: "space-between",
                marginTop: 14,
              }}
            >
              <MiniInfo icon="time-outline" text={trainer.time} />
              <MiniInfo icon="cash-outline" text={trainer.price} />
            </View>

            {!trainer.hasTrainer && (
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.smallBtn, { marginTop: 12 }]}
                onPress={() => router.push("/userTabs/trainer/browse")}
              >
                <Text style={{ color: "white", fontWeight: "900" }}>
                  Find trainers
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardTitle}>EXERCISE</Text>

            <View style={{ alignItems: "center", marginTop: 12 }}>
              <View
                style={{
                  width: 120,
                  height: 120,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ProgressRing size={116} stroke={10} progress={exercise.pct} />
                <View style={{ position: "absolute", alignItems: "center" }}>
                  <Ionicons name="walk-outline" size={28} color="white" />
                </View>
              </View>

              <Text
                style={{ color: "white", fontWeight: "900", marginTop: 10 }}
              >
                {Math.round(exercise.pct * 100)}%{" "}
                <Text style={{ color: "#9AA6BD", fontWeight: "700" }}>
                  remaining
                </Text>
              </Text>

              <Text style={{ color: "#9AA6BD", fontSize: 12, marginTop: 2 }}>
                {exercise.updated}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { marginTop: 12 }]}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.cardTitle}>DAILY STATS</Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 12,
            }}
          >
            {extras.map((x) => (
              <View key={x.label} style={styles.statTile}>
                <Ionicons name={x.icon as any} size={18} color="#FF4D2D" />
                <Text style={{ color: "#9AA6BD", fontSize: 12, marginTop: 6 }}>
                  {x.label}
                </Text>
                <Text
                  style={{ color: "white", fontWeight: "900", marginTop: 2 }}
                >
                  {x.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
    <ScrollView style={{ flex: 1, backgroundColor: "#0B0F1A", padding: 16 }}>

      <Text style={{ color: "#FF4D2D", fontSize: 20, fontWeight: "900" }}>
        Hello, {userName}
      </Text>

      <Text style={{ color: "#9AA6BD", marginBottom: 16 }}>
        Welcome to FitLife
      </Text>

      <Text style={{ color: "white", fontWeight: "900" }}>
        {remaining} kcal remaining
      </Text>

      <Text style={{ color: "#9AA6BD" }}>
        Food logs: {foodCount}
      </Text>

      <Text style={{ color: "#9AA6BD" }}>
        Exercise: {exerciseMins} mins / {exerciseCalories} kcal
      </Text>

      <Text style={{ color: "#9AA6BD", marginTop: 10 }}>
        Trainer: {trainerName || "No trainer yet"}
      </Text>

        <View style={[styles.card, { marginTop: 12 }]}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.cardTitle}>LATEST WORKOUT</Text>
          </View>

          <View style={styles.weightPlaceholder}>
            {!latestWorkout ? (
              <Text style={{ color: "#9AA6BD", fontWeight: "800" }}>
                You have no workouts yet. Log your first workout now.
              </Text>
            ) : (
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{ color: "white", fontWeight: "900", fontSize: 15 }}
                >
                  {latestWorkout.title}
                </Text>
                <Text style={{ color: "#9AA6BD", marginTop: 6, fontSize: 12 }}>
                  {latestWorkout.total_duration_mins || 0} mins •{" "}
                  {latestWorkout.calories_burned || 0} kcal
                </Text>
                <Text style={{ color: "#9AA6BD", marginTop: 4, fontSize: 12 }}>
                  {latestWorkout.created_at
                    ? `Logged ${formatRelativeTime(latestWorkout.created_at)}`
                    : "Logged recently"}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ProgressRing({
  size,
  stroke,
  progress,
}: {
  size: number;
  stroke: number;
  progress: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * progress;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#2B3446"
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#FF4D2D"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        rotation={-90}
        originX={size / 2}
        originY={size / 2}
      />
    </Svg>
  );
}

function MacroRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = clamp(value / max, 0, 1);

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: "#9AA6BD", fontSize: 12 }}>{label}</Text>
        <Text style={{ color: "#9AA6BD", fontSize: 12 }}>
          {value}/{max}g
      <TouchableOpacity
        onPress={() => router.push("/userTabs/trainer")}
        style={{
          marginTop: 20,
          padding: 12,
          backgroundColor: "#FF4D2D",
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "white", fontWeight: "900" }}>
          Go to Trainer
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
<<<<<<< HEAD
}
=======
}