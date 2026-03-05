import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";


const ORANGE = "#FF4D2D";
const BG = "#0B0F1A";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

export default function TrainerHome() {
    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Trainer</Text>
                <Text style={styles.sub}>Find, hire, and manage your coaching.</Text>

                <Card
                    icon="people-outline"
                    title="Browse Trainers"
                    desc="Search by specialty, price, and location"
                    onPress={() => router.push("/userTabs/trainer/browse")}
                />

                <Card
                    icon="paper-plane-outline"
                    title="Requests"
                    desc="View pending/approved/declined requests"
                    onPress={() => router.push("/userTabs/trainer/requests")}
                />

                <Card
                    icon="person-circle-outline"
                    title="My Trainer"
                    desc="Your active trainer + next session + progress"
                    onPress={() => router.push("/userTabs/trainer/my-trainer")}
                />

                <Card
                    icon="chatbubble-ellipses-outline"
                    title="Chats"
                    desc="Message your trainer (add later)"
                    onPress={() => { }}
                />
            </ScrollView>
        </View>
    );
}

function Card({ icon, title, desc, onPress }: any) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
            <Ionicons name={icon} size={24} color={ORANGE} />
            <View style={{ marginLeft: 14, flex: 1 }}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardDesc}>{desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={MUTED} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    title: { color: "white", fontSize: 28, fontWeight: "900", marginTop: 40, marginBottom: 6 },
    sub: { color: MUTED, marginBottom: 18 },
    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 18,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        marginBottom: 14,
    },
    cardTitle: { color: "white", fontWeight: "900", fontSize: 16 },
    cardDesc: { color: MUTED, marginTop: 4 },
});