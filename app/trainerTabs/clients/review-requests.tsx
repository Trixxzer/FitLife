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

const ORANGE = "#FF4D2D";
const BG = "#0B0F1A";
const CARD = "#111A2C";
const CARD2 = "#0F1627";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";
const SUCCESS = "#22C55E";
const DANGER = "#EF4444";

type RequestRow = {
  id: string;
  user_id: string;
  trainer_id: string;
  package_id: string | null;
  status: "pending" | "approved" | "declined";
  created_at: string;
  user_name: string | null;
  user_goal: string | null;
  package_name: string | null;
  price_per_month: number | null;
};

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

function formatPrice(value?: number | null) {
  return `Rs. ${Number(value ?? 0)}`;
}

export default function ReviewRequests() {
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestRow[]>([]);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;

      if (!user) {
        setRequests([]);
        return;
      }

      const { data, error } = await supabase
        .from("trainer_requests")
        .select(
          `
          id,
          user_id,
          trainer_id,
          package_id,
          status,
          created_at,
          user_name,
          user_goal,
          package_name,
          price_per_month
        `,
        )
        .eq("trainer_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRequests((data as RequestRow[]) || []);
    } catch (e: any) {
      console.log("Review requests load error:", e);
      Alert.alert("Error", e?.message || "Failed to load requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests]),
  );

  const handleApprove = async (id: string) => {
    try {
      setSubmittingId(id);

      const { error } = await supabase
        .from("trainer_requests")
        .update({
          status: "approved",
        })
        .eq("id", id);

      if (error) throw error;

      setRequests((prev) => prev.filter((x) => x.id !== id));
      Alert.alert(
        "Approved",
        "Request approved. The user can now complete payment.",
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to approve request.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setSubmittingId(id);

      const { error } = await supabase
        .from("trainer_requests")
        .update({
          status: "declined",
        })
        .eq("id", id);

      if (error) throw error;

      setRequests((prev) => prev.filter((x) => x.id !== id));
      Alert.alert("Declined", "Request declined successfully.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to decline request.");
    } finally {
      setSubmittingId(null);
    }
  };

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
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            marginTop: 40,
            marginBottom: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Review Requests</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>PENDING REQUESTS</Text>

          {requests.length === 0 ? (
            <Text style={{ color: MUTED, marginTop: 12 }}>
              No pending requests.
            </Text>
          ) : (
            requests.map((r) => (
              <View key={r.id} style={styles.row}>
                <View style={styles.avatar} />

                <View style={{ flex: 1 }}>
                  <Text style={{ color: "white", fontWeight: "900" }}>
                    {r.user_name?.trim() || "Client"}
                  </Text>

                  <Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>
                    {formatGoal(r.user_goal)}
                  </Text>

                  <Text
                    style={{ color: "#D8DEEA", fontSize: 12, marginTop: 4 }}
                  >
                    {r.package_name?.trim() || "Package"}
                  </Text>

                  <Text
                    style={{
                      color: ORANGE,
                      fontSize: 12,
                      marginTop: 2,
                      fontWeight: "800",
                    }}
                  >
                    {formatPrice(r.price_per_month)}
                  </Text>
                </View>

                <View style={{ gap: 8 }}>
                  <TouchableOpacity
                    disabled={submittingId === r.id}
                    onPress={() => handleApprove(r.id)}
                    style={styles.approveBtn}
                  >
                    <Text style={styles.approveText}>
                      {submittingId === r.id ? "..." : "Approve"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={submittingId === r.id}
                    onPress={() => handleReject(r.id)}
                    style={styles.rejectBtn}
                  >
                    <Text style={styles.rejectText}>
                      {submittingId === r.id ? "..." : "Decline"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>How it works</Text>
          <Text style={styles.noteText}>
            Approving a request allows the user to pay. The user is added to
            your actual client list only after payment is completed.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = {
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "900" as const,
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
  approveBtn: {
    minWidth: 88,
    height: 36,
    borderRadius: 12,
    backgroundColor: ORANGE,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 12,
  },
  approveText: {
    color: "white",
    fontWeight: "900" as const,
  },
  rejectBtn: {
    minWidth: 88,
    height: 36,
    borderRadius: 12,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: DANGER,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 12,
  },
  rejectText: {
    color: DANGER,
    fontWeight: "900" as const,
  },
  noteCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  noteTitle: {
    color: SUCCESS,
    fontWeight: "900" as const,
    marginBottom: 6,
  },
  noteText: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
  },
};
