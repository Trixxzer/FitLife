import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { supabase } from "../../../lib/supabase";

const ACCENT = "#FF4D2D";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

type Row = {
    rank: number;
    name: string;
    bestScore: number;
    averageScore: number;
    totalAttempts: number;
};

export default function Leaderboard() {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<Row[]>([]);

    useEffect(() => {
        loadLeaderboard();
    }, []);

    async function loadLeaderboard() {
        try {
            setLoading(true);

            const { data: scoreRows, error: scoreErr } = await supabase
                .from("challenge_scores")
                .select("user_id,score")
                .eq("challenge_key", "squat")
                .order("score", { ascending: false })
                .order("created_at", { ascending: false })
                .limit(200);

            if (scoreErr) throw scoreErr;

            const userIds = Array.from(new Set((scoreRows || []).map((r: any) => r.user_id)));
            const { data: profiles, error: profileErr } = userIds.length
                ? await supabase.from("profiles").select("id,first_name").in("id", userIds)
                : { data: [], error: null };

            if (profileErr) throw profileErr;

            const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.first_name]));
            const stats = new Map<
                string,
                { name: string; bestScore: number; totalAttempts: number; sum: number }
            >();

            (scoreRows || []).forEach((row: any) => {
                const userId = row.user_id as string;
                const score = Number(row.score || 0);
                const existing = stats.get(userId);
                if (!existing) {
                    stats.set(userId, {
                        name: nameMap.get(userId) || "User",
                        bestScore: score,
                        totalAttempts: 1,
                        sum: score,
                    });
                } else {
                    existing.bestScore = Math.max(existing.bestScore, score);
                    existing.totalAttempts += 1;
                    existing.sum += score;
                }
            });

            const mapped = Array.from(stats.values())
                .map((s) => ({
                    name: s.name,
                    bestScore: s.bestScore,
                    averageScore: s.totalAttempts ? Math.round(s.sum / s.totalAttempts) : 0,
                    totalAttempts: s.totalAttempts,
                }))
                .sort((a, b) => b.bestScore - a.bestScore)
                .slice(0, 20)
                .map((r, idx) => ({
                    rank: idx + 1,
                    ...r,
                }));

            setRows(mapped);
        } catch (e) {
            console.log("loadLeaderboard error", e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#0B0F1A" }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                <View style={styles.headerCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.hello}>Leaderboard</Text>
                        <Text style={styles.welcome}>Squat Challenge • Top performers</Text>
                    </View>

                    <View style={styles.iconBtn}>
                        <Ionicons name="trophy-outline" size={20} color="white" />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Top 20</Text>

                <View style={styles.bigCard}>
                    {loading ? (
                        <View style={{ padding: 20, alignItems: "center" }}>
                            <ActivityIndicator color={ACCENT} />
                        </View>
                    ) : rows.length === 0 ? (
                        <View style={{ padding: 20, alignItems: "center" }}>
                            <Text style={{ color: MUTED }}>No scores yet.</Text>
                        </View>
                    ) : (
                        rows.map((r, idx) => (
                            <View key={`${r.name}-${idx}`} style={styles.row}>
                                <Text style={styles.rank}>{r.rank || idx + 1}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.name}>{r.name}</Text>
                                    <Text style={styles.meta}>Avg {r.averageScore} • {r.totalAttempts} attempts</Text>
                                </View>
                                <Text style={styles.score}>{r.bestScore} reps</Text>
                            </View>
                        ))
                    )}
                </View>
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
    meta: { color: MUTED, fontSize: 11, marginTop: 2 },
};
