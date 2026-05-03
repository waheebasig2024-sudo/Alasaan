import React from "react";
import { Stack } from "expo-router";
import { ToolsScreen } from "@/src/ui/screens/ToolsScreen";
import { COLORS } from "@/src/ui/theme/colors";

export default function ToolsRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "الأدوات",
          headerStyle: { backgroundColor: COLORS.secondaryBg },
          headerShadowVisible: false,
        }}
      />
      <ToolsScreen />
    </>
  );
}
