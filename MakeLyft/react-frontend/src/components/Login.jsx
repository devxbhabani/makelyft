import React, { useState } from "react";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Shield } from "lucide-react";

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "var(--text-2)" }}>
      {label}
    </label>
    {children}
  </div>
);

function Login({ onSwitchToSignup, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("Odoo");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [resolvedEmail, setResolvedEmail] = useState("");

  const inputStyle = {
    width: "100%",
    padding: "9px 12px 9px 36px",
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text)",
    fontFamily: "inherit",
    fontSize: "0.875rem",
    outline: "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  };

  const onFocus = (e) => {
    e.target.style.borderColor = "var(--border-focus)";
    e.target.style.boxShadow = "0 0 0 3px rgba(24,24,27,0.06)";
  };
  const onBlur = (e) => {
    e.target.style.borderColor = "var(--border)";
    e.target.style.boxShadow = "none";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields"); return; }
    if (!email.includes("@")) { setError("Please enter a valid email"); return; }
    setIsLoading(true);
    fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, organization }),
    })
      .then((r) => r.ok ? r.json() : r.json().then((d) => { throw new Error(d.message || d.error || "Login failed"); }))
      .then((data) => {
        setIsLoading(false);
        if (data.requires2FA) { setShowOtp(true); setResolvedEmail(data.resolvedEmail || email); }
        else if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          onLoginSuccess?.({ ...data.user, organization });
        }
      })
      .catch((err) => { setIsLoading(false); setError(err.message || "Something went wrong."); });
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!otp) { setError("Please enter the OTP"); return; }
    setIsLoading(true);
    fetch("/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resolvedEmail, otp }),
    })
      .then((r) => r.ok ? r.json() : r.json().then((d) => { throw new Error(d.message || "Invalid OTP"); }))
      .then((data) => {
        setIsLoading(false);
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          onLoginSuccess?.({ ...data.user, organization });
        }
      })
      .catch((err) => { setIsLoading(false); setError(err.message || "Invalid OTP."); });
  };

  return (
    <div className="w-full max-w-sm animate-fade-up">
      {/* Heading */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", margin: "0 0 4px" }}>
          {showOtp ? "Check your email" : "Sign in"}
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-2)", margin: 0 }}>
          {showOtp
            ? <>Code sent to <span style={{ color: "var(--text)" }}>{resolvedEmail}</span></>
            : "Enter your credentials to continue"}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="animate-fade-up"
          style={{
            marginBottom: "16px",
            padding: "10px 12px",
            borderRadius: "8px",
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
            fontSize: "0.8rem",
            color: "var(--danger)",
          }}
        >
          {error}
        </div>
      )}

      {!showOtp ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Organization */}
          <Field label="Organization">
            <div style={{ position: "relative" }}>
              <select
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                style={{ ...inputStyle, paddingLeft: "36px", cursor: "pointer", appearance: "none" }}
                onFocus={onFocus} onBlur={onBlur}
              >
                <option value="Odoo">Odoo S.A.</option>
                <option value="Google">Google Inc.</option>
                <option value="Microsoft">Microsoft Corp.</option>
                <option value="Meta">Meta Platforms</option>
              </select>
              <Shield style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--text-3)", pointerEvents: "none" }} />
            </div>
          </Field>

          {/* Email */}
          <Field label="Email">
            <div style={{ position: "relative" }}>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              />
              <Mail style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--text-3)" }} />
            </div>
          </Field>

          {/* Password */}
          <Field label="Password">
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                style={{ ...inputStyle, paddingRight: "36px" }} onFocus={onFocus} onBlur={onBlur}
              />
              <Lock style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--text-3)" }} />
              <button
                type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex", padding: 2 }}
              >
                {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
              </button>
            </div>
          </Field>

          <button
            type="submit" disabled={isLoading}
            className="btn btn-primary w-full gap-2"
            style={{ padding: "10px", marginTop: "8px" }}
          >
            {isLoading
              ? <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} className="animate-spin" />
              : <><span>Continue</span><ArrowRight style={{ width: 15, height: 15 }} /></>}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-4 animate-fade-up">
          <Field label="6-digit code">
            <input
              type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
              placeholder="000000" maxLength={6}
              style={{
                ...inputStyle,
                paddingLeft: "12px",
                textAlign: "center",
                letterSpacing: "0.4em",
                fontSize: "1.25rem",
                fontWeight: 600,
              }}
              onFocus={onFocus} onBlur={onBlur}
            />
          </Field>
          <button
            type="submit" disabled={isLoading}
            className="btn btn-primary w-full gap-2"
            style={{ padding: "10px" }}
          >
            {isLoading
              ? <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} className="animate-spin" />
              : <><span>Verify</span><ArrowRight style={{ width: 15, height: 15 }} /></>}
          </button>
          <button
            type="button" onClick={() => setShowOtp(false)}
            style={{ background: "none", border: "none", cursor: "pointer", width: "100%", padding: "6px", fontSize: "0.8rem", color: "var(--text-3)", fontFamily: "inherit" }}
          >
            â† Back
          </button>
        </form>
      )}

      {/* Switch to signup */}
      {!showOtp && (
        <p style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border)", fontSize: "0.8rem", color: "var(--text-2)", textAlign: "center" }}>
          Don't have an account?{" "}
          <button
            onClick={onSwitchToSignup}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontWeight: 500, fontFamily: "inherit", fontSize: "inherit", padding: 0 }}
          >
            Sign up
          </button>
        </p>
      )}
    </div>
  );
}

export default Login;
