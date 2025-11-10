import React from "react";
import { Text, View } from "react-native";
import { colors } from "../theme/colors";
import { type } from "../theme/typography";

export const ErrorBanner: React.FC<{ message: string }> = ({ message }) => {
  if (!message) return null;
  return (
    <View style={{
      borderWidth: 1,
      borderColor: colors.crimson,
      backgroundColor: "#FDECEC",
      padding: 10,
      borderRadius: 8,
      marginTop: 10
    }}>
      <Text style={[type.body, { color: colors.charcoal }]}>{message}</Text>
    </View>
  );
};
