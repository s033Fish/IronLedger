import { useEffect, useState } from "react";
import { Plus, ChevronDown, Trophy } from "lucide-react";

export default function LogScreen() {
  const [exercise, setExercise] = useState("Squat");
  const [weight, setWeight] = useState(225);
  const [reps, setReps] = useState(5);
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  return (
    <div className="min-h-screen bg-background px-4 pt-14">
      <h1 className="font-bebas text-4xl text-charcoal uppercase tracking-wide mb-6">Log</h1>

      {/* XP Bar Placeholder */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bebas text-lg text-charcoal">LEVEL 1</span>
          <span className="text-sm text-muted">0 / 10 XP</span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-crimson" style={{ width: "0%" }} />
        </div>
      </div>

      {/* Exercise Selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-charcoal mb-2">EXERCISE</label>
        <button
          onClick={() => setShowExercisePicker(!showExercisePicker)}
          className="w-full bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <span className="font-semibold text-charcoal">{exercise}</span>
          <ChevronDown size={20} className="text-muted" />
        </button>
      </div>

      {/* Weight and Reps Input */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-2">WEIGHT (LB)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full bg-card border border-border rounded-lg p-4 text-charcoal font-semibold"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-2">REPS</label>
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(Number(e.target.value))}
            className="w-full bg-card border border-border rounded-lg p-4 text-charcoal font-semibold"
          />
        </div>
      </div>

      {/* Log Set Button */}
      <button className="w-full bg-crimson hover:bg-crimson/90 text-white font-bold py-4 px-6 rounded-lg uppercase tracking-wider transition-colors border border-border mb-6">
        Log Set
      </button>

      {/* Today's Sets */}
      <div className="mb-6">
        <h2 className="font-bebas text-2xl text-charcoal uppercase mb-3">Today's Sets</h2>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted text-center">No sets logged yet today.</p>
        </div>
      </div>
    </div>
  );
}
