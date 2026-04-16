import React from "react";
import { Stack } from "expo-router";
import { MemoryScreen } from "@/src/ui/screens/MemoryScreen";
import { COLORS } from "@/src/ui/theme/colors";

export default function MemoryRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "الذاكرة",
          headerStyle: { backgroundColor: COLORS.secondaryBg },
          headerShadowVisible: false,
        }}
      />
      <MemoryScreen />
    </>
  );
}
