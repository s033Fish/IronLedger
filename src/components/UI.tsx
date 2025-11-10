import React from "react";
import { Pressable, Text, TextStyle, View, ViewStyle } from "react-native";
import { colors } from "../../src/theme/colors";
import { type } from "../../src/theme/typography";


export const Screen: React.FC<{ children: React.ReactNode; padTop?: number }> = ({ children, padTop = 54 }) => (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: 16, paddingTop: padTop }}>
        {children}
    </View>
);


export const Card: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => (
    <View style={[{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 8, padding: 12 }, style]}>
        {children}
    </View>
);


export const H1: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Text style={[type.h1, { color: colors.charcoal, textTransform: "uppercase" }]}>{children}</Text>
);


export const H2: React.FC<{ children: React.ReactNode; style?: TextStyle }> = ({ children, style }) => (
    <Text style={[type.h2, { color: colors.charcoal, textTransform: "uppercase" }, style]}>{children}</Text>
);


export const Body: React.FC<{ children: React.ReactNode; style?: TextStyle }> = ({ children, style }) => (
    <Text style={[type.body, { color: colors.text }, style]}>{children}</Text>
);


export const Button: React.FC<{ title: string; onPress: () => void; style?: ViewStyle; disabled?: boolean }> = ({ title, onPress, style, disabled }) => (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [{
        backgroundColor: disabled ? "#b86b6b" : colors.crimson,
        borderRadius: 6,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.8 : 1,
    }, style]}>
        <Text style={[type.bodyBold, { color: "white", textTransform: "uppercase", letterSpacing: 1 }]}>{title}</Text>
    </Pressable>
);