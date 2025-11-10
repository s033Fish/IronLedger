import { Stack } from "expo-router";
import React from "react";
import { AppProvider } from "../src/context/AppContext"; // ← your provider
import { AuthGate } from "../src/context/AuthGate"; // ← if you use it
// (and your theme providers if any)

export default function RootLayout() {
  return (
    <AuthGate>
      <AppProvider>
        {/* Use a single navigator here. Do NOT add <Slot /> as well. */}
        <Stack screenOptions={{ headerShown: false }} />
      </AppProvider>
    </AuthGate>
  );
}
