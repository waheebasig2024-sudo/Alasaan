import React from "react";
import { Stack } from "expo-router";
import { CoDesignScreen } from "@/src/ui/screens/CoDesignScreen";
import { COLORS } from "@/src/ui/theme/colors";

export default function CoDesignRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Open CoDesign",
          headerStyle: { backgroundColor: COLORS.secondaryBg },
          headerShadowVisible: false,
        }}
      />
      <CoDesignScreen />
    </>
  );
}