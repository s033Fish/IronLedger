export function toYMD(dateISO: string): string {
    const d = new Date(dateISO);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
}
    
    
export function prettyDate(dateISO: string): string {
    const d = new Date(dateISO);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function toDateSafe(x: any): Date | null {
    if (!x) return null;
    if (typeof x?.toDate === "function") {
      const d = x.toDate();
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof x === "number") {
      const d = new Date(x);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof x === "string") {
      // If it's just YYYY-MM-DD, there’s no time to show
      if (/^\d{4}-\d{2}-\d{2}$/.test(x)) return null;
      const d = new Date(x);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }
    
    
  export function prettyTime(x: any, opts?: { dateOnlyIfNoTime?: boolean }) {
    const d = toDateSafe(x);
    if (!d) return "—";
    // If the input was date-only, toDateSafe created a noon-UTC date; show just the date.
    if (opts?.dateOnlyIfNoTime) return d.toLocaleDateString();
    return d.toLocaleString();
  }
  
  export function prettyTimeOnly(x: any): string {
    const d = toDateSafe(x);
    if (!d) return "—";
  
    // Try locale API first
    try {
      return d.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true, // gives "8:53 PM"
      });
    } catch {
      // Fallback if RN environment ignores options
      let h = d.getHours();
      const m = d.getMinutes();
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      const mm = m < 10 ? `0${m}` : `${m}`;
      return `${h}:${mm} ${ampm}`;
    }
  }