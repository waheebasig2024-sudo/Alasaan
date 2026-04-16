import React from "react";
import { SettingsProvider } from "./SettingsProvider";
import { AssistantProvider } from "./AssistantProvider";
import { PermissionsProvider } from "./PermissionsProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <PermissionsProvider>
        <AssistantProvider>{children}</AssistantProvider>
      </PermissionsProvider>
    </SettingsProvider>
  );
}
