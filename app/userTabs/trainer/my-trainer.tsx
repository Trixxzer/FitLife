import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { TRAINER_UPLOADS_BUCKET } from "../../../lib/storage";
import { supabase } from "../../../lib/supabase";

const ACCENT = "#FF4D2D";
const BG = "#0B0F1A";
const CARD = "#111A2C";
const CARD2 = "#0F1627";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

function getPublicFileUrl(path?: string | null) {
  if (!path) return null;

  const cleanPath = path.trim().replace(/^\/+/, "");
  if (!cleanPath) return null;

  const { data } = supabase.storage
    .from(TRAINER_UPLOADS_BUCKET)
    .getPublicUrl(cleanPath);

  return data.publicUrl;
}

function buildWhatsAppPhone(phone?: string | null) {
  if (!phone) return null;

  const cleaned = String(phone).replace(/[^\d]/g, "");
  if (!cleaned) return null;

  if (cleaned.startsWith("977")) return cleaned;
  if (cleaned.startsWith("0")) return `977${cleaned.slice(1)}`;
  return `977${cleaned}`;
}

export default function MyTrainer() {
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState<any>(null);

  const openWhatsApp = async (phone?: string | null, trainerName?: string) => {
    const formattedPhone = buildWhatsAppPhone(phone);

    if (!formattedPhone) {
      Alert.alert(
        "No phone number",
        "This trainer has not added a phone number yet.",
      );
      return;
    }

    const message = `Hi ${trainerName || "Coach"}, I am your client from FitLife.`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "Could not open WhatsApp.");
    }
  };

  const loadCoach = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;

      if (!user) {
        setCoach(null);
        return;
      }

      const { data: relation, error: relationErr } = await supabase
        .from("user_trainers")
        .select("id, trainer_id, package_id, status, created_at")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (relationErr || !relation) {
        setCoach(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, first_name")
        .eq("id", relation.trainer_id)
        .single();

      const { data: tp } = await supabase
        .from("trainer_profiles")
        .select("*")
        .eq("user_id", relation.trainer_id)
        .maybeSingle();

      const { data: pkg } = relation.package_id
        ? await supabase
            .from("trainer_packages")
            .select("*")
            .eq("id", relation.package_id)
            .maybeSingle()
        : { data: null as any };

      let threadId: string | null = null;

      if (user?.id && relation?.trainer_id) {
        const { data: existingConvo } = await supabase
          .from("conversations")
          .select("id")
          .eq("user_id", user.id)
          .eq("trainer_id", relation.trainer_id)
          .eq("phase", "post")
          .maybeSingle();

        threadId = existingConvo?.id ?? null;
      }

      setCoach({
        trainerProfileId: tp?.id || null, // this is what browse.tsx uses
        trainerUserId: relation.trainer_id, // actual trainer account id
        name: tp?.full_name || profile?.first_name || "Trainer",
        specialty: tp?.specialty || "Fitness Coaching",
        rating: Number(tp?.rating || 0),
        sessionsThisWeek: pkg?.sessions_per_week || 0,
        plan: {
          name: pkg?.title || "Active Plan",
          price: Number(pkg?.price || 0),
        },
        profileImageUrl: tp?.profile_image_url || null,
        phone: tp?.contact_number || null,
        chatThreadId: threadId,
      });
    } catch (e) {
      console.log("loadCoach error", e);
      setCoach(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCoach();
    }, [loadCoach]),
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
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.iconBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back-outline" size={22} color="white" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>My Trainer</Text>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.iconBtn}
            onPress={() => router.push("/userTabs/trainer/browse")}
          >
            <Ionicons name="people-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {!coach ? (
          <View
            style={[
              styles.card,
              { marginTop: 14, alignItems: "center", paddingVertical: 22 },
            ]}
          >
            <Ionicons name="person-add-outline" size={28} color={ACCENT} />
            <Text style={{ color: "white", fontWeight: "900", marginTop: 10 }}>
              No trainer yet
            </Text>
            <Text style={{ color: MUTED, marginTop: 6, textAlign: "center" }}>
              Browse trainers and send a request to start coaching.
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.btnSolid, { marginTop: 14 }]}
              onPress={() => router.push("/userTabs/trainer/browse")}
            >
              <Text style={{ color: "white", fontWeight: "900" }}>
                Browse Trainers
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.card, { marginTop: 14 }]}>
              <Text style={styles.cardTitle}>ACTIVE COACH</Text>

              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  marginTop: 12,
                  alignItems: "center",
                }}
              >
                <View style={styles.avatar}>
                   {coach.profileImageUrl ? (
                     <Image
                       source={{ uri: getPublicFileUrl(coach.profileImageUrl) || coach.profileImageUrl }}
                       style={{ width: "100%", height: "100%" }}
                     />
                   ) : (
                     <View
                       style={{
                         width: "100%",
                         height: "100%",
                         backgroundColor: "#E6E6E6",
                       }}
                     />
                   )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: "white", fontWeight: "900", fontSize: 16 }}
                  >
                    {coach.name}
                  </Text>
                  <Text style={{ color: MUTED, marginTop: 2 }}>
                    {coach.specialty}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 8,
                    }}
                  >
                    <Ionicons name="star" size={14} color="#FFD166" />
                    <Text style={{ color: MUTED, fontSize: 12 }}>
                      {coach.rating.toFixed(1)} rating
                    </Text>

                    <View
                      style={{
                        marginLeft: "auto",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={MUTED}
                      />
                      <Text style={{ color: MUTED, fontSize: 12 }}>
                        {coach.sessionsThisWeek} sessions/week
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

               <View
                 style={{
                   flexDirection: "row",
                   gap: 10,
                   marginTop: 14,
                   flexWrap: "wrap",
                 }}
               >
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.btnOutline, { flexBasis: "48%" }]}
                  onPress={async () => {
                    if (!coach?.trainerUserId) {
                      Alert.alert("Error", "Trainer not found.");
                      return;
                    }

                    if (coach.chatThreadId) {
                      router.push(`/userTabs/trainer/chat/${coach.chatThreadId}`);
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
                     .insert({ user_id: user.id, trainer_id: coach.trainerUserId, phase: 'post' })
                     .select("id")
                     .single();

                    if (error) {
                      Alert.alert("Error", "Could not open chat.");
                      return;
                    }

                    router.push(`/userTabs/trainer/chat/${data.id}`);
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "900" }}>
                    Chat
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.btnSolid, { flexBasis: "48%" }]}
                  onPress={() => {
                    if (!coach?.trainerUserId) {
                      Alert.alert("Error", "Trainer not found.");
                      return;
                    }
                    router.push({
                      pathname: "/userTabs/trainer/video-call",
                      params: { trainerId: coach.trainerUserId },
                    });
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "900" }}>
                    Video Call
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.btnSolid, { flexBasis: "100%" }]}
                  onPress={() => {
                    if (!coach.trainerProfileId) {
                      Alert.alert("Error", "Trainer profile not found.");
                      return;
                    }
                    router.push(`/userTabs/trainer/${coach.trainerProfileId}`);
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "900" }}>
                    View Profile
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.card, { marginTop: 12 }]}>
              <Text style={styles.cardTitle}>YOUR PLAN</Text>

              <View
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 16,
                  backgroundColor: CARD2,
                  borderWidth: 1,
                  borderColor: BORDER,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "900" }}>
                    {coach.plan.name}
                  </Text>
                  <Text style={{ color: "white", fontWeight: "900" }}>
                    ${coach.plan.price}/mo
                  </Text>
                </View>
                <View
                  style={{ flexDirection: "row", gap: 10, marginTop: 12 }}
                ></View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = {
  headerRow: {
    marginTop: 40,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  headerTitle: { color: "white", fontWeight: "900" as const, fontSize: 16 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  card: {
    borderRadius: 22,
    backgroundColor: CARD,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardTitle: {
    color: "#AEB8CA",
    fontWeight: "900" as const,
    fontSize: 12,
    letterSpacing: 0.6,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 20,
    overflow: "hidden" as const,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#E6E6E6",
  },
  btnSolid: {
    height: 46,
    borderRadius: 16,
    backgroundColor: ACCENT,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  btnOutline: {
    height: 46,
    borderRadius: 16,
    backgroundColor: CARD2,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
};
