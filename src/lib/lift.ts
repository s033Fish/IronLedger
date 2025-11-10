export type SetRecord = {
    id: string;
    exercise: string;
    weight: number;
    reps: number;
    dateISO: string;   // yyyy-mm-dd
    ts?: any;          // Firestore timestamp
  };
  
  export const epley1RM = (w: number, r: number) => Math.round(w * (1 + r / 30));
  export const isoToday = () => new Date().toISOString().slice(0, 10);
  