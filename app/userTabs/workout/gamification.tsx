import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

const ACCENT = "#FF4D2D";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

type StreakRow = {
  streak_type: string;
  current_streak: number | null;
  longest_streak: number | null;
  last_log_date: string | null;
};

type BadgeRow = {
  id: string;
  badge_name: string;
  badge_description: string;
  icon_name: string;
  badge_category: string;
  requirement_value: number;
  color_hex: string;
};

type LeaderRow = {
  rank: number;
  user_name: string;
  best_score: number;
  average_score: number;
};

type DayLeaderRow = {
  rank: number;
  user_name: string;
  workout_count: number;
  workout_date: string;
};

export default function Gamification() {
  const [loading, setLoading] = useState(true);
  const [streaks, setStreaks] = useState<Record<string, StreakRow>>({});
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [earned, setEarned] = useState<Set<string>>(new Set());
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [dayLeaders, setDayLeaders] = useState<DayLeaderRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadGamification();
    }, []),
  );

  async function loadGamification() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;

      const userId = user?.id;

      const [streakRes, badgeRes, earnedRes, leaderRes, dayLeaderRes] = await Promise.all([
        userId
          ? supabase
              .from("user_streaks")
              .select("streak_type,current_streak,longest_streak,last_log_date")
              .eq("user_id", userId)
          : Promise.resolve({ data: [] as any, error: null }),

        supabase
          .from("badge_definitions")
          .select(
            "id,badge_name,badge_description,icon_name,badge_category,requirement_value,color_hex",
          )
          .order("requirement_value", { ascending: true }),

        userId
          ? supabase
              .from("user_badges")
              .select("badge_id")
              .eq("user_id", userId)
          : Promise.resolve({ data: [] as any, error: null }),

        supabase
          .from("challenge_scores")
          .select("user_id,score")
          .eq("challenge_key", "squat")
          .order("score", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(200),

        supabase
          .from("daily_workout_leaderboard_top")
          .select("rank,user_name,workout_count,workout_date")
          .order("rank", { ascending: true })
          .limit(5),
      ]);

      if (streakRes.error) throw streakRes.error;
      if (badgeRes.error) throw badgeRes.error;
      if (earnedRes.error) throw earnedRes.error;
      if (leaderRes.error) throw leaderRes.error;
      if (dayLeaderRes.error) throw dayLeaderRes.error;

      const streakMap: Record<string, StreakRow> = {};
      (streakRes.data || []).forEach((row: StreakRow) => {
        streakMap[row.streak_type] = row;
      });

      setStreaks(streakMap);
      setBadges((badgeRes.data || []) as BadgeRow[]);
      setEarned(new Set((earnedRes.data || []).map((r: any) => r.badge_id)));
      const leaderRows = (leaderRes.data || []) as Array<{ user_id: string; score: number }>;
      const userIds = Array.from(new Set(leaderRows.map((r) => r.user_id)));
      const { data: profiles, error: profileErr } = userIds.length
        ? await supabase.from("profiles").select("id,first_name").in("id", userIds)
        : { data: [], error: null };

      if (profileErr) throw profileErr;

      const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.first_name]));
      const stats = new Map<
        string,
        { user_name: string; best_score: number; average_score: number; total: number; attempts: number }
      >();

      leaderRows.forEach((row) => {
        const existing = stats.get(row.user_id);
        if (!existing) {
          stats.set(row.user_id, {
            user_name: nameMap.get(row.user_id) || "User",
            best_score: Number(row.score || 0),
            average_score: 0,
            total: Number(row.score || 0),
            attempts: 1,
          });
        } else {
          existing.best_score = Math.max(existing.best_score, Number(row.score || 0));
          existing.total += Number(row.score || 0);
          existing.attempts += 1;
        }
      });

      const leadersMapped: LeaderRow[] = Array.from(stats.values())
        .map((s, idx) => ({
          rank: idx + 1,
          user_name: s.user_name,
          best_score: s.best_score,
          average_score: s.attempts ? Math.round(s.total / s.attempts) : 0,
        }))
        .sort((a, b) => b.best_score - a.best_score)
        .slice(0, 5)
        .map((row, idx) => ({ ...row, rank: idx + 1 }));

      setLeaders(leadersMapped);
      setDayLeaders((dayLeaderRes.data || []) as DayLeaderRow[]);
    } catch (e) {
      console.log("loadGamification error", e);
    } finally {
      setLoading(false);
    }
  }

  const workoutStreak = streaks.workout;
  const dietStreak = streaks.diet;

  const badgeGroups = useMemo(() => {
    return badges.map((b) => ({
      ...b,
      earned: earned.has(b.id),
    }));
  }, [badges, earned]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F1A" }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Rewards</Text>
            <Text style={styles.welcome}>Streaks, badges, and leaderboards.</Text>
          </View>

          <View style={styles.iconBtn}>
            <Ionicons name="trophy-outline" size={20} color="white" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Streaks</Text>

        <View style={styles.rowCards}>
          <StreakCard
            title="Workout"
            current={Number(workoutStreak?.current_streak || 0)}
            longest={Number(workoutStreak?.longest_streak || 0)}
            lastDate={workoutStreak?.last_log_date || null}
            loading={loading}
          />
          <StreakCard
            title="Diet"
            current={Number(dietStreak?.current_streak || 0)}
            longest={Number(dietStreak?.longest_streak || 0)}
            lastDate={dietStreak?.last_log_date || null}
            loading={loading}
          />
        </View>

        <Text style={styles.sectionTitle}>Badges</Text>

        <View style={styles.badgeGrid}>
          {loading ? (
            <View style={{ paddingVertical: 18, alignItems: "center" }}>
              <ActivityIndicator color={ACCENT} />
            </View>
          ) : badgeGroups.length === 0 ? (
            <View style={{ paddingVertical: 18, alignItems: "center" }}>
              <Text style={{ color: MUTED }}>No badges found.</Text>
            </View>
          ) : (
            badgeGroups.map((b) => (
              <View
                key={b.id}
                style={[
                  styles.badgeCard,
                  !b.earned && { opacity: 0.5 },
                ]}
              >
                <View
                  style={[
                    styles.badgeIcon,
                    { borderColor: b.color_hex, backgroundColor: "rgba(255,255,255,0.06)" },
                  ]}
                >
                  <Ionicons
                    name={b.icon_name as any}
                    size={18}
                    color={b.color_hex}
                  />
                </View>
                <Text style={styles.badgeName}>{b.badge_name}</Text>
                <Text style={styles.badgeMeta}>{b.badge_description}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Squat Leaderboard</Text>

        <View style={styles.bigCard}>
          {loading ? (
            <View style={{ paddingVertical: 18, alignItems: "center" }}>
              <ActivityIndicator color={ACCENT} />
            </View>
          ) : leaders.length === 0 ? (
            <View style={{ paddingVertical: 18, alignItems: "center" }}>
              <Text style={{ color: MUTED }}>No scores yet.</Text>
            </View>
          ) : (
            leaders.map((row) => (
              <View key={`${row.rank}-${row.user_name}`} style={styles.leaderRow}>
                <Text style={styles.rank}>{row.rank}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{row.user_name}</Text>
                  <Text style={styles.meta}>Avg {row.average_score}</Text>
                </View>
                <Text style={styles.score}>{row.best_score} reps</Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.primaryBtn}
          onPress={() => router.push("/userTabs/workout/leaderboard")}
        >
          <Ionicons name="trophy-outline" size={18} color="white" />
          <Text style={styles.primaryText}>View Full Leaderboard</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Most Workouts In A Day</Text>

        <View style={styles.bigCard}>
          {loading ? (
            <View style={{ paddingVertical: 18, alignItems: "center" }}>
              <ActivityIndicator color={ACCENT} />
            </View>
          ) : dayLeaders.length === 0 ? (
            <View style={{ paddingVertical: 18, alignItems: "center" }}>
              <Text style={{ color: MUTED }}>No results yet.</Text>
            </View>
          ) : (
            dayLeaders.map((row) => (
              <View key={`${row.rank}-${row.user_name}`} style={styles.leaderRow}>
                <Text style={styles.rank}>{row.rank}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{row.user_name}</Text>
                  <Text style={styles.meta}>{formatDate(row.workout_date)}</Text>
                </View>
                <Text style={styles.score}>{row.workout_count} workouts</Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.secondaryBtn}
          onPress={() => router.push("/userTabs/workout/day-leaderboard")}
        >
          <Ionicons name="calendar-outline" size={18} color="#FFD3CA" />
          <Text style={styles.secondaryText}>View Daily Leaderboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function StreakCard({
  title,
  current,
  longest,
  lastDate,
  loading,
}: {
  title: string;
  current: number;
  longest: number;
  lastDate: string | null;
  loading: boolean;
}) {
  return (
    <View style={styles.streakCard}>
      <View style={styles.streakTop}>
        <Text style={styles.streakTitle}>{title}</Text>
        <Ionicons name="flame-outline" size={16} color={ACCENT} />
      </View>
      {loading ? (
        <ActivityIndicator color={ACCENT} />
      ) : (
        <>
          <Text style={styles.streakValue}>{current} days</Text>
          <Text style={styles.streakMeta}>Best: {longest} days</Text>
          <Text style={styles.streakMeta}>
            Last log: {lastDate ? formatDate(lastDate) : "—"}
          </Text>
        </>
      )}
    </View>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
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
  },
  sectionTitle: {
    fontSize: 18,
    color: ACCENT,
    fontWeight: "900" as const,
    marginTop: 14,
    marginBottom: 8,
  },
  rowCards: {
    flexDirection: "row" as const,
    gap: 12,
  },
  streakCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: CARD,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  streakTop: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  streakTitle: { color: "white", fontWeight: "900" as const },
  streakValue: { color: ACCENT, fontWeight: "900" as const, fontSize: 20, marginTop: 10 },
  streakMeta: { color: MUTED, fontSize: 12, marginTop: 6 },
  badgeGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
  },
  badgeCard: {
    width: "48%" as const,
    borderRadius: 16,
    backgroundColor: CARD,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  badgeIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
  },
  badgeName: { color: "white", fontWeight: "900" as const, marginTop: 10 },
  badgeMeta: { color: MUTED, fontSize: 12, marginTop: 4 },
  bigCard: {
    borderRadius: 22,
    backgroundColor: CARD,
    padding: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  leaderRow: {
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
  primaryBtn: {
    height: 56,
    borderRadius: 999,
    backgroundColor: ACCENT,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    gap: 10,
    marginTop: 12,
  },
  primaryText: { color: "white", fontWeight: "900" as const, fontSize: 16 },
  secondaryBtn: {
    height: 56,
    borderRadius: 999,
    backgroundColor: "rgba(255,77,45,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,77,45,0.35)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    gap: 10,
    marginTop: 12,
  },
  secondaryText: { color: "#FFD3CA", fontWeight: "900" as const, fontSize: 16 },
};
