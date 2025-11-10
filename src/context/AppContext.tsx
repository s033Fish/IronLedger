import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SetRecord, XPEvent } from "../types";
import {
loadExercises, loadLastLogDate, loadLevel, loadSets, loadXP, loadXPEvents,
saveExercises, saveLastLogDate, saveLevel, saveSets, saveXP, saveXPEvents,
} from "../storage/store";
import { epley1RM } from "../utils/epley";
import { toYMD } from "../utils/dates";
import { levelFromXP } from "../utils/leveling";


function uuid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// --- Derived helpers ---
function dayBest1RMForExercise(sets: SetRecord[], exercise: string, ymd: string): number | null {
    const day = sets.filter((s) => s.exercise === exercise && toYMD(s.dateISO) === ymd);
    if (!day.length) return null;
    return day.reduce((max, s) => Math.max(max, epley1RM(s.weight, s.reps)), 0);
}
    
    
function allTimeBest1RM(sets: SetRecord[], exercise: string): number | null {
    const list = sets.filter((s) => s.exercise === exercise);
    if (!list.length) return null;
    return list.reduce((max, s) => Math.max(max, epley1RM(s.weight, s.reps)), 0);
}
    
    
function lastSessionSummary(sets: SetRecord[], exercise: string): string | null {
    const filtered = sets.filter((s) => s.exercise === exercise).sort((a, b) => b.dateISO.localeCompare(a.dateISO));
    if (!filtered.length) return null;
    const latestYMD = toYMD(filtered[0].dateISO);
    const lastDay = filtered.filter((s) => toYMD(s.dateISO) === latestYMD).sort((a, b) => a.dateISO.localeCompare(b.dateISO));
    const parts = lastDay.map((s) => `${s.weight}×${s.reps}`);
    const dt = new Date(filtered[0].dateISO);
    return `${dt.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${parts.join(" • ")}`;
}
    
    
// --- Context types ---
interface AppState {
    sets: SetRecord[];
    exercises: string[];
    xp: number;
    level: number;
    xpEvents: XPEvent[];
    addExercise(name: string): Promise<void>;
    deleteExercise(name: string): Promise<void>;
    addSet(exercise: string, weight: number, reps: number): Promise<{ prHappened: boolean; dayBest: number | null; prevAllTime: number | null }>;
    deleteSet(id: string): Promise<void>;
    getDayBest(exercise: string, ymd: string): number | null;
    getAllTimeBest(exercise: string): number | null;
    getLastSessionSummary(exercise: string): string | null;
}

const Ctx = createContext<AppState | null>(null);
export const useApp = () => {
    const c = useContext(Ctx);
    if (!c) throw new Error("AppContext missing");
    return c;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sets, setSets] = useState<SetRecord[]>([]);
    const [exercises, setExercises] = useState<string[]>([]);
    const [xp, setXP] = useState(0);
    const [level, setLevel] = useState(1);
    const [xpEvents, setXPEvents] = useState<XPEvent[]>([]);
    
    
    useEffect(() => {
        (async () => {
          const [s, e, x, lvl, events] = await Promise.all([
            loadSets(), loadExercises(), loadXP(), loadLevel(), loadXPEvents(),
          ]);
          setSets(s);
          setExercises(e);
          setXP(x);
          setLevel(lvl);
          setXPEvents(events);
        })();
    }, []);
    
    
    // Persist on change (simple & safe)
    useEffect(() => { saveSets(sets); }, [sets]);
    useEffect(() => { saveExercises(exercises); }, [exercises]);
    useEffect(() => { saveXP(xp); }, [xp]);
    useEffect(() => { saveLevel(level); }, [level]);
    useEffect(() => { saveXPEvents(xpEvents); }, [xpEvents]);
    
    
    // keep level in sync with XP
    useEffect(() => {
        const { level: L } = levelFromXP(xp);
        setLevel(L);
    }, [xp]);

    const api = useMemo<AppState>(() => ({
        sets,
        exercises,
        xp,
        level,
        xpEvents,
        async addExercise(name: string) {
          const clean = name.trim();
            if (!clean) return;
            if (!exercises.includes(clean)) setExercises((prev) => [...prev, clean].sort());
          },
        async deleteExercise(name: string) {
          setExercises((prev) => prev.filter((e) => e !== name));
          // also keep sets (user may delete exercise but keep history)
        },
        async addSet(exercise: string, weight: number, reps: number) {
          const now = new Date().toISOString();
          const record: SetRecord = { id: uuid(), dateISO: now, exercise, weight, reps };
        
          setSets((prev) => [...prev, record]);
        
        
          // XP: +2 per set
          const setEvent: XPEvent = { id: uuid(), dateISO: now, type: "SET", amount: 2, note: `${exercise} ${weight}×${reps}` };
          setXP((x) => x + 2);
          setXPEvents((events) => [setEvent, ...events].slice(0, 200));
        
        
          // PR detection: compare today's day-best vs prior all-time best (before adding this set)
          const ymd = toYMD(now);
          const beforeAllTime = allTimeBest1RM(sets, exercise) ?? 0;
          const afterDayBest = dayBest1RMForExercise([...sets, record], exercise, ymd);
          const prHappened = (afterDayBest ?? 0) > beforeAllTime;
        
        
          if (prHappened) {
            const prEvent: XPEvent = { id: uuid(), dateISO: now, type: "PR", amount: 10, note: `${exercise} new PR` };
            setXP((x) => x + 10);
            setXPEvents((events) => [prEvent, ...events].slice(0, 200));
          }
        
        
          saveLastLogDate(now);
          return { prHappened, dayBest: afterDayBest, prevAllTime: beforeAllTime };
        },
        async deleteSet(id: string) {
          setSets((prev) => prev.filter((s) => s.id !== id));
        },
        getDayBest(exercise: string, ymd: string) { return dayBest1RMForExercise(sets, exercise, ymd); },
        getAllTimeBest(exercise: string) { return allTimeBest1RM(sets, exercise); },
        getLastSessionSummary(exercise: string) { return lastSessionSummary(sets, exercise); },
    }), [sets, exercises, xp, level, xpEvents]);
        
        
    return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
};