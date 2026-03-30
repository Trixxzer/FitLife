import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { supabase } from "../lib/supabase";

function esc(value: string) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function decodeBase64Json(base64Str: string) {
  try {
    const padded = base64Str + "=".repeat((4 - (base64Str.length % 4)) % 4);
    const json = globalThis.atob
      ? globalThis.atob(padded)
      : Buffer.from(padded, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function EsewaPayScreen() {
  const params = useLocalSearchParams();
  const handledRef = useRef(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  const html = useMemo(() => {
    const fields = {
      amount: esc(String(params.amount ?? "")),
      tax_amount: esc(String(params.tax_amount ?? "0")),
      total_amount: esc(String(params.total_amount ?? "")),
      transaction_uuid: esc(String(params.transaction_uuid ?? "")),
      product_code: esc(String(params.product_code ?? "")),
      product_service_charge: esc(String(params.product_service_charge ?? "0")),
      product_delivery_charge: esc(
        String(params.product_delivery_charge ?? "0"),
      ),
      success_url: esc("https://success.fitlife"),
      failure_url: esc("https://failure.fitlife"),
      signed_field_names: esc(String(params.signed_field_names ?? "")),
      signature: esc(String(params.signature ?? "")),
    };

    return `<!doctype html>
<html>
<body>
<form id="esewaForm" action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" method="POST">
<input type="hidden" name="amount" value="${fields.amount}" />
<input type="hidden" name="tax_amount" value="${fields.tax_amount}" />
<input type="hidden" name="total_amount" value="${fields.total_amount}" />
<input type="hidden" name="transaction_uuid" value="${fields.transaction_uuid}" />
<input type="hidden" name="product_code" value="${fields.product_code}" />
<input type="hidden" name="product_service_charge" value="${fields.product_service_charge}" />
<input type="hidden" name="product_delivery_charge" value="${fields.product_delivery_charge}" />
<input type="hidden" name="success_url" value="${fields.success_url}" />
<input type="hidden" name="failure_url" value="${fields.failure_url}" />
<input type="hidden" name="signed_field_names" value="${fields.signed_field_names}" />
<input type="hidden" name="signature" value="${fields.signature}" />
</form>
<script>document.getElementById("esewaForm").submit();</script>
</body>
</html>`;
  }, [params]);

  useEffect(() => {
    if (!successData || verifying) return;

    const runVerify = async () => {
      try {
        setVerifying(true);

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
              success_data: successData,
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
            throw new Error(error.message || "Verification failed");
          }
        }

        console.log("esewa-verify success:", data);
        Alert.alert("Success", "Payment completed successfully.");
        router.replace("/userTabs/trainer");
      } catch (e: any) {
        console.log("eSewa verify useEffect error:", e);
        Alert.alert("Payment Error", e?.message || "Could not verify payment.");
        router.replace("/userTabs/trainer");
      } finally {
        setVerifying(false);
      }
    };

    runVerify();
  }, [successData, verifying]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F1A" }}>
      <View
        style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 }}
      >
        <Text style={{ color: "white", fontSize: 20, fontWeight: "600" }}>
          Processing Payment
        </Text>
        <Text style={{ color: "#9AA6BD", marginTop: 4 }}>
          {verifying ? "Verifying payment..." : "Redirecting you to eSewa..."}
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          marginHorizontal: 16,
          marginBottom: 16,
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: "#fff",
        }}
      >
        <WebView
          originWhitelist={["*"]}
          source={{ html }}
          startInLoadingState
          onShouldStartLoadWithRequest={(request) => {
            const url = request.url;
            console.log("WebView URL:", url);

            if (url.startsWith("https://success.fitlife")) {
              if (!handledRef.current) {
                handledRef.current = true;
                const parsedUrl = new URL(url);
                const dataParam = parsedUrl.searchParams.get("data") || "";
                const decoded = decodeBase64Json(dataParam);
                console.log("eSewa success decoded:", decoded);
                setSuccessData(decoded);
              }
              return false;
            }

            if (url.startsWith("https://failure.fitlife")) {
              Alert.alert("Payment Failed");
              router.back();
              return false;
            }

            return true;
          }}
          renderLoading={() => (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#fff",
              }}
            >
              <ActivityIndicator size="large" color="#FF4D2D" />
              <Text style={{ marginTop: 10, color: "#333" }}>
                {verifying ? "Verifying payment..." : "Opening eSewa..."}
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}
