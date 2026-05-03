import React from "react";
import { Stack } from "expo-router";
import { SecurityDashboard } from "@/src/ui/screens/SecurityDashboard";
import { COLORS } from "@/src/ui/theme/colors";

export default function SecurityRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SecurityDashboard />
    </>
  );
}
