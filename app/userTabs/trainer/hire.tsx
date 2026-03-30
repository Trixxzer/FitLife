import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

const BG = "#0B0F1A";
const CARD = "#111A2C";
const CARD2 = "#0F1627";
const BORDER = "#1F2A44";
const ACCENT = "#FF4D2D";
const MUTED = "#9AA6BD";
const SUCCESS = "#22C55E";
const WARNING = "#F59E0B";
const DANGER = "#EF4444";

type TrainerInfo = {
  id: string;
  trainer_id?: string | null;
  full_name: string | null;
  specialty: string | null;
  monthly_rate: number | null;
};

type TrainerPackage = {
  id: string;
  trainer_id: string;
  title: string;
  description: string | null;
  price: number | null;
  duration_days: number | null;
  sessions_per_week: number | null;
  includes_diet: boolean | null;
  includes_workout: boolean | null;
  includes_chat_support: boolean | null;
  is_active: boolean | null;
  is_featured: boolean | null;
};

type TrainerRequest = {
  id: string;
  user_id: string;
  trainer_id: string;
  package_id: string | null;
  status: "pending" | "approved" | "declined";
  package_name: string | null;
  price_per_month: number | null;
  created_at: string | null;
};

type PaymentRow = {
  id: string;
  trainer_id: string | null;
  user_id: string | null;
  order_id: string;
  peripay_payment_id: string | null;
  product_name: string;
  amount: number;
  payment_gateway: string | null;
  payment_status: string | null;
  refunded?: boolean | null;
};

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function uniqueIds(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(Boolean) as string[])];
}

function formatMoney(value: number | null | undefined) {
  return `Rs. ${Number(value ?? 0)}`;
}

export default function HireTrainerPage() {
  const params = useLocalSearchParams();

  const trainerId = normalizeParam(
    (params.trainerId as string | string[] | undefined) ??
      (params.id as string | string[] | undefined),
  );

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [trainer, setTrainer] = useState<TrainerInfo | null>(null);
  const [packages, setPackages] = useState<TrainerPackage[]>([]);
  const [requests, setRequests] = useState<TrainerRequest[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const resolvedTrainerProfileId = useMemo(() => {
    return trainer?.trainer_id || trainerId || null;
  }, [trainer, trainerId]);

  const loadRequestsAndPayments = useCallback(
    async (currentUserId: string, currentTrainerProfileId: string) => {
      try {
        const { data: requestRows, error: requestError } = await supabase
          .from("trainer_requests")
          .select(
            `
            id,
            user_id,
            trainer_id,
            package_id,
            status,
            package_name,
            price_per_month,
            created_at
          `,
          )
          .eq("user_id", currentUserId)
          .eq("trainer_id", currentTrainerProfileId)
          .order("created_at", { ascending: false });

        if (requestError) throw requestError;
        setRequests((requestRows ?? []) as TrainerRequest[]);

        const { data: paymentRows, error: paymentError } = await supabase
          .from("payments")
          .select(
            `
            id,
            trainer_id,
            user_id,
            order_id,
            peripay_payment_id,
            product_name,
            amount,
            payment_gateway,
            payment_status,
            refunded
          `,
          )
          .eq("user_id", currentUserId)
          .eq("trainer_id", currentTrainerProfileId)
          .order("created_at", { ascending: false });

        if (paymentError) throw paymentError;
        setPayments((paymentRows ?? []) as PaymentRow[]);
      } catch (e) {
        console.log("[hire.tsx] loadRequestsAndPayments error:", e);
      }
    },
    [],
  );

  const loadData = useCallback(async () => {
    if (!trainerId) {
      setTrainer(null);
      setPackages([]);
      setRequests([]);
      setPayments([]);
      setError("No trainer id found.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      if (!user) {
        router.replace("/auth/Login");
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email ?? null);

      const { data: trainerRows, error: trainerError } = await supabase
        .from("trainer_profiles")
        .select("id, trainer_id, full_name, specialty, monthly_rate")
        .or(`id.eq.${trainerId},trainer_id.eq.${trainerId}`);

      if (trainerError) throw trainerError;

      const resolvedTrainer =
        trainerRows && trainerRows.length > 0
          ? (trainerRows[0] as TrainerInfo)
          : null;

      const possibleTrainerIds = uniqueIds([
        trainerId,
        resolvedTrainer?.id,
        resolvedTrainer?.trainer_id,
      ]);

      let packageRows: TrainerPackage[] = [];

      if (possibleTrainerIds.length > 0) {
        const { data: activePackages, error: packagesError } = await supabase
          .from("trainer_packages")
          .select(
            `
            id,
            trainer_id,
            title,
            description,
            price,
            duration_days,
            sessions_per_week,
            includes_diet,
            includes_workout,
            includes_chat_support,
            is_active,
            is_featured
          `,
          )
          .in("trainer_id", possibleTrainerIds)
          .eq("is_active", true)
          .order("is_featured", { ascending: false })
          .order("price", { ascending: true });

        if (packagesError) throw packagesError;
        packageRows = (activePackages ?? []) as TrainerPackage[];
      }

      setTrainer(resolvedTrainer);
      setPackages(packageRows);

      const finalTrainerProfileId =
        resolvedTrainer?.trainer_id || trainerId || null;

      if (finalTrainerProfileId) {
        await loadRequestsAndPayments(user.id, finalTrainerProfileId);
      }
    } catch (e: any) {
      console.log("[hire.tsx] loadData error:", e);
      setTrainer(null);
      setPackages([]);
      setRequests([]);
      setPayments([]);
      setError(e?.message || "Failed to load trainer packages.");
    } finally {
      setLoading(false);
    }
  }, [trainerId, loadRequestsAndPayments]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function getRequestForPackage(packageId: string) {
    return (
      requests.find(
        (r) =>
          r.package_id === packageId &&
          (r.status === "pending" || r.status === "approved"),
      ) || null
    );
  }

  function getPaymentForPackage(pkg: TrainerPackage) {
    const priceInPaisa = Math.round(Number(pkg.price ?? 0) * 100);

    return (
      payments.find(
        (p) =>
          p.product_name === pkg.title &&
          Number(p.amount ?? 0) === priceInPaisa &&
          p.payment_status !== "failed",
      ) || null
    );
  }

  async function refreshRequestsAndPayments() {
    if (!userId || !resolvedTrainerProfileId) return;
    await loadRequestsAndPayments(userId, resolvedTrainerProfileId);
  }

  function confirmRequest(pkg: TrainerPackage) {
    Alert.alert(
      "Request Package",
      `Are you sure you want to request "${pkg.title}" from ${
        trainer?.full_name || "this trainer"
      }?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Request",
          onPress: () => handleRequestPackage(pkg),
        },
      ],
    );
  }

  async function handleRequestPackage(pkg: TrainerPackage) {
    if (!userId || !resolvedTrainerProfileId) {
      Alert.alert("Error", "User or trainer not found.");
      return;
    }

    try {
      setActionLoadingId(pkg.id);

      const existingRequest = getRequestForPackage(pkg.id);
      if (existingRequest) {
        Alert.alert("Already Requested", "You already requested this package.");
        return;
      }

      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, goal_type")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.log("[hire.tsx] profile fetch error:", profileError);
      }

      const insertPayload = {
        user_id: userId,
        trainer_id: resolvedTrainerProfileId,
        package_id: pkg.id,
        status: "pending",
        user_name: profileRow?.first_name ?? null,
        user_goal: profileRow?.goal_type ?? null,
        package_name: pkg.title,
        price_per_month: Number(pkg.price ?? 0),
      };

      const { error: insertError } = await supabase
        .from("trainer_requests")
        .insert(insertPayload);

      if (insertError) throw insertError;

      Alert.alert(
        "Request Sent",
        "Your package request has been sent to the trainer for approval.",
      );

      await refreshRequestsAndPayments();
    } catch (e: any) {
      console.log("[hire.tsx] handleRequestPackage error:", e);
      Alert.alert("Error", e?.message || "Failed to request package.");
    } finally {
      setActionLoadingId(null);
    }
  }

  function confirmRemoveRequest(pkg: TrainerPackage, requestId: string) {
    Alert.alert(
      "Remove Request",
      `Do you want to remove your request for "${pkg.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => handleRemoveRequest(pkg.id, requestId),
        },
      ],
    );
  }

  async function handleRemoveRequest(packageId: string, requestId: string) {
    try {
      setActionLoadingId(packageId);

      const { error: deleteError } = await supabase
        .from("trainer_requests")
        .delete()
        .eq("id", requestId);

      if (deleteError) throw deleteError;

      Alert.alert("Removed", "Your request has been removed.");
      await refreshRequestsAndPayments();
    } catch (e: any) {
      console.log("[hire.tsx] handleRemoveRequest error:", e);
      Alert.alert("Error", e?.message || "Failed to remove request.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handlePay(pkg: TrainerPackage) {
    try {
      setActionLoadingId(pkg.id);

      if (!userId || !resolvedTrainerProfileId) {
        throw new Error("User or trainer missing.");
      }

      const amount = Number(pkg.price);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Invalid package amount.");
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", userId)
        .single();

      if (profileErr) throw profileErr;

      const phone = String(profile?.phone || "").trim();
      if (!phone) {
        throw new Error("Please add phone number in settings first.");
      }

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error("Please log in again.");
      }

      const { data: result, error: fnError } = await supabase.functions.invoke(
        "esewa-init",
        {
          body: {
            trainer_id: resolvedTrainerProfileId,
            package_id: pkg.id,
            amount,
            trainer_name: trainer?.full_name || pkg.title || "Trainer",
            customer_phone: phone,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (fnError) {
        try {
          const errBody = await fnError.context.json();
          console.log("esewa-init error body:", errBody);
          throw new Error(errBody?.error || JSON.stringify(errBody));
        } catch {
          throw new Error(
            fnError.message || "Failed to initiate eSewa payment",
          );
        }
      }

      const fields = result?.fields;
      if (!fields) {
        throw new Error("eSewa fields missing.");
      }
      router.push({
        pathname: "../../../esewa-pay",
        params: {
          amount: fields.amount,
          tax_amount: fields.tax_amount,
          total_amount: fields.total_amount,
          transaction_uuid: fields.transaction_uuid,
          product_code: fields.product_code,
          product_service_charge: fields.product_service_charge,
          product_delivery_charge: fields.product_delivery_charge,
          success_url: fields.success_url,
          failure_url: fields.failure_url,
          signed_field_names: fields.signed_field_names,
          signature: fields.signature,
        },
      });
    } catch (e: any) {
      Alert.alert(
        "Payment Error",
        e?.message || "Could not start eSewa payment.",
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  function renderActionButtons(pkg: TrainerPackage) {
    const request = getRequestForPackage(pkg.id);
    const payment = getPaymentForPackage(pkg);
    const isBusy = actionLoadingId === pkg.id;

    if (!request) {
      return (
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.selectBtn}
          onPress={() => confirmRequest(pkg)}
          disabled={isBusy}
        >
          {isBusy ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.selectBtnText}>Request Package</Text>
          )}
        </TouchableOpacity>
      );
    }

    if (request.status === "pending") {
      return (
        <View style={{ marginTop: 14, gap: 10 }}>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: "rgba(245,158,11,0.15)",
                borderColor: "rgba(245,158,11,0.35)",
              },
            ]}
          >
            <Text style={[styles.statusPillText, { color: WARNING }]}>
              Requested - Waiting for trainer approval
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.secondaryBtn, { borderColor: DANGER }]}
            onPress={() => confirmRemoveRequest(pkg, request.id)}
            disabled={isBusy}
          >
            {isBusy ? (
              <ActivityIndicator color={DANGER} />
            ) : (
              <Text style={[styles.secondaryBtnText, { color: DANGER }]}>
                Remove Request
              </Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    if (request.status === "approved") {
      if (payment?.payment_status === "completed") {
        return (
          <View style={{ marginTop: 14, gap: 10 }}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: "rgba(34,197,94,0.15)",
                  borderColor: "rgba(34,197,94,0.35)",
                },
              ]}
            >
              <Text style={[styles.statusPillText, { color: SUCCESS }]}>
                Payment Completed
              </Text>
            </View>
          </View>
        );
      }
      return (
        <View style={{ marginTop: 14, gap: 10 }}>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: "rgba(34,197,94,0.15)",
                borderColor: "rgba(34,197,94,0.35)",
              },
            ]}
          >
            <Text style={[styles.statusPillText, { color: SUCCESS }]}>
              Approved by trainer
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.selectBtn}
            onPress={() => handlePay(pkg)}
            disabled={isBusy}
          >
            {isBusy ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.selectBtnText}>
                {payment ? "Continue Payment" : "Pay"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: BG,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerCard}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back-outline" size={22} color="white" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {trainer?.full_name || "Trainer Packages"}
          </Text>
          <Text style={styles.subtitle}>
            Request package, wait for approval, then pay
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.emptyCard}>
          <Text style={{ color: "#ffb4a8", fontWeight: "800" }}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryName}>
          {trainer?.full_name || "Trainer"}
        </Text>
        <Text style={styles.summaryMeta}>
          {trainer?.specialty || "General Fitness"}
        </Text>
        <Text style={styles.summaryPrice}>
          Starting from {formatMoney(trainer?.monthly_rate)}/mo
        </Text>
      </View>

      <View style={{ marginTop: 14 }}>
        <Text style={styles.sectionTitle}>All Packages</Text>

        {packages.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ color: MUTED, fontWeight: "800" }}>
              No packages available.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {packages.map((pkg) => (
              <View key={pkg.id} style={styles.packageCard}>
                <View style={styles.badgeRow}>
                  <Text style={styles.packageTitle}>{pkg.title}</Text>
                  {pkg.is_featured ? (
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredBadgeText}>Featured</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.packageDesc}>
                  {pkg.description || "No description available."}
                </Text>

                <Text style={styles.priceText}>{formatMoney(pkg.price)}</Text>

                <View style={{ marginTop: 10, gap: 6 }}>
                  <Text style={styles.infoText}>
                    Duration: {pkg.duration_days ?? 0} days
                  </Text>
                  <Text style={styles.infoText}>
                    Sessions/week: {pkg.sessions_per_week ?? 0}
                  </Text>
                  <Text style={styles.infoText}>
                    Diet: {pkg.includes_diet ? "Included" : "Not included"}
                  </Text>
                  <Text style={styles.infoText}>
                    Workout:{" "}
                    {pkg.includes_workout ? "Included" : "Not included"}
                  </Text>
                  <Text style={styles.infoText}>
                    Chat Support:{" "}
                    {pkg.includes_chat_support ? "Included" : "Not included"}
                  </Text>
                </View>

                {renderActionButtons(pkg)}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
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
  title: {
    color: "white",
    fontWeight: "900" as const,
    fontSize: 18,
  },
  subtitle: {
    color: MUTED,
    marginTop: 2,
    fontSize: 12,
  },
  summaryCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  summaryName: {
    color: "white",
    fontWeight: "900" as const,
    fontSize: 18,
  },
  summaryMeta: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
  },
  summaryPrice: {
    color: ACCENT,
    fontWeight: "900" as const,
    marginTop: 8,
    fontSize: 14,
  },
  sectionTitle: {
    color: ACCENT,
    fontWeight: "900" as const,
    marginBottom: 8,
  },
  packageCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  badgeRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 10,
  },
  packageTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "900" as const,
    flex: 1,
  },
  featuredBadge: {
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 999,
    backgroundColor: "rgba(255,77,45,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,77,45,0.35)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  featuredBadgeText: {
    color: "#FFD3CA",
    fontWeight: "900" as const,
    fontSize: 11,
  },
  packageDesc: {
    color: "#AEB8CA",
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  priceText: {
    color: "white",
    fontSize: 22,
    fontWeight: "900" as const,
    marginTop: 12,
  },
  infoText: {
    color: MUTED,
    fontSize: 13,
  },
  selectBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 16,
    backgroundColor: ACCENT,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  selectBtnText: {
    color: "white",
    fontWeight: "900" as const,
  },
  secondaryBtn: {
    height: 46,
    borderRadius: 16,
    backgroundColor: "transparent",
    borderWidth: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  secondaryBtnText: {
    fontWeight: "900" as const,
  },
  statusPill: {
    minHeight: 40,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center" as const,
  },
  statusPillText: {
    fontWeight: "800" as const,
    fontSize: 12,
  },
  emptyCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center" as const,
  },
};
