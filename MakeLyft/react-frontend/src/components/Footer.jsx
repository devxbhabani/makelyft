import React from "react";

const Footer = () => (
  <footer
    style={{
      borderTop: "1px solid var(--border)",
      padding: "18px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      flexWrap: "wrap",
    }}
  >
    <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>
      © {new Date().getFullYear()} MakeLyft · Powered by Odoo S.A.
    </span>
    <div style={{ display: "flex", gap: 20 }}>
      {["Privacy", "Terms", "Support"].map((link) => (
        <a
          key={link}
          href="#"
          style={{
            fontSize: "0.78rem",
            color: "var(--text-3)",
            textDecoration: "none",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-2)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-3)"}
        >
          {link}
        </a>
      ))}
    </div>
  </footer>
);

export default Footer;
