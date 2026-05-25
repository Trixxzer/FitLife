import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
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

type TrainerCard = {
  id: string;
  full_name: string | null;
  specialty: string | null;
  location: string | null;
  monthly_rate: number | null;
  rating: number | null;
  reviews_count: number | null;
  photo_path: string | null;
};

export default function BrowseTrainers() {
  const [loading, setLoading] = useState(true);
  const [trainers, setTrainers] = useState<TrainerCard[]>([]);

  const loadTrainers = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("trainer_profiles")
        .select(
          "id, full_name, specialty, location, monthly_rate, rating, reviews_count, photo_path",
        )
        .order("rating", { ascending: false })
        .order("reviews_count", { ascending: false });

      if (error) throw error;

      console.log("[browse] trainers data:", data);
      if (data && data.length > 0) {
        console.log("[browse] first trainer:", data[0]);
      }

      setTrainers((data as TrainerCard[]) || []);
    } catch (e) {
      console.log("loadTrainers error", e);
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTrainers();
    }, [loadTrainers]),
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

          <Text style={styles.headerTitle}>Browse Trainers</Text>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.iconBtn}
            onPress={() => router.push("/userTabs/trainer/my-trainer")}
          >
            <Ionicons name="person-circle-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {trainers.length === 0 ? (
          <View
            style={[
              styles.card,
              { marginTop: 14, alignItems: "center", paddingVertical: 22 },
            ]}
          >
            <Ionicons name="people-outline" size={28} color={ACCENT} />
            <Text style={{ color: "white", fontWeight: "900", marginTop: 10 }}>
              No trainers available
            </Text>
            <Text style={{ color: MUTED, marginTop: 6, textAlign: "center" }}>
              Check back soon for new trainers.
            </Text>
          </View>
        ) : (
          trainers.map((trainer) => (
            <TouchableOpacity
              key={trainer.id}
              activeOpacity={0.9}
              style={[styles.card, { marginTop: 12 }]}
              onPress={() => router.push(`/userTabs/trainer/${trainer.id}`)}
            >
              <View
                style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
              >
                <View style={styles.avatar}>
                   {trainer.photo_path ? (
                     <Image
                       source={{ uri: getPublicFileUrl(trainer.photo_path) || "https://picsum.photos/200" }}
                       style={{ width: "100%", height: "100%", borderRadius: 20 }}
                     />
                   ) : (
                     <Image
                       source={{ uri: "https://picsum.photos/200" }}
                       style={{ width: "100%", height: "100%", borderRadius: 20 }}
                     />
                   )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: "white", fontWeight: "900", fontSize: 16 }}
                  >
                    {trainer.full_name || "Trainer"}
                  </Text>
                  <Text style={{ color: MUTED, marginTop: 2 }}>
                    {trainer.specialty || "Fitness Coaching"}
                  </Text>
                  <Text style={{ color: MUTED, marginTop: 2, fontSize: 12 }}>
                    {trainer.location || "Online"}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 8,
                      justifyContent: "space-between",
                    }}
                  >
                    {/* <Text style={{ color: "white", fontWeight: "800" }}>
                      ${Number(trainer.monthly_rate || 0)}/mo
                    </Text> */}
                    <Text style={{ color: MUTED, fontSize: 12 }}>
                      {Number(trainer.rating || 0).toFixed(1)} (
                      {trainer.reviews_count || 0})
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
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
};
