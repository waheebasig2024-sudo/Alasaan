import React from "react";
import { Stack } from "expo-router";
import { VisionScreen } from "@/src/ui/screens/VisionScreen";

export default function VisionRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <VisionScreen />
    </>
  );
}
