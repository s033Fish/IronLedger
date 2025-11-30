// app/(tabs)/exercises.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Body, Button, Card, H1, Screen } from "../../src/components/UI";
import { colors } from "../../src/theme/colors";
import { type } from "../../src/theme/typography";

import {
  addCustomExercise,
  deleteExercise,
  listExercisesMerged,
} from "../../src/services/api";

/* ---------------- helpers ---------------- */

const normalize = (s: string) => s.trim().replace(/\s+/g, " ");
const isDup = (items: string[], name: string) =>
  items.some((n) => n.toLowerCase() === name.toLowerCase());

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <Text style={[type.bodyBold, { color: colors.charcoal }]}>{text}</Text>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <Text style={[type.bodyBold, { color: colors.charcoal }]}>{text}</Text>;
  return (
    <Text style={[type.bodyBold, { color: colors.charcoal }]}>
      {text.slice(0, i)}
      <Text style={{ backgroundColor: "#FFF1A8" }}>{text.slice(i, i + q.length)}</Text>
      {text.slice(i + q.length)}
    </Text>
  );
}

/* Simple bottom-sheet style menu */
function RowMenu({
  visible,
  name,
  onClose,
  onRename,
  onDelete,
}: {
  visible: boolean;
  name: string | null;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.25)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            padding: 12,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 8,
          }}
        >
          <Text style={[type.bodyBold, { color: colors.charcoal, marginBottom: 4 }]}>
            {name}
          </Text>
          <Pressable
            onPress={() => { onClose(); onRename(); }}
            style={{
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              alignItems: "center",
              backgroundColor: "white",
            }}
          >
            <Text style={[type.bodyBold, { color: colors.charcoal }]}>Rename</Text>
          </Pressable>
          <Pressable
            onPress={() => { onClose(); onDelete(); }}
            style={{
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              alignItems: "center",
              backgroundColor: "#fbe9e9",
            }}
          >
            <Text style={[type.bodyBold, { color: colors.crimson }]}>Delete</Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            style={{ paddingVertical: 12, alignItems: "center", marginTop: 4 }}
          >
            <Text style={[type.bodyBold, { color: colors.muted }]}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

/* Rename modal */
function RenameModal({
  visible,
  initial,
  onSubmit,
  onCancel,
  error,
}: {
  visible: boolean;
  initial: string;
  onSubmit: (v: string) => void;
  onCancel: () => void;
  error?: string;
}) {
  const [val, setVal] = useState(initial);
  useEffect(() => setVal(initial), [initial, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)", justifyContent: "center", padding: 16 }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 12,
            gap: 8,
          }}
        >
          <Text style={[type.h2, { color: colors.charcoal }]}>Rename Exercise</Text>
          <TextInput
            autoFocus
            placeholder="New name"
            value={val}
            onChangeText={setVal}
            onSubmitEditing={() => onSubmit(val)}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 6,
              padding: 10,
              backgroundColor: "white",
            }}
          />
          {!!error && <Text style={[type.body, { color: colors.crimson }]}>{error}</Text>}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={onCancel}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                backgroundColor: colors.card,
              }}
            >
              <Text style={[type.bodyBold, { color: colors.charcoal }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => onSubmit(val)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                backgroundColor: colors.crimson,
              }}
            >
              <Text style={[type.bodyBold, { color: "white" }]}>Save</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

/* ---------------- main screen ---------------- */

export default function ExercisesScreen() {
  const [items, setItems] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renameFor, setRenameFor] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | undefined>(undefined);

  async function refresh() {
    setItems(await listExercisesMerged());
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((n) => n.toLowerCase().includes(q));
  }, [items, query]);

  const totalCount = items.length;
  const showingCount = filtered.length;
  const showingText =
    query.trim().length > 0
      ? `${showingCount} of ${totalCount} exercises`
      : `${totalCount} exercises`;

  /* ----- add flow ----- */
  const canAdd = (() => {
    const name = normalize(input);
    return !!name && !isDup(items, name);
  })();

  async function onAdd() {
    const name = normalize(input);
    if (!name || isDup(items, name)) return;
    await addCustomExercise(name);
    setInput("");
    await refresh();
  }

  /* ----- delete flow ----- */
  async function onConfirmDelete(name: string) {
    Alert.alert("Delete exercise", `Remove “${name}”?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteExercise(name);
          await refresh();
        },
      },
    ]);
  }

  /* ----- rename flow (delete + re-add) ----- */
  async function onSubmitRename(newName: string) {
    if (!renameFor) return;
    const clean = normalize(newName);
    if (!clean) {
      setRenameError("Name cannot be empty.");
      return;
    }
    if (isDup(items.filter((n) => n !== renameFor), clean)) {
      setRenameError("That name already exists.");
      return;
    }
    setRenameError(undefined);
    await deleteExercise(renameFor);
    await addCustomExercise(clean);
    setRenameFor(null);
    await refresh();
  }

  /* ----- header ----- */
  const Header = (
    <View>
      <H1>EXERCISES</H1>
      <Text style={[type.body, { color: colors.muted, marginTop: 4 }]}>{showingText}</Text>

      <Card style={{ marginTop: 8, marginBottom: 8 }}>
        <Body>ADD EXERCISE</Body>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 6, alignItems: "stretch" }}>
          <TextInput
            placeholder="Name"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={onAdd}
            returnKeyType="done"
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 6,
              padding: 10,
              backgroundColor: "white",
            }}
          />
          <Button title="Add" onPress={onAdd} disabled={!canAdd} style={{ opacity: canAdd ? 1 : 0.5 }} />
        </View>
        {!canAdd && input.trim().length > 0 && (
          <Text style={[type.body, { marginTop: 6, color: colors.crimson }]}>
            {isDup(items, normalize(input))
              ? "That exercise already exists."
              : "Enter a name to add."}
          </Text>
        )}

        <Body style={{ marginTop: 12 }}>SEARCH</Body>
        <TextInput
          placeholder="Filter exercises"
          value={query}
          onChangeText={setQuery}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 6,
            padding: 10,
            backgroundColor: "white",
            marginTop: 6,
          }}
        />
      </Card>
    </View>
  );

  /* ----- row renderer for DraggableFlatList ----- */
  function Row({ item, drag, isActive }: RenderItemParams<string>) {
    return (
      <Card
        style={{
          marginTop: 6,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: isActive ? 0.85 : 1,
        }}
      >
        <Pressable onLongPress={drag} style={{ flex: 1, paddingRight: 8 }}>
          <Highlight text={item} q={query} />
          <Text style={[type.body, { color: colors.muted }]}>Long-press to reorder</Text>
        </Pressable>

        <Pressable
          onPress={() => setMenuFor(item)}
          hitSlop={12}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 10,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 6,
          }}
        >
          <Text style={[type.bodyBold, { color: colors.charcoal }]}>⋯</Text>
        </Pressable>
      </Card>
    );
  }

  return (
    <Screen>
      {/* Option B: wrap just this screen’s list in GestureHandlerRootView */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <DraggableFlatList
          data={filtered}
          keyExtractor={(n) => n}
          ListHeaderComponent={Header}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
          onDragEnd={({ data }) => {
            // Persisting order is optional—currently local only.
            if (query.trim().length === 0) setItems(data);
          }}
          renderItem={Row}
          activationDistance={12}
          keyboardShouldPersistTaps="handled"
        />
      </GestureHandlerRootView>

      {/* Row menu */}
      <RowMenu
        visible={menuFor != null}
        name={menuFor}
        onClose={() => setMenuFor(null)}
        onRename={() => {
          setRenameError(undefined);
          setRenameFor(menuFor!);
        }}
        onDelete={() => {
          const name = menuFor!;
          setMenuFor(null);
          onConfirmDelete(name);
        }}
      />

      {/* Rename modal */}
      <RenameModal
        visible={renameFor != null}
        initial={renameFor ?? ""}
        error={renameError}
        onCancel={() => setRenameFor(null)}
        onSubmit={onSubmitRename}
      />
    </Screen>
  );
}
