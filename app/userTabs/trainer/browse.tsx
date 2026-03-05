import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

type Specialty = "Weight Loss" | "Strength" | "Yoga" | "Cardio" | "Rehab";

type Trainer = {
    id: string;
    name: string;
    specialty: Specialty;
    rating: number;
    reviews: number;
    pricePerMonth: number;
    location: string;
    online: boolean;
    verified: boolean;
    bio: string;
};

const ACCENT = "#FF4D2D";
const BG = "#0B0F1A";
const CARD = "#111A2C";
const CARD2 = "#0F1627";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

export default function TrainerBrowse() {
    const [query, setQuery] = useState("");
    const [activeChip, setActiveChip] = useState<Specialty | "All">("All");

    const trainers: Trainer[] = useMemo(
        () => [
            {
                id: "t1",
                name: "Prajwal Shrestha",
                specialty: "Strength",
                rating: 4.8,
                reviews: 212,
                pricePerMonth: 140,
                location: "Kathmandu",
                online: true,
                verified: true,
                bio: "Strength coach focused on hypertrophy + beginner-friendly plans.",
            },
            {
                id: "t2",
                name: "Aarati Shrestha",
                specialty: "Yoga",
                rating: 4.7,
                reviews: 156,
                pricePerMonth: 95,
                location: "Online",
                online: true,
                verified: true,
                bio: "Mobility + yoga flows for posture, flexibility, and stress relief.",
            },
            {
                id: "t3",
                name: "Rohan Singh",
                specialty: "Weight Loss",
                rating: 4.6,
                reviews: 98,
                pricePerMonth: 110,
                location: "Lalitpur",
                online: false,
                verified: false,
                bio: "Fat-loss coach with habit tracking and nutrition accountability.",
            },
            {
                id: "t4",
                name: "Maya Gurung",
                specialty: "Cardio",
                rating: 4.5,
                reviews: 73,
                pricePerMonth: 80,
                location: "Online",
                online: true,
                verified: true,
                bio: "HIIT + endurance plans, great for busy schedules.",
            },
            {
                id: "t5",
                name: "Sagar Thapa",
                specialty: "Rehab",
                rating: 4.4,
                reviews: 51,
                pricePerMonth: 120,
                location: "Kathmandu",
                online: false,
                verified: true,
                bio: "Recovery & injury-prevention training (knee/shoulder friendly).",
            },
        ],
        []
    );

    const chips: (Specialty | "All")[] = ["All", "Weight Loss", "Strength", "Yoga", "Cardio", "Rehab"];

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return trainers.filter((t) => {
            const chipOk = activeChip === "All" ? true : t.specialty === activeChip;
            const textOk =
                !q ||
                t.name.toLowerCase().includes(q) ||
                t.specialty.toLowerCase().includes(q) ||
                t.location.toLowerCase().includes(q);
            return chipOk && textOk;
        });
    }, [trainers, query, activeChip]);

    const featured = filtered[0];

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.headerCard}>
                    <TouchableOpacity activeOpacity={0.9} onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back-outline" size={22} color="white" />
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                        <Text style={styles.hello}>Trainers</Text>
                        <Text style={styles.welcome}>Find a coach, get verified guidance.</Text>
                    </View>

                    <TouchableOpacity activeOpacity={0.9} style={styles.iconBtn}>
                        <Ionicons name="notifications-outline" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={18} color={MUTED} />
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search trainer, specialty, location…"
                        placeholderTextColor="#6B7690"
                        style={styles.searchInput}
                    />
                    {!!query && (
                        <TouchableOpacity activeOpacity={0.85} onPress={() => setQuery("")}>
                            <Ionicons name="close-circle" size={18} color={MUTED} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filter chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: "row", gap: 10, paddingRight: 6 }}>
                        {chips.map((c) => {
                            const active = c === activeChip;
                            return (
                                <TouchableOpacity
                                    key={c}
                                    activeOpacity={0.9}
                                    onPress={() => setActiveChip(c)}
                                    style={[
                                        styles.chip,
                                        {
                                            borderColor: active ? "rgba(255,77,45,0.35)" : BORDER,
                                            backgroundColor: active ? "rgba(255,77,45,0.12)" : CARD2,
                                        },
                                    ]}
                                >
                                    <Text style={{ color: active ? "#FFD3CA" : MUTED, fontWeight: "900", fontSize: 12 }}>{c}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* Featured */}
                {featured ? (
                    <View style={[styles.card, { marginTop: 14 }]}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={styles.cardTitle}>FEATURED</Text>
                            <TouchableOpacity activeOpacity={0.9} style={styles.pillTiny}>
                                <Ionicons name="options-outline" size={14} color={MUTED} />
                                <Text style={{ color: MUTED, fontWeight: "900", fontSize: 12 }}>Filter</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: "row", gap: 12, marginTop: 12, alignItems: "center" }}>
                            <View style={styles.avatarBig}>
                                <Image source={{ uri: "https://picsum.photos/200" }} style={{ width: "100%", height: "100%" }} />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>{featured.name}</Text>
                                <Text style={{ color: MUTED, marginTop: 2, fontSize: 12 }}>
                                    {featured.specialty} • {featured.location} • {featured.online ? "Online" : "In-person"}
                                </Text>

                                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 }}>
                                    <Stars rating={featured.rating} />
                                    <Text style={{ color: MUTED, fontSize: 12 }}>
                                        {featured.rating.toFixed(1)} ({featured.reviews})
                                    </Text>
                                </View>

                                <Text style={{ color: "#AEB8CA", marginTop: 8, fontSize: 12, lineHeight: 16 }}>{featured.bio}</Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                            <TouchableOpacity
                                activeOpacity={0.9}
                                style={[styles.btnOutline, { flex: 1 }]}
                                onPress={() => router.push(`/userTabs/trainer/${featured.id}`)}
                            >
                                <Text style={{ color: "white", fontWeight: "900" }}>View profile</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.9}
                                style={[styles.btnSolid, { flex: 1 }]}
                                onPress={() => router.push({ pathname: "/userTabs/trainer/hire", params: { id: featured.id } })}
                            >
                                <Text style={{ color: "white", fontWeight: "900" }}>Hire • ${featured.pricePerMonth}/mo</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.card, { marginTop: 14, alignItems: "center", paddingVertical: 20 }]}>
                        <Text style={{ color: MUTED, fontWeight: "800" }}>No trainers found.</Text>
                    </View>
                )}

                {/* List */}
                <View style={{ marginTop: 12 }}>
                    <Text style={styles.sectionTitle}>Available Trainers</Text>

                    <View style={{ gap: 12 }}>
                        {filtered.slice(0, 10).map((t) => (
                            <View key={t.id} style={styles.listCard}>
                                <View style={{ flexDirection: "row", gap: 12 }}>
                                    <View style={styles.avatarSm}>
                                        <Image
                                            source={{ uri: `https://picsum.photos/seed/${t.id}/200` }}
                                            style={{ width: "100%", height: "100%" }}
                                        />
                                        {t.online && <View style={styles.onlineDot} />}
                                    </View>

                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: "white", fontWeight: "900", fontSize: 15 }}>{t.name}</Text>
                                        <Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>
                                            {t.specialty} • {t.location} • {t.online ? "Online" : "In-person"}
                                        </Text>

                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                                            <Stars rating={t.rating} />
                                            <Text style={{ color: MUTED, fontSize: 12 }}>
                                                {t.rating.toFixed(1)} ({t.reviews})
                                            </Text>
                                            <Text style={{ color: "#AEB8CA", fontSize: 12, marginLeft: "auto" }}>${t.pricePerMonth}/mo</Text>
                                        </View>

                                        <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                                            <TouchableOpacity
                                                activeOpacity={0.9}
                                                style={[styles.btnOutline, { flex: 1, height: 42 }]}
                                                onPress={() => router.push(`/userTabs/trainer/${t.id}`)}
                                            >
                                                <Text style={{ color: "white", fontWeight: "900", fontSize: 12 }}>Profile</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                activeOpacity={0.9}
                                                style={[styles.btnSolid, { flex: 1, height: 42 }]}
                                                onPress={() => router.push({ pathname: "/userTabs/trainer/hire", params: { id: t.id } })}
                                            >
                                                <Text style={{ color: "white", fontWeight: "900", fontSize: 12 }}>Hire</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

function Stars({ rating }: { rating: number }) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;

    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            {Array.from({ length: 5 }).map((_, i) => {
                const idx = i + 1;
                const name = idx <= full ? "star" : idx === full + 1 && half ? "star-half" : "star-outline";
                return <Ionicons key={i} name={name as any} size={14} color="#FFD166" />;
            })}
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
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 16,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        backgroundColor: CARD2,
        borderWidth: 1,
        borderColor: BORDER,
    },
    hello: { color: ACCENT, fontWeight: "900" as const, fontSize: 18 },
    welcome: { color: MUTED, marginTop: 2, fontSize: 12 },

    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 16,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        backgroundColor: CARD2,
        borderWidth: 1,
        borderColor: BORDER,
    },

    searchBox: {
        marginTop: 14,
        height: 52,
        borderRadius: 16,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        paddingHorizontal: 12,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        color: "white",
        fontWeight: "700" as const,
    },

    chip: {
        height: 36,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        alignItems: "center" as const,
        justifyContent: "center" as const,
    },

    sectionTitle: {
        color: ACCENT,
        fontWeight: "900" as const,
        marginTop: 6,
        marginBottom: 8,
    },

    card: {
        padding: 14,
        borderRadius: 18,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
    },
    cardTitle: { color: "#AEB8CA", fontWeight: "900" as const, fontSize: 12, letterSpacing: 0.6 },

    pillTiny: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 6,
        paddingHorizontal: 10,
        height: 32,
        borderRadius: 999,
        backgroundColor: CARD2,
        borderWidth: 1,
        borderColor: BORDER,
    },

    avatarBig: {
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

    listCard: {
        padding: 12,
        borderRadius: 18,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
    },

    avatarSm: {
        width: 64,
        height: 64,
        borderRadius: 18,
        overflow: "hidden" as const,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: "#E6E6E6",
    },
    onlineDot: {
        position: "absolute" as const,
        width: 10,
        height: 10,
        borderRadius: 999,
        backgroundColor: "#22C55E",
        borderWidth: 2,
        borderColor: CARD,
        right: 6,
        bottom: 6,
    },
};