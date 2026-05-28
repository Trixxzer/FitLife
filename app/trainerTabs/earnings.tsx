import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { useResponsiveLayout } from "../../lib/useResponsiveLayout";

const BG = "#0B0F1A";
const CARD = "#111A2C";
const CARD2 = "#0F1627";
const BORDER = "#1F2A44";
const MUTED = "#9AA6BD";

type PaymentRow = {
  id: string;
  order_id: string;
  product_name: string;
  amount: number;
  payment_gateway: string | null;
  payment_status: string | null;
  refunded: boolean | null;
  created_at: string;
};

export default function Earnings() {
  const { contentContainerStyle } = useResponsiveLayout({ paddingTop: 20, paddingBottom: 24 });
  const [loading, setLoading] = useState(true);
  const [monthTotal, setMonthTotal] = useState(0);
  const [activeClients, setActiveClients] = useState(0);
  const [paymentCount, setPaymentCount] = useState(0);
  const [transactions, setTransactions] = useState<PaymentRow[]>([]);
  const [lastMethod, setLastMethod] = useState("—");
  const [payoutLabel, setPayoutLabel] = useState("—");

  const loadEarnings = useCallback(async () => {
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      if (!user) return;

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: paymentRows, error: paymentErr } = await supabase
        .from("payments")
        .select(
          "id, order_id, product_name, amount, payment_gateway, payment_status, refunded, created_at",
        )
        .eq("trainer_id", user.id)
        .order("created_at", { ascending: false });

      if (paymentErr) throw paymentErr;

      const allPayments: PaymentRow[] = (paymentRows || []) as PaymentRow[];

      const successfulPayments = allPayments.filter(
        (x) =>
          !x.refunded &&
          ["success", "completed", "paid"].includes(
            String(x.payment_status || "").toLowerCase(),
          ),
      );

      setTransactions(successfulPayments.slice(0, 10));

      const monthlyPayments = successfulPayments.filter(
        (x) => new Date(x.created_at) >= monthStart,
      );

      const monthlyTotal = monthlyPayments.reduce(
        (sum, x) => sum + Number(x.amount || 0),
        0,
      );

      setMonthTotal(monthlyTotal);
      setPaymentCount(monthlyPayments.length);

      const latestPayment = successfulPayments[0];
      setLastMethod(
        latestPayment?.payment_gateway
          ? String(latestPayment.payment_gateway).toUpperCase()
          : "—",
      );

      const pendingExists = allPayments.some(
        (x) =>
          !x.refunded &&
          ["pending", "initiated", "processing"].includes(
            String(x.payment_status || "").toLowerCase(),
          ),
      );

      setPayoutLabel(pendingExists ? "Pending" : "Settled");

      const { count, error: countErr } = await supabase
        .from("user_trainers")
        .select("*", { count: "exact", head: true })
        .eq("trainer_id", user.id)
        .eq("status", "approved");

      if (countErr) throw countErr;

      setActiveClients(count || 0);
    } catch (e) {
      console.log("Earnings load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadEarnings();
    }, [loadEarnings]),
  );

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
        <ActivityIndicator color="#FF4D2D" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Earnings</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>THIS MONTH</Text>
          <Text
            style={{
              color: "white",
              fontWeight: "900",
              fontSize: 28,
              marginTop: 10,
            }}
          >
            रु {monthTotal.toFixed(3)}
          </Text>
          <Text style={{ color: MUTED, marginTop: 4 }}>
            {paymentCount} payments • {activeClients} active clients
          </Text>

          <View style={styles.divider} />

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            {/* <Mini icon="wallet-outline" label="Payout" value={payoutLabel} />
            <Mini icon="card-outline" label="Method" value={lastMethod} /> */}
          </View>
        </View>

        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.cardTitle}>RECENT TRANSACTIONS</Text>

          {transactions.length === 0 ? (
            <Text style={{ color: MUTED, marginTop: 12 }}>
              No transactions yet.
            </Text>
          ) : (
            transactions.map((tx) => (
              <Tx
                key={tx.id}
                title={tx.product_name || tx.order_id}
                value={`+ रु ${Number(tx.amount).toFixed(3)}`}
                sub={`${String(tx.payment_status || "").toUpperCase()}${
                  tx.payment_gateway
                    ? ` • ${String(tx.payment_gateway).toUpperCase()}`
                    : ""
                }`}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Mini({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Ionicons name={icon as any} size={16} color={MUTED} />
      <Text style={{ color: MUTED, fontSize: 12 }}>{label}:</Text>
      <Text style={{ color: "white", fontWeight: "900", fontSize: 12 }}>
        {value}
      </Text>
    </View>
  );
}

function Tx({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <View style={styles.tx}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={{ color: "white", fontWeight: "800" }} numberOfLines={1}>
          {title}
        </Text>
        <Text
          style={{ color: MUTED, fontSize: 12, marginTop: 3 }}
          numberOfLines={1}
        >
          {sub}
        </Text>
      </View>
      <Text style={{ color: "#7FF2C6", fontWeight: "900" }}>{value}</Text>
    </View>
  );
}

const styles = {
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "900" as const,
    marginTop: 40,
    marginBottom: 14,
  },
  card: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardTitle: {
    color: "#AEB8CA",
    fontWeight: "900" as const,
    fontSize: 12,
    letterSpacing: 0.6,
  },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 12 },
  tx: {
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD2,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
};
