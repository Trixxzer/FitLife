import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";

type ItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
};

function Item({ icon, title, subtitle, onPress }: ItemProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.item}>
      <Ionicons name={icon} size={20} color="#FF4D2D" />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.itemTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.itemSub}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9AA6BD" />
    </TouchableOpacity>
  );
}

export default function Settings() {
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/auth/Login");
    } catch (e: any) {
      Alert.alert("Logout failed", e?.message ?? "Try again");
    }
  };

  const notReady = () => Alert.alert("Coming soon", "We’ll connect this screen next.");

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.title}>Settings</Text>

        {/* PROFILE */}
        <Text style={styles.section}>Profile</Text>
        <Item icon="person-outline" title="Edit Profile" subtitle="Name, bio, personal details" onPress={notReady} />
        <Item icon="camera-outline" title="Change Photo" subtitle="Update your avatar" onPress={notReady} />
        <Item icon="flag-outline" title="Goals & Targets" subtitle="Weight goal, activity goal" onPress={notReady} />
        <Item icon="scale-outline" title="Weight & Body Metrics" subtitle="Weight, height, measurements" onPress={notReady} />

        {/* FITNESS */}
        <Text style={styles.section}>Fitness Preferences</Text>
        <Item icon="barbell-outline" title="Workout Preferences" subtitle="Experience, focus areas" onPress={notReady} />
        <Item icon="restaurant-outline" title="Nutrition Settings" subtitle="Diet type, macros" onPress={notReady} />
        <Item icon="flame-outline" title="Calorie Targets" subtitle="Daily calories & macros" onPress={notReady} />
        <Item icon="speedometer-outline" title="Activity Level" subtitle="Sedentary, active, etc." onPress={notReady} />

        {/* APP */}
        <Text style={styles.section}>App Settings</Text>
        <Item icon="resize-outline" title="Units (kg/lb)" subtitle="Measurement preferences" onPress={notReady} />
        <Item icon="notifications-outline" title="Notifications" subtitle="Reminders & alerts" onPress={notReady} />
        <Item icon="moon-outline" title="Dark Mode" subtitle="Theme preference" onPress={notReady} />
        <Item icon="language-outline" title="Language" subtitle="App language" onPress={notReady} />

        {/* PRIVACY */}
        <Text style={styles.section}>Privacy & Security</Text>
        <Item icon="lock-closed-outline" title="Change Password" subtitle="Secure your account" onPress={notReady} />
        <Item icon="shield-checkmark-outline" title="Data & Privacy" subtitle="Manage your data" onPress={notReady} />
        <Item icon="download-outline" title="Export My Data" subtitle="Download your data" onPress={notReady} />

        {/* MEMBERSHIP */}
        <Text style={styles.section}>Membership</Text>
        <Item icon="card-outline" title="Subscription Plan" subtitle="View your plan" onPress={notReady} />
        <Item icon="star-outline" title="Upgrade to Pro" subtitle="Unlock premium features" onPress={notReady} />

        {/* SUPPORT */}
        <Text style={styles.section}>Support</Text>
        <Item icon="help-circle-outline" title="Help Center" subtitle="FAQs & guides" onPress={notReady} />
        <Item icon="mail-outline" title="Contact Support" subtitle="Report issues" onPress={notReady} />
        <Item icon="document-text-outline" title="Terms & Policies" subtitle="Legal information" onPress={notReady} />

        {/* LOGOUT */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.logoutBtn}
          onPress={() =>
            Alert.alert("Logout?", "You will be signed out of FitLife.", [
              { text: "Cancel", style: "cancel" },
              { text: "Logout", style: "destructive", onPress: logout },
            ])
          }
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0B0F1A",
  },
  container: {
    padding: 16,
    paddingBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 40,
    marginBottom: 18,
  },
  section: {
    color: "#FF4D2D",
    fontWeight: "900",
    marginTop: 18,
    marginBottom: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#0F1627",
    borderWidth: 1,
    borderColor: "#1F2A44",
    marginBottom: 10,
  },
  itemTitle: {
    color: "white",
    fontWeight: "900",
  },
  itemSub: {
    color: "#9AA6BD",
    fontSize: 12,
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: 26,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FF4D2D",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },
});
