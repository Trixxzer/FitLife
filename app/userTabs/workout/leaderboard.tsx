import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";

const ACCENT = "#FF4D2D";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

export default function Leaderboard() {
    const rows = useMemo(
        () => [
            { name: "Prajwal", score: 52 },
            { name: "Asmita", score: 45 },
            { name: "Rashfa", score: 39 },
            { name: "John", score: 34 },
        ],
        []
    );

    return (
        <View style={{ flex: 1, backgroundColor: "#0B0F1A" }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                <View style={styles.headerCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.hello}>Leaderboard</Text>
                        <Text style={styles.welcome}>Push-up Challenge • Top performers</Text>
                    </View>

                    <View style={styles.iconBtn}>
                        <Ionicons name="trophy-outline" size={20} color="white" />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Top 20</Text>

                <View style={styles.bigCard}>
                    {rows.map((r, idx) => (
                        <View key={r.name} style={styles.row}>
                            <Text style={styles.rank}>{idx + 1}</Text>
                            <Text style={styles.name}>{r.name}</Text>
                            <Text style={styles.score}>{r.score} reps</Text>
                        </View>
                    ))}
                </View>

                <Text style={{ color: MUTED, marginTop: 12, fontSize: 12 }}>
                    Next: connect this to Supabase challenge_scores table.
                </Text>
            </ScrollView>
        </View>
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
        gap: 10,
    },
    hello: { color: ACCENT, fontWeight: "900" as const, fontSize: 18 },
    welcome: { color: MUTED, marginTop: 2, fontSize: 12 },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        backgroundColor: "transparent",
    },
    sectionTitle: {
        fontSize: 18,
        color: ACCENT,
        fontWeight: "900" as const,
        marginTop: 14,
        marginBottom: 8,
    },
    bigCard: {
        borderRadius: 22,
        backgroundColor: CARD,
        padding: 6,
        borderWidth: 1,
        borderColor: BORDER,
    },
    row: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    rank: { color: ACCENT, fontWeight: "900" as const, width: 26 },
    name: { color: "white", fontWeight: "900" as const, flex: 1 },
    score: { color: "#C7CFDD", fontWeight: "900" as const },
};