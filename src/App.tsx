import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthGate } from "./context/AuthGate";
import { AppProvider } from "./context/AppContext";
import Layout from "./components/Layout";
import LogScreen from "./pages/LogScreen";
import HistoryScreen from "./pages/HistoryScreen";
import CoachScreen from "./pages/CoachScreen";
import TrackScreen from "./pages/TrackScreen";
import ExercisesScreen from "./pages/ExercisesScreen";

function App() {
  return (
    <Router>
      <AuthGate>
        <AppProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<LogScreen />} />
              <Route path="/history" element={<HistoryScreen />} />
              <Route path="/coach" element={<CoachScreen />} />
              <Route path="/track" element={<TrackScreen />} />
              <Route path="/exercises" element={<ExercisesScreen />} />
            </Routes>
          </Layout>
        </AppProvider>
      </AuthGate>
    </Router>
  );
}

export default App;
