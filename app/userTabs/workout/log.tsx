import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

const ACCENT = "#FF4D2D";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";
const BG = "#0B0F1A";

type ExerciseRow = {
    id: string;
    name: string;
    sets: string; // optional now (can be auto)
    repsPerSet: string; // "12,10,8"
    weight: string; // kg (same weight across sets)
    duration: string; // mins
    notes: string;
};

export default function LogWorkout() {
    const [title, setTitle] = useState("My Workout");
    const [workoutType, setWorkoutType] = useState<"strength" | "cardio" | "hiit" | "mobility">("strength");
    const [dateText, setDateText] = useState(() => new Date().toLocaleDateString());

    const [exercises, setExercises] = useState<ExerciseRow[]>([
        {
            id: "ex-1",
            name: "Push-ups",
            sets: "3",
            repsPerSet: "12,10,8",
            weight: "0",
            duration: "",
            notes: "",
        },
    ]);

    const addExercise = () => {
        setExercises((prev) => [
            ...prev,
            {
                id: `ex-${Date.now()}`,
                name: "",
                sets: "",
                repsPerSet: "",
                weight: "",
                duration: "",
                notes: "",
            },
        ]);
    };

    const removeExercise = (id: string) => {
        setExercises((prev) => prev.filter((x) => x.id !== id));
    };

    const updateExercise = (id: string, patch: Partial<ExerciseRow>) => {
        setExercises((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    };

    const summary = useMemo(() => {
        let totalSets = 0;
        let totalReps = 0;
        let totalVolume = 0; // sum(reps) * weight
        let totalMins = 0;

        for (const ex of exercises) {
            const repsList = parseRepsList(ex.repsPerSet);
            const setsFromList = repsList.length;

            const sets = num(ex.sets) > 0 ? num(ex.sets) : setsFromList;
            const repsSum = repsList.reduce((a, b) => a + b, 0);

            const weight = num(ex.weight);
            const duration = num(ex.duration);

            totalSets += sets;
            totalReps += repsSum;
            totalVolume += repsSum * weight;
            totalMins += duration;
        }

        return { totalSets, totalReps, totalVolume, totalMins };
    }, [exercises]);

    const saveWorkout = async () => {
        if (title.trim().length < 2) {
            Alert.alert("Missing title", "Please enter a workout title.");
            return;
        }
        if (exercises.length === 0) {
            Alert.alert("No exercises", "Add at least one exercise.");
            return;
        }
        const anyEmpty = exercises.some((x) => x.name.trim().length < 2);
        if (anyEmpty) {
            Alert.alert("Missing exercise name", "Please enter a name for each exercise.");
            return;
        }

        // ✅ Validate reps-per-set input
        for (const ex of exercises) {
            const repsList = parseRepsList(ex.repsPerSet);
            const sets = num(ex.sets);

            if (repsList.length === 0) {
                Alert.alert("Missing reps", `Please enter reps per set for "${ex.name}". Example: 12,10,8`);
                return;
            }

            // If sets is provided, enforce exact match
            if (sets > 0 && repsList.length !== sets) {
                Alert.alert(
                    "Sets mismatch",
                    `"${ex.name}" has ${sets} sets but you entered ${repsList.length} rep values.\nExample: 12,10,8`
                );
                return;
            }
        }

        // TODO: Connect to Supabase
        // const payload = { title, workoutType, date: new Date().toISOString(), exercises };

        Alert.alert("Saved ✅", "Workout saved (connect Supabase next).", [
            { text: "OK", onPress: () => router.back() },
        ]);
    };

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back-outline" size={22} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Log Workout</Text>

                    <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn} onPress={addExercise}>
                        <Ionicons name="add" size={22} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Summary card */}
                <View style={[styles.card, { marginTop: 12 }]}>
                    <Text style={styles.cardTitle}>SUMMARY</Text>

                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                        <MiniStat icon="layers-outline" label="Sets" value={`${summary.totalSets}`} />
                        <MiniStat icon="repeat-outline" label="Reps" value={`${summary.totalReps}`} />
                        <MiniStat icon="barbell-outline" label="Volume" value={`${Math.round(summary.totalVolume)} kg`} />
                        <MiniStat icon="time-outline" label="Duration" value={`${summary.totalMins} mins`} />
                    </View>

                    <Text style={{ color: MUTED, marginTop: 10, fontSize: 12 }}>
                        Volume = total reps × weight (per exercise). Reps are summed from “reps per set”.
                    </Text>
                </View>

                {/* Top card (title + type + date) */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>WORKOUT DETAILS</Text>

                    <Text style={styles.label}>workout title</Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g., Upper Body Strength"
                        placeholderTextColor="#6B7690"
                        style={styles.input}
                    />

                    <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                        <TypePill active={workoutType === "strength"} text="Strength" onPress={() => setWorkoutType("strength")} />
                        <TypePill active={workoutType === "cardio"} text="Cardio" onPress={() => setWorkoutType("cardio")} />
                        <TypePill active={workoutType === "hiit"} text="HIIT" onPress={() => setWorkoutType("hiit")} />
                        <TypePill active={workoutType === "mobility"} text="Mobility" onPress={() => setWorkoutType("mobility")} />
                    </View>

                    <Text style={[styles.label, { marginTop: 12 }]}>date</Text>
                    <TextInput
                        value={dateText}
                        onChangeText={setDateText}
                        placeholder="e.g., 3/2/2026"
                        placeholderTextColor="#6B7690"
                        style={styles.input}
                    />
                </View>

                {/* Exercises */}
                <Text style={styles.sectionTitle}>Exercises</Text>

                <View style={{ gap: 12 }}>
                    {exercises.map((ex, idx) => (
                        <View key={ex.id} style={styles.exerciseCard}>
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                <Text style={{ color: "white", fontWeight: "900" as const }}>Exercise {idx + 1}</Text>

                                {exercises.length > 1 && (
                                    <TouchableOpacity activeOpacity={0.9} onPress={() => removeExercise(ex.id)} style={styles.trashBtn}>
                                        <Ionicons name="trash-outline" size={18} color="#FFD3CA" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <Text style={[styles.label, { marginTop: 10 }]}>exercise name</Text>
                            <TextInput
                                value={ex.name}
                                onChangeText={(t) => updateExercise(ex.id, { name: t })}
                                placeholder="e.g., Bench Press"
                                placeholderTextColor="#6B7690"
                                style={styles.input}
                            />

                            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                                <Field
                                    label="sets (optional)"
                                    value={ex.sets}
                                    placeholder="e.g., 3"
                                    onChange={(t) => updateExercise(ex.id, { sets: digitsOnly(t) })}
                                />

                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>reps per set</Text>
                                    <TextInput
                                        value={ex.repsPerSet}
                                        onChangeText={(t) => updateExercise(ex.id, { repsPerSet: t })}
                                        placeholder="e.g., 12,10,8"
                                        placeholderTextColor="#6B7690"
                                        style={styles.input}
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                                <Field
                                    label="weight (kg)"
                                    value={ex.weight}
                                    placeholder="0"
                                    onChange={(t) => updateExercise(ex.id, { weight: numOnly(t) })}
                                />
                                <Field
                                    label="duration (mins)"
                                    value={ex.duration}
                                    placeholder="10"
                                    onChange={(t) => updateExercise(ex.id, { duration: digitsOnly(t) })}
                                />
                            </View>

                            <Text style={[styles.label, { marginTop: 12 }]}>notes (optional)</Text>
                            <TextInput
                                value={ex.notes}
                                onChangeText={(t) => updateExercise(ex.id, { notes: t })}
                                placeholder="e.g., felt strong, increase weight next time"
                                placeholderTextColor="#6B7690"
                                style={[styles.input, { height: 90, paddingTop: 14 }]}
                                multiline
                            />
                        </View>
                    ))}
                </View>

                {/* Add exercise */}
                <TouchableOpacity activeOpacity={0.9} style={[styles.secondaryBtn, { marginTop: 12 }]} onPress={addExercise}>
                    <Ionicons name="add-circle-outline" size={18} color={ACCENT} />
                    <Text style={styles.secondaryText}>Add Exercise</Text>
                </TouchableOpacity>

                {/* Save button */}
                <TouchableOpacity activeOpacity={0.9} style={[styles.primaryBtn, { marginTop: 12 }]} onPress={saveWorkout}>
                    <Text style={styles.primaryText}>Save Workout</Text>
                </TouchableOpacity>

                <Text style={{ color: MUTED, marginTop: 10, fontSize: 12 }}>
                    Next step: connect this to Supabase so every workout is saved under the logged-in user.
                </Text>
            </ScrollView>
        </View>
    );
}

/* ---------------- UI helpers ---------------- */

function TypePill({ active, text, onPress }: { active: boolean; text: string; onPress: () => void }) {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={[
                styles.pill,
                {
                    backgroundColor: active ? "rgba(255,77,45,0.14)" : "transparent",
                    borderColor: active ? "rgba(255,77,45,0.35)" : BORDER,
                },
            ]}
        >
            <Text style={{ color: active ? "#FFD3CA" : MUTED, fontWeight: "900" as const, fontSize: 12 }}>{text}</Text>
        </TouchableOpacity>
    );
}

function MiniStat({ icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <View style={styles.miniStat}>
            <Ionicons name={icon} size={16} color={ACCENT} />
            <View style={{ marginLeft: 8 }}>
                <Text style={{ color: MUTED, fontSize: 12 }}>{label}</Text>
                <Text style={{ color: "white", fontWeight: "900" as const, marginTop: 2 }}>{value}</Text>
            </View>
        </View>
    );
}

function Field({
    label,
    value,
    placeholder,
    onChange,
}: {
    label: string;
    value: string;
    placeholder: string;
    onChange: (t: string) => void;
}) {
    return (
        <View style={{ flex: 1 }}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor="#6B7690"
                keyboardType="numeric"
                style={styles.input}
            />
        </View>
    );
}

function parseRepsList(text: string) {
    const cleaned = String(text || "").trim();
    if (!cleaned) return [];

    return cleaned
        .split(/[\s,|]+/g)
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n) && n >= 0);
}

function digitsOnly(t: string) {
    return t.replace(/\D/g, "");
}
function numOnly(t: string) {
    return t.replace(/[^0-9.]/g, "");
}
function num(v: string) {
    const n = Number(String(v || "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
}

/* ---------------- Styles ---------------- */

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

    sectionTitle: {
        fontSize: 18,
        color: ACCENT,
        fontWeight: "900" as const,
        marginTop: 14,
        marginBottom: 8,
    },

    card: {
        borderRadius: 22,
        backgroundColor: CARD,
        padding: 14,
        borderWidth: 1,
        borderColor: BORDER,
        marginTop: 20,
    },
    cardTitle: { color: "#AEB8CA", fontWeight: "900" as const, fontSize: 12, letterSpacing: 0.6 },

    label: {
        color: "#6B7690",
        fontWeight: "800" as const,
        textTransform: "lowercase" as const,
        marginTop: 10,
        marginBottom: 8,
    },
    input: {
        height: 54,
        borderRadius: 14,
        paddingHorizontal: 14,
        color: "white",
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderColor: ACCENT,
    },

    pill: {
        flex: 1,
        height: 40,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: "center" as const,
        justifyContent: "center" as const,
    },

    miniStat: {
        width: "48%" as const,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: "rgba(255,255,255,0.04)",
        padding: 12,
        flexDirection: "row" as const,
        alignItems: "center" as const,
    },

    exerciseCard: {
        borderRadius: 22,
        backgroundColor: CARD,
        padding: 14,
        borderWidth: 1,
        borderColor: BORDER,
    },
    trashBtn: {
        width: 40,
        height: 36,
        borderRadius: 14,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        backgroundColor: "rgba(255,77,45,0.14)",
        borderWidth: 1,
        borderColor: "rgba(255,77,45,0.25)",
    },

    secondaryBtn: {
        height: 56,
        borderRadius: 999,
        backgroundColor: "transparent",
        alignItems: "center" as const,
        justifyContent: "center" as const,
        flexDirection: "row" as const,
        gap: 10,
        borderWidth: 1.5,
        borderColor: ACCENT,
    },
    secondaryText: { color: "#FFD3CA", fontWeight: "900" as const, fontSize: 14 },

    primaryBtn: {
        height: 56,
        borderRadius: 999,
        backgroundColor: ACCENT,
        alignItems: "center" as const,
        justifyContent: "center" as const,
    },
    primaryText: { color: "white", fontWeight: "900" as const, fontSize: 16 },
};