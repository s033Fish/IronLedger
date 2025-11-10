import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import { LevelModal } from "../../src/components/LevelModal";
import { Body, Button, Card, H1, Screen } from "../../src/components/UI";
import { XPBar } from "../../src/components/XPBar";
import { colors } from "../../src/theme/colors";
import { type } from "../../src/theme/typography";
import { prettyTimeOnly, toYMD } from "../../src/utils/dates";
import { epley1RM } from "../../src/utils/epley";

// ---- Firestore API ----
import { FlatList } from "react-native"; // optional: RN or RNGH both OK
import { SetRecord } from "../../src/lib/lift";
import {
    addSetFS,
    addXP,
    getAllTimePR,
    getLastSessionSets,
    listExercisesMerged,
    listRecentXP,
    listTodaySets
} from "../../src/services/api";

type XPEvent = {
    id: string;
    amount: number;
    reason: string;
    exercise?: string | null;
    // normalized fields:
    dateISO?: string;       // ISO string for display
    createdAtMs?: number;   // optional millis if your UI sorts
};

function normalizeXP(raw: any[]): XPEvent[] {
    return raw.map((e) => {
        // Try common timestamp fields:
        const src = e?.dateISO ?? e?.createdAt ?? e?.ts ?? e?.date ?? null;

        let dateISO: string | undefined;
        if (src) {
            if (typeof src === "string") {
                const d = new Date(src);
                if (!isNaN(d.getTime())) dateISO = d.toISOString();
            } else if (typeof src?.toDate === "function") {
                // Firestore Timestamp
                dateISO = src.toDate().toISOString();
            } else if (typeof src === "number") {
                // already in millis
                dateISO = new Date(src).toISOString();
            }
        }

        const createdAtMs = dateISO ? new Date(dateISO).getTime() : undefined;

        return { ...e, dateISO, createdAtMs };
    });
}

export default function LogScreen() {
    // --- UI state ---
    const [exercise, setExercise] = useState<string>("");
    const [exercises, setExercises] = useState<string[]>([]);

    const [weight, setWeight] = useState<number>(225);
    const [reps, setReps] = useState<number>(5);

    const [todaySets, setTodaySets] = useState<SetRecord[]>([]);
    const [lastSessionSets, setLastSessionSets] = useState<SetRecord[]>([]);
    const [allTimePR, setAllTimePR] = useState<{ dateISO: string; maxRM: number } | null>(null);

    const [modalOpen, setModalOpen] = useState(false); // level modal
    const [exPickerOpen, setExPickerOpen] = useState(false); // exercise dropdown modal
    const [query, setQuery] = useState("");

    // XP summary
    const [recentXP, setRecentXP] = useState<XPEvent[]>([]);
    const xpTotal = useMemo(
        () => recentXP.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
        [recentXP]
    );

    const todayYMD = toYMD(new Date().toISOString());

    const exerciseSetsToday = useMemo(
        () => todaySets.filter((s) => s.exercise === exercise),
        [todaySets, exercise]
    );

    const dayBest = useMemo(() => {
        const best = exerciseSetsToday.reduce(
            (max, s) => Math.max(max, epley1RM(s.weight, s.reps)),
            0
        );
        return best || null;
    }, [exerciseSetsToday]);

    const filteredExercises = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return exercises;
        return exercises.filter((e) => e.toLowerCase().includes(q));
    }, [exercises, query]);

    // --- load initial data ---
    useEffect(() => {
        (async () => {
            const exs = await listExercisesMerged();
            setExercises(exs);
            if (!exercise) setExercise(exs[0] ?? "");
            setTodaySets(await listTodaySets());
            setRecentXP(await listRecentXP(50));
        })();
    }, []);

    // refresh when exercise changes (PR + Last Session)
    useEffect(() => {
        (async () => {
            if (!exercise) {
                setAllTimePR(null);
                setLastSessionSets([]);
                return;
            }
            setAllTimePR(await getAllTimePR(exercise));
            setLastSessionSets(await getLastSessionSets(exercise));
        })();
    }, [exercise]);

    // helper to refresh “today” + xp after add/delete
    async function refreshAfterMutation() {
        setTodaySets(await listTodaySets());

        const rawXP = await listRecentXP(50);
        setRecentXP(normalizeXP(rawXP));

        if (exercise) {
            setAllTimePR(await getAllTimePR(exercise));
            setLastSessionSets(await getLastSessionSets(exercise));
        }
    }

    async function onAdd() {
        if (!exercise) return;
        const w = Number(weight), r = Number(reps);
        if (!isFinite(w) || !isFinite(r) || w <= 0 || r <= 0) return;

        // Capture previous PR BEFORE adding this new set
        const prevPR = await getAllTimePR(exercise);
        const prevBest = prevPR?.maxRM ?? 0;

        await addSetFS(exercise, w, r, todayYMD);
        await addXP(2, "Set logged", exercise);

        const newRM = epley1RM(w, r);
        if (!prevBest || newRM > prevBest) {
            await addXP(10, "New PR!", exercise);
            Alert.alert("🏆 New PR!", `${exercise}: Est. 1RM ${newRM} lb (prev ${prevBest || "—"})`);
        }

        await refreshAfterMutation();
    }

    // Everything above the sets list becomes the ListHeaderComponent
    const Header = (
        <View style={{ paddingBottom: 8 }}>
            <H1>IRON LEDGER</H1>
            <XPBar totalXP={xpTotal} />

            {/* INPUT CARD */}
            <Card style={{ marginTop: 8 }}>
                <Body style={{ marginBottom: 6 }}>EXERCISE</Body>

                {/* Exercise "dropdown" field */}
                <Pressable
                    onPress={() => setExPickerOpen(true)}
                    style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 6,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        backgroundColor: "white",
                    }}
                >
                    <Text style={[type.bodyBold, { color: colors.charcoal }]}>
                        {exercise || "Select exercise"}
                    </Text>
                </Pressable>

                {/* Weight / Reps row */}
                <View style={{ flexDirection: "row", marginTop: 12, gap: 8 }}>
                    <View style={{ flex: 1 }}>
                        <Body>WEIGHT</Body>
                        <TextInput
                            keyboardType="numeric"
                            value={String(weight)}
                            onChangeText={(t) => setWeight(Number(t || 0))}
                            style={{
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 6,
                                padding: 10,
                                backgroundColor: "white",
                            }}
                            placeholder="0"
                        />
                    </View>
                    <View style={{ width: 100 }}>
                        <Body>REPS</Body>
                        <TextInput
                            keyboardType="numeric"
                            value={String(reps)}
                            onChangeText={(t) => setReps(Number(t || 0))}
                            style={{
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 6,
                                padding: 10,
                                backgroundColor: "white",
                            }}
                            placeholder="0"
                        />
                    </View>
                </View>

                <Button title="Add Set" onPress={onAdd} style={{ marginTop: 12 }} />
            </Card>

            {/* PR + LAST SESSION */}
            {!!exercise && (
                <View style={{ gap: 8, marginTop: 8 }}>
                    <Card
                        style={{
                            borderWidth: 1,
                            borderColor: colors.crimson,
                            backgroundColor: "#FDECEC", // light red inner
                            padding: 12,
                        }}
                    >
                        {/* Header row: trophy + PERSONAL RECORD */}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Text style={{ fontSize: 18 }}>🏆</Text>
                            <Text style={[type.bodyBold, { color: colors.crimson, letterSpacing: 0.5 }]}>
                                PERSONAL RECORD
                            </Text>
                        </View>

                        {/* Details */}
                        <View style={{ marginTop: 6 }}>
                            <Text style={[type.body, { color: colors.charcoal }]}>
                                Est. 1RM:{" "}
                                <Text style={[type.bodyBold, { color: colors.charcoal }]}>
                                    {allTimePR
                                        ? `${Math.round(allTimePR.maxRM)} lb`
                                        : dayBest
                                            ? `${Math.round(dayBest)} lb`
                                            : "—"}
                                </Text>{" "}
                                {!!allTimePR && (
                                    <Text style={{ color: colors.muted }}>
                                        {/* If your getAllTimePR returns weight/reps, show them; otherwise just show the date */}
                                        {typeof (allTimePR as any).weight === "number" &&
                                            typeof (allTimePR as any).reps === "number"
                                            ? `(from ${(allTimePR as any).weight}×${(allTimePR as any).reps} on ${new Date(
                                                allTimePR.dateISO
                                            ).toLocaleDateString()})`
                                            : `(on ${new Date(allTimePR.dateISO).toLocaleDateString()})`}
                                    </Text>
                                )}
                            </Text>
                        </View>
                    </Card>

                    <Card>
  {(() => {
    const first = lastSessionSets?.[0];

    // Pick a date-like field safely (supports dateISO | ts | createdAt)
    const rawDate =
      first?.dateISO ?? (first as any)?.ts ?? (first as any)?.createdAt ?? null;

    // Robust parse: Firestore Timestamp | number | ISO | YYYY-MM-DD
    let lastDateLabel: string | null = null;
    if (rawDate) {
      let d: Date | null = null;
      if (typeof (rawDate as any)?.toDate === "function") d = (rawDate as any).toDate();
      else if (typeof rawDate === "number") d = new Date(rawDate);
      else if (typeof rawDate === "string") {
        d = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
          ? new Date(rawDate + "T12:00:00Z") // avoid TZ shift for date-only
          : new Date(rawDate);
      }
      if (d && !isNaN(d.getTime())) lastDateLabel = d.toLocaleDateString();
    }

    return (
      <>
        <Text style={[type.bodyBold, { color: colors.charcoal, marginBottom: 4 }]}>
          LAST SESSION{lastDateLabel ? ` (${lastDateLabel})` : ""}
        </Text>

        {lastSessionSets && lastSessionSets.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
            {lastSessionSets.map((s) => (
              <View
                key={s.id}
                style={{
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: "#eee",
                  borderRadius: 6,
                }}
              >
                <Text style={type.body}>
                  {s.weight}×{s.reps}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[type.body, { color: colors.muted }]}>—</Text>
        )}
      </>
    );
  })()}
</Card>
                </View>
            )}

            <Text style={[type.h2, { marginTop: 16, color: colors.charcoal }]}>TODAY’S SETS</Text>
        </View>
    );

    return (
        // Disable Screen's internal ScrollView because we are using FlatList to scroll the whole page
        <Screen scroll={false}>
            <FlatList
                data={todaySets}
                keyExtractor={(i) => i.id}
                ListHeaderComponent={Header}
                contentContainerStyle={{ paddingBottom: 120 }} // room for floating button
                renderItem={({ item }) => (
                    <Card
                        style={{
                            marginTop: 6,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <View>
                            <Text style={[type.bodyBold, { color: colors.charcoal }]}>
                                {item.exercise}
                            </Text>
                            <Text style={[type.body, { color: colors.muted }]}>
                            {item.weight} lb × {item.reps} reps - {prettyTimeOnly((item as any).ts ?? item.dateISO)}
                            </Text>
                        </View>
                    </Card>
                )}
                ListEmptyComponent={
                    <Text style={[type.body, { color: colors.muted, paddingVertical: 8 }]}>
                        No sets yet today.
                    </Text>
                }
            />

            {/* Floating Level Button */}
            <Pressable
                onPress={() => setModalOpen(true)}
                style={{
                    position: "absolute",
                    right: 16,
                    bottom: 20,
                    backgroundColor: colors.crimson,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 28,
                    borderWidth: 1,
                    borderColor: colors.border,
                }}
            >
                <Text style={[type.bodyBold, { color: "white", letterSpacing: 1 }]}>LEVEL</Text>
            </Pressable>

            <LevelModal
                visible={modalOpen}
                onClose={() => setModalOpen(false)}
                totalXP={xpTotal}
                events={recentXP}
            />

            {/* --------- Exercise Modal Picker --------- */}
            <Modal
                visible={exPickerOpen}
                animationType="slide"
                transparent
                onRequestClose={() => setExPickerOpen(false)}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.35)",
                        justifyContent: "flex-end",
                    }}
                >
                    <View
                        style={{
                            backgroundColor: colors.background,
                            borderTopLeftRadius: 14,
                            borderTopRightRadius: 14,
                            padding: 14,
                            borderTopWidth: 1,
                            borderColor: colors.border,
                            maxHeight: "75%",
                        }}
                    >
                        <Text style={[type.h2, { color: colors.charcoal, marginBottom: 8 }]}>
                            Select Exercise
                        </Text>

                        <TextInput
                            placeholder="Search"
                            value={query}
                            onChangeText={setQuery}
                            autoCapitalize="none"
                            style={{
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 6,
                                padding: 10,
                                backgroundColor: "white",
                                marginBottom: 8,
                            }}
                        />

                        {/* This FlatList is inside a modal; allow its own scrolling */}
                        <FlatList
                            data={filteredExercises}
                            keyExtractor={(item) => item}
                            keyboardShouldPersistTaps="handled"
                            nestedScrollEnabled
                            renderItem={({ item }) => (
                                <Pressable
                                    onPress={() => {
                                        setExercise(item);
                                        setExPickerOpen(false);
                                        setQuery("");
                                    }}
                                    style={{
                                        paddingVertical: 10,
                                        paddingHorizontal: 8,
                                        borderRadius: 6,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        backgroundColor: item === exercise ? colors.crimson : colors.card,
                                        marginBottom: 6,
                                    }}
                                >
                                    <Text
                                        style={[
                                            type.bodyBold,
                                            { color: item === exercise ? "white" : colors.charcoal },
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                </Pressable>
                            )}
                            ListEmptyComponent={
                                <Text style={[type.body, { color: colors.muted, padding: 8 }]}>
                                    No matches
                                </Text>
                            }
                            style={{ marginBottom: 8 }}
                        />

                        <Pressable
                            onPress={() => setExPickerOpen(false)}
                            style={{
                                alignSelf: "center",
                                paddingVertical: 10,
                                paddingHorizontal: 16,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: colors.border,
                                backgroundColor: colors.card,
                                marginTop: 4,
                                marginBottom: 6,
                            }}
                        >
                            <Text style={[type.bodyBold, { color: colors.charcoal }]}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
            {/* --------- /Exercise Modal Picker --------- */}
        </Screen>
    );
}
