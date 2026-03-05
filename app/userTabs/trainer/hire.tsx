import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

const ACCENT = "#FF4D2D";
const BG = "#0B0F1A";
const CARD = "#111A2C";
const CARD2 = "#0F1627";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

export default function HireTrainer() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const trainerId = String(id || "");

    const plans = useMemo(
        () => [
            { key: "basic", name: "Basic", desc: "Workout plan + weekly check-in", price: 79 },
            { key: "standard", name: "Standard", desc: "Workout + diet + 2 check-ins/week", price: 129 },
            { key: "pro", name: "Pro", desc: "Full coaching + daily chat support", price: 199 },
        ],
        []
    );

    const [active, setActive] = useState(plans[1].key);

    const submit = () => {
        // TODO: write to supabase "trainer_requests" table
        Alert.alert("Request sent ✅", `Trainer: ${trainerId}\nPlan: ${active}`, [{ text: "OK", onPress: () => router.back() }]);
    };

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                <View style={{ marginTop: 40, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back-outline" size={22} color="white" />
                    </TouchableOpacity>
                    <Text style={{ color: "white", fontWeight: "900" }}>Hire Trainer</Text>
                    <View style={{ width: 44 }} />
                </View>

                <View style={[styles.card, { marginTop: 14 }]}>
                    <Text style={styles.cardTitle}>SELECT PLAN</Text>

                    {plans.map((p) => {
                        const isActive = p.key === active;
                        return (
                            <TouchableOpacity
                                key={p.key}
                                activeOpacity={0.9}
                                onPress={() => setActive(p.key)}
                                style={{
                                    marginTop: 10,
                                    padding: 12,
                                    borderRadius: 16,
                                    backgroundColor: isActive ? "rgba(255,77,45,0.12)" : CARD2,
                                    borderWidth: 1,
                                    borderColor: isActive ? "rgba(255,77,45,0.35)" : BORDER,
                                }}
                            >
                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                    <Text style={{ color: "white", fontWeight: "900" }}>{p.name}</Text>
                                    <Text style={{ color: "white", fontWeight: "900" }}>${p.price}/mo</Text>
                                </View>
                                <Text style={{ color: MUTED, marginTop: 6 }}>{p.desc}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity activeOpacity={0.9} style={styles.btnSolid} onPress={submit}>
                    <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>Send Request</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = {
    card: { padding: 14, borderRadius: 18, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
    cardTitle: { color: "#AEB8CA", fontWeight: "900" as const, fontSize: 12, letterSpacing: 0.6 },
    iconBtn: { width: 44, height: 44, borderRadius: 16, alignItems: "center" as const, justifyContent: "center" as const, backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER },
    btnSolid: { marginTop: 14, height: 56, borderRadius: 999, backgroundColor: ACCENT, alignItems: "center" as const, justifyContent: "center" as const },
};