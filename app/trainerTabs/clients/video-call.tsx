import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";
import { supabase } from "../../../lib/supabase";

const BG = "#0B0F1A";
const ACCENT = "#FF4D2D";
const CARD = "#111A2C";
const BORDER = "#1F2A44";

export default function TrainerVideoCall() {
  const params = useLocalSearchParams<{ userId?: string }>();
  const userId = String(params.userId || "").trim();

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [roomName, setRoomName] = useState("");

  const roomUrl = useMemo(() => {
    if (!roomName) return "";
    return `https://meet.jit.si/${roomName}`;
  }, [roomName]);

  useEffect(() => {
    const check = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();

        if (userErr) throw userErr;
        if (!user?.id || !userId) {
          setAllowed(false);
          return;
        }

        const { data: relation } = await supabase
          .from("user_trainers")
          .select("id")
          .eq("user_id", userId)
          .eq("trainer_id", user.id)
          .eq("status", "approved")
          .maybeSingle();

        if (!relation?.id) {
          setAllowed(false);
          return;
        }

        const clean = `${userId}-${user.id}`.replace(/[^a-zA-Z0-9-_]/g, "");
        setRoomName(`fitlife-${clean}`);
        setAllowed(true);
      } catch (e) {
        console.log("[video] access check error", e);
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [userId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ color: "white", fontWeight: "900", fontSize: 18, textAlign: "center" }}>
          Video calls are available after you hire this client.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 16,
            height: 46,
            paddingHorizontal: 18,
            borderRadius: 14,
            backgroundColor: CARD,
            borderWidth: 1,
            borderColor: BORDER,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
          }}
        >
          <Ionicons name="arrow-back-outline" size={18} color="white" />
          <Text style={{ color: "white", fontWeight: "900" }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View
        style={{
          paddingTop: 40,
          paddingHorizontal: 16,
          paddingBottom: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
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
        >
          <Ionicons name="arrow-back-outline" size={22} color="white" />
        </TouchableOpacity>
        <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>
          Video Call
        </Text>
      </View>
      {roomUrl ? (
        <WebView
          source={{ uri: roomUrl }}
          style={{ flex: 1 }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
        />
      ) : null}
    </View>
  );
}
