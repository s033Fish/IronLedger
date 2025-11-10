export type SetRecord = {
    id: string; // uuid
    dateISO: string; // e.g., 2025-10-20T14:12:00.000Z
    exercise: string;
    weight: number; // lbs
    reps: number; // integer
    };
    
    
export type XPEvent = {
    id: string; // uuid
    dateISO: string;
    type: "SET" | "PR";
    amount: number; // +2 or +10
    note?: string; // optional context
};

export type BodyweightRecord = {
    id: string;
    dateISO: string; // YYYY-MM-DD
    weightLb: number; // store canonical in lb
    timestamp: number; // ms epoch for sorting (optional convenience)
};
      
export type CreatineRecord = {
    dateISO: string; // YYYY-MM-DD
    taken: boolean;
};
      
export type WeightUnit = "lb" | "kg";
      