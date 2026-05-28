import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../../lib/supabase";
import { useResponsiveLayout } from "../../../lib/useResponsiveLayout";

const ACCENT = "#FF4D2D";
const BG = "#0B0F1A";
const CARD = "#111A2C";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

type TrainerPackage = {
  id: string;
  trainer_id: string;
  title: string;
  description: string | null;
  price: number;
  duration_days: number;
  sessions_per_week: number | null;
  includes_diet: boolean;
  includes_workout: boolean;
  includes_chat_support: boolean;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

type TrainerProfileLite = {
  id: string;
  trainer_id: string | null;
  user_id: string | null;
};

function formatNPR(value: number | string | null | undefined) {
  const num = Number(value || 0);
  return `रु ${num.toLocaleString("en-IN")}`;
}

function FeatureChip({ text, active }: { text: string; active: boolean }) {
  return (
    <View
      style={[
        styles.featureChip,
        {
          backgroundColor: active
            ? "rgba(255,77,45,0.12)"
            : "rgba(255,255,255,0.04)",
          borderColor: active ? ACCENT : BORDER,
        },
      ]}
    >
      <Text
        style={{
          color: active ? "#FFD3CA" : MUTED,
          fontSize: 12,
          fontWeight: "800",
        }}
      >
        {text}
      </Text>
    </View>
  );
}

export default function TrainerPackagesPage() {
  const { contentContainerStyle } = useResponsiveLayout({ paddingTop: 20, paddingBottom: 24 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [trainerKey, setTrainerKey] = useState<string | null>(null);
  const [packages, setPackages] = useState<TrainerPackage[]>([]);

  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [sessionsPerWeek, setSessionsPerWeek] = useState("");
  const [includesDiet, setIncludesDiet] = useState(false);
  const [includesWorkout, setIncludesWorkout] = useState(true);
  const [includesChatSupport, setIncludesChatSupport] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      if (!user) {
        Alert.alert("Not logged in", "Please log in first.");
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("trainer_profiles")
        .select("id, trainer_id, user_id")
        .or(`user_id.eq.${user.id},trainer_id.eq.${user.id}`)
        .maybeSingle();

      if (profileErr) throw profileErr;

      const resolvedTrainerKey =
        profile?.trainer_id || profile?.user_id || profile?.id || user.id;

      console.log("auth user.id:", user.id);
      console.log("trainer profile:", profile);
      console.log("resolvedTrainerKey:", resolvedTrainerKey);

      setTrainerKey(resolvedTrainerKey);

      await loadPackages(resolvedTrainerKey);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load packages.");
    } finally {
      setLoading(false);
    }
  }

  async function loadPackages(key?: string | null) {
    const resolvedKey = key || trainerKey;
    if (!resolvedKey) return;

    console.log("loading packages for trainer_id:", resolvedKey);

    const { data, error } = await supabase
      .from("trainer_packages")
      .select("*")
      .eq("trainer_id", resolvedKey)
      .order("created_at", { ascending: false });

    console.log("packages result:", data);
    console.log("packages error:", error);

    if (error) throw error;

    setPackages((data || []) as TrainerPackage[]);
  }

  async function onRefresh() {
    try {
      setRefreshing(true);
      await loadPackages();
    } catch (e: any) {
      Alert.alert("Refresh failed", e?.message || "Please try again.");
    } finally {
      setRefreshing(false);
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setPrice("");
    setDurationDays("");
    setSessionsPerWeek("");
    setIncludesDiet(false);
    setIncludesWorkout(true);
    setIncludesChatSupport(false);
    setIsFeatured(false);
    setIsActive(true);
  }

  async function createPackage() {
    if (!trainerKey) {
      Alert.alert("Missing trainer", "Could not identify trainer account.");
      return;
    }

    if (title.trim().length < 2) {
      Alert.alert("Invalid title", "Please enter a valid package title.");
      return;
    }

    const priceNum = Number(price);
    const durationNum = Number(durationDays);
    const sessionsNum = sessionsPerWeek ? Number(sessionsPerWeek) : null;

    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Invalid price", "Enter a valid package price in rupees.");
      return;
    }

    if (!durationDays || Number.isNaN(durationNum) || durationNum <= 0) {
      Alert.alert("Invalid duration", "Enter valid duration in days.");
      return;
    }

    if (
      sessionsPerWeek &&
      (Number.isNaN(Number(sessionsPerWeek)) || Number(sessionsPerWeek) < 0)
    ) {
      Alert.alert("Invalid sessions", "Sessions per week must be 0 or more.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        trainer_id: trainerKey,
        title: title.trim(),
        description: description.trim() || null,
        price: priceNum,
        duration_days: durationNum,
        sessions_per_week: sessionsNum,
        includes_diet: includesDiet,
        includes_workout: includesWorkout,
        includes_chat_support: includesChatSupport,
        is_active: isActive,
        is_featured: isFeatured,
      };

      const { error } = await supabase.from("trainer_packages").insert(payload);

      if (error) throw error;

      setShowModal(false);
      resetForm();
      await loadPackages();
      Alert.alert("Success", "Package created successfully.");
    } catch (e: any) {
      Alert.alert("Create failed", e?.message || "Could not create package.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: TrainerPackage) {
    try {
      const { error } = await supabase
        .from("trainer_packages")
        .update({
          is_active: !item.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) throw error;

      await loadPackages();
    } catch (e: any) {
      Alert.alert("Update failed", e?.message || "Could not update package.");
    }
  }

  async function toggleFeatured(item: TrainerPackage) {
    try {
      const { error } = await supabase
        .from("trainer_packages")
        .update({
          is_featured: !item.is_featured,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) throw error;

      await loadPackages();
    } catch (e: any) {
      Alert.alert("Update failed", e?.message || "Could not update package.");
    }
  }

  async function deletePackage(item: TrainerPackage) {
    Alert.alert(
      "Delete Package",
      `Are you sure you want to delete "${item.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("trainer_packages")
                .delete()
                .eq("id", item.id);

              if (error) throw error;

              await loadPackages();
              Alert.alert("Deleted", "Package removed successfully.");
            } catch (e: any) {
              Alert.alert(
                "Delete failed",
                e?.message || "Could not delete package.",
              );
            }
          },
        },
      ],
    );
  }

  const stats = useMemo(() => {
    return {
      total: packages.length,
      active: packages.filter((p) => p.is_active).length,
      featured: packages.filter((p) => p.is_featured).length,
      avgPrice:
        packages.length > 0
          ? Math.round(
              packages.reduce((sum, p) => sum + Number(p.price || 0), 0) /
                packages.length,
            )
          : 0,
    };
  }, [packages]);

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={styles.loaderText}>Loading packages...</Text>
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
            tintColor={ACCENT}
          />
        }
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Packages & Pricing</Text>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.addBtn}
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subTitle}>Create your coaching plans.</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{stats.total}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{stats.active}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{stats.featured}</Text>
            <Text style={styles.summaryLabel}>Featured</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{formatNPR(stats.avgPrice)}</Text>
            <Text style={styles.summaryLabel}>Avg Price</Text>
          </View>
        </View>

        <View style={{ marginTop: 18, gap: 14 }}>
          {packages.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="cash-outline" size={34} color={ACCENT} />
              <Text style={styles.emptyTitle}>No packages yet</Text>
              <Text style={styles.emptyText}>
                Add your first training package so users can book you.
              </Text>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.primaryBtn}
                onPress={() => setShowModal(true)}
              >
                <Text style={styles.primaryBtnText}>Create First Package</Text>
              </TouchableOpacity>
            </View>
          ) : (
            packages.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardPrice}>
                      {formatNPR(item.price)}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end", gap: 8 }}>
                    {item.is_featured && (
                      <View style={styles.featuredBadge}>
                        <Text style={styles.featuredText}>Featured</Text>
                      </View>
                    )}
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: item.is_active
                            ? "rgba(47,165,100,0.18)"
                            : "rgba(255,77,77,0.16)",
                          borderColor: item.is_active ? "#2FA564" : "#FF6666",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: item.is_active ? "#9FF0B6" : "#FFB3B3" },
                        ]}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>
                </View>

                {!!item.description && (
                  <Text style={styles.desc}>{item.description}</Text>
                )}

                <View style={styles.metaRow}>
                  <View style={styles.metaBox}>
                    <Text style={styles.metaValue}>{item.duration_days}</Text>
                    <Text style={styles.metaLabel}>Days</Text>
                  </View>
                  <View style={styles.metaBox}>
                    <Text style={styles.metaValue}>
                      {item.sessions_per_week ?? 0}
                    </Text>
                    <Text style={styles.metaLabel}>Sessions/Week</Text>
                  </View>
                </View>

                <View style={styles.featuresWrap}>
                  <FeatureChip text="Diet Plan" active={item.includes_diet} />
                  <FeatureChip
                    text="Workout Plan"
                    active={item.includes_workout}
                  />
                  <FeatureChip
                    text="Chat Support"
                    active={item.includes_chat_support}
                  />
                </View>

                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.smallActionBtn}
                    onPress={() => toggleActive(item)}
                  >
                    <Ionicons
                      name={item.is_active ? "pause-outline" : "play-outline"}
                      size={16}
                      color="white"
                    />
                    <Text style={styles.smallActionText}>
                      {item.is_active ? "Deactivate" : "Activate"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.smallOutlineBtn}
                    onPress={() => toggleFeatured(item)}
                  >
                    <Ionicons name="star-outline" size={16} color={ACCENT} />
                    <Text style={styles.smallOutlineText}>
                      {item.is_featured ? "Unfeature" : "Feature"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.deleteBtn}
                    onPress={() => deletePackage(item)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF9A9A" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Package</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Package Title</Text>
              <TextInput
                placeholder="e.g. Fat Loss Starter"
                placeholderTextColor="#6B7690"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                placeholder="What does this package include?"
                placeholderTextColor="#6B7690"
                value={description}
                onChangeText={setDescription}
                style={[styles.input, { height: 90, textAlignVertical: "top" }]}
                multiline
              />

              <Text style={styles.inputLabel}>Price (NPR)</Text>
              <TextInput
                placeholder="e.g. 5000"
                placeholderTextColor="#6B7690"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Duration (days)</Text>
              <TextInput
                placeholder="e.g. 30"
                placeholderTextColor="#6B7690"
                value={durationDays}
                onChangeText={setDurationDays}
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Sessions Per Week</Text>
              <TextInput
                placeholder="e.g. 3"
                placeholderTextColor="#6B7690"
                value={sessionsPerWeek}
                onChangeText={setSessionsPerWeek}
                keyboardType="numeric"
                style={styles.input}
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Includes Diet</Text>
                <Switch
                  value={includesDiet}
                  onValueChange={setIncludesDiet}
                  trackColor={{ false: "#2A3248", true: ACCENT }}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Includes Workout</Text>
                <Switch
                  value={includesWorkout}
                  onValueChange={setIncludesWorkout}
                  trackColor={{ false: "#2A3248", true: ACCENT }}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Includes Chat Support</Text>
                <Switch
                  value={includesChatSupport}
                  onValueChange={setIncludesChatSupport}
                  trackColor={{ false: "#2A3248", true: ACCENT }}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Featured Package</Text>
                <Switch
                  value={isFeatured}
                  onValueChange={setIsFeatured}
                  trackColor={{ false: "#2A3248", true: ACCENT }}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Active</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: "#2A3248", true: ACCENT }}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.createBtn}
                onPress={createPackage}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.createBtnText}>Save Package</Text>
                )}
              </TouchableOpacity>

              <View style={{ height: 18 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {},
  loaderWrap: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    color: MUTED,
    marginTop: 10,
  },
  headerRow: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    flex: 1,
    paddingRight: 10,
  },
  subTitle: {
    color: MUTED,
    marginTop: 8,
    lineHeight: 20,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    marginTop: 18,
    borderRadius: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  summaryBox: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    color: ACCENT,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  summaryLabel: {
    color: MUTED,
    marginTop: 4,
    fontSize: 11,
    textAlign: "center",
  },
  emptyCard: {
    borderRadius: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 22,
    alignItems: "center",
  },
  emptyTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 12,
  },
  emptyText: {
    color: MUTED,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  primaryBtn: {
    marginTop: 16,
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "white",
    fontWeight: "900",
  },
  card: {
    borderRadius: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },
  cardPrice: {
    color: ACCENT,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6,
  },
  desc: {
    color: MUTED,
    marginTop: 10,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  metaBox: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 12,
    alignItems: "center",
  },
  metaValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },
  metaLabel: {
    color: MUTED,
    marginTop: 4,
    fontSize: 12,
  },
  featuresWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  featureChip: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontWeight: "900",
    fontSize: 12,
  },
  featuredBadge: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,215,0,0.12)",
    borderWidth: 1,
    borderColor: "#D4A937",
    alignItems: "center",
    justifyContent: "center",
  },
  featuredText: {
    color: "#FFD76A",
    fontWeight: "900",
    fontSize: 11,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  smallActionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  smallActionText: {
    color: "white",
    fontWeight: "900",
    fontSize: 13,
  },
  smallOutlineBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ACCENT,
    backgroundColor: "rgba(255,77,45,0.08)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  smallOutlineText: {
    color: ACCENT,
    fontWeight: "900",
    fontSize: 13,
  },
  deleteBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#6B2A2A",
    backgroundColor: "#3B1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: "90%",
    borderTopWidth: 1,
    borderColor: BORDER,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
  },
  inputLabel: {
    color: "white",
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
    borderRadius: 14,
    color: "white",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  switchRow: {
    marginTop: 14,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    color: "white",
    fontWeight: "800",
  },
  createBtn: {
    marginTop: 20,
    height: 54,
    borderRadius: 16,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },
});
