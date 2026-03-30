import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { supabase } from "../lib/supabase";

function decodeBase64Json(base64Str: string) {
  try {
    const json = atob(base64Str);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function PaymentReturn() {
  const params = useLocalSearchParams();

  useEffect(() => {
    const run = async () => {
      try {
        console.log("payment-return params:", params);

        const dataParam = typeof params.data === "string" ? params.data : "";
        if (!dataParam) {
          Alert.alert("Payment", "No payment data received.");
          router.replace("/userTabs/trainer");
          return;
        }

        const decoded = decodeBase64Json(dataParam);
        console.log("decoded payment data:", decoded);

        if (!decoded?.transaction_uuid || !decoded?.total_amount) {
          Alert.alert("Payment", "Invalid payment response.");
          router.replace("/userTabs/trainer");
          return;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session?.access_token) {
          throw new Error("Missing session. Please log in again.");
        }

        const { data, error } = await supabase.functions.invoke(
          "esewa-verify",
          {
            body: {
              transaction_uuid: decoded.transaction_uuid,
              total_amount: decoded.total_amount,
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          },
        );

        if (error) {
          try {
            const errBody = await error.context.json();
            console.log("esewa-verify error body:", errBody);
            throw new Error(errBody?.error || JSON.stringify(errBody));
          } catch {
            throw new Error(error.message || "Verification failed.");
          }
        }

        console.log("esewa-verify success:", data);
        Alert.alert("Success", "Payment completed successfully.");
        router.replace("/userTabs/trainer");
      } catch (e: any) {
        console.log("payment-return error:", e);
        Alert.alert("Payment Error", e?.message || "Could not verify payment.");
        router.replace("/userTabs/trainer");
      }
    };

    run();
  }, [params]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0B0F1A",
      }}
    >
      <ActivityIndicator size="large" color="#FF4D2D" />
    </View>
  );
}
