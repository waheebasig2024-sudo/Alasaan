import React from "react";
import { Stack } from "expo-router";
import { KnowledgeVault } from "@/src/ui/screens/KnowledgeVault";

export default function KnowledgeRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <KnowledgeVault />
    </>
  );
}
