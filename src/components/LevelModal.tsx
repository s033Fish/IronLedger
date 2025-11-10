import React, { useMemo } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { colors } from "../../src/theme/colors";
import { type } from "../../src/theme/typography";
import { XPEvent } from "../../src/types";
import { xpProgress } from "../../src/utils/leveling";

export const LevelModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  totalXP: number;
  events: XPEvent[];
}> = ({ visible, onClose, totalXP, events }) => {
  const p = xpProgress(totalXP);

  // Normalize just for display (label + PR highlight)
  const rows = useMemo(() => {
    return (events ?? []).map((e) => {
      const amount = Number((e as any).amount) || 0;
      const exercise = (e as any).exercise ?? null;
      const type = (e as any).type ?? null;           // may be "PR"
      const reason = (e as any).reason ?? "";         // e.g., "Set logged" or "New PR!"
      const isPR =
        type === "PR" || reason.toLowerCase().includes("pr");

      return {
        id: e.id,
        amount,
        exercise,
        isPR,
      };
    });
  }, [events]);

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: colors.background,
            padding: 16,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={[type.h1, { color: colors.charcoal, textAlign: "center" }]}>
            Level Progression
          </Text>
          <Text style={[type.h2, { color: colors.charcoal, textAlign: "center", marginTop: 6 }]}>
            LEVEL {p.level}
          </Text>

          <View style={{ marginTop: 12 }}>
            <View
              style={{
                height: 18,
                borderRadius: 8,
                backgroundColor: "#e3d6d6",
                borderWidth: 1,
                borderColor: colors.silver,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${p.fraction * 100}%`,
                  backgroundColor: colors.crimson,
                  flex: 1,
                }}
              />
            </View>
            <Text style={[type.body, { color: colors.charcoal, textAlign: "center", marginTop: 6 }]}>
              XP: {totalXP} / {p.nextReq}
            </Text>
          </View>

          <View
            style={{
              marginTop: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              backgroundColor: colors.card,
            }}
          >
            <Text style={[type.bodyBold, { color: colors.charcoal, marginBottom: 6 }]}>
              XP Rules
            </Text>
            <Text style={[type.body, { color: colors.text }]}>• +2 per set logged</Text>
            <Text style={[type.body, { color: colors.text }]}>• +10 per new PR</Text>
          </View>

          <Text style={[type.h2, { color: colors.charcoal, marginTop: 12, marginBottom: 6 }]}>
            Recent XP
          </Text>
          <FlatList
            data={rows}
            keyExtractor={(e) => e.id}
            style={{ maxHeight: 220 }}
            renderItem={({ item }) => (
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
                  {/* LEFT: label with lighter gray exercise */}
                  {item.isPR ? (
                    <Text style={[type.body, { color: colors.text }]}>
                      New PR
                      {item.exercise ? (
                        <Text style={{ color: colors.muted }}>{` (${item.exercise})`}</Text>
                      ) : null}
                    </Text>
                  ) : (
                    <Text style={[type.body, { color: colors.text }]}>
                      Set logged
                      {item.exercise ? (
                        <Text style={{ color: colors.muted }}>{` (${item.exercise})`}</Text>
                      ) : null}
                    </Text>
                  )}
              
                  {/* RIGHT: XP amount */}
                  <Text
                    style={[
                      type.bodyBold,
                      { color: item.isPR ? colors.crimson : colors.charcoal },
                    ]}
                  >
                    +{item.amount} XP
                  </Text>
                </View>
              )}
            ListEmptyComponent={
              <Text style={[type.body, { color: colors.muted }]}>No XP yet.</Text>
            }
          />

          <Pressable
            onPress={onClose}
            style={{
              marginTop: 12,
              alignSelf: "center",
              paddingHorizontal: 24,
              paddingVertical: 10,
              backgroundColor: "#d1d1d1",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={[type.bodyBold, { color: colors.charcoal }]}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
