import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const ORANGE="#FF4D2D", BG="#0B0F1A", CARD="#111A2C", CARD2="#0F1627", BORDER="#1F2A44", MUTED="#9AA6BD";

export default function Clients() {
  const clients = useMemo(() => [
    { name: "Prajwal", status: "Active", last: "Today", goal: "Lose weight" },
    { name: "Asmita", status: "Inactive", last: "3 days ago", goal: "Stay fit" },
    { name: "Rashfa", status: "Active", last: "Yesterday", goal: "Gain muscle" },
  ], []);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Clients</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>CLIENT LIST</Text>

          {clients.map((c) => (
            <TouchableOpacity key={c.name} activeOpacity={0.9} style={styles.row}>
              <View style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: "white", fontWeight: "900" }}>{c.name}</Text>
                <Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>
                  {c.goal} • Last active: {c.last}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: c.status === "Active" ? "rgba(0,200,120,0.12)" : "rgba(255,77,45,0.12)", borderColor: c.status === "Active" ? "rgba(0,200,120,0.25)" : "rgba(255,77,45,0.25)" }]}>
                <Text style={{ color: c.status === "Active" ? "#7FF2C6" : "#FFD3CA", fontWeight: "900", fontSize: 12 }}>
                  {c.status}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={MUTED} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity activeOpacity={0.9} style={[styles.cta, { marginTop: 12 }]}>
          <Ionicons name="person-add-outline" size={18} color="white" />
          <Text style={{ color: "white", fontWeight: "900" }}>Review Requests</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = {
  title: { color: "white", fontSize: 28, fontWeight: "900" as const, marginTop: 40, marginBottom: 14 },
  card: { padding: 14, borderRadius: 18, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  cardTitle: { color: "#AEB8CA", fontWeight: "900" as const, fontSize: 12, letterSpacing: 0.6 },
  row: { marginTop: 10, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD2, flexDirection: "row" as const, alignItems: "center" as const, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 999, backgroundColor: "#E6E6E6" },
  badge: { paddingHorizontal: 10, height: 28, borderRadius: 999, borderWidth: 1, alignItems: "center" as const, justifyContent: "center" as const, marginRight: 6 },
  cta: { height: 56, borderRadius: 16, backgroundColor: ORANGE, alignItems: "center" as const, justifyContent: "center" as const, flexDirection: "row" as const, gap: 10 },
};
