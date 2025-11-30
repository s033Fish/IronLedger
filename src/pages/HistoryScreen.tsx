import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function HistoryScreen() {
  const [exercise, setExercise] = useState("Squat");

  return (
    <div className="min-h-screen bg-background px-4 pt-14">
      <h1 className="font-bebas text-4xl text-charcoal uppercase tracking-wide mb-6">History</h1>

      {/* Exercise Selector */}
      <div className="mb-6">
        <button className="w-full bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <span className="font-semibold text-charcoal">{exercise}</span>
          <ChevronDown size={20} className="text-muted" />
        </button>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="font-bebas text-xl text-charcoal uppercase mb-4">Progress Chart</h2>
        <div className="h-48 flex items-center justify-center text-muted">
          No data to display
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted mb-1">All-Time PR</p>
          <p className="font-bebas text-2xl text-charcoal">-</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted mb-1">Total Sessions</p>
          <p className="font-bebas text-2xl text-charcoal">0</p>
        </div>
      </div>
    </div>
  );
}
