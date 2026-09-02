import React, { useState } from "react";
import { User, Mail, Lock, Phone, Shield, ArrowRight } from "lucide-react";

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "var(--text-2)" }}>
      {label}
    </label>
    {children}
  </div>
);

function checkPasswordStrength(password) {
  let score = 0;
  let feedback = [];
  if (!password) return { score: 0, strength: "Weak", feedback: [] };
  if (password.length > 8) score += 1;
  else feedback.push("Longer than 8 chars");
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  else feedback.push("Upper & lowercase");
  if (/\d/.test(password)) score += 1;
  else feedback.push("At least one number");
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push("Special character");
  let strength = "Weak";
  if (score >= 4) strength = "Strong";
  else if (score === 3) strength = "Medium";
  return { score, strength, feedback };
}

function Signup({ onSwitchToLogin, onSignupSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("Odoo");
  const [role, setRole] = useState("employee");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");

  const inputStyle = {
    width: "100%", padding: "9px 12px 9px 36px", background: "transparent",
    border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)",
    fontFamily: "inherit", fontSize: "0.875rem", outline: "none",
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
    if (!name || !email || !phone || !password || !confirmPassword) { setError("Please fill in all fields"); return; }
    if (!email.includes("@")) { setError("Please enter a valid corporate email"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (!agreeTerms) { setError("You must agree to the Terms of Service & Privacy Policy"); return; }
    setIsLoading(true);
    fetch("/auth/signup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, organization, role, password })
    })
      .then(res => {
        if (!res.ok) return res.json().then(data => { throw new Error(data.message || data.error || "Failed to sign up") });
        return res.json();
      })
      .then(data => {
        setIsLoading(false);
        if (data.requires2FA) { setShowOtp(true); }
        else if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          onSignupSuccess?.({ ...data.user, organization });
        }
      })
      .catch(err => { setIsLoading(false); setError(err.message || "Something went wrong."); });
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!otp) { setError("Please enter the OTP"); return; }
    setIsLoading(true);
    fetch("/auth/verify-signup-otp", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    })
      .then(res => {
        if (!res.ok) return res.json().then(data => { throw new Error(data.message || "Invalid OTP") });
        return res.json();
      })
      .then(data => {
        setIsLoading(false);
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          onSignupSuccess?.({ ...data.user, organization });
        }
      })
      .catch(err => { setIsLoading(false); setError(err.message || "Invalid OTP."); });
  };

  return (
    <div className="w-full max-w-md animate-fade-up">
      {/* Heading */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", margin: "0 0 4px" }}>
          {showOtp ? "Verify your email" : "Join MakeLyft"}
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-2)", margin: 0 }}>
          {showOtp ? `Code sent to ${email}` : "Create an account to start carpooling"}
        </p>
      </div>

      {error && (
        <div className="animate-fade-up" style={{ marginBottom: "16px", padding: "10px 12px", borderRadius: "8px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: "0.8rem", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {!showOtp ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <Field label="Full Name">
              <div style={{ position: "relative" }}>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                <User style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--text-3)" }} />
              </div>
            </Field>

            {/* Email */}
            <Field label="Corporate Email">
              <div style={{ position: "relative" }}>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                <Mail style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--text-3)" }} />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <Field label="Phone Number">
              <div style={{ position: "relative" }}>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000-0000" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                <Phone style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--text-3)" }} />
              </div>
            </Field>

            {/* Organization */}
            <Field label="Organization">
              <div style={{ position: "relative" }}>
                <select value={organization} onChange={(e) => setOrganization(e.target.value)} style={{ ...inputStyle, paddingLeft: "36px", cursor: "pointer", appearance: "none" }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="Odoo">Odoo S.A.</option>
                  <option value="Google">Google Inc.</option>
                  <option value="Microsoft">Microsoft Corp.</option>
                  <option value="Meta">Meta Platforms</option>
                </select>
                <Shield style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--text-3)", pointerEvents: "none" }} />
              </div>
            </Field>
          </div>

          {/* Role selection minimal */}
          <Field label="Role">
            <div style={{ display: "flex", gap: "8px", background: "var(--bg-hover)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <button type="button" onClick={() => setRole("employee")} style={{ flex: 1, padding: "6px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 500, fontFamily: "inherit", border: "none", cursor: "pointer", background: role === "employee" ? "var(--bg-card)" : "transparent", color: role === "employee" ? "var(--text)" : "var(--text-2)", border: role === "employee" ? "1px solid var(--border)" : "1px solid transparent", transition: "all 0.15s" }}>
                Employee
              </button>
              <button type="button" onClick={() => setRole("admin")} style={{ flex: 1, padding: "6px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 500, fontFamily: "inherit", border: "none", cursor: "pointer", background: role === "admin" ? "var(--bg-card)" : "transparent", color: role === "admin" ? "var(--text)" : "var(--text-2)", border: role === "admin" ? "1px solid var(--border)" : "1px solid transparent", transition: "all 0.15s" }}>
                Admin
              </button>
            </div>
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <Field label="Password">
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" style={{ ...inputStyle, paddingRight: "36px" }} onFocus={onFocus} onBlur={onBlur} />
                <Lock style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--text-3)" }} />
              </div>
              {password && (() => {
                const s = checkPasswordStrength(password).score;
                return (
                  <div style={{ display: "flex", gap: "2px", marginTop: "6px" }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} style={{ height: "4px", flex: 1, borderRadius: "2px", background: i <= s ? (s >= 4 ? "#10b981" : s === 3 ? "#f59e0b" : "#f43f5e") : "var(--bg-hover)", transition: "background 0.2s" }} />
                    ))}
                  </div>
                )
              })()}
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm Password">
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                <Lock style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--text-3)" }} />
              </div>
            </Field>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", paddingTop: "8px" }}>
            <input type="checkbox" id="terms" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} style={{ marginTop: "2px", cursor: "pointer", accentColor: "var(--primary)" }} />
            <label htmlFor="terms" style={{ fontSize: "0.78rem", color: "var(--text-3)", lineHeight: 1.4, cursor: "pointer" }}>
              I agree to the <a href="#" style={{ color: "var(--text)", textDecoration: "none", fontWeight: 500 }}>Terms of Service</a> & <a href="#" style={{ color: "var(--text)", textDecoration: "none", fontWeight: 500 }}>Privacy Policy</a>
            </label>
          </div>

          <button type="submit" disabled={isLoading} className="btn btn-primary w-full gap-2" style={{ padding: "10px", marginTop: "12px" }}>
            {isLoading ? <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} className="animate-spin" /> : <><span>Register Account</span><ArrowRight style={{ width: 15, height: 15 }} /></>}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-4 animate-fade-up">
          <Field label="6-digit verification code">
            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="000000" maxLength={6} style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.4em", fontSize: "1.25rem", fontWeight: 600, paddingLeft: "12px" }} onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <button type="submit" disabled={isLoading} className="btn btn-primary w-full gap-2" style={{ padding: "10px" }}>
            {isLoading ? <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} className="animate-spin" /> : <><span>Verify</span><ArrowRight style={{ width: 15, height: 15 }} /></>}
          </button>
          <button type="button" onClick={() => setShowOtp(false)} style={{ background: "none", border: "none", cursor: "pointer", width: "100%", padding: "6px", fontSize: "0.8rem", color: "var(--text-3)", fontFamily: "inherit" }}>
            â† Back to Edit
          </button>
        </form>
      )}

      {!showOtp && (
        <p style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border)", fontSize: "0.8rem", color: "var(--text-2)", textAlign: "center" }}>
          Already have an account?{" "}
          <button onClick={onSwitchToLogin} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontWeight: 500, fontFamily: "inherit", padding: 0 }}>
            Sign in
          </button>
        </p>
      )}
    </div>
  );
}

export default Signup;
