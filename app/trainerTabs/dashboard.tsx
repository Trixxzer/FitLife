import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const ORANGE = "#FF4D2D";
const BG = "#0B0F1A";
const CARD = "#111A2C";
const CARD2 = "#0F1627";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

export default function TrainerDashboard() {
  const trainerName = "John";
  const today = useMemo(
    () => ({
      sessions: 3,
      pendingRequests: 2,
      inactiveClients: 1,
    }),
    []
  );
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Trainer, {trainerName}</Text>
            <Text style={styles.sub}>Manage clients and earnings.</Text>
          </View>
          <View style={styles.avatar} />
        </View>

        <Text style={styles.sectionTitle}>Today</Text>

        {/* Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>OVERVIEW</Text>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <StatTile icon="time-outline" label="Sessions" value={`${today.sessions}`} />
            <StatTile icon="person-add-outline" label="Requests" value={`${today.pendingRequests}`} />
            <StatTile icon="alert-circle-outline" label="Inactive" value={`${today.inactiveClients}`} />
          </View>

          <View style={styles.divider} />

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <MiniRow icon="calendar-outline" label="Next session" value="5:30 AM" />
            <MiniRow icon="location-outline" label="Mode" value="Online" />
          </View>
        </View>
        {/* Alerts */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.cardTitle}>ALERTS</Text>

          <AlertRow
            icon="person-add-outline"
            title="New client requests"
            subtitle="Review and accept new clients."
          />
          <AlertRow
            icon="notifications-outline"
            title="Client inactivity"
            subtitle="1 client hasn’t logged a workout in 3 days."
          />
          <AlertRow
            icon="notifications-outline"
            title="Client inactivity"
            subtitle="1 client hasn’t logged a workout in 3 days."
          />
          <AlertRow
            icon="notifications-outline"
            title="Client inactivity"
            subtitle="1 client hasn’t logged a workout in 3 days."
          /> n
        </View>

        {/* Earnings snapshot */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.cardTitle}>EARNINGS</Text>
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: "white", fontWeight: "900", fontSize: 22 }}>$240</Text>
            <Text style={{ color: MUTED, marginTop: 4 }}>This week • 4 clients active</Text>
          </View>

          <TouchableOpacity activeOpacity={0.9} style={[styles.smallBtn, { marginTop: 12 }]}>
            <Text style={{ color: "white", fontWeight: "900" }}>View earnings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function StatTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statTile}>
      <Ionicons name={icon as any} size={18} color={ORANGE} />
      <Text style={{ color: MUTED, fontSize: 12, marginTop: 6 }}>{label}</Text>
      <Text style={{ color: "white", fontWeight: "900", marginTop: 2, fontSize: 18 }}>{value}</Text>
    </View>
  );
}

function MiniRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Ionicons name={icon as any} size={14} color={MUTED} />
      <Text style={{ color: MUTED, fontSize: 12 }}>{label}:</Text>
      <Text style={{ color: "white", fontWeight: "900", fontSize: 12 }}>{value}</Text>
    </View>
  );
}

function AlertRow({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.alertRow}>
      <View style={styles.alertIcon}>
        <Ionicons name={icon as any} size={18} color={ORANGE} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "white", fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={MUTED} />
    </TouchableOpacity>
  );
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
  },
  hello: { color: ORANGE, fontWeight: "900" as const, fontSize: 18 },
  sub: { color: MUTED, marginTop: 2, fontSize: 12 },
  avatar: { width: 44, height: 44, borderRadius: 999, backgroundColor: "#E6E6E6" },

  sectionTitle: { fontSize: 18, color: ORANGE, fontWeight: "900" as const, marginTop: 14, marginBottom: 8 },

  card: { padding: 14, borderRadius: 18, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  cardTitle: { color: "#AEB8CA", fontWeight: "900" as const, fontSize: 12, letterSpacing: 0.6 },

  divider: { height: 1, backgroundColor: BORDER, marginVertical: 12 },

  statTile: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: CARD2,
    borderWidth: 1,
    borderColor: BORDER,
  },

  actionPill: {
    width: "48%" as const,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD2,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 10,
  },

  alertRow: {
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
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(255,77,45,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,77,45,0.25)",
  },

  smallBtn: {
    height: 44,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: CARD2,
    borderWidth: 1,
    borderColor: BORDER,
  },
};
