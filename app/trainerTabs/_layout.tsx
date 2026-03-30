import { Ionicons } from "@expo/vector-icons";
<<<<<<< HEAD
import { Tabs } from "expo-router";
import React from "react";
=======
import { router, Tabs, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "../../lib/supabase";
>>>>>>> e8600b5 (payment added)

const ORANGE = "#FF4D2D";
const MUTED = "#9AA6BD";
const BG = "#0B0F1A";

export default function TrainerTabsLayout() {
<<<<<<< HEAD
=======
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState(false);
  const [checked, setChecked] = useState(false);

  const checkAccess = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;

      if (!user) {
        setApproved(false);
        router.replace("/auth/Login");
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("role, trainer_approved")
        .eq("id", user.id)
        .maybeSingle();

      if (profileErr) throw profileErr;

      const isTrainer = profile?.role === "TRAINER";
      const isApproved = isTrainer && Boolean(profile?.trainer_approved);

      setApproved(isApproved);

      if (!isTrainer) {
        router.replace("/auth/Login");
        return;
      }

      // Only redirect to pending if not approved on initial check
      if (!isApproved && !checked) {
        router.replace("/trainerTabs/pending");
      }

      setChecked(true);
    } catch {
      router.replace("/auth/Login");
    } finally {
      setLoading(false);
    }
  }, [checked]);

  useFocusEffect(
    useCallback(() => {
      if (!checked) {
        checkAccess();
      }
    }, [checkAccess, checked]),
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
        <ActivityIndicator color={ORANGE} />
      </View>
    );
  }

>>>>>>> e8600b5 (payment added)
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: BG,
          borderTopColor: "#1F2A44",
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: ORANGE,
        tabBarInactiveTintColor: MUTED,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: "Clients",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="setting"
        options={{
<<<<<<< HEAD
=======
          href: approved ? "/trainerTabs/setting/settings" : null,
>>>>>>> e8600b5 (payment added)
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
