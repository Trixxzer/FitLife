import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";
import { useResponsiveLayout } from "../../../lib/useResponsiveLayout";

const ORANGE = "#FF4D2D";
const BG = "#0B0F1A";
const CARD = "#111A2C";
const CARD2 = "#0F1627";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

type ClientRow = {
  id: string;
  name: string;
  status: string;
  last: string;
  goal: string;
  threadId: string | null;
};

type UserTrainerRow = {
  id: string;
  user_id: string;
  trainer_id: string;
  status: "pending" | "approved" | "rejected" | "declined" | "ended";
  created_at: string;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  goal_type: string | null;
};

type WorkoutRow = {
  user_id: string;
  created_at: string;
};

export default function Clients() {
  const { contentContainerStyle } = useResponsiveLayout({ paddingTop: 20, paddingBottom: 24 });
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;

      if (!user) {
        setClients([]);
        setPendingCount(0);
        return;
      }

      const { data: relations, error: relationsErr } = await supabase
        .from("user_trainers")
        .select("id, user_id, trainer_id, status, created_at")
        .eq("trainer_id", user.id)
        .order("created_at", { ascending: false });

      if (relationsErr) throw relationsErr;

      const relationRows = (relations || []) as UserTrainerRow[];

      setPendingCount(
        relationRows.filter((row) => row.status === "pending").length,
      );

      const approvedRows = relationRows.filter(
        (row) => row.status === "approved",
      );

      if (approvedRows.length === 0) {
        setClients([]);
        return;
      }

      const approvedUserIds = Array.from(
        new Set(approvedRows.map((row) => row.user_id)),
      );

      console.log(
        "[clients] approved user ids from user_trainers:",
        approvedUserIds,
      );

      const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("id, first_name, goal_type")
        .in("id", approvedUserIds);

      if (profilesErr) throw profilesErr;

      console.log("[clients] profiles fetched:", profiles);

      const { data: workouts, error: workoutsErr } = await supabase
        .from("workout_logs")
        .select("user_id, created_at")
        .in("user_id", approvedUserIds)
        .order("created_at", { ascending: false });

      if (workoutsErr) throw workoutsErr;

      const profileMap = new Map<string, ProfileRow>();
      for (const profile of (profiles || []) as ProfileRow[]) {
        profileMap.set(profile.id, profile);
      }

      const latestWorkoutMap = new Map<string, string>();
      for (const workout of (workouts || []) as WorkoutRow[]) {
        if (!latestWorkoutMap.has(workout.user_id)) {
          latestWorkoutMap.set(workout.user_id, workout.created_at);
        }
      }

      const mappedClients: ClientRow[] = approvedRows.map((row) => {
        const profile = profileMap.get(row.user_id);
        const lastWorkout = latestWorkoutMap.get(row.user_id);

        return {
          id: row.user_id,
          name: profile?.first_name?.trim() || "Client",
          status: "Active",
          last: lastWorkout ? formatRelative(lastWorkout) : "No workouts yet",
          goal: formatGoal(profile?.goal_type),
          threadId: null,
        };
      });

      const { data: threads } = await supabase
        .from("conversations")
        .select("id, user_id")
        .eq("trainer_id", user.id)
        .in("user_id", approvedUserIds);

      const threadMap = new Map<string, string>();
      (threads || []).forEach((t: any) => {
        if (t?.user_id && t?.id) threadMap.set(t.user_id, t.id);
      });

      const enrichedClients = mappedClients.map((c) => ({
        ...c,
        threadId: threadMap.get(c.id) || null,
      }));

      console.log("[clients] final mapped clients:", mappedClients);

      setClients(enrichedClients);
    } catch (e: any) {
      console.log("Clients load error:", e);
      Alert.alert("Error", e?.message || "Failed to load clients.");
      setClients([]);
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [loadClients]),
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: BG,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color={ORANGE} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Clients</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>CLIENT LIST</Text>

          {clients.length === 0 ? (
            <Text style={{ color: MUTED, marginTop: 12 }}>
              No approved clients yet.
            </Text>
           ) : (
             clients.map((c) => (
               <View
                 key={c.id}
                 style={{
                   marginTop: 10,
                   borderRadius: 16,
                   backgroundColor: CARD2,
                   borderWidth: 1,
                   borderColor: BORDER,
                   overflow: "hidden",
                 }}
               >
                 <TouchableOpacity
                   activeOpacity={0.9}
                   style={styles.row}
                   onPress={async () => {
                     if (c.threadId) {
                       router.push(`/trainerTabs/clients/chat/${c.threadId}`);
                       return;
                     }

                     const {
                       data: { user },
                     } = await supabase.auth.getUser();
                     if (!user?.id) {
                       Alert.alert("Error", "Please log in again.");
                       return;
                     }

                   const { data, error } = await supabase
                     .from("conversations")
                     .insert({ user_id: c.id, trainer_id: user.id, phase: 'post' })
                     .select("id")
                     .single();

                     if (error) {
                       Alert.alert("Error", "Could not open chat.");
                       return;
                     }

                     router.push(`/trainerTabs/clients/chat/${data.id}`);
                   }}
                 >
                   <View style={styles.avatar} />
                   <View style={{ flex: 1 }}>
                     <Text style={{ color: "white", fontWeight: "900" }}>
                       {c.name}
                     </Text>
                     <Text
                       style={{ color: MUTED, fontSize: 12, marginTop: 2 }}
                       numberOfLines={1}
                     >
                       {c.goal} • Last active: {c.last}
                     </Text>
                   </View>

                   <View style={styles.badge}>
                     <Text
                       style={{
                         color: "#7FF2C6",
                         fontWeight: "900",
                         fontSize: 12,
                       }}
                     >
                       {c.status}
                     </Text>
                   </View>
                   <Ionicons name="chatbubble-ellipses-outline" size={18} color={MUTED} />
                 </TouchableOpacity>

                 <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: BORDER }}>
                   <TouchableOpacity
                     activeOpacity={0.9}
                     style={[styles.actionBtn, { borderRightWidth: 1, borderRightColor: BORDER }]}
                     onPress={async () => {
                       if (c.threadId) {
                         router.push(`/trainerTabs/clients/chat/${c.threadId}`);
                         return;
                       }

                       const {
                         data: { user },
                       } = await supabase.auth.getUser();
                       if (!user?.id) {
                         Alert.alert("Error", "Please log in again.");
                         return;
                       }

                       const { data, error } = await supabase
                         .from("conversations")
                         .insert({ user_id: c.id, trainer_id: user.id, phase: 'post' })
                         .select("id")
                         .single();

                       if (error) {
                         Alert.alert("Error", "Could not open chat.");
                         return;
                       }

                       router.push(`/trainerTabs/clients/chat/${data.id}`);
                     }}
                   >
                     <Ionicons name="chatbubble-outline" size={16} color={ORANGE} />
                     <Text style={{ color: ORANGE, fontWeight: "900", fontSize: 11, marginLeft: 4 }}>Chat</Text>
                   </TouchableOpacity>

                   <TouchableOpacity
                     activeOpacity={0.9}
                     style={styles.actionBtn}
                     onPress={() => {
                       router.push({
                         pathname: "/trainerTabs/clients/video-call",
                         params: { userId: c.id },
                       });
                     }}
                   >
                     <Ionicons name="videocam-outline" size={16} color={ORANGE} />
                     <Text style={{ color: ORANGE, fontWeight: "900", fontSize: 11, marginLeft: 4 }}>Video</Text>
                   </TouchableOpacity>
                 </View>
               </View>
             ))
           )}
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.cta, { marginTop: 12 }]}
          onPress={() => router.push("/trainerTabs/clients/review-requests")}
        >
          <Ionicons name="person-add-outline" size={18} color="white" />
          <Text style={{ color: "white", fontWeight: "900" }}>
            Review Requests
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function formatRelative(dateString: string) {
  const date = new Date(dateString).getTime();
  const now = Date.now();
  const diffHours = Math.floor((now - date) / (1000 * 60 * 60));

  if (diffHours < 24) return "Today";
  if (diffHours < 48) return "Yesterday";

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

function formatGoal(goalType?: string | null) {
  switch (goalType) {
    case "lose_weight":
      return "Lose Weight";
    case "gain_muscle":
      return "Gain Muscle";
    case "stay_fit":
      return "Stay Fit";
    case "endurance":
      return "Build Endurance";
    default:
      return "Fitness Goal";
  }
}

const styles = {
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "900" as const,
    marginTop: 40,
    marginBottom: 14,
  },
  card: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardTitle: {
    color: "#AEB8CA",
    fontWeight: "900" as const,
    fontSize: 12,
    letterSpacing: 0.6,
  },
  row: {
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD2,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#E6E6E6",
  },
  badge: {
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 6,
    backgroundColor: "rgba(0,200,120,0.12)",
    borderColor: "rgba(0,200,120,0.25)",
  },
  cta: {
    height: 56,
    borderRadius: 14,
    backgroundColor: "#1A3B2A",
    borderWidth: 1,
    borderColor: "#2A6B45",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
  },
};
