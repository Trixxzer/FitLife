import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";
import { useResponsiveLayout } from "../../../lib/useResponsiveLayout";

type TrainerProfile = {
  id: string;
  user_id: string | null;
  trainer_id: string | null;
  full_name: string | null;
  bio: string | null;
  specialty: string | null;
  experience_years: number | null;
  certifications: string | null;
  location: string | null;
  is_available: boolean | null;
  is_online: boolean | null;
  profile_image_url: string | null;
  photo_path: string | null;
  cert_title: string | null;
  cert_issuer: string | null;
  cert_year: number | null;
  contact_number: string | null;
};

type TrainerPackageLite = {
  id: string;
  is_active: boolean;
  is_featured: boolean;
};

function Item({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.item}
    >
      <Ionicons name={icon} size={20} color="#FF4D2D" />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.itemTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.itemSub}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9AA6BD" />
    </TouchableOpacity>
  );
}

export default function TrainerSettings() {
  const { contentContainerStyle } = useResponsiveLayout({ paddingTop: 40, paddingBottom: 24 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);

  const [trainerProfile, setTrainerProfile] = useState<TrainerProfile | null>(
    null,
  );
  const [packageCount, setPackageCount] = useState(0);
  const [featuredCount, setFeaturedCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  const [phone, setPhone] = useState("");
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);

  useEffect(() => {
    loadTrainerData();
  }, []);

  const loadTrainerData = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;

      if (!user) {
        Alert.alert("Not logged in", "Please log in first.");
        router.replace("/auth/Login");
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("trainer_profiles")
        .select(
          `
            id,
            user_id,
            trainer_id,
            full_name,
            bio,
            specialty,
            experience_years,
            certifications,
            location,
            is_available,
            is_online,
            profile_image_url,
            photo_path,
            cert_title,
            cert_issuer,
            cert_year,
            contact_number
          `,
        )
        .or(`user_id.eq.${user.id},trainer_id.eq.${user.id}`)
        .maybeSingle();

      if (profileErr) throw profileErr;

      const trainerData = (profile as TrainerProfile | null) ?? null;
      setTrainerProfile(trainerData);
      setPhone(trainerData?.contact_number ?? "");

      const resolvedTrainerId =
        trainerData?.trainer_id || trainerData?.user_id || user.id;

      const { data: packages, error: packagesErr } = await supabase
        .from("trainer_packages")
        .select("id,is_active,is_featured")
        .eq("trainer_id", resolvedTrainerId);

      if (packagesErr) throw packagesErr;

      const packageRows = (packages || []) as TrainerPackageLite[];
      setPackageCount(packageRows.length);
      setActiveCount(packageRows.filter((p) => p.is_active).length);
      setFeaturedCount(packageRows.filter((p) => p.is_featured).length);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load trainer settings.");
    } finally {
      setLoading(false);
    }
  };

  const savePhoneNumber = async () => {
    try {
      setSavingPhone(true);

      const cleanPhone = phone.trim();

      if (!cleanPhone) {
        Alert.alert("Phone required", "Please enter a phone number.");
        return;
      }

      if (cleanPhone.length < 7) {
        Alert.alert("Invalid phone", "Please enter a valid phone number.");
        return;
      }

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      if (!user) throw new Error("No authenticated user found.");

      const { error: trainerUpdateError } = await supabase
        .from("trainer_profiles")
        .update({
          contact_number: cleanPhone,
        })
        .or(`user_id.eq.${user.id},trainer_id.eq.${user.id}`);

      if (trainerUpdateError) throw trainerUpdateError;

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          phone: cleanPhone,
        })
        .eq("id", user.id);

      if (profileUpdateError) throw profileUpdateError;

      setTrainerProfile((prev) =>
        prev ? { ...prev, contact_number: cleanPhone } : prev,
      );

      setPhoneModalVisible(false);
      Alert.alert("Success", "Phone number updated successfully.");
    } catch (e: any) {
      Alert.alert(
        "Failed to save phone number",
        e?.message || "Please try again.",
      );
    } finally {
      setSavingPhone(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadTrainerData();
    } catch (e: any) {
      Alert.alert("Refresh failed", e?.message || "Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Logout failed", error.message);
    else router.replace("/auth/Login");
  };

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#FF4D2D" />
        <Text style={styles.loaderText}>Loading trainer settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF4D2D"
          />
        }
      >
        <Text style={styles.title}>Trainer Settings</Text>

        <View style={styles.profileCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>
              {trainerProfile?.full_name || "Trainer"}
            </Text>
            <Text style={styles.profileMeta}>
              {trainerProfile?.specialty || "No specialty added"}
            </Text>
            <Text style={styles.profileMeta}>
              {trainerProfile?.location || "Location not set"}
            </Text>
            <Text style={styles.profileMeta}>
              {trainerProfile?.contact_number || "No phone number found"}
            </Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: trainerProfile?.is_available
                    ? "rgba(47,165,100,0.18)"
                    : "rgba(255,173,51,0.16)",
                  borderColor: trainerProfile?.is_available
                    ? "#2FA564"
                    : "#FFAD33",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  {
                    color: trainerProfile?.is_available ? "#9FF0B6" : "#FFD59A",
                  },
                ]}
              >
                {trainerProfile?.is_available ? "Available" : "Unavailable"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{packageCount}</Text>
            <Text style={styles.summaryLabel}>Packages</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{activeCount}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{featuredCount}</Text>
            <Text style={styles.summaryLabel}>Featured</Text>
          </View>
        </View>

        <Text style={styles.section}>Trainer Profile</Text>
        {/* <Item
          icon="person-outline"
          title="Edit Profile"
          subtitle={
            trainerProfile?.bio
              ? "Update bio, experience and certifications"
              : "Complete your trainer details"
          }
          onPress={() =>
            router.push("/trainerTabs/settings/edit-profile" as any)
          }
        /> */}
        <Item
          icon="call-outline"
          title="Add Phone Number"
          subtitle={trainerProfile?.contact_number || "No phone number found"}
          onPress={() => setPhoneModalVisible(true)}
        />
        {/* <Item
          icon="camera-outline"
          title="Change Photo"
          subtitle={
            trainerProfile?.photo_path || trainerProfile?.profile_image_url
              ? "Update your profile photo"
              : "Add your trainer photo"
          }
          onPress={() =>
            router.push("/trainerTabs/settings/edit-profile" as any)
          }
        /> */}

        <Text style={styles.section}>Business</Text>
        <Item
          icon="cash-outline"
          title="Pricing & Packages"
          subtitle={`${packageCount} package${
            packageCount === 1 ? "" : "s"
          } created`}
          onPress={() => router.push("/trainerTabs/setting/packages" as any)}
        />
        {/* <Item
          icon="calendar-outline"
          title="Availability"
          subtitle={
            trainerProfile?.is_available
              ? "You are currently available"
              : "You are currently unavailable"
          }
          onPress={() =>
            Alert.alert(
              "Next Step",
              "We can connect availability editing after packages.",
            )
          }
        /> */}

        <Text style={styles.section}>Support</Text>
        <Item
          icon="help-circle-outline"
          title="Help Center"
          onPress={() => Alert.alert("Help", "Coming soon")}
        />
        <Item
          icon="mail-outline"
          title="Contact Support"
          onPress={() => Alert.alert("Support", "Coming soon")}
        />

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.logoutBtn}
          onPress={() =>
            Alert.alert("Logout?", "You will be signed out.", [
              { text: "Cancel", style: "cancel" },
              { text: "Logout", style: "destructive", onPress: logout },
            ])
          }
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal
        visible={phoneModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhoneModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Phone Number</Text>
            <Text style={styles.modalSub}>
              This will update both your trainer contact number and account
              phone number.
            </Text>

            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              placeholderTextColor="#7F8BA3"
              keyboardType="phone-pad"
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPhoneModalVisible(false)}
                disabled={savingPhone}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={savePhoneNumber}
                disabled={savingPhone}
              >
                {savingPhone ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B0F1A" },
  container: {},
  loaderWrap: {
    flex: 1,
    backgroundColor: "#0B0F1A",
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    color: "#9AA6BD",
    marginTop: 10,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 40,
    marginBottom: 18,
  },
  profileCard: {
    borderRadius: 18,
    backgroundColor: "#111A2C",
    borderWidth: 1,
    borderColor: "#1F2A44",
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  profileName: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },
  profileMeta: {
    color: "#9AA6BD",
    marginTop: 4,
    fontSize: 13,
  },
  statusPill: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPillText: {
    fontWeight: "900",
    fontSize: 12,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  summaryBox: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#111A2C",
    borderWidth: 1,
    borderColor: "#1F2A44",
    paddingVertical: 16,
    alignItems: "center",
  },
  summaryValue: {
    color: "#FF4D2D",
    fontWeight: "900",
    fontSize: 22,
  },
  summaryLabel: {
    color: "#9AA6BD",
    marginTop: 4,
    fontSize: 12,
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
  itemTitle: { color: "white", fontWeight: "900" },
  itemSub: { color: "#9AA6BD", fontSize: 12, marginTop: 2 },
  logoutBtn: {
    marginTop: 26,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FF4D2D",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: { color: "white", fontWeight: "900", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#0F1627",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1F2A44",
    padding: 18,
  },
  modalTitle: {
    color: "white",
    fontWeight: "900",
    fontSize: 18,
  },
  modalSub: {
    color: "#9AA6BD",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 19,
  },
  input: {
    marginTop: 16,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1F2A44",
    backgroundColor: "#111A2C",
    paddingHorizontal: 14,
    color: "white",
    fontSize: 15,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A3550",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  cancelBtnText: {
    color: "#C7D0E0",
    fontWeight: "800",
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FF4D2D",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "white",
    fontWeight: "900",
  },
});
