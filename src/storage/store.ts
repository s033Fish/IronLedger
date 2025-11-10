import AsyncStorage from "@react-native-async-storage/async-storage";
import { BodyweightRecord, CreatineRecord, SetRecord, WeightUnit, XPEvent } from "../types";
import { KEYS } from "./keys";


const DEFAULT_EXERCISES = [
"Squat",
"Barbell Bench Press",
"Barbell Incline Bench Press",
"Dumbell Bench Press",
"Dumbell Incline Bench Press",
"Lat Pulldown",
"Deadlift",
"Overhead Press",
"Barbell Row",
"Lateral Raises",
"Shoulder Press",
"Lat Pullover",
"Cable Bicep Curls",
"Leg Curl",
"Leg Extension",
];

export async function loadSets(): Promise<SetRecord[]> {
    const raw = await AsyncStorage.getItem(KEYS.sets);
    return raw ? JSON.parse(raw) : [];
}


export async function saveSets(sets: SetRecord[]) {
    await AsyncStorage.setItem(KEYS.sets, JSON.stringify(sets));
}


export async function loadExercises(): Promise<string[]> {
    const raw = await AsyncStorage.getItem(KEYS.exercises);
    return raw ? JSON.parse(raw) : DEFAULT_EXERCISES;
}


export async function saveExercises(list: string[]) {
    await AsyncStorage.setItem(KEYS.exercises, JSON.stringify(list));
}


export async function loadXP(): Promise<number> {
    const raw = await AsyncStorage.getItem(KEYS.xpTotal);
    return raw ? Number(JSON.parse(raw)) : 0;
}


export async function saveXP(xp: number) {
    await AsyncStorage.setItem(KEYS.xpTotal, JSON.stringify(xp));
}


export async function loadLevel(): Promise<number> {
    const raw = await AsyncStorage.getItem(KEYS.level);
    return raw ? Number(JSON.parse(raw)) : 1;
}


export async function saveLevel(level: number) {
    await AsyncStorage.setItem(KEYS.level, JSON.stringify(level));
}


export async function loadLastLogDate(): Promise<string | null> {
    return (await AsyncStorage.getItem(KEYS.lastLogDate)) as string | null;
}


export async function saveLastLogDate(iso: string) {
    await AsyncStorage.setItem(KEYS.lastLogDate, iso);
}


export async function loadXPEvents(): Promise<XPEvent[]> {
    const raw = await AsyncStorage.getItem(KEYS.xpEvents);
    return raw ? JSON.parse(raw) : [];
}


export async function saveXPEvents(events: XPEvent[]) {
    await AsyncStorage.setItem(KEYS.xpEvents, JSON.stringify(events));
}

export async function loadBodyweight(): Promise<BodyweightRecord[]> {
    const raw = await AsyncStorage.getItem(KEYS.bodyweight);
    return raw ? JSON.parse(raw) : [];
  }
  
  export async function saveBodyweight(list: BodyweightRecord[]) {
    await AsyncStorage.setItem(KEYS.bodyweight, JSON.stringify(list));
  }
  
  export async function addBodyweightEntry(weightLb: number) {
    const list = await loadBodyweight();
    const now = new Date();
    const rec: BodyweightRecord = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      dateISO: now.toISOString().slice(0, 10),
      weightLb,
      timestamp: now.getTime(),
    };
    list.push(rec);
    await saveBodyweight(list);
    return rec;
  }
  
  export async function deleteBodyweightEntry(id: string) {
    const list = await loadBodyweight();
    await saveBodyweight(list.filter((r) => r.id !== id));
  }
  
  export function lbToKg(lb: number) { return lb * 0.45359237; }
  export function kgToLb(kg: number) { return kg / 0.45359237; }
  
  // Weekly avg change (lb). Positive = up.
  export async function weeklyWeightChangeLb(): Promise<number> {
    const list = (await loadBodyweight()).sort((a, b) => a.timestamp - b.timestamp);
    if (list.length < 2) return 0;
    const WEEK_MS = 7 * 24 * 3600 * 1000;
    const now = Date.now();
    const weekAgo = now - WEEK_MS;
    const recent = list.filter((r) => r.timestamp >= weekAgo);
    if (recent.length < 2) return 0;
    const first = recent[0].weightLb;
    const last = recent[recent.length - 1].weightLb;
    return (last - first);
  }
  
  export async function loadWeightUnit(): Promise<WeightUnit> {
    const raw = await AsyncStorage.getItem(KEYS.weightUnit);
    return (raw ? JSON.parse(raw) : "lb") as WeightUnit;
  }
  export async function saveWeightUnit(u: WeightUnit) {
    await AsyncStorage.setItem(KEYS.weightUnit, JSON.stringify(u));
  }
  
  // ---------- Creatine ----------
  export async function loadCreatine(): Promise<CreatineRecord[]> {
    const raw = await AsyncStorage.getItem(KEYS.creatine);
    return raw ? JSON.parse(raw) : [];
  }
  export async function saveCreatine(list: CreatineRecord[]) {
    await AsyncStorage.setItem(KEYS.creatine, JSON.stringify(list));
  }
  
  export async function toggleCreatineDay(dateISO: string, taken: boolean) {
    const list = await loadCreatine();
    const idx = list.findIndex((d) => d.dateISO === dateISO);
    if (idx >= 0) list[idx].taken = taken;
    else list.push({ dateISO, taken });
    await saveCreatine(list);
  }
  
  export async function getCreatineForDate(dateISO: string) {
    const list = await loadCreatine();
    return list.find((d) => d.dateISO === dateISO) || null;
  }
  
  export async function getCreatineStreak(): Promise<number> {
    // count consecutive taken days up to today
    const list = await loadCreatine();
    const map = new Map<string, boolean>();
    for (const r of list) map.set(r.dateISO, !!r.taken);
  
    let streak = 0;
    const d = new Date();
    for (;;) {
      const iso = d.toISOString().slice(0, 10);
      if (map.get(iso)) streak += 1;
      else break;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }