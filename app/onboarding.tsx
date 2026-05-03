import React from "react";
import { Stack, router } from "expo-router";
import { OnboardingScreen } from "@/src/ui/screens/OnboardingScreen";

export default function OnboardingRoute() {
  const handleComplete = () => {
    router.replace("/chat");
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingScreen onComplete={handleComplete} />
    </>
  );
}
