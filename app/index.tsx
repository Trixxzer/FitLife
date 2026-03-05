import { Link } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text className="font-bold text-lg my-10">Hello worlds</Text>
      <Link href="/onboarding">SignIn</Link>
      <Link href="../userTabs">Homepage</Link>
      <Link href="../trainerTabs">Trainer Tabs</Link>
    </View>
  );
}
