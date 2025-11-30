import { useState } from "react";

export default function TrackScreen() {
  const [activeTab, setActiveTab] = useState<"bodyweight" | "creatine">("bodyweight");

  return (
    <div className="min-h-screen bg-background px-4 pt-14">
      <h1 className="font-bebas text-4xl text-charcoal uppercase tracking-wide mb-6">Track</h1>

      {/* Tab Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("bodyweight")}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold uppercase tracking-wide transition-colors ${
            activeTab === "bodyweight"
              ? "bg-crimson text-white"
              : "bg-card text-charcoal border border-border hover:bg-gray-50"
          }`}
        >
          Bodyweight
        </button>
        <button
          onClick={() => setActiveTab("creatine")}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold uppercase tracking-wide transition-colors ${
            activeTab === "creatine"
              ? "bg-crimson text-white"
              : "bg-card text-charcoal border border-border hover:bg-gray-50"
          }`}
        >
          Creatine
        </button>
      </div>

      {/* Content */}
      {activeTab === "bodyweight" ? (
        <div>
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="font-bebas text-xl text-charcoal uppercase mb-4">Log Bodyweight</h2>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-charcoal mb-2">WEIGHT (LB)</label>
                <input
                  type="number"
                  placeholder="180"
                  className="w-full bg-background border border-border rounded-lg p-3"
                />
              </div>
              <button className="bg-crimson hover:bg-crimson/90 text-white font-bold py-3 px-6 rounded-lg uppercase">
                Add
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-bebas text-xl text-charcoal uppercase mb-4">History</h2>
            <p className="text-muted text-center">No entries yet</p>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="font-bebas text-xl text-charcoal uppercase mb-4">Today</h2>
            <button className="w-full bg-crimson hover:bg-crimson/90 text-white font-bold py-4 px-6 rounded-lg uppercase">
              Mark Taken
            </button>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-bebas text-xl text-charcoal uppercase mb-4">This Week</h2>
            <div className="grid grid-cols-7 gap-2">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                <div key={i} className="text-center">
                  <p className="text-xs text-muted mb-1">{day}</p>
                  <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center">
                    <span className="text-xs">-</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
