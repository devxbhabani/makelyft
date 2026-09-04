import React, { useState, useEffect } from "react";
import {
  Bell, LogOut, Wallet, Car,
  User, Clock, Phone, MessageSquare,
  MessageSquareHeart, Plus,
  //eslint-disable-next-line
  ChevronDown, Settings, Calendar, MapPin,
} from "lucide-react";
import WalletModal from "./WalletModal";
import { getWalletData, subscribeToWallet } from "../../utils/walletService";

function Header({ socket, onOpenVehicleModal, onOpenChat, onOpenVoiceCall, onOpenHistory, onOpenFeedback, onOpenProfile }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(650.0);
  const [notifications, setNotifications] = useState([]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const empId = user.emp_id || "EMP-DEFAULT";
  const initials = (user.name || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    if (!socket) return;
    const fn = (data) => {
      if (data.target_emp_id === empId || data.target_emp_id === "all") setNotifications((p) => [data, ...p]);
    };
    socket.on("new_notification", fn);
    return () => socket.off("new_notification", fn);
  }, [socket, empId]);

  useEffect(() => {
    getWalletData(empId).then((d) => { if (d && typeof d.balance === "number") setWalletBalance(d.balance); });
    const unsub = subscribeToWallet((d) => { if (d && typeof d.balance === "number") setWalletBalance(d.balance); });
    return unsub;
  }, [empId]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const iconBtnStyle = {
    width: 36, height: 36, borderRadius: 8,
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--text-2)",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
    position: "relative",
    flexShrink: 0,
  };

  const dropdownStyle = {
    position: "absolute",
    right: 0,
    top: "calc(100% + 8px)",
    zIndex: 50,
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    boxShadow: "var(--shadow)",
    overflow: "hidden",
    minWidth: 210,
  };

  const menuItemStyle = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    width: "100%", padding: "9px 14px",
    background: "none", border: "none",
    cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem",
    color: "var(--text-2)", textAlign: "left",
    transition: "background 0.12s ease, color 0.12s ease",
  };

  return (
    <>
      <header
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
          height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 100,
          boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30, height: 30, borderRadius: 7,
              background: "var(--bg-hover)",
              border: "1px solid var(--border-focus)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Car style={{ width: 15, height: 15, color: "var(--primary)" }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: "0.975rem", color: "var(--text)", letterSpacing: "-0.02em" }}>
            MakeLyft
          </span>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

          {/* Wallet */}
          <button
            onClick={() => { setWalletModalOpen(true); setDropdownOpen(false); setNotificationsOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 12px 6px 8px",
              borderRadius: 8,
              background: "transparent",
              border: "1px solid var(--border)",
              cursor: "pointer",
              transition: "background 0.15s ease, border-color 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.borderColor = "var(--border-focus)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border)"; }}
          >
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--primary-dim)", border: "1px solid rgba(124,106,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wallet style={{ width: 12, height: 12, color: "var(--primary)" }} />
            </div>
            <div style={{ textAlign: "left", lineHeight: 1.2 }}>
              <p style={{ fontSize: "0.65rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Wallet</p>
              <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums", margin: 0 }}>
                ₹{walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
              </p>
            </div>
            <Plus style={{ width: 13, height: 13, color: "var(--text-3)" }} />
          </button>

          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setNotificationsOpen(!notificationsOpen); setDropdownOpen(false); }}
              style={iconBtnStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--border-focus)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <Bell style={{ width: 15, height: 15 }} />
              {notifications.length > 0 && (
                <span style={{
                  position: "absolute", top: 7, right: 7,
                  width: 6, height: 6, borderRadius: "50%",
                  background: "var(--danger)",
                  border: "1.5px solid var(--bg)",
                }} />
              )}
            </button>

            {notificationsOpen && (
              <div style={{ ...dropdownStyle, width: 300 }} className="animate-fade-up">
                <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)" }}>Notifications</span>
                  {notifications.length > 0 && (
                    <span style={{ fontSize: "0.7rem", background: "rgba(248,113,113,0.1)", color: "var(--danger)", padding: "2px 7px", borderRadius: "9999px", border: "1px solid rgba(248,113,113,0.2)" }}>
                      {notifications.length}
                    </span>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <p style={{ padding: "24px", textAlign: "center", fontSize: "0.82rem", color: "var(--text-3)", margin: 0 }}>No notifications</p>
                ) : (
                  <div style={{ maxHeight: 320, overflowY: "auto" }}>
                    {notifications.map((n, i) => (
                      <div key={i} style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: n.type === "request" ? "var(--primary)" : "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{n.title}</span>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-3)" }}>{new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p style={{ fontSize: "0.82rem", color: "var(--text-2)", margin: "0 0 10px" }}>{n.message}</p>
                        <div style={{ display: "flex", gap: 6 }}>
                          {[
                            { icon: Phone, label: "Call", onClick: () => { setNotificationsOpen(false); onOpenVoiceCall?.(); } },
                            { icon: MessageSquare, label: "Chat", onClick: () => { setNotificationsOpen(false); onOpenChat?.(); } },
                          ].map(({ icon: Icon, label, onClick }) => (
                            <button
                              key={label}
                              onClick={onClick}
                              style={{
                                flex: 1, padding: "5px", borderRadius: 6, fontSize: "0.78rem", fontWeight: 500,
                                background: "var(--bg-hover)", border: "1px solid var(--border)",
                                color: "var(--text-2)", cursor: "pointer", fontFamily: "inherit",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                                transition: "background 0.12s, color 0.12s",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "var(--text)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-2)"; }}
                            >
                              <Icon style={{ width: 12, height: 12 }} /> {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setDropdownOpen(!dropdownOpen); setNotificationsOpen(false); }}
              style={{
                ...iconBtnStyle,
                fontWeight: 600,
                fontSize: "0.75rem",
                color: "var(--text)",
                background: "var(--bg-hover)",
                border: "1px solid var(--border-focus)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-card)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
            >
              {initials}
            </button>

            {dropdownOpen && (
              <div style={dropdownStyle} className="animate-fade-up">
                {/* User info */}
                <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--primary-dim)", border: "1px solid rgba(124,106,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 600, color: "var(--primary)" }}>
                    {initials}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "var(--text)" }}>{user.name || "Employee"}</p>
                    <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-3)", fontFamily: "monospace" }}>{empId}</p>
                  </div>
                </div>

                {/* Menu items */}
                {[
                  { icon: Wallet, label: "Commute Wallet", badge: `₹${walletBalance.toFixed(0)}`, fn: () => { setDropdownOpen(false); setWalletModalOpen(true); } },
                  { icon: Car, label: "Register Vehicle", fn: () => { setDropdownOpen(false); onOpenVehicleModal(); } },
                  { icon: User, label: "Profile", fn: () => { setDropdownOpen(false); onOpenProfile?.(); } },
                  { icon: Clock, label: "History", fn: () => { setDropdownOpen(false); onOpenHistory?.(); } },
                  { icon: MessageSquareHeart, label: "Feedback", fn: () => { setDropdownOpen(false); onOpenFeedback?.(); } },
                ].map(({ icon: Icon, label, badge, fn }) => (
                  <button
                    key={label}
                    onClick={fn}
                    style={menuItemStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-2)"; }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
                      {label}
                    </span>
                    {badge && <span style={{ fontSize: "0.75rem", color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>{badge}</span>}
                  </button>
                ))}

                <button
                  onClick={handleLogout}
                  style={{ ...menuItemStyle, color: "var(--danger)", borderTop: "1px solid var(--border)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <LogOut style={{ width: 14, height: 14 }} />
                    Sign out
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <WalletModal isOpen={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
    </>
  );
}

export default Header;
