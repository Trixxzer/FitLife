import { Stack } from "expo-router";
import React from "react";

export default function ClientsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="review-requests" />
      <Stack.Screen name="chat/[threadId]" />
      <Stack.Screen name="video-call" />
    </Stack>
  );
}
