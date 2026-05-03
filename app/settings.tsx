import React from "react";
import { Stack } from "expo-router";
import { SettingsScreen } from "@/src/ui/screens/SettingsScreen";
import { COLORS } from "@/src/ui/theme/colors";

export default function SettingsRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "الإعدادات",
          headerStyle: { backgroundColor: COLORS.secondaryBg },
          headerShadowVisible: false,
        }}
      />
      <SettingsScreen />
    </>
  );
}
