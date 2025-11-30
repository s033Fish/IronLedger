// app/(tabs)/coach.tsx
import React from "react";
import { Text, View } from "react-native";
import { Body, Card, H1, Screen } from "../../src/components/UI";
import { colors } from "../../src/theme/colors";
import { type } from "../../src/theme/typography";

export default function CoachScreen() {
  return (
    <Screen>
      <H1>Coach</H1>

      <View style={{ alignItems: "center", justifyContent: "center", marginTop: 32 }}>
        <Text style={[type.h2, { color: colors.muted, textAlign: "center", marginBottom: 12 }]}>
          🏗️ Coming Soon
        </Text>
        <Card style={{ maxWidth: 480 }}>
          <Body style={{ textAlign: "center", color: colors.muted }}>
            This page will host guidance, suggestions, and programming tools in a future update.
          </Body>
        </Card>
      </View>
    </Screen>
  );
}
