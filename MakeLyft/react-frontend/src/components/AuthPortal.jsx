import React, { useState } from "react";
import Login from "./Login";
import Signup from "./signup";
import { Users, Leaf, Shield, CheckCircle2 } from "lucide-react";

function AuthPortal({ onLoginSuccess }) {
  const [currentView, setCurrentView] = useState("login");
  const [userProfile, setUserProfile] = useState(null);

  const handleLogin = (profile) => {
    setUserProfile(profile);
    setCurrentView("success");
    onLoginSuccess?.(profile);
  };

  const handleSignup = (profile) => {
    setUserProfile(profile);
    setCurrentView("success");
    onLoginSuccess?.(profile);
  };

  const features = [
    { icon: Users, text: "Verified colleagues only" },
    { icon: Leaf,  text: "Reduce your carbon footprint" },
    { icon: Shield, text: "Live ride tracking & safe payments" },
  ];

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row w-full page-transition"
      style={{ background: "var(--bg)" }}
    >
      {/* ── Left panel ── */}
      <div
        className="md:w-1/2 flex flex-col justify-between p-10 md:p-16"
        style={{ borderRight: "1px solid var(--border)" }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 animate-fade-up">
          <div
            style={{
              width: 36, height: 36, borderRadius: 9,
              background: "var(--bg-hover)",
              border: "1px solid var(--border-focus)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
              <rect x="9" y="11" width="14" height="10" rx="2" />
              <circle cx="12" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            </svg>
          </div>
          <span style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>
            MakeLyft
          </span>
        </div>

        {/* Headline */}
        <div className="my-auto py-12 space-y-8 max-w-sm animate-fade-up" style={{ animationDelay: "0.06s" }}>
          <div className="space-y-3">
            <span
              style={{
                display: "inline-block",
                fontSize: "0.7rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--primary)",
                padding: "3px 10px",
                borderRadius: "9999px",
                background: "var(--primary-dim)",
                border: "1px solid var(--border)",
              }}
            >
              Enterprise Carpooling
            </span>
            <h1
              style={{
                fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                color: "var(--text)",
                margin: 0,
              }}
            >
              Commute together,{" "}
              <span style={{ color: "var(--text-2)" }}>save smarter.</span>
            </h1>
            <p style={{ fontSize: "0.9rem", color: "var(--text-2)", lineHeight: 1.65, margin: 0 }}>
              Share rides with verified colleagues. Cut costs, reduce congestion, and lower your carbon footprint.
            </p>
          </div>

          {/* Features */}
          <ul className="space-y-3">
            {features.map(({ icon: Icon, text }, i) => (
              <li
                key={text}
                className="flex items-center gap-3 animate-fade-up"
                style={{ animationDelay: `${0.1 + i * 0.07}s` }}
              >
                <div
                  style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon style={{ width: 14, height: 14, color: "var(--text-2)" }} />
                </div>
                <span style={{ fontSize: "0.875rem", color: "var(--text-2)" }}>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
          © {new Date().getFullYear()} MakeLyft · Powered by Odoo S.A.
        </p>
      </div>

      {/* ── Right panel ── */}
      <div
        className="md:w-1/2 flex items-center justify-center p-6 md:p-12"
        style={{ background: "var(--bg)" }}
      >
        {currentView === "login" && (
          <Login onSwitchToSignup={() => setCurrentView("signup")} onLoginSuccess={handleLogin} />
        )}
        {currentView === "signup" && (
          <Signup onSwitchToLogin={() => setCurrentView("login")} onSignupSuccess={handleSignup} />
        )}
        {currentView === "success" && (
          <div
            className="card modal-pop w-full max-w-sm p-8 space-y-5 text-center"
          >
            <div
              style={{
                width: 52, height: 52, borderRadius: 12,
                background: "var(--accent-dim)",
                border: "1px solid rgba(45,212,191,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto",
              }}
            >
              <CheckCircle2 style={{ width: 24, height: 24, color: "var(--accent)" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>
                You're in
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--text-2)", margin: 0 }}>
                Welcome, <strong style={{ color: "var(--text)" }}>{userProfile?.name || userProfile?.email}</strong>
              </p>
            </div>
            <div
              className="space-y-1.5 text-sm text-left"
              style={{
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "12px 14px",
              }}
            >
              {[["Organization", userProfile?.organization], ["Email", userProfile?.email], userProfile?.phone ? ["Phone", userProfile.phone] : null]
                .filter(Boolean).map(([k, v]) => (
                  <p key={k} style={{ margin: 0, color: "var(--text-2)", fontSize: "0.8rem" }}>
                    <span style={{ color: "var(--text)", fontWeight: 500 }}>{k}:</span> {v}
                  </p>
                ))}
            </div>
            <button
              className="btn btn-primary w-full"
              style={{ padding: "10px" }}
              onClick={() => { setCurrentView("login"); setUserProfile(null); }}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthPortal;
