import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

const ACCENT = "#FF4D2D";
const BG = "#0B0F1A";
const CARD = "#111A2C";
const CARD2 = "#0F1627";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

export default function TrainerDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const trainerId = String(id || "");

    const trainer = useMemo(() => {
        // Later you’ll fetch from Supabase; demo data for now:
        const map: any = {
            t1: { name: "Prajwal Shrestha", specialty: "Strength", price: 140, rating: 4.8, reviews: 212, location: "Kathmandu", online: true, verified: true },
            t2: { name: "Aarati Shrestha", specialty: "Yoga", price: 95, rating: 4.7, reviews: 156, location: "Online", online: true, verified: true },
            t3: { name: "Rohan Singh", specialty: "Weight Loss", price: 110, rating: 4.6, reviews: 98, location: "Lalitpur", online: false, verified: false },
            t4: { name: "Maya Gurung", specialty: "Cardio", price: 80, rating: 4.5, reviews: 73, location: "Online", online: true, verified: true },
            t5: { name: "Sagar Thapa", specialty: "Rehab", price: 120, rating: 4.4, reviews: 51, location: "Kathmandu", online: false, verified: true },
        };
        return map[trainerId] ?? map.t1;
    }, [trainerId]);

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                <View style={{ marginTop: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back-outline" size={22} color="white" />
                    </TouchableOpacity>
                    <Text style={{ color: "white", fontWeight: "900" }}>Trainer Profile</Text>
                    <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn}>
                        <Ionicons name="share-outline" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                <View style={[styles.card, { marginTop: 14 }]}>
                    <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                        <View style={styles.avatar}>
                            <Image source={{ uri: `https://picsum.photos/seed/${trainerId}/400` }} style={{ width: "100%", height: "100%" }} />
                            {trainer.online && <View style={styles.onlineDot} />}
                        </View>

                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>{trainer.name}</Text>
                                {trainer.verified && (
                                    <View style={styles.verified}>
                                        <Ionicons name="checkmark-circle" size={14} color={ACCENT} />
                                        <Text style={{ color: "#FFD3CA", fontWeight: "900", fontSize: 12 }}>Verified</Text>
                                    </View>
                                )}
                            </View>

                            <Text style={{ color: MUTED, marginTop: 4 }}>
                                {trainer.specialty} • {trainer.location} • {trainer.online ? "Online" : "In-person"}
                            </Text>

                            <Text style={{ color: MUTED, marginTop: 6 }}>
                                ⭐ {trainer.rating.toFixed(1)} ({trainer.reviews} reviews)
                            </Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                        <TouchableOpacity activeOpacity={0.9} style={[styles.btnOutline, { flex: 1 }]}>
                            <Text style={{ color: "white", fontWeight: "900" }}>Message</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={[styles.btnSolid, { flex: 1 }]}
                            onPress={() => router.push({ pathname: "/userTabs/trainer/hire", params: { id: trainerId } })}
                        >
                            <Text style={{ color: "white", fontWeight: "900" }}>Hire • ${trainer.price}/mo</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* About */}
                <View style={[styles.card, { marginTop: 12 }]}>
                    <Text style={styles.cardTitle}>ABOUT</Text>
                    <Text style={{ color: "#C7CFDD", marginTop: 10, lineHeight: 18 }}>
                        Coaching focused on clear structure, weekly progress checks, and sustainable habits. You’ll get a plan that
                        fits your schedule and goals.
                    </Text>
                </View>

                {/* Packages */}
                <View style={[styles.card, { marginTop: 12 }]}>
                    <Text style={styles.cardTitle}>PACKAGES</Text>

                    <Package name="Basic" desc="Workout plan + weekly check-in" price="$79/mo" />
                    <Package name="Standard" desc="Workout + diet plan + 2 check-ins/week" price="$129/mo" featured />
                    <Package name="Pro" desc="Full coaching + daily chat support" price="$199/mo" />
                </View>

                {/* Availability */}
                <View style={[styles.card, { marginTop: 12 }]}>
                    <Text style={styles.cardTitle}>AVAILABILITY</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                        <Pill text="Mon" />
                        <Pill text="Tue" />
                        <Pill text="Wed" />
                        <Pill text="Thu" />
                        <Pill text="Fri" />
                    </View>
                    <Text style={{ color: MUTED, marginTop: 10 }}>Typical slots: 6AM–9AM • 6PM–9PM</Text>
                </View>

                {/* Reviews */}
                <View style={[styles.card, { marginTop: 12 }]}>
                    <Text style={styles.cardTitle}>REVIEWS</Text>
                    <Review name="Aashish" text="Super supportive coach. My strength improved a lot." />
                    <Review name="Sanjana" text="Great plan and very consistent follow-ups." />
                </View>
            </ScrollView>
        </View>
    );
}

function Package({ name, desc, price, featured }: any) {
    return (
        <View
            style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 16,
                backgroundColor: featured ? "rgba(255,77,45,0.12)" : CARD2,
                borderWidth: 1,
                borderColor: featured ? "rgba(255,77,45,0.35)" : BORDER,
            }}
        >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "white", fontWeight: "900" }}>{name}</Text>
                <Text style={{ color: "white", fontWeight: "900" }}>{price}</Text>
            </View>
            <Text style={{ color: MUTED, marginTop: 6 }}>{desc}</Text>
        </View>
    );
}

function Pill({ text }: { text: string }) {
    return (
        <View style={{ paddingHorizontal: 12, height: 34, borderRadius: 999, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD2, justifyContent: "center" }}>
            <Text style={{ color: MUTED, fontWeight: "900" }}>{text}</Text>
        </View>
    );
}

function Review({ name, text }: { name: string; text: string }) {
    return (
        <View style={{ marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER }}>
            <Text style={{ color: "white", fontWeight: "900" }}>{name}</Text>
            <Text style={{ color: MUTED, marginTop: 6 }}>{text}</Text>
        </View>
    );
}

const styles = {
    card: { padding: 14, borderRadius: 18, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
    cardTitle: { color: "#AEB8CA", fontWeight: "900" as const, fontSize: 12, letterSpacing: 0.6 },
    iconBtn: { width: 44, height: 44, borderRadius: 16, alignItems: "center" as const, justifyContent: "center" as const, backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER },
    avatar: { width: 84, height: 84, borderRadius: 22, overflow: "hidden" as const, borderWidth: 1, borderColor: BORDER },
    onlineDot: { position: "absolute" as const, width: 12, height: 12, borderRadius: 999, backgroundColor: "#22C55E", borderWidth: 2, borderColor: CARD, right: 8, bottom: 8 },
    verified: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, paddingHorizontal: 10, height: 28, borderRadius: 999, backgroundColor: "rgba(255,77,45,0.12)", borderWidth: 1, borderColor: "rgba(255,77,45,0.25)" },
    btnSolid: { height: 46, borderRadius: 16, backgroundColor: ACCENT, alignItems: "center" as const, justifyContent: "center" as const },
    btnOutline: { height: 46, borderRadius: 16, backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER, alignItems: "center" as const, justifyContent: "center" as const },
};