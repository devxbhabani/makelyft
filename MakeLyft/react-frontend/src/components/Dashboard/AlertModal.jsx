import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { subscribeAlert } from "../../utils/alertService";

export default function AlertModal() {
	const [alertConfig, setAlertConfig] = useState(null);

	useEffect(() => {
		const unsubscribe = subscribeAlert(({ message, title, type }) => {
			setAlertConfig({ message, title, type });
		});
		return unsubscribe;
	}, []);

	if (!alertConfig) return null;

	const { message, title, type } = alertConfig;

	const iconColor = type === "success" ? "var(--accent)" : type === "error" ? "var(--danger)" : "var(--text-2)";
	const Icon = type === "success" ? CheckCircle2 : type === "error" ? AlertCircle : Info;

	return (
		<div
			style={{
				position: "fixed", inset: 0, zIndex: 200,
				display: "flex", alignItems: "center", justifyContent: "center",
				padding: 16,
				background: "rgba(0,0,0,0.65)",
				backdropFilter: "blur(4px)",
				animation: "fadeIn 0.2s ease both",
			}}
		>
			<div
				className="card animate-fade-up"
				style={{
					width: "100%", maxWidth: 360,
					padding: 24, textAlign: "center",
				}}
			>
				<div
					style={{
						width: 44, height: 44, borderRadius: 10,
						background: "var(--bg-hover)",
						border: "1px solid var(--border)",
						display: "flex", alignItems: "center", justifyContent: "center",
						margin: "0 auto 16px",
					}}
				>
					<Icon style={{ width: 20, height: 20, color: iconColor }} />
				</div>

				<h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text)", margin: "0 0 6px" }}>
					{title || "Notice"}
				</h3>
				<p style={{ fontSize: "0.82rem", color: "var(--text-2)", margin: "0 0 20px", lineHeight: 1.6 }}>
					{message}
				</p>

				<button
					onClick={() => setAlertConfig(null)}
					style={{
						width: "100%", padding: "9px", borderRadius: 7,
						background: "var(--bg-hover)", border: "1px solid var(--border-focus)",
						color: "var(--text)", fontWeight: 500, fontSize: "0.85rem",
						cursor: "pointer", fontFamily: "inherit",
						transition: "background 0.15s",
					}}
					onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
					onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
				>
					Dismiss
				</button>
			</div>
		</div>
	);
}
