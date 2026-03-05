import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const ACCENT = "#FF4D2D";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

export default function WorkoutHome() {
  const [expanded, setExpanded] = useState(false);

  // Example workout data (replace later with backend data)
  const workoutsToday = [
    { name: "Chest & Triceps", duration: 30, sets: 10 },
    { name: "Evening Cardio", duration: 15, sets: 8 },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F1A" }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Workout</Text>
            <Text style={styles.welcome}>
              Log training, watch videos, and compete.
            </Text>
          </View>

          <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Today</Text>

        {/* Activity Summary (Dropdown) */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.summaryCard}
          onPress={() => setExpanded(!expanded)}
        >
          <View style={styles.summaryTopRow}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>320</Text>
                <Text style={styles.statLabel}>Calories</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statValue}>45</Text>
                <Text style={styles.statLabel}>Duration (mins)</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statValue}>18</Text>
                <Text style={styles.statLabel}>Sets</Text>
              </View>
            </View>

            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={22}
              color="#C7CFDD"
              style={{ marginLeft: 10 }}
            />
          </View>

          {/* Dropdown Content */}
          {expanded && (
            <View style={styles.dropdownContainer}>
              {workoutsToday.map((workout, index) => (
                <View key={index} style={styles.workoutItem}>
                  <Text style={styles.workoutName}>{workout.name}</Text>

                  <View style={styles.workoutMetaRow}>
                    <Text style={styles.workoutMeta}>
                      ⏱ {workout.duration} mins
                    </Text>
                    <Text style={styles.workoutMeta}>
                      💪 {workout.sets} sets
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>

        {/* Action cards */}
        <ActionCard
          icon="add-circle-outline"
          title="Log Workout"
          subtitle="Record sets, reps & calories"
          onPress={() => router.push("/userTabs/workout/log")}
        />

        <ActionCard
          icon="barbell-outline"
          title="Browse Workouts"
          subtitle="Explore workouts & watch videos"
          onPress={() => router.push("/userTabs/workout/browse")}
        />

        <ActionCard
          icon="trophy-outline"
          title="Challenges"
          subtitle="Push-up challenge & leaderboard"
          onPress={() => router.push("/userTabs/workout/challenges")}
        />
      </ScrollView>
    </View>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.bigCard}
    >
      <View style={styles.bigCardRow}>
        <View style={styles.bigIcon}>
          <Ionicons name={icon} size={22} color={ACCENT} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.bigTitle}>{title}</Text>
          <Text style={styles.bigSub}>{subtitle}</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#C7CFDD" />
      </View>
    </TouchableOpacity>
  );
}

const styles = {
  headerCard: {
    marginTop: 40,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 14,
    borderRadius: 18,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 10,
  },
  hello: { color: ACCENT, fontWeight: "900" as const, fontSize: 18 },
  welcome: { color: MUTED, marginTop: 2, fontSize: 12 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  sectionTitle: {
    fontSize: 18,
    color: ACCENT,
    fontWeight: "900" as const,
    marginTop: 14,
    marginBottom: 8,
  },

  summaryCard: {
    borderRadius: 22,
    backgroundColor: CARD,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
  },
  summaryTopRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  statsRow: {
    flexDirection: "row" as const,
    flex: 1,
    justifyContent: "space-between" as const,
  },
  statBox: {
    alignItems: "center" as const,
    flex: 1,
  },
  statValue: {
    color: ACCENT,
    fontWeight: "700" as const,
    fontSize: 40,
  },
  statLabel: {
    color: MUTED,
    fontSize: 11,
    marginTop: 4,
  },

  dropdownContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 12,
  },
  workoutItem: {
    marginBottom: 14,
  },
  workoutName: {
    color: "white",
    fontWeight: "700" as const,
    fontSize: 14,
    marginBottom: 6,
  },
  workoutMetaRow: {
    flexDirection: "row" as const,
    gap: 16,
  },
  workoutMeta: {
    color: "#C7CFDD",
    fontSize: 12,
  },

  bigCard: {
    borderRadius: 22,
    backgroundColor: CARD,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },
  bigCardRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  bigIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(255,77,45,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,77,45,0.25)",
  },
  bigTitle: {
    color: "white",
    fontWeight: "900" as const,
    fontSize: 16,
  },
  bigSub: {
    color: "#C7CFDD",
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },
};