import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import Svg, { Circle, Line, Polygon, Polyline, Text as SvgText } from "react-native-svg";
import { Body, Button, Card, H1, Screen } from "../../src/components/UI";
import { colors } from "../../src/theme/colors";
import { type } from "../../src/theme/typography";

// Firestore API:
// - listBodyweight(), addBodyweightLb(weightLb, dateISO), deleteBodyweight(id)
// - listCreatine(), setCreatine(dateISO, taken)
import {
    addBodyweightLb,
    deleteBodyweight as deleteBW,
    listBodyweight,
    listCreatine,
    setCreatine,
} from "../../src/services/api";

type Tab = "bodyweight" | "creatine";

const localDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

const normalizeKey = (k: string) => {
    // if it's already YYYY-MM-DD, keep it
    if (/^\d{4}-\d{2}-\d{2}$/.test(k)) return k;
    // else try to interpret as a date and convert to local key
    const d = new Date(k);
    return Number.isNaN(+d) ? k : localDateKey(d);
};

const COLS = 7;
const GAP = 4;

/* ======================= TRACK SCREEN (parent) ======================= */

export default function TrackScreen() {
    const [tab, setTab] = useState<Tab>("bodyweight");

    const TopBar = (
        <>
            <H1>TRACK</H1>
            {/* Toggle */}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                {(["bodyweight", "creatine"] as Tab[]).map((t) => {
                    const active = tab === t;
                    return (
                        <Pressable
                            key={t}
                            onPress={() => setTab(t)}
                            style={{
                                flex: 1,
                                alignItems: "center",
                                paddingVertical: 10,
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 6,
                                backgroundColor: active ? colors.crimson : colors.card,
                            }}
                        >
                            <Text style={[type.bodyBold, { color: active ? "white" : colors.charcoal }]}>
                                {t.toUpperCase()}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </>
    );

    return tab === "bodyweight" ? (
        <BodyweightView top={TopBar} />
    ) : (
        <CreatineView top={TopBar} />
    );
}

/* ======================= BODYWEIGHT (FlatList owns scroll) ======================= */

function BodyweightView({ top }: { top: React.ReactNode }) {
    const [log, setLog] = useState<Array<{ id: string; weightLb: number; dateISO: string; ts?: any }>>([]);
    const [weight, setWeight] = useState("");
    const [unit, setUnit] = useState<"lb" | "kg">("lb");

    useEffect(() => {
        refresh();
    }, []);
    async function refresh() {
        setLog(await listBodyweight());
    }

    // --- Prepare data (coerce to numbers and average per day) ---
    const sorted = useMemo(() => {
        const grouped = log.reduce((acc, record) => {
            const key = record.dateISO;
            if (!acc[key]) acc[key] = [];
            acc[key].push(Number(record.weightLb));
            return acc;
        }, {} as Record<string, number[]>);

        return Object.entries(grouped)
            .map(([dateISO, weights]) => ({
                dateISO,
                weightLb: weights.reduce((s, w) => s + w, 0) / weights.length,
            }))
            .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
    }, [log]);

    const lbToKg = (lb: number) => lb * 0.45359237;
    const kgToLb = (kg: number) => kg / 0.45359237;
    const showValue = (lb: number) => (unit === "lb" ? lb.toFixed(1) : lbToKg(lb).toFixed(1));

    const min = sorted.length ? Math.min(...sorted.map((r) => r.weightLb)) : 0;
    const max = sorted.length ? Math.max(...sorted.map((r) => r.weightLb)) : 100;
    const yMin = Math.max(0, min - 10);
    const yMax = Math.max(yMin + 1, max + 10);
    const ySpan = yMax - yMin;

    // Weekly change (last 7 vs prev 7)
    const weeklyChangeLb = useMemo(() => {
        if (sorted.length < 2) return 0;
        const last7 = sorted.slice(-7);
        const prev7 = sorted.slice(-14, -7);
        if (!last7.length || !prev7.length) return 0;
        const avg = (arr: typeof sorted) => arr.reduce((s, r) => s + r.weightLb, 0) / arr.length;
        return avg(last7) - avg(prev7);
    }, [sorted]);

    // Linear trend
    const trend = useMemo(() => {
        if (sorted.length < 2) return null;
        const n = sorted.length;
        let sumX = 0,
            sumY = 0,
            sumXY = 0,
            sumX2 = 0;
        for (let i = 0; i < n; i++) {
            const x = i,
                y = sorted[i].weightLb;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        }
        const denom = Math.max(1, n * sumX2 - sumX * sumX);
        const slope = (n * sumXY - sumX * sumY) / denom;
        const intercept = (sumY - slope * sumX) / n;
        return { slope, intercept, n };
    }, [sorted]);

    async function onAdd() {
        const v = Number(weight);
        if (!isFinite(v) || v <= 0) return;
        const lb = unit === "lb" ? v : kgToLb(v);
        const dateISO = localDateKey(new Date());
        await addBodyweightLb(lb, dateISO);
        setWeight("");
        await refresh();
    }

    async function onDelete(id: string) {
        await deleteBW(id);
        await refresh();
    }

    const weeklyDisplay = unit === "lb" ? weeklyChangeLb : lbToKg(weeklyChangeLb);

    // Chart helpers
    const xPxMin = 44,
        xPxMax = 388,
        yPxMin = 30,
        yPxMax = 190;
    const chartH = yPxMax - yPxMin;
    const n = sorted.length;
    const xMax = Math.max(1, n - 1);
    const x = (i: number) => xPxMin + (i / xMax) * (xPxMax - xPxMin);
    const y = (lb: number) => yPxMin + (1 - (lb - yMin) / ySpan) * chartH;

    // History list data (newest first)
    const listData = useMemo(
        () => [...log].sort((a, b) => (b.ts?.toMillis?.() ?? 0) - (a.ts?.toMillis?.() ?? 0)),
        [log]
    );

    // ---------- HEADER (everything above the history cards) ----------
    const Header = (
        <View>
            {top}

            <Card style={{ marginTop: 8, paddingBottom: 12 }}>
                {/* Input row */}
                <Body>WEIGHT ({unit.toUpperCase()})</Body>

                {/* Controls row: everyone matches the tallest child (the TextInput) */}
                <View style={{ flexDirection: "row", gap: 8, alignItems: "stretch" }}>
                    <TextInput
                        keyboardType="numeric"
                        value={weight}
                        placeholder="0"
                        onChangeText={setWeight}
                        onSubmitEditing={onAdd}
                        style={{
                            flex: 1,
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 6,
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            backgroundColor: "white",
                        }}
                    />

                    {/* If your Button can't stretch via style, wrap it */}
                    <View style={{ alignSelf: "stretch" }}>
                        <Pressable
                            onPress={() => setUnit(unit === "lb" ? "kg" : "lb")}
                            style={{
                                flex: 1,                  // fill wrapper height
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 6,
                                paddingHorizontal: 12,    // no vertical padding; let height come from stretch
                                justifyContent: "center", // center label
                                alignItems: "center",

                                backgroundColor: colors.crimson,
                            }}
                        >
                            <Text style={[type.bodyBold, { color: "white" }]}>{unit.toUpperCase()}</Text>
                        </Pressable>
                    </View>

                    <View style={{ alignSelf: "stretch" }}>
                        <Pressable
                            onPress={onAdd}
                            style={{
                                flex: 1,
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 6,
                                paddingHorizontal: 12,
                                justifyContent: "center",
                                alignItems: "center",
                                backgroundColor: colors.crimson,
                            }}
                        >
                            <Text style={[type.bodyBold, { color: "white" }]}>ADD</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Graph */}
                {n > 0 && (
                    <View style={{ marginTop: 12 }}>
                        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8 }}>
                            <Svg width="100%" height={240} viewBox="0 0 400 240" style={{ width: "100%" }}>
                                {/* grid */}
                                {[0, 1, 2, 3, 4].map((i) => {
                                    const yLine = yPxMin + (i * chartH) / 4;
                                    return (
                                        <Line
                                            key={`g-${i}`}
                                            x1={xPxMin}
                                            y1={yLine}
                                            x2={xPxMax}
                                            y2={yLine}
                                            stroke="#e6e6e6"
                                            strokeWidth={1}
                                        />
                                    );
                                })}

                                {/* series */}
                                {(() => {
                                    const pts = sorted.map((r, i) => `${x(i)},${y(r.weightLb)}`).join(" ");

                                    if (n === 1) {
                                        const y0 = y(sorted[0].weightLb);
                                        return (
                                            <>
                                                <Polygon
                                                    points={`${xPxMin},${y(yMin)} ${xPxMax},${y(yMin)} ${xPxMax},${y0} ${xPxMin},${y0}`}
                                                    fill={colors.crimson}
                                                    opacity={0.12}
                                                />
                                                <Line x1={xPxMin} y1={y0} x2={xPxMax} y2={y0} stroke="#555" strokeWidth={2.5} />
                                                <Circle cx={x(0)} cy={y0} r={3} fill={colors.crimson} />
                                            </>
                                        );
                                    }

                                    return (
                                        <>
                                            <Polygon
                                                points={`${xPxMin},${y(yMin)} ${pts} ${x(n - 1)},${y(yMin)}`}
                                                fill={colors.crimson}
                                                opacity={0.15}
                                            />
                                            <Polyline points={pts} fill="none" stroke="#555" strokeWidth={2.5} />
                                            {sorted.map((r, i) => (
                                                <Circle key={`pt-${i}`} cx={x(i)} cy={y(r.weightLb)} r={3} fill={colors.crimson} />
                                            ))}
                                            {trend && (
                                                <Line
                                                    x1={xPxMin}
                                                    y1={y(trend.intercept)}
                                                    x2={xPxMax}
                                                    y2={y(trend.slope * (n - 1) + trend.intercept)}
                                                    stroke={colors.crimson}
                                                    strokeWidth={2}
                                                    strokeDasharray="5,5"
                                                    opacity={0.7}
                                                />
                                            )}
                                        </>
                                    );
                                })()}

                                {/* x-axis ticks + rotated date labels */}
                                {(() => {
                                    const fmt = (iso: string) =>
                                        new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
                                    const targetLabels = 8;
                                    const step = Math.max(1, Math.ceil(n / targetLabels));

                                    return (
                                        <>
                                            {sorted.map((r, i) => {
                                                const xi = x(i);
                                                const show = i % step === 0 || i === 0 || i === n - 1;
                                                if (!show) return null;
                                                return (
                                                    <React.Fragment key={`xt-${i}`}>
                                                        <Line x1={xi} y1={yPxMax} x2={xi} y2={yPxMax + 6} stroke={colors.charcoal} strokeWidth={1} />
                                                        <SvgText
                                                            x={xi}
                                                            y={yPxMax + 18}
                                                            fontSize={9}
                                                            fill={colors.charcoal}
                                                            textAnchor="middle"
                                                            transform={`rotate(-45 ${xi} ${yPxMax + 18})`}
                                                        >
                                                            {fmt(r.dateISO)}
                                                        </SvgText>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </>
                                    );
                                })()}

                                {/* axes + y labels */}
                                <Line x1={xPxMin} y1={yPxMin} x2={xPxMin} y2={yPxMax} stroke={colors.charcoal} strokeWidth={1.5} />
                                <Line x1={xPxMin} y1={yPxMax} x2={xPxMax} y2={yPxMax} stroke={colors.charcoal} strokeWidth={1.5} />

                                {[0, 1, 2, 3, 4].map((i) => {
                                    const yVal = yMax - (i * (yMax - yMin)) / 4;
                                    const yTick = yPxMin + (i * chartH) / 4;
                                    return (
                                        <SvgText
                                            key={`yl-${i}`}
                                            x={xPxMin - 4}
                                            y={yTick + 3}
                                            fontSize={10}
                                            fill={colors.charcoal}
                                            textAnchor="end"
                                        >
                                            {Math.round(unit === "lb" ? yVal : lbToKg(yVal))}
                                        </SvgText>
                                    );
                                })}
                            </Svg>
                        </View>

                        {/* Stats */}
                        <View style={{ marginTop: 8, gap: 6 }}>
                            <RowStat
                                label="AVG WEEKLY CHANGE:"
                                value={`${weeklyDisplay >= 0 ? "+" : ""}${weeklyDisplay.toFixed(1)} ${unit}`}
                            />
                            <RowStat
                                label="LOWEST:"
                                value={`${showValue(Math.min(...sorted.map((r) => r.weightLb)))} ${unit}`}
                            />
                            <RowStat
                                label="HIGHEST:"
                                value={`${showValue(Math.max(...sorted.map((r) => r.weightLb)))} ${unit}`}
                            />
                        </View>
                    </View>
                )}
            </Card>

            <Text style={[type.h2, { marginTop: 12, color: colors.charcoal }]}>HISTORY</Text>
        </View>
    );

    return (
        <Screen scroll={false}>
            <FlatList
                data={listData}
                keyExtractor={(i) => i.id}
                ListHeaderComponent={Header}
                contentContainerStyle={{ paddingBottom: 100 }}
                renderItem={({ item }) => (
                    <Card
                        style={{
                            marginTop: 6,
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <View>
                            <Text style={[type.bodyBold, { color: colors.charcoal }]}>
                                {showValue(item.weightLb)} {unit}
                            </Text>
                            <Text style={[type.body, { color: colors.muted }]}>
                                {new Date(item.dateISO).toLocaleDateString()}
                            </Text>
                        </View>
                        <Pressable
                            onPress={() => onDelete(item.id)}
                            style={{
                                paddingVertical: 6,
                                paddingHorizontal: 10,
                                backgroundColor: "#e8b3b3",
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 6,
                            }}
                        >
                            <Text style={[type.bodyBold, { color: colors.charcoal }]}>Delete</Text>
                        </Pressable>
                    </Card>
                )}
                ListEmptyComponent={
                    <Card style={{ marginTop: 6 }}>
                        <Text style={[type.body, { color: colors.muted, textAlign: "center", paddingVertical: 16 }]}>
                            No entries yet.
                        </Text>
                    </Card>
                }
                keyboardShouldPersistTaps="handled"
            />
        </Screen>
    );
}

function RowStat({ label, value }: { label: string; value: string }) {
    return (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={[type.bodyBold, { color: colors.charcoal }]}>{label}</Text>
            <Text style={[type.bodyBold, { color: colors.crimson }]}>{value}</Text>
        </View>
    );
}

/* ======================= CREATINE (FlatList with header-only) ======================= */

function CreatineView({ top }: { top: React.ReactNode }) {
    const [gridWidth, setGridWidth] = useState<number | null>(null)
    const [rawLog, setRawLog] = useState<Array<{ id: string; dateISO: string; taken: boolean }>>([]);
    const [month, setMonth] = useState(new Date());

    const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
    const isSameMonth = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

    const goToToday = () => setMonth(startOfMonth(new Date()));
    const atCurrentMonth = isSameMonth(month, new Date());

    const log = useMemo(
        () => rawLog.map(r => ({ ...r, dateISO: normalizeKey(r.dateISO) })),
        [rawLog]
    );

    useEffect(() => {
        refresh();
    }, []);
    async function refresh() {
        setRawLog(await listCreatine());
    }

    const todayISO = localDateKey(new Date());
    async function toggleToday() {
        const cur = log.find((r) => r.dateISO === todayISO)?.taken ?? false;
        await setCreatine(todayISO, !cur);
        await refresh();
    }

    function monthDays(date: Date) {
        const y = date.getFullYear(),
            m = date.getMonth();
        const first = new Date(y, m, 1);
        const last = new Date(y, m + 1, 0);
        const pad = Array(first.getDay()).fill(null);
        const days = Array.from({ length: last.getDate() }, (_, i) => i + 1);
        return pad.concat(days);
    }

    function monthStats(date: Date) {
        const y = date.getFullYear(),
            m = date.getMonth();
        const days = new Date(y, m + 1, 0).getDate();
        let taken = 0;
        for (let i = 1; i <= days; i++) {
            const iso = localDateKey(new Date(y, m, i));
            if (log.find((r) => r.dateISO === iso && r.taken)) taken++;
        }
        return { taken, total: days };
    }

    function currentStreak(): number {
        let streak = 0;
        const d = new Date();
        for (; ;) {
            const iso = localDateKey(d);
            const ok = !!log.find((r) => r.dateISO === iso && r.taken);
            if (!ok) break;
            streak++;
            d.setDate(d.getDate() - 1);
        }
        return streak;
    }

    const days = monthDays(month);
    const stats = monthStats(month);
    const streak = currentStreak();

    const Header = (
        <View>
            {top}

            <Card style={{ marginTop: 8, padding: 12 }}>
                {/* Month controls */}
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                    }}
                >
                    <Pressable
                        onPress={() => {
                            const d = new Date(month);
                            d.setMonth(d.getMonth() - 1);
                            setMonth(startOfMonth(d));
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Previous month"
                    >
                        <Text style={[type.bodyBold, { color: colors.charcoal }]}>←</Text>
                    </Pressable>

                    <Text style={[type.h2, { color: colors.charcoal }]}>
                        {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                    </Text>

                    <Pressable
                        onPress={() => {
                            const d = new Date(month);
                            d.setMonth(d.getMonth() + 1);
                            setMonth(startOfMonth(d));
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Next month"
                    >
                        <Text style={[type.bodyBold, { color: colors.charcoal }]}>→</Text>
                    </Pressable>
                </View>

                {/* Today button UNDER the month bar */}
                <View style={{ alignItems: "center", marginBottom: 10 }}>
                    <Pressable
                        onPress={goToToday}
                        disabled={atCurrentMonth}
                        accessibilityRole="button"
                        accessibilityLabel="Go to current month"
                        style={{
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 999,
                            backgroundColor: colors.crimson,
                            opacity: atCurrentMonth ? 0.5 : 1,
                        }}
                    >
                        <Text style={[type.bodyBold, { color: "white" }]}>Skip Back to Today</Text>
                    </Pressable>
                </View>

                {/* Week headers */}
                <View style={{ flexDirection: "row", gap: 4, marginBottom: 6 }}>
                    {["Su", "M", "T", "W", "Th", "F", "Sa"].map((d) => (
                        <View key={d} style={{ flex: 1, alignItems: "center" }}>
                            <Text style={[type.body, { color: colors.muted }]}>{d}</Text>
                        </View>
                    ))}
                </View>

                <View
                    onLayout={(e) => {
                        // Save the inner width of the grid for exact calc
                        const w = e.nativeEvent.layout.width;
                        setGridWidth(w);
                    }}
                    style={{ flexDirection: "row", flexWrap: "wrap", columnGap: GAP, rowGap: GAP }}
                >
                    {/* Calendar grid - 7 columns, square cells */}
                    {gridWidth != null && days.map((day, i) => {
                        const cell = (gridWidth - GAP * (COLS - 1)) / COLS;
                        if (!day) {
                            return <View key={`pad-${i}`} style={{ width: cell, aspectRatio: 1 }} />;
                        }
                        const iso = localDateKey(new Date(month.getFullYear(), month.getMonth(), day));
                        const rec = log.find((r) => r.dateISO === iso);
                        const taken = !!rec?.taken;
                        const isToday = iso === todayISO;

                        return (
                            <View
                                key={`d-${i}`}
                                style={{
                                    width: cell,
                                    aspectRatio: 1,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    backgroundColor: isToday ? "#f6eaea" : colors.card,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Text style={[type.bodyBold, { color: colors.muted }]}>{day}</Text>
                                <Text style={[type.bodyBold, { color: taken ? colors.crimson : colors.muted }]}>
                                    {taken ? "✓" : rec ? "×" : " "}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Stats */}
                <View style={{ marginTop: 12, gap: 6 }}>
                    <RowStat label="THIS MONTH:" value={`${stats.taken}/${stats.total} DAYS`} />
                    <RowStat label="CURRENT STREAK:" value={`${streak} DAYS`} />
                </View>
            </Card>

            <Button
                title={log.find((r) => r.dateISO === todayISO && r.taken) ? "MARK AS NOT TAKEN TODAY" : "MARK AS TAKEN TODAY"}
                onPress={toggleToday}
                style={{ marginTop: 10 }}
            />
        </View>
    );

    // Use a FlatList with only a header so the page still scrolls
    return (
        <Screen scroll={false}>
            <FlatList
                data={[]}
                keyExtractor={(_, idx) => String(idx)}
                ListHeaderComponent={Header}
                contentContainerStyle={{ paddingBottom: 100 }}
                renderItem={null as any}
            />
        </Screen>
    );
}
