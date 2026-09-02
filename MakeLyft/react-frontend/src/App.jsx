import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AuthPortal from "./components/AuthPortal";
import Dashboard from "./components/Dashboard/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import AlertModal from "./components/Dashboard/AlertModal";
import AIAssistant from "./components/Dashboard/AIAssistant";
import "./App.css";
import SplashScreen from "./components/SplashScreen";

// ─── DB VERSION GUARD ──────────────────────────────────────────────────────────
// Increment this number every time you run seed.js so stale tokens get cleared.
const APP_DB_VERSION = "3";
const storedVersion = localStorage.getItem("db_version");
if (storedVersion !== APP_DB_VERSION) {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.setItem("db_version", APP_DB_VERSION);
  console.log("[MakeLyft] DB version changed — cleared stale session.");
}
// ──────────────────────────────────────────────────────────────────────────────

// We extract the routes into a separate component so we can use the `useNavigate` hook 
// (which must be inside a <Router> context).
function AppRoutes() {
  const navigate = useNavigate();

  const handleLoginSuccess = (profile) => {
    console.log("Logged in:", profile);
    if (profile.role === 'admin') {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/auth" element={<div className="flex items-center justify-center min-h-screen w-full"><AuthPortal onLoginSuccess={handleLoginSuccess} /></div>} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen w-full page-transition" style={{background: 'var(--bg-base)'}}>
        <AppRoutes />
      </div>
      <AlertModal />
      <AIAssistant />
    </Router>
  );
}

export default App;
