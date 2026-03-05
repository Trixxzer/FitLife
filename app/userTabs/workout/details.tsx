import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const ACCENT = "#FF4D2D";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";
const BG = "#0B0F1A";

export default function WorkoutDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const workoutId = String(id || "");

    // ✅ Demo data (replace later with Supabase fetch by ID)
    const workout = useMemo(() => {
        const map: Record<string, any> = {
            "1": {
                title: "Push-ups",
                meta: "Chest • Beginner • 6 mins",
                kcal: 60,
                difficulty: "Beginner",
                exercises: [
                    { name: "Warm-up Shoulder Circles", sets: "1", reps: "30 sec" },
                    { name: "Incline Push-ups", sets: "3", reps: "10–12" },
                    { name: "Standard Push-ups", sets: "3", reps: "8–10" },
                    { name: "Cool Down Stretch", sets: "1", reps: "60 sec" },
                ],
            },
            "2": {
                title: "Squats",
                meta: "Legs • Beginner • 8 mins",
                kcal: 90,
                difficulty: "Beginner",
                exercises: [
                    { name: "Warm-up Leg Swings", sets: "1", reps: "30 sec" },
                    { name: "Bodyweight Squats", sets: "4", reps: "10–12" },
                    { name: "Wall Sit", sets: "3", reps: "30 sec" },
                ],
            },
            "3": {
                title: "Plank",
                meta: "Core • Intermediate • 5 mins",
                kcal: 40,
                difficulty: "Intermediate",
                exercises: [
                    { name: "Forearm Plank", sets: "3", reps: "30–45 sec" },
                    { name: "Side Plank", sets: "2", reps: "20–30 sec" },
                ],
            },
            "4": {
                title: "HIIT Burn",
                meta: "Cardio • Advanced • 15 mins",
                kcal: 180,
                difficulty: "Advanced",
                exercises: [
                    { name: "Jumping Jacks", sets: "4", reps: "30 sec" },
                    { name: "High Knees", sets: "4", reps: "30 sec" },
                    { name: "Burpees", sets: "4", reps: "10–12" },
                    { name: "Rest", sets: "-", reps: "20 sec" },
                ],
            },
        };

        return (
            map[workoutId] ?? {
                title: "Workout",
                meta: "Details",
                kcal: 0,
                difficulty: "—",
                exercises: [],
            }
        );
    }, [workoutId]);

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <TouchableOpacity activeOpacity={0.9} style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back-outline" size={22} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Workout Details</Text>

                    <TouchableOpacity activeOpacity={0.9} style={styles.backBtn} onPress={() => { }}>
                        <Ionicons name="bookmark-outline" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Hero card */}
                <View style={styles.heroCard}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.heroTitle}>{workout.title}</Text>
                            <Text style={styles.heroMeta}>{workout.meta}</Text>
                        </View>

                        <View style={styles.iconBubble}>
                            <Ionicons name="barbell-outline" size={20} color={ACCENT} />
                        </View>
                    </View>

                    <View style={styles.heroStatsRow}>
                        <MiniPill icon="speedometer-outline" label="Level" value={workout.difficulty} />
                        <MiniPill icon="flame-outline" label="Calories" value={`${workout.kcal} kcal`} />
                    </View>

                    {/* CTA buttons */}
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                        <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} activeOpacity={0.9} onPress={() => { }}>
                            <Ionicons name="play-outline" size={18} color="white" />
                            <Text style={styles.primaryText}>Start</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} activeOpacity={0.9} onPress={() => { }}>
                            <Ionicons name="videocam-outline" size={18} color={ACCENT} />
                            <Text style={styles.secondaryText}>Watch Video</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Exercises */}
                <Text style={styles.sectionTitle}>Exercises</Text>

                <View style={styles.bigCard}>
                    {workout.exercises.length === 0 ? (
                        <Text style={{ color: MUTED }}>No exercises found for this workout.</Text>
                    ) : (
                        workout.exercises.map((ex: any, idx: number) => (
                            <View
                                key={`${ex.name}-${idx}`}
                                style={[
                                    styles.exerciseRow,
                                    { borderBottomWidth: idx === workout.exercises.length - 1 ? 0 : 1 },
                                ]}
                            >
                                <View style={styles.exerciseIcon}>
                                    <Ionicons name="checkmark-circle-outline" size={18} color={ACCENT} />
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={styles.exerciseName}>{ex.name}</Text>
                                    <Text style={styles.exerciseMeta}>
                                        Sets: {ex.sets} • Reps/Time: {ex.reps}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Notes */}
                <Text style={styles.sectionTitle}>Tips</Text>
                <View style={styles.bigCard}>
                    <Text style={{ color: "white", fontWeight: "900" as const }}>Form matters more than speed.</Text>
                    <Text style={{ color: MUTED, marginTop: 8 }}>
                        Keep your core tight, breathe steadily, and stop if you feel sharp pain.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

/* ----------- Small UI helpers ----------- */

function MiniPill({ icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <View style={styles.miniPill}>
            <Ionicons name={icon} size={14} color={ACCENT} />
            <Text style={{ color: MUTED, fontSize: 12 }}>{label}</Text>
            <Text style={{ color: "white", fontWeight: "900" as const, fontSize: 12 }}>{value}</Text>
        </View>
    );
}

/* -------------------- Styles -------------------- */

const styles = {
    headerRow: {
        marginTop: 40,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        justifyContent: "space-between" as const,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
    },
    headerTitle: {
        color: "white",
        fontWeight: "900" as const,
        fontSize: 16,
    },

    heroCard: {
        marginTop: 14,
        borderRadius: 22,
        backgroundColor: CARD,
        padding: 14,
        borderWidth: 1,
        borderColor: BORDER,
    },
    heroTitle: { color: "white", fontWeight: "900" as const, fontSize: 20 },
    heroMeta: { color: "#C7CFDD", marginTop: 4, fontSize: 12, opacity: 0.9 },

    iconBubble: {
        width: 44,
        height: 44,
        borderRadius: 16,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        backgroundColor: "rgba(255,77,45,0.12)",
        borderWidth: 1,
        borderColor: "rgba(255,77,45,0.25)",
        marginLeft: 12,
    },

    heroStatsRow: {
        flexDirection: "row" as const,
        gap: 10,
        marginTop: 12,
    },
    miniPill: {
        flex: 1,
        height: 40,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: "rgba(255,255,255,0.04)",
        alignItems: "center" as const,
        justifyContent: "center" as const,
        flexDirection: "row" as const,
        gap: 8,
    },

    primaryBtn: {
        height: 54,
        borderRadius: 16,
        backgroundColor: ACCENT,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        flexDirection: "row" as const,
        gap: 8,
    },
    primaryText: { color: "white", fontWeight: "900" as const, fontSize: 14 },

    secondaryBtn: {
        height: 54,
        borderRadius: 16,
        backgroundColor: "transparent",
        alignItems: "center" as const,
        justifyContent: "center" as const,
        flexDirection: "row" as const,
        gap: 8,
        borderWidth: 1.5,
        borderColor: ACCENT,
    },
    secondaryText: { color: "#FFD3CA", fontWeight: "900" as const, fontSize: 14 },

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
        padding: 14,
        borderWidth: 1,
        borderColor: BORDER,
    },

    exerciseRow: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 12,
        paddingVertical: 12,
        borderBottomColor: BORDER,
    },
    exerciseIcon: {
        width: 36,
        height: 36,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.08)",
        alignItems: "center" as const,
        justifyContent: "center" as const,
    },
    exerciseName: { color: "white", fontWeight: "900" as const, fontSize: 14 },
    exerciseMeta: { color: MUTED, fontSize: 12, marginTop: 4 },
};