// src/services/api.ts
import {
  addDoc,
  collection,
  deleteDoc, doc,
  getDoc,
  getDocs,
  onSnapshot,
  query, /* orderBy, limit, */
  serverTimestamp,
  setDoc,
  where
} from "firebase/firestore";
import { SetRecord } from "../lib/lift";
import { auth, db } from "./firebase";

export const DEFAULT_EXERCISES = [
    "Squat",
    "Bench Press",
    "Deadlift",
    "Overhead Press",
    "Barbell Row",
    "Pull-Up",
    "Incline Bench",
    "Front Squat",
    "Romanian Deadlift",
    "Dumbbell Bench Press",
];
  
  const u = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Not signed in");
    return {
      exercises: collection(db, "users", uid, "exercises"),
      sets:      collection(db, "users", uid, "sets"),
      xp:        collection(db, "users", uid, "xp_events"),
      bw:        collection(db, "users", uid, "bodyweight"),
      creatine:  collection(db, "users", uid, "creatine"),
      path: (sub: string, id: string) => doc(db, "users", uid, sub, id),
      deletedDefaultsDoc: doc(db, "users", uid, "prefs", "deleted_defaults"),
      custom: collection(db, "users", uid, "exercises_custom"),
    };
  };

  const TAG_LIST = "[listExercisesMerged]";

function showAlert(label: string, message: string) {
  const text = `${label} ${message}`;
  if (typeof alert === "function") {
    alert(text);
  }
}
  
  /** Merge = (defaults - deleted) ∪ custom, sorted */
  export async function listExercisesMerged(): Promise<string[]> {
    showAlert(TAG_LIST, "START: listExercisesMerged called");
  
    try {
      const { custom, deletedDefaultsDoc } = u();
      if (!custom || !deletedDefaultsDoc) {
        showAlert(
          TAG_LIST,
          "ERROR: u() did not return expected refs (custom/deletedDefaultsDoc)."
        );
        throw new Error("Invalid Firestore refs from u()");
      }
  
      // ---------- Load custom exercises ----------
      let customNames: string[] = [];
      try {
        showAlert(TAG_LIST, "Fetching custom exercises via getDocs(custom)...");
        const customSnap = await getDocs(custom);
        customNames = customSnap.docs
          .map((d) => {
            const data: any = d.data() || {};
            return typeof data.name === "string" ? data.name.trim() : "";
          })
          .filter((n) => !!n);
        showAlert(
          TAG_LIST,
          `Custom fetch OK. Count=${customNames.length}`
        );
      } catch (err: any) {
        const code = err?.code ?? "no-code";
        const msg = err?.message ?? String(err);
        showAlert(
          TAG_LIST,
          `ERROR: getDocs(custom) failed.\ncode=${code}\nmessage=${msg}\n` +
            "Proceeding with customNames = []."
        );
        customNames = [];
      }
  
      // ---------- Load deleted defaults list ----------
      let deleted: string[] = [];
      try {
        showAlert(
          TAG_LIST,
          "Fetching deleted defaults doc via getDoc(deletedDefaultsDoc)..."
        );
        const delSnap = await getDoc(deletedDefaultsDoc);
        if (delSnap.exists()) {
          const data: any = delSnap.data() || {};
          const names = Array.isArray(data.names) ? data.names : [];
          deleted = names
            .map((n: any) => (typeof n === "string" ? n : ""))
            .filter((n: any) => !!n);
          showAlert(
            TAG_LIST,
            `Deleted defaults doc exists. Deleted count=${deleted.length}`
          );
        } else {
          showAlert(
            TAG_LIST,
            "Deleted defaults doc does not exist. Treating as no deleted defaults."
          );
          deleted = [];
        }
      } catch (err: any) {
        const code = err?.code ?? "no-code";
        const msg = err?.message ?? String(err);
        showAlert(
          TAG_LIST,
          `ERROR: getDoc(deletedDefaultsDoc) failed.\ncode=${code}\nmessage=${msg}\n` +
            "Treating deleted defaults as []."
        );
        deleted = [];
      }
  
      // ---------- Merge logic ----------
      const defaultsKept = DEFAULT_EXERCISES.filter(
        (name) => !deleted.includes(name)
      );
      const merged = Array.from(
        new Set([...defaultsKept, ...customNames])
      ).sort((a, b) => a.localeCompare(b));
  
      showAlert(
        TAG_LIST,
        [
          "SUCCESS: listExercisesMerged computed.",
          `defaultsKept=${defaultsKept.length}`,
          `customNames=${customNames.length}`,
          `deleted=${deleted.length}`,
          `merged(total)=${merged.length}`,
        ].join("\n")
      );
  
      return merged;
    } catch (err: any) {
      const code = err?.code ?? "no-code";
      const msg = err?.message ?? String(err);
  
      showAlert(
        TAG_LIST,
        `FATAL ERROR in listExercisesMerged.\ncode=${code}\nmessage=${msg}`
      );
  
      // Safe fallback: just return sorted defaults so UI doesn't explode
      const fallback = [...DEFAULT_EXERCISES].sort((a, b) =>
        a.localeCompare(b)
      );
      showAlert(
        TAG_LIST,
        `Returning FALLBACK defaults only. Count=${fallback.length}`
      );
  
      return fallback;
    }
  }
  
  /** Add custom exercise (dedupe vs defaults & customs) */
  export async function addCustomExercise(nameRaw: string) {
    const name = nameRaw.trim();
    if (!name) return;
  
    // if it matches a default that is deleted, "restore" instead of creating custom
    if (DEFAULT_EXERCISES.includes(name)) {
      await restoreDefaultExercise(name);
      return;
    }
  
    // prevent dup with existing custom
    const current = await listExercisesMerged();
    if (current.includes(name)) return;
  
    await addDoc(u().custom, { name, createdAt: serverTimestamp() });
  }
  
  /** Delete exercise:
   * - if default -> record it in deleted_defaults.names
   * - if custom  -> remove the doc from exercises_custom
   */
  export async function deleteExercise(name: string) {
    const { custom, deletedDefaultsDoc } = u();
  
    if (DEFAULT_EXERCISES.includes(name)) {
      const snap = await getDoc(deletedDefaultsDoc);
      const current: string[] = snap.exists() ? (snap.data()?.names ?? []) : [];
      if (!current.includes(name)) {
        await setDoc(deletedDefaultsDoc, { names: [...current, name] }, { merge: true });
      }
      return;
    }
  
    // delete a custom exercise by name
    const customSnap = await getDocs(custom);
    const match = customSnap.docs.find((d) => (d.data() as any).name === name);
    if (match) await deleteDoc(match.ref);
  }
  
  /** Restore a default that was deleted */
  export async function restoreDefaultExercise(name: string) {
    if (!DEFAULT_EXERCISES.includes(name)) return;
    const { deletedDefaultsDoc } = u();
    const snap = await getDoc(deletedDefaultsDoc);
    if (!snap.exists()) return; // nothing to restore
    const current: string[] = snap.data()?.names ?? [];
    const next = current.filter((n) => n !== name);
    await setDoc(deletedDefaultsDoc, { names: next }, { merge: true });
  }
  
  /** ---------- Sets / Log ---------- */
  export async function addSetFS(exercise: string, weight: number, reps: number, dateISO: string) {
    return addDoc(u().sets, { exercise, weight, reps, dateISO, ts: serverTimestamp() });
  }
  
  export async function deleteSetFS(id: string) {
    await deleteDoc(u().path("sets", id));
  }
  
  export async function listTodaySets(): Promise<SetRecord[]> {
    const today = new Date().toISOString().slice(0,10);
    const q = query(u().sets, where("dateISO","==",today));
    const snap = await getDocs(q);
    const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as SetRecord[];
    // Sort locally by ts desc, then fallback to dateISO if needed
    return rows.sort((a, b) => (b.ts?.toMillis?.() ?? 0) - (a.ts?.toMillis?.() ?? 0));
  }
  
  export async function listSetsByExercise(exercise: string): Promise<SetRecord[]> {
    const q = query(u().sets, where("exercise","==",exercise));
    const snap = await getDocs(q);
    const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as SetRecord[];
    // Sort locally by timestamp ascending (or change to desc if you prefer)
    return rows.sort((a, b) => (a.ts?.toMillis?.() ?? 0) - (b.ts?.toMillis?.() ?? 0));
  }
  
  /** Last session = most recent date (before today) that has sets for this exercise */
  export async function getLastSessionSets(exercise: string): Promise<SetRecord[]> {
    const rows = await listSetsByExercise(exercise); // already sorted asc by ts
    // Find the latest dateISO present (excluding today)
    const today = new Date().toISOString().slice(0,10);
    const byDate = new Map<string, SetRecord[]>();
    rows.forEach(r => {
      if (!byDate.has(r.dateISO)) byDate.set(r.dateISO, []);
      byDate.get(r.dateISO)!.push(r);
    });
    const dates = Array.from(byDate.keys()).filter(d => d !== today).sort((a,b) => a.localeCompare(b));
    const lastDate = dates[dates.length - 1];
    return lastDate ? byDate.get(lastDate)! : [];
  }
  
  /** Day PRs and all-time PR computed client-side */
  export async function getAllDayPRs(exercise: string) {
    const sets = await listSetsByExercise(exercise); // already sorted asc by ts
    const byDate = new Map<string, SetRecord[]>();
    sets.forEach(s => {
      if (!byDate.has(s.dateISO)) byDate.set(s.dateISO, []);
      byDate.get(s.dateISO)!.push(s);
    });
    return Array.from(byDate.entries()).map(([dateISO, items]) => {
      const best = items.reduce((m, s) => Math.max(m, Math.round(s.weight * (1 + s.reps / 30))), 0);
      return { dateISO, maxRM: best };
    }).sort((a,b) => a.dateISO.localeCompare(b.dateISO));
  }
  export async function getAllTimePR(exercise: string) {
    const dayPRs = await getAllDayPRs(exercise);
    if (dayPRs.length === 0) return null;
    return dayPRs.reduce((a,b) => (b.maxRM > a.maxRM ? b : a));
  }
  
  /** ---------- XP ---------- */
  export async function addXP(amount: number, reason: string, exercise?: string) {
    return addDoc(u().xp, { amount, reason, exercise: exercise ?? null, ts: serverTimestamp() });
  }
  export async function listRecentXP(limitN = 50) {
    // no orderBy; we sort locally
    const snap = await getDocs(u().xp);
    const result = snap.docs
      .map(d => ({ id: d.id, ...(d.data() as any) }))
      .sort((a, b) => (b.ts?.toMillis?.() ?? 0) - (a.ts?.toMillis?.() ?? 0))
      .slice(0, limitN);
    return result;
  }
  
  /** ---------- Bodyweight ---------- */
  export async function addBodyweightLb(weightLb: number, dateISO: string) {
    return addDoc(u().bw, { weightLb, dateISO, ts: serverTimestamp() });
  }
  export async function listBodyweight() {
    const snap = await getDocs(u().bw);
    const results = snap.docs
    .map(d => ({ id: d.id, ...(d.data() as any) }))
    .sort((a, b) => (a.dateISO ?? "").localeCompare(b.dateISO ?? ""));
    return results
  }
  export async function deleteBodyweight(id: string) {
    await deleteDoc(u().path("bodyweight", id));
  }
  
  /** ---------- Creatine ---------- */
  export async function setCreatine(dateISO: string, taken: boolean) {
    await setDoc(u().path("creatine", dateISO), { dateISO, taken }, { merge: true });
  }
  export async function listCreatine() {
    const snap = await getDocs(u().creatine);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  }
  
  /** ---------- Realtime (no index) ---------- */
  // We can still use onSnapshot with a simple where and sort locally
  export function onTodaySets(cb: (rows: SetRecord[]) => void) {
    const today = new Date().toISOString().slice(0,10);
    const q = query(u().sets, where("dateISO","==",today));
    return onSnapshot(q, (snap) => {
      const arr = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as SetRecord[];
      arr.sort((a, b) => (b.ts?.toMillis?.() ?? 0) - (a.ts?.toMillis?.() ?? 0));
      cb(arr);
    });
  }
  