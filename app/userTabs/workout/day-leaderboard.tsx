import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { supabase } from "../../../lib/supabase";

const ACCENT = "#FF4D2D";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

type Row = {
  rank: number;
  name: string;
  workoutCount: number;
  workoutDate: string;
};

export default function DayLeaderboard() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("daily_workout_leaderboard_top")
        .select("rank,user_name,workout_count,workout_date")
        .order("rank", { ascending: true })
        .limit(20);

      if (error) throw error;

      const mapped =
        (data || []).map((r: any, idx: number) => ({
          rank: Number(r.rank || idx + 1),
          name: r.user_name || `User ${idx + 1}`,
          workoutCount: Number(r.workout_count || 0),
          workoutDate: String(r.workout_date || ""),
        })) || [];

      setRows(mapped);
    } catch (e) {
      console.log("load day leaderboard error", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F1A" }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Daily Leaderboard</Text>
            <Text style={styles.welcome}>Most workouts logged in a day</Text>
          </View>

          <View style={styles.iconBtn}>
            <Ionicons name="calendar-outline" size={20} color="white" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Top 20</Text>

        <View style={styles.bigCard}>
          {loading ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator color={ACCENT} />
            </View>
          ) : rows.length === 0 ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ color: MUTED }}>No results yet.</Text>
            </View>
          ) : (
            rows.map((r, idx) => (
              <View key={`${r.name}-${idx}`} style={styles.row}>
                <Text style={styles.rank}>{r.rank || idx + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{r.name}</Text>
                  <Text style={styles.meta}>{formatDate(r.workoutDate)}</Text>
                </View>
                <Text style={styles.score}>{r.workoutCount} workouts</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
    backgroundColor: "transparent",
  },
  sectionTitle: {
    fontSize: 18,
    color: ACCENT,
    fontWeight: "900" as const,
    marginTop: 14,
    marginBottom: 8,
  },
  bigCard: {
    borderRadius: 22,
    backgroundColor: CARD,
    padding: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  rank: { color: ACCENT, fontWeight: "900" as const, width: 26 },
  name: { color: "white", fontWeight: "900" as const },
  score: { color: "#C7CFDD", fontWeight: "900" as const },
  meta: { color: MUTED, fontSize: 11, marginTop: 2 },
};
