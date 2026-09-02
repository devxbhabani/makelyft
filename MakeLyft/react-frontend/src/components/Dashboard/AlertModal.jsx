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

	const getIcon = () => {
		switch (type) {
			case "success":
				return <CheckCircle2 className="w-8 h-8 text-emerald-500" />;
			case "error":
				return <AlertCircle className="w-8 h-8 text-rose-500" />;
			default:
				return <Info className="w-8 h-8 text-[#00A09D]" />;
		}
	};

	return (
		<div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
			<div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl flex flex-col transform transition-all relative overflow-hidden border border-gray-100 p-6 text-center">
				{/* Top Decorative Bar */}
				<div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#714B67] to-[#00A09D]"></div>

				<div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4 mt-2 shadow-inner border border-gray-100">
					{getIcon()}
				</div>

				<h3 className="text-lg font-extrabold text-gray-900 mb-2 leading-tight">
					{title || "Notice"}
				</h3>
				<p className="text-xs font-medium text-gray-600 mb-6 leading-relaxed">
					{message}
				</p>

				<button
					onClick={() => setAlertConfig(null)}
					className="w-full bg-[#714B67] hover:bg-[#5c3c54] text-white font-bold py-3 rounded-xl shadow-lg shadow-[#714B67]/20 transition-all cursor-pointer text-sm"
				>
					Dismiss
				</button>
			</div>
		</div>
	);
}
