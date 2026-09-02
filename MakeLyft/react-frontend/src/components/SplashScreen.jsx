import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const SplashScreen = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(0); // 0=mount, 1=visible, 2=fadeout

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 6000);
    const t3 = setTimeout(() => navigate("/auth", { replace: true }), 6700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [navigate]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        transition: "opacity 0.7s ease",
        opacity: phase === 2 ? 0 : 1,
        zIndex: 50,
      }}
    >
      {/* Road + car */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: 0,
          right: 0,
          height: "48px",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Dashed road line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "repeating-linear-gradient(90deg, var(--border) 0 24px, transparent 24px 48px)",
          }}
        />

        {/* Car */}
        {phase >= 1 && (
          <div className="animate-slide-car" style={{ position: "absolute", bottom: "2px", display: "flex", alignItems: "center" }}>
            {/* Minimal car SVG */}
            <svg viewBox="0 0 80 32" width="80" height="36" style={{ transform: "scaleX(-1)", opacity: 0.9 }}>
              <rect x="8" y="14" width="64" height="14" rx="4" fill="#52525b" />
              <path d="M18 14 L22 6 L58 6 L62 14 Z" fill="#3f3f46" />
              <rect x="23" y="7" width="34" height="6" rx="2" fill="rgba(255,255,255,0.7)" />
              <circle cx="20" cy="28" r="5" fill="#18181b" />
              <circle cx="60" cy="28" r="5" fill="#18181b" />
              <rect x="70" y="18" width="4" height="6" rx="2" fill="rgba(255,230,120,0.9)" />
            </svg>
          </div>
        )}
      </div>

      {/* Logo + text */}
      <div
        style={{
          textAlign: "center",
          marginTop: "60px",
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-focus)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
            <rect x="9" y="11" width="14" height="10" rx="2" />
            <circle cx="12" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
          </svg>
        </div>

        <h1 style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.03em", margin: "0 0 6px" }}>
          MakeLyft
        </h1>
        <p style={{ fontSize: "0.8rem", color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
          Carpooling, simplified
        </p>

        {/* Loading dots */}
        <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginTop: "32px" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "var(--text-3)",
                animation: `blink 1.4s ease ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
