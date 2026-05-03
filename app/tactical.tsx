import React from "react";
import { Stack } from "expo-router";
import { TacticalToolbox } from "@/src/ui/screens/TacticalToolbox";

export default function TacticalRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <TacticalToolbox />
    </>
  );
}
