import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { TRAINER_UPLOADS_BUCKET } from "../../../lib/storage";
import { supabase } from "../../../lib/supabase";
import { useResponsiveLayout } from "../../../lib/useResponsiveLayout";

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

type ChatRow = {
  id: string;
  trainer_id: string;
  trainer_name: string;
  specialty: string;
  profile_image_url?: string | null;
};

export default function UserChats() {
  const { contentContainerStyle } = useResponsiveLayout({ paddingTop: 40, paddingBottom: 24 });
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatRow[]>([]);

  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      if (!user?.id) {
        setChats([]);
        return;
      }

      const { data: threads } = await supabase
        .from("conversations")
        .select("id, trainer_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const trainerIds = (threads || []).map((t: any) => t.trainer_id);

      const { data: profiles } = trainerIds.length
        ? await supabase.from("profiles").select("id, first_name").in("id", trainerIds)
        : { data: [] as any[] };

      const { data: trainerProfiles } = trainerIds.length
        ? await supabase.from("trainer_profiles").select("user_id, specialty, profile_image_url").in("user_id", trainerIds)
        : { data: [] as any[] };

      const nameMap = new Map((profiles || []).map((x) => [x.id, x.first_name]));
      const specialtyMap = new Map((trainerProfiles || []).map((x) => [x.user_id, x.specialty]));
      const imageMap = new Map((trainerProfiles || []).map((x) => [x.user_id, x.profile_image_url]));

      const mapped = (threads || []).map((t: any) => ({
        id: t.id,
        trainer_id: t.trainer_id,
        trainer_name: nameMap.get(t.trainer_id) || "Trainer",
        specialty: specialtyMap.get(t.trainer_id) || "Fitness Coaching",
        profile_image_url: imageMap.get(t.trainer_id) || null,
      }));

      setChats(mapped);
    } catch (e) {
      console.log("[chats] load error", e);
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats]),
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={contentContainerStyle}>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 40 }}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: CARD,
              borderWidth: 1,
              borderColor: BORDER,
            }}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back-outline" size={22} color="white" />
          </TouchableOpacity>
          <Text style={{ color: "white", fontWeight: "900", fontSize: 18, marginLeft: 12 }}>
            Chats
          </Text>
        </View>

        {chats.length === 0 ? (
          <View style={[styles.card, { marginTop: 16, alignItems: "center" }]}> 
            <Text style={{ color: MUTED, fontWeight: "800" }}>No chats yet.</Text>
          </View>
        ) : (
          <View style={{ marginTop: 16, gap: 12 }}>
             {chats.map((c) => (
               <TouchableOpacity
                 key={c.id}
                 activeOpacity={0.9}
                 style={styles.card}
                 onPress={() => router.push(`/userTabs/trainer/chat/${c.id}`)}
               >
                 <View style={styles.avatar}>
                   {c.profile_image_url ? (
                     <Image
                       source={{ uri: getPublicFileUrl(c.profile_image_url) || c.profile_image_url }}
                       style={{ width: "100%", height: "100%", borderRadius: 999 }}
                     />
                   ) : (
                     <View
                       style={{
                         width: "100%",
                         height: "100%",
                         backgroundColor: "#E6E6E6",
                         borderRadius: 999,
                       }}
                     />
                   )}
                 </View>
                 <View style={{ flex: 1 }}>
                   <Text style={{ color: "white", fontWeight: "900" }}>{c.trainer_name}</Text>
                   <Text style={{ color: MUTED, marginTop: 4, fontSize: 12 }}>{c.specialty}</Text>
                 </View>
                 <Ionicons name="chatbubble-ellipses-outline" size={18} color={MUTED} />
               </TouchableOpacity>
             ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = {
  card: {
    borderRadius: 18,
    backgroundColor: CARD,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: CARD2,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden" as const,
  },
};
