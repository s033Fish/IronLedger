import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";
import Svg, { Circle, ClipPath, Defs, Line, Polyline, Rect, Text as SvgText } from "react-native-svg";
import { Card, Screen } from "../../src/components/UI";
import { colors } from "../../src/theme/colors";
import { type } from "../../src/theme/typography";

import {
  getAllDayPRs,
  getAllTimePR,
  listExercisesMerged,
  listSetsByExercise,
} from "../../src/services/api";

type Range = "30d" | "90d" | "all";


export default function HistoryScreen() {
  const [exercises, setExercises] = useState<string[]>([]);
  const [exercise, setExercise] = useState<string>("");
  const [range, setRange] = useState<Range>("all");
  const [sets, setSets] = useState<any[]>([]);
  const [dayPRs, setDayPRs] = useState<{ dateISO: string; maxRM: number }[]>([]);
  const [allTimePR, setAllTimePRState] = useState<{ dateISO: string; maxRM: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFor = useCallback(async (name: string) => {
    const s = await listSetsByExercise(name);
    setSets(s);
    setDayPRs(await getAllDayPRs(name));
    setAllTimePRState(await getAllTimePR(name));
  }, []);

  useEffect(() => {
    (async () => {
      const ex = await listExercisesMerged();
      setExercises(ex);
      const name = exercise || ex[0];     // pick current or first option
      if (name) {
        // fetch immediately so the UI is current
        await fetchFor(name);
        setExercise(name);                // update state after ensuring data
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused && exercise) {
      fetchFor(exercise);
    }
  }, [isFocused, exercise, fetchFor]);

  const refreshExercise = useCallback(async () => {
    if (!exercise) return;
    const s = await listSetsByExercise(exercise);
    setSets(s);
    setDayPRs(await getAllDayPRs(exercise));
    setAllTimePRState(await getAllTimePR(exercise));
  }, [exercise]);

  useFocusEffect(
    useCallback(() => {
      refreshExercise();
    }, [refreshExercise])
  );
  
  const onRefresh = useCallback(async () => {
    if (!exercise) return;
    setRefreshing(true);
    await fetchFor(exercise);
    setRefreshing(false);
  }, [exercise, fetchFor]);

  // dropdown modal
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const ex = await listExercisesMerged();
      setExercises(ex);
      if (!exercise && ex.length) setExercise(ex[0]);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!exercise) return;
      const s = await listSetsByExercise(exercise);
      setSets(s);
      const prs = await getAllDayPRs(exercise);
      setDayPRs(prs);
      setAllTimePRState(await getAllTimePR(exercise));
    })();
  }, [exercise]);

  // filter day PR points by range
  const filteredPRs = useMemo(() => {
    if (range === "all") return dayPRs;
    const days = range === "30d" ? 30 : 90;
    const now = new Date().getTime();
    return dayPRs.filter((p) => (now - new Date(p.dateISO).getTime()) / 86400000 <= days);
  }, [dayPRs, range]);

  const maxRM = filteredPRs.length ? Math.max(...filteredPRs.map((p) => p.maxRM)) : 0;
  const minRM = filteredPRs.length ? Math.min(...filteredPRs.map((p) => p.maxRM)) : 0;
  const yMin = Math.max(0, minRM - 10);
  const yMax = Math.max(yMin + 1, maxRM + 10);
  const ySpan = yMax - yMin;
  const [chartW, setChartW] = useState(0);
  const chartH = 260;

  const filteredExercises = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((e) => e.toLowerCase().includes(q));
  }, [query, exercises]);

  // History items for the selected exercise, newest first
  const historyData = useMemo(
    () =>
      [...sets]
        .filter((s) => s.exercise === exercise)
        .sort((a, b) => (b.ts?.toMillis?.() ?? 0) - (a.ts?.toMillis?.() ?? 0)),
    [sets, exercise]
  );

  // ----- Header (everything above the list) -----
  const Header = (
    <View>
      <Text style={type.h1}>PROGRESS TRACKER</Text>

      <Card style={{ marginTop: 8 }}>
        <Text style={type.body}>EXERCISE</Text>
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={{
            borderWidth: 1, borderColor: colors.border, borderRadius: 6,
            paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "white",
          }}
        >
          <Text style={[type.bodyBold, { color: colors.charcoal }]}>
            {exercise || "Select exercise"}
          </Text>
        </Pressable>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          {(["30d", "90d", "all"] as Range[]).map((r) => {
            const active = range === r;
            return (
              <Pressable
                key={r}
                onPress={() => setRange(r)}
                style={{
                  flex: 1, alignItems: "center", paddingVertical: 10,
                  borderWidth: 1, borderColor: colors.border, borderRadius: 6,
                  backgroundColor: active ? colors.crimson : colors.card,
                }}
              >
                <Text style={[type.bodyBold, { color: active ? "white" : colors.charcoal }]}>
                  {r.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {!!exercise && (
        <>
          {!!allTimePR && (
            <Card style={{
                    borderWidth: 1,
                    borderColor: colors.crimson,
                    backgroundColor: "#FDECEC", // light red inner
                    padding: 12,
                    marginTop: 8
                }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 18 }}>🏆</Text>
                  <Text style={[type.bodyBold, { color: colors.crimson, letterSpacing: 0.5 }]}>
                      PERSONAL RECORD
                  </Text>
              </View>
              <Text style={[type.bodyBold, { color: colors.charcoal }]}>{allTimePR.maxRM} lb</Text>
              <Text style={[type.body, { color: colors.muted }]}>
                {new Date(allTimePR.dateISO).toLocaleDateString()}
              </Text>
            </Card>

            
          )}

          <Card style={{ marginTop: 8 }}>
            <Text style={[type.bodyBold, { color: colors.charcoal, marginBottom: 6 }]}>
              ESTIMATED 1RM PROGRESSION
            </Text>
            <View
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: "hidden" }}
              onLayout={(e) => {
                // store width in state above (add: const [chartW, setChartW] = useState(0); const chartH = 260;)
                // or inline with a ref; here assume state vars exist in the component:
                setChartW(e.nativeEvent.layout.width);
              }}
            >
              {chartW > 0 && (
                <Svg width={chartW} height={chartH}>
                  {(() => {
                    // Paddings
                    const PAD_L = 44, PAD_R = 12, PAD_T = 30, PAD_B = 70; // extra bottom for dates
                    const innerW = Math.max(1, chartW - PAD_L - PAD_R);
                    const innerH = Math.max(1, chartH - PAD_T - PAD_B);

                    // Scales
                    const xMaxIdx = Math.max(1, filteredPRs.length - 1);
                    const x = (i: number) => PAD_L + (i / xMaxIdx) * innerW;
                    const y = (rm: number) => PAD_T + (1 - (rm - yMin) / ySpan) * innerH;

                    // Grid
                    const gridRows = 4;

                    // Clip so lines/points never draw outside plot area
                    const clipId = "clip-plot";

                    // Ticks for dates (up to 6)
                    const nTicks = filteredPRs.length > 1 ? Math.min(6, filteredPRs.length) : filteredPRs.length;
                    const raw = Array.from({ length: nTicks }, (_, i) =>
                      Math.round((i * (filteredPRs.length - 1)) / Math.max(1, nTicks - 1))
                    );
                    const tickIdx = Array.from(new Set(raw)).sort((a, b) => a - b);
                    const fmt = (iso: string) =>
                      new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }); // "Oct 24"

                    return (
                      <>
                        {/* defs for clipping */}
                        <Defs>
                          <ClipPath id={clipId}>
                            <Rect x={PAD_L} y={PAD_T} width={innerW} height={innerH} />
                          </ClipPath>
                        </Defs>

                        {/* grid */}
                        {Array.from({ length: gridRows + 1 }, (_, i) => {
                          const gy = PAD_T + (i * innerH) / gridRows;
                          return (
                            <Line key={`g-${i}`} x1={PAD_L} y1={gy} x2={PAD_L + innerW} y2={gy} stroke="#e6e6e6" strokeWidth={1} />
                          );
                        })}

                        {/* axes */}
                        <Line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + innerH} stroke={colors.charcoal} strokeWidth={1.5} />
                        <Line x1={PAD_L} y1={PAD_T + innerH} x2={PAD_L + innerW} y2={PAD_T + innerH} stroke={colors.charcoal} strokeWidth={1.5} />

                        {/* y-axis labels */}
                        {Array.from({ length: gridRows + 1 }, (_, i) => {
                          const val = yMax - (i * (ySpan)) / gridRows;
                          const gy = PAD_T + (i * innerH) / gridRows;
                          return (
                            <SvgText key={`yl-${i}`} x={PAD_L - 4} y={gy + 3} fontSize={10} fill={colors.charcoal} textAnchor="end">
                              {Math.round(val)}
                            </SvgText>
                          );
                        })}

                        {/* x-axis ticks + date labels (first/last nudged in) */}
                        {tickIdx.map((i, idx) => {
                          const xi = x(i);
                          const isFirst = idx === 0;
                          const isLast = idx === tickIdx.length - 1;
                          const anchor = isFirst ? "start" : isLast ? "end" : "middle";
                          const dx = isFirst ? 4 : isLast ? -4 : 0;
                          return (
                            <React.Fragment key={`xt-${i}`}>
                              <Line x1={xi} y1={PAD_T + innerH} x2={xi} y2={PAD_T + innerH + 4} stroke={colors.charcoal} strokeWidth={1} />
                              <SvgText
                                x={xi + dx}
                                y={PAD_T + innerH + 20}
                                fontSize={10}
                                fill={colors.charcoal}
                                textAnchor={anchor}
                              >
                                {fmt(filteredPRs[i].dateISO)}
                              </SvgText>
                            </React.Fragment>
                          );
                        })}

                        {/* series (clipped to plot area) */}
                        {filteredPRs.length > 0 && (
                          <>
                            <Polyline
                              clipPath={`url(#${clipId})`}
                              points={filteredPRs.map((p, i) => `${x(i)},${y(p.maxRM)}`).join(" ")}
                              fill="none"
                              stroke={colors.crimson}
                              strokeWidth={2}
                            />
                            {filteredPRs.map((p, i) => (
                              <Circle
                                key={p.dateISO}
                                clipPath={`url(#${clipId})`}
                                cx={x(i)}
                                cy={y(p.maxRM)}
                                r={4}
                                fill={colors.crimson}
                              />
                            ))}
                          </>
                        )}

                        {/* axis titles */}
                        <SvgText
                          x={16}
                          y={PAD_T + innerH / 2}
                          fontSize={11}
                          fill={colors.charcoal}
                          transform={`rotate(-90, 16, ${PAD_T + innerH / 2})`}
                          textAnchor="middle"
                        >
                          Est. 1RM (lb)
                        </SvgText>
                        <SvgText
                          x={PAD_L + innerW / 2}
                          y={chartH - 10}
                          fontSize={11}
                          fill={colors.charcoal}
                          textAnchor="middle"
                        >
                          Date
                        </SvgText>
                      </>
                    );
                  })()}
                </Svg>
              )}
            </View>


          </Card>

          <Text style={[type.h2, { marginTop: 12, color: colors.charcoal }]}>WORKOUT HISTORY</Text>
        </>
      )}
    </View>
  );

  return (
    // FlatList controls scrolling for the whole page
    <Screen scroll={false}>
      <FlatList
        refreshing={refreshing}
        onRefresh={onRefresh}
        data={historyData}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={Header}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Card style={{ marginTop: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
              <Text style={[type.bodyBold, { color: colors.charcoal }]}>{item.exercise}</Text>
              <Text style={[type.body, { color: colors.muted }]}>
                {new Date(item.dateISO).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[type.body, { color: colors.charcoal }]}>
              {item.weight} lb × {item.reps} reps
            </Text>
          </Card>
        )}
        ListEmptyComponent={
          !!exercise ? (
            <Text style={[type.body, { color: colors.muted, paddingVertical: 8 }]}>
              No history yet for this exercise.
            </Text>
          ) : null
        }
        keyboardShouldPersistTaps="handled"
      />

      {/* Exercise picker modal */}
      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }}>
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
                borderWidth: 1, borderColor: colors.border, borderRadius: 6,
                padding: 10, backgroundColor: "white", marginBottom: 8,
              }}
            />

            <FlatList
              refreshing={refreshing}
              onRefresh={onRefresh}
              data={filteredExercises}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { setExercise(item); setPickerOpen(false); setQuery(""); }}
                  style={{
                    paddingVertical: 10, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1,
                    borderColor: colors.border, backgroundColor: item === exercise ? colors.crimson : colors.card,
                    marginBottom: 6,
                  }}
                >
                  <Text style={[type.bodyBold, { color: item === exercise ? "white" : colors.charcoal }]}>
                    {item}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={[type.body, { color: colors.muted, padding: 8 }]}>No matches</Text>
              }
              style={{ marginBottom: 8 }}
            />

            <Pressable
              onPress={() => setPickerOpen(false)}
              style={{
                alignSelf: "center", paddingVertical: 10, paddingHorizontal: 16,
                borderRadius: 8, borderWidth: 1, borderColor: colors.border,
                backgroundColor: colors.card, marginTop: 4, marginBottom: 6,
              }}
            >
              <Text style={[type.bodyBold, { color: colors.charcoal }]}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
