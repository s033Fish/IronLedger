import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { colors } from "../../src/theme/colors";

function iconFor(name: string, focused: boolean) {
  switch (name) {
    case "index": return focused ? "barbell" : "barbell-outline";
    case "history": return focused ? "trending-up" : "trending-up-outline";
    case "exercises": return focused ? "list" : "list-outline";
    case "track": return focused ? "speedometer" : "speedometer-outline";
    case "coach": return focused ? "school" : "school-outline";
    default: return focused ? "ellipse" : "ellipse-outline";
  }
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.crimson,
        tabBarInactiveTintColor: colors.charcoal,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={iconFor(route.name, focused) as any} color={color} size={size} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Log" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="coach" options={{ title: "Coach" }} />
      <Tabs.Screen name="track" options={{ title: "Track" }} />
      <Tabs.Screen name="exercises" options={{ title: "Exercises" }} />
      <Tabs.Screen name="diagnostics" options={{ title: "Diagnostics" }} />
    </Tabs>
  );
}
