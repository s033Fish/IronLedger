import React from "react";
import { View, Text } from "react-native";
import { colors } from "../../src/theme/colors";
import { type } from "../../src/theme/typography";
import { xpProgress } from "../../src/utils/leveling";


export const XPBar: React.FC<{ totalXP: number }> = ({ totalXP }) => {
    const p = xpProgress(totalXP);
    return (
        <View style={{ marginVertical: 8 }}>
            <Text style={[type.bodyBold, { color: colors.charcoal }]}>
                Level {p.level} {" "}
                <Text style={[type.body, { color: colors.muted }]}> {Math.round(p.fraction * 100)}% • {totalXP}/{p.nextReq}</Text>
            </Text>
            <View style={{ height: 14, borderRadius: 6, backgroundColor: "#e3d6d6", borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
                <View style={{ width: `${p.fraction * 100}%`, backgroundColor: colors.crimson, flex: 1 }} />
            </View>
        </View>
    );
};