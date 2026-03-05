import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

const ACCENT = "#FF4D2D";
const BG = "#0B0F1A";
const CARD = "#111A2C";
const CARD2 = "#0F1627";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

type ActiveCoach = {
    id: string;
    name: string;
    specialty: string;
    rating: number;
    sessionsThisWeek: number;
    nextSession: { title: string; time: string; place: string };
    plan: { name: string; price: number; renewsOn: string };
};

export default function MyTrainer() {
    // demo state (later: fetch from Supabase)
    const coach: ActiveCoach | null = useMemo(
        () => ({
            id: "t2",
            name: "Aarati Shrestha",
            specialty: "Yoga • Mobility",
            rating: 4.7,
            sessionsThisWeek: 2,
            nextSession: { title: "Mobility Flow — 30 mins", time: "Tomorrow • 6:30 AM", place: "Online (Zoom)" },
            plan: { name: "Standard", price: 129, renewsOn: "Mar 30, 2026" },
        }),
        []
    );

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back-outline" size={22} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>My Trainer</Text>

                    <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn} onPress={() => router.push("/(tabs)/trainer/browse")}>
                        <Ionicons name="people-outline" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {!coach ? (
                    <View style={[styles.card, { marginTop: 14, alignItems: "center", paddingVertical: 22 }]}>
                        <Ionicons name="person-add-outline" size={28} color={ACCENT} />
                        <Text style={{ color: "white", fontWeight: "900", marginTop: 10 }}>No trainer yet</Text>
                        <Text style={{ color: MUTED, marginTop: 6, textAlign: "center" }}>
                            Browse trainers and send a request to start coaching.
                        </Text>

                        <TouchableOpacity activeOpacity={0.9} style={[styles.btnSolid, { marginTop: 14 }]} onPress={() => router.push("/(tabs)/trainer/browse")}>
                            <Text style={{ color: "white", fontWeight: "900" }}>Browse Trainers</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Coach card */}
                        <View style={[styles.card, { marginTop: 14 }]}>
                            <Text style={styles.cardTitle}>ACTIVE COACH</Text>

                            <View style={{ flexDirection: "row", gap: 12, marginTop: 12, alignItems: "center" }}>
                                <View style={styles.avatar}>
                                    <Image source={{ uri: `https://picsum.photos/seed/${coach.id}/500` }} style={{ width: "100%", height: "100%" }} />
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>{coach.name}</Text>
                                    <Text style={{ color: MUTED, marginTop: 2 }}>{coach.specialty}</Text>

                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                                        <Ionicons name="star" size={14} color="#FFD166" />
                                        <Text style={{ color: MUTED, fontSize: 12 }}>{coach.rating.toFixed(1)} rating</Text>

                                        <View style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 6 }}>
                                            <Ionicons name="calendar-outline" size={14} color={MUTED} />
                                            <Text style={{ color: MUTED, fontSize: 12 }}>{coach.sessionsThisWeek} sessions/week</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                                <TouchableOpacity activeOpacity={0.9} style={[styles.btnOutline, { flex: 1 }]}>
                                    <Text style={{ color: "white", fontWeight: "900" }}>Message</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    style={[styles.btnSolid, { flex: 1 }]}
                                    onPress={() => router.push(`/(tabs)/trainer/${coach.id}`)}
                                >
                                    <Text style={{ color: "white", fontWeight: "900" }}>View Profile</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Next session */}
                        <View style={[styles.card, { marginTop: 12 }]}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <Text style={styles.cardTitle}>NEXT SESSION</Text>
                                <TouchableOpacity activeOpacity={0.9}>
                                    <Text style={{ color: MUTED, fontWeight: "900" }}>Reschedule</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.nextRow}>
                                <View style={styles.nextIcon}>
                                    <Ionicons name="time-outline" size={18} color="white" />
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: "white", fontWeight: "900" }}>{coach.nextSession.title}</Text>
                                    <Text style={{ color: MUTED, marginTop: 2, fontSize: 12 }}>
                                        {coach.nextSession.time} • {coach.nextSession.place}
                                    </Text>
                                </View>

                                <Ionicons name="chevron-forward" size={18} color={MUTED} />
                            </View>

                            <TouchableOpacity activeOpacity={0.9} style={[styles.btnSolid, { marginTop: 12 }]}>
                                <Text style={{ color: "white", fontWeight: "900" }}>Join Session</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Plan */}
                        <View style={[styles.card, { marginTop: 12 }]}>
                            <Text style={styles.cardTitle}>YOUR PLAN</Text>

                            <View style={{ marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER }}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                    <Text style={{ color: "white", fontWeight: "900" }}>{coach.plan.name}</Text>
                                    <Text style={{ color: "white", fontWeight: "900" }}>${coach.plan.price}/mo</Text>
                                </View>
                                <Text style={{ color: MUTED, marginTop: 6 }}>Renews on {coach.plan.renewsOn}</Text>

                                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                                    <TouchableOpacity activeOpacity={0.9} style={[styles.btnOutline, { flex: 1, height: 42 }]}>
                                        <Text style={{ color: "white", fontWeight: "900", fontSize: 12 }}>Manage</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity activeOpacity={0.9} style={[styles.btnOutline, { flex: 1, height: 42 }]}>
                                        <Text style={{ color: "white", fontWeight: "900", fontSize: 12 }}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Progress */}
                        <View style={[styles.card, { marginTop: 12 }]}>
                            <Text style={styles.cardTitle}>PROGRESS</Text>

                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                                <StatTile icon="flame-outline" label="Streak" value="4 days" />
                                <StatTile icon="barbell-outline" label="Workouts" value="12" />
                                <StatTile icon="walk-outline" label="Steps avg" value="5,430" />
                                <StatTile icon="water-outline" label="Water avg" value="1.8L" />
                            </View>

                            <Text style={{ color: MUTED, marginTop: 10, fontSize: 12 }}>
                                Later we’ll calculate this from Diet + Workout logs.
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

/* ---------- components ---------- */

function StatTile({ icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <View style={styles.statTile}>
            <Ionicons name={icon} size={18} color={ACCENT} />
            <Text style={{ color: MUTED, fontSize: 12, marginTop: 6 }}>{label}</Text>
            <Text style={{ color: "white", fontWeight: "900", marginTop: 2 }}>{value}</Text>
        </View>
    );
}

/* ---------- styles ---------- */

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
    cardTitle: { color: "#AEB8CA", fontWeight: "900" as const, fontSize: 12, letterSpacing: 0.6 },

    avatar: {
        width: 74,
        height: 74,
        borderRadius: 20,
        overflow: "hidden" as const,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: "#E6E6E6",
    },

    btnSolid: {
        height: 46,
        borderRadius: 16,
        backgroundColor: ACCENT,
        alignItems: "center" as const,
        justifyContent: "center" as const,
    },
    btnOutline: {
        height: 46,
        borderRadius: 16,
        backgroundColor: CARD2,
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: "center" as const,
        justifyContent: "center" as const,
    },

    nextRow: {
        marginTop: 12,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 12,
        padding: 12,
        borderRadius: 16,
        backgroundColor: CARD2,
        borderWidth: 1,
        borderColor: BORDER,
    },
    nextIcon: {
        width: 38,
        height: 38,
        borderRadius: 14,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        backgroundColor: "rgba(255,77,45,0.12)",
        borderWidth: 1,
        borderColor: "rgba(255,77,45,0.25)",
    },

    statTile: {
        width: "48%" as const,
        padding: 12,
        borderRadius: 16,
        backgroundColor: CARD2,
        borderWidth: 1,
        borderColor: BORDER,
    },
};