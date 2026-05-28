import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../../lib/supabase";
import { useResponsiveLayout } from "../../../../lib/useResponsiveLayout";

const BG = "#0B0F1A";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const ACCENT = "#FF4D2D";
const MUTED = "#9AA6BD";

type MessageRow = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export default function TrainerChatThread() {
  const { contentContainerStyle } = useResponsiveLayout({ paddingTop: 20, paddingBottom: 12, maxWidth: 900 });
  const params = useLocalSearchParams<{ threadId?: string }>();
  const threadId = String(params.threadId || "").trim();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [text, setText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView | null>(null);

  const canSend = useMemo(() => text.trim().length > 0 && !sending, [text, sending]);

  const loadMessages = useCallback(async () => {
    if (!threadId) return;

    try {
      setLoading(true);
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      setUserId(user?.id ?? null);

      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, body, created_at")
        .eq("conversation_id", threadId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data as MessageRow[]) ?? []);
    } catch (e) {
      console.log("[chat] loadMessages error", e);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 0);
    }
  }, [threadId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!threadId) return;

    const channel = supabase
      .channel(`messages:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${threadId}`,
        },
        (payload) => {
          const next = payload.new as MessageRow;
          setMessages((prev) => [...prev, next]);
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 20);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  const send = async () => {
    if (!canSend || !threadId) return;

    try {
      setSending(true);
      const clean = text.trim();
      setText("");

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      if (!user?.id) throw new Error("Missing user.");

      const { error } = await supabase
        .from("messages")
        .insert({ conversation_id: threadId, sender_id: user.id, body: clean });

      if (error) throw error;
    } catch (e) {
      console.log("[chat] send error", e);
      setText((prev) => (prev ? prev : text));
    } finally {
      setSending(false);
    }
  };

  if (!threadId) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "white" }}>Chat not found.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ padding: 16, paddingTop: 40 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
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
          <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>Chat</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={contentContainerStyle}
      >
        {messages.length === 0 ? (
          <View
            style={{
              marginTop: 24,
              backgroundColor: CARD,
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: BORDER,
            }}
          >
            <Text style={{ color: MUTED }}>
              No messages yet. Say hello to start the conversation.
            </Text>
          </View>
        ) : (
          messages.map((msg) => {
            const mine = msg.sender_id === userId;
            return (
              <View
                key={msg.id}
                style={{
                  alignSelf: mine ? "flex-end" : "flex-start",
                  marginTop: 10,
                  maxWidth: "82%",
                }}
              >
                <View
                  style={{
                    padding: 12,
                    borderRadius: 16,
                    backgroundColor: mine ? ACCENT : CARD,
                    borderWidth: 1,
                    borderColor: mine ? "rgba(255,77,45,0.5)" : BORDER,
                  }}
                >
                  <Text style={{ color: "white" }}>{msg.body}</Text>
                </View>
                <Text
                  style={{
                    color: MUTED,
                    fontSize: 11,
                    marginTop: 4,
                    alignSelf: mine ? "flex-end" : "flex-start",
                  }}
                >
                  {new Date(msg.created_at).toLocaleTimeString()}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <View
        style={{
          padding: 12,
          borderTopWidth: 1,
          borderTopColor: BORDER,
          backgroundColor: BG,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message"
          placeholderTextColor={MUTED}
          style={{
            flex: 1,
            minHeight: 44,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: BORDER,
            paddingHorizontal: 12,
            color: "white",
            backgroundColor: CARD,
          }}
        />
        <TouchableOpacity
          onPress={send}
          disabled={!canSend}
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: canSend ? ACCENT : "#2A3550",
          }}
        >
          <Ionicons name="send" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
