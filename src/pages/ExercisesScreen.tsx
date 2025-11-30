import { useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";

const DEFAULT_EXERCISES = [
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

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState(DEFAULT_EXERCISES);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExercise, setNewExercise] = useState("");

  const filteredExercises = exercises.filter((ex) =>
    ex.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (newExercise.trim() && !exercises.includes(newExercise.trim())) {
      setExercises([...exercises, newExercise.trim()].sort());
      setNewExercise("");
      setShowAddModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 pt-14">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bebas text-4xl text-charcoal uppercase tracking-wide">Exercises</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-crimson hover:bg-crimson/90 text-white p-2 rounded-lg"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises..."
          className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-3"
        />
      </div>

      {/* Exercise List */}
      <div className="space-y-2">
        {filteredExercises.map((exercise) => (
          <div
            key={exercise}
            className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-charcoal">{exercise}</span>
            <button
              onClick={() => setExercises(exercises.filter((ex) => ex !== exercise))}
              className="text-muted hover:text-crimson transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-background border-t border-border rounded-t-2xl p-6 w-full max-w-lg">
            <h2 className="font-bebas text-2xl text-charcoal uppercase mb-4">Add Exercise</h2>
            <input
              type="text"
              value={newExercise}
              onChange={(e) => setNewExercise(e.target.value)}
              placeholder="Exercise name"
              className="w-full bg-card border border-border rounded-lg p-3 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-charcoal font-bold py-3 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 bg-crimson hover:bg-crimson/90 text-white font-bold py-3 rounded-lg"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
