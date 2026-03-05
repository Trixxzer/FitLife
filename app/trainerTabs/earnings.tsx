import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, View } from "react-native";

const ORANGE="#FF4D2D", BG="#0B0F1A", CARD="#111A2C", CARD2="#0F1627", BORDER="#1F2A44", MUTED="#9AA6BD";

export default function Earnings() {
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Earnings</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>THIS WEEK</Text>
          <Text style={{ color: "white", fontWeight: "900", fontSize: 28, marginTop: 10 }}>$240</Text>
          <Text style={{ color: MUTED, marginTop: 4 }}>4 sessions • 3 active clients</Text>

          <View style={styles.divider} />

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Mini icon="wallet-outline" label="Payout" value="Friday" />
            <Mini icon="card-outline" label="Method" value="Bank" />
          </View>
        </View>

        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.cardTitle}>RECENT TRANSACTIONS</Text>

          <Tx title="Session — Prajwal" value="+ $60" />
          <Tx title="Session — Rashfa" value="+ $60" />
          <Tx title="Monthly plan — Asmita" value="+ $120" />
        </View>
      </ScrollView>
    </View>
  );
}

function Mini({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Ionicons name={icon as any} size={16} color={MUTED} />
      <Text style={{ color: MUTED, fontSize: 12 }}>{label}:</Text>
      <Text style={{ color: "white", fontWeight: "900", fontSize: 12 }}>{value}</Text>
    </View>
  );
}

function Tx({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.tx}>
      <Text style={{ color: "white", fontWeight: "800" }}>{title}</Text>
      <Text style={{ color: "#7FF2C6", fontWeight: "900" }}>{value}</Text>
    </View>
  );
}

const styles = {
  title: { color: "white", fontSize: 28, fontWeight: "900" as const, marginTop: 40, marginBottom: 14 },
  card: { padding: 14, borderRadius: 18, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  cardTitle: { color: "#AEB8CA", fontWeight: "900" as const, fontSize: 12, letterSpacing: 0.6 },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 12 },
  tx: { marginTop: 10, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD2, flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const },
};
