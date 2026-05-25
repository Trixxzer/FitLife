import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { TRAINER_UPLOADS_BUCKET } from "../../../lib/storage";
import { supabase } from "../../../lib/supabase";

const BG = "#0B0F1A";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const ACCENT = "#FF4D2D";
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

export default function TrainerProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [trainer, setTrainer] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  const loadTrainer = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      setUserId(user?.id ?? null);

      const { data: profile, error: profileError } = await supabase
        .from("trainer_profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (profileError) throw profileError;

      const { data: application, error: appError } = await supabase
        .from("trainer_applications")
        .select("*")
        .eq("user_id", profile.user_id)
        .eq("status", "approved")
        .maybeSingle();

      if (appError) throw appError;

      setTrainer({
        ...profile,
        application,
      });

      if (user?.id && profile?.user_id) {
        const { data: existingConvo } = await supabase
          .from("conversations")
          .select("id")
          .eq("user_id", user.id)
          .eq("trainer_id", profile.user_id)
          .maybeSingle();

        setThreadId(existingConvo?.id ?? null);
      }
    } catch (e) {
      console.log("load trainer profile error", e);
      setTrainer(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTrainer();
  }, [loadTrainer]);

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

  if (!trainer) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: BG,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white" }}>Trainer not found.</Text>
      </View>
    );
  }

  const photoUrl =
    getPublicFileUrl(trainer.photo_path) ||
    getPublicFileUrl(trainer.application?.photo_path) ||
    "https://picsum.photos/200";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ padding: 16 }}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          width: 44,
          height: 44,
          borderRadius: 16,
          backgroundColor: CARD,
          borderWidth: 1,
          borderColor: BORDER,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 30,
          marginBottom: 16,
        }}
      >
        <Ionicons name="arrow-back-outline" size={22} color="white" />
      </TouchableOpacity>

      <View
        style={{
          backgroundColor: CARD,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: BORDER,
          padding: 16,
        }}
      >
        <Image
          source={{ uri: photoUrl }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 20,
            alignSelf: "center",
          }}
        />

        <Text
          style={{
            color: "white",
            fontSize: 22,
            fontWeight: "900",
            marginTop: 12,
            textAlign: "center",
          }}
        >
          {trainer.full_name}
        </Text>

        <Text style={{ color: MUTED, textAlign: "center", marginTop: 4 }}>
          {trainer.specialty} • {trainer.location || "Online"}
        </Text>

        <Text style={{ color: MUTED, textAlign: "center", marginTop: 4 }}>
          Rating: {Number(trainer.rating || 0).toFixed(1)} (
          {trainer.reviews_count || 0} reviews)
        </Text>

        <Text style={{ color: "#AEB8CA", marginTop: 16, lineHeight: 20 }}>
          {trainer.bio || trainer.application?.bio || "No bio available."}
        </Text>

        <View style={{ marginTop: 16, gap: 8 }}>
          <Text style={{ color: "white" }}>
            Age: {trainer.age ?? trainer.application?.age ?? "N/A"}
          </Text>
          <Text style={{ color: "white" }}>
            Gender: {trainer.gender ?? trainer.application?.gender ?? "N/A"}
          </Text>
          <Text style={{ color: "white" }}>
            Experience: {trainer.experience_years ?? 0} years
          </Text>
          <Text style={{ color: "white" }}>
            Monthly Rate: ${trainer.monthly_rate ?? 0}
          </Text>
          <Text style={{ color: "white" }}>
            Online: {trainer.is_online ? "Yes" : "No"}
          </Text>
          <Text style={{ color: "white" }}>
            Certificate:{" "}
            {trainer.cert_title || trainer.application?.cert_title || "N/A"}
          </Text>
          <Text style={{ color: "white" }}>
            Issuer:{" "}
            {trainer.cert_issuer || trainer.application?.cert_issuer || "N/A"}
          </Text>
          <Text style={{ color: "white" }}>
            Year: {trainer.cert_year || trainer.application?.cert_year || "N/A"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/userTabs/trainer/hire",
              params: { trainerId: trainer.id },
            })
          }
          style={{
            marginTop: 20,
            height: 50,
            borderRadius: 16,
            backgroundColor: ACCENT,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "900" }}>
            View Packages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            if (!userId) {
              Alert.alert("Error", "Please log in again.");
              return;
            }

            if (!trainer?.user_id) {
              Alert.alert("Error", "Trainer information not found.");
              return;
            }

            if (threadId) {
              router.push(`/userTabs/trainer/chat/${threadId}`);
              return;
            }

            try {
              const { data, error } = await supabase
                .from("conversations")
                .insert({ 
                  user_id: userId, 
                  trainer_id: trainer.user_id,
                  phase: 'pre'
                })
                .select("id")
                .single();

              if (error) {
                console.log("create conversation error", error);
                Alert.alert("Error", "Could not open chat. Please try again.");
                return;
              }

              setThreadId(data.id);
              router.push(`/userTabs/trainer/chat/${data.id}`);
            } catch (e: any) {
              console.log("Message trainer error:", e);
              Alert.alert("Error", e?.message || "Could not open chat.");
            }
          }}
          style={{
            marginTop: 10,
            height: 50,
            borderRadius: 16,
            backgroundColor: CARD,
            borderWidth: 1,
            borderColor: BORDER,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "900" }}>
            Message Trainer
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
