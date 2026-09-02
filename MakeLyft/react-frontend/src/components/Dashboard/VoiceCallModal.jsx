import React, { useState, useEffect, useRef } from "react";

import {
	PhoneOff,
	Mic,
	MicOff,
	//eslint-disable-next-line
	Volume2,
	ShieldCheck,
	//eslint-disable-next-line
	User,
} from "lucide-react";
import { VoiceCall } from "../../utils/VoiceCall";

export default function VoiceCallModal({
	isOpen,
	onClose,
	socket,
	activeTrip,
	user,
	isCaller = true,
}) {
	const [callState, setCallState] = useState("connecting"); // connecting, connected, closed, failed
	const [isMuted, setIsMuted] = useState(false);
	const [timerSeconds, setTimerSeconds] = useState(0);
	const voiceCallRef = useRef(null);

	const targetName = isCaller
		? activeTrip?.ride?.driver_name || "Rahul M. (Driver)"
		: activeTrip?.passenger_name || "Employee Passenger";

	// Initialize WebRTC Voice Call when Modal opens
	useEffect(() => {
		if (!isOpen) return;

		const rideId =
			activeTrip?.ride?.ride_id ||
			activeTrip?.ride_id ||
			activeTrip?.booking_id ||
			"DEMO_RIDE_1";

		// CRITICAL FIX: Ensure caller joins the socket room so they can receive signaling answers
		if (socket) {
			socket.emit("join_ride_room", { ride_id: rideId });
		}

		const vc = new VoiceCall(socket, rideId, isCaller, (state) => {
			setCallState(state);
			if (state === "closed" || state === "failed") {
				setTimeout(() => {
					onClose();
				}, 1200);
			}
		});

		voiceCallRef.current = vc;
		vc.start();

		return () => {
			if (voiceCallRef.current) {
				voiceCallRef.current.endCall();
			}
		};
		//eslint-disable-next-line
	}, [isOpen, socket, activeTrip, isCaller]);

	// Call Duration Timer
	useEffect(() => {
		let interval = null;
		if (callState === "connected") {
			interval = setInterval(() => {
				setTimerSeconds((prev) => prev + 1);
			}, 1000);
		} else {
			//eslint-disable-next-line
			setTimerSeconds(0);
		}
		return () => clearInterval(interval);
	}, [callState]);

	const formatTimer = (sec) => {
		const mins = Math.floor(sec / 60);
		const remainderSecs = sec % 60;
		return `${mins.toString().padStart(2, "0")}:${remainderSecs.toString().padStart(2, "0")}`;
	};

	const handleToggleMute = () => {
		if (voiceCallRef.current) {
			const muted = voiceCallRef.current.toggleMute();
			setIsMuted(muted);
		}
	};

	const handleEndCall = () => {
		if (voiceCallRef.current) {
			voiceCallRef.current.endCall();
		}
		setCallState("closed");
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
			<div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl flex flex-col transform transition-all relative overflow-hidden border border-gray-100">
				{/* Header - Elaborate Odoo Branding */}
				<div
					className={`p-10 flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500 ${callState === "failed" ? "bg-red-500" : "bg-gradient-to-br from-[#714B67] to-[#8C5D80]"}`}
				>
					{/* Abstract Background Design */}
					<div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
					<div className="absolute left-0 bottom-0 w-40 h-40 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

					{/* Encrypted Badge */}
					<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 border border-white/10 text-emerald-300 text-[10px] font-bold mb-6 z-10 backdrop-blur-sm">
						<ShieldCheck className="w-3.5 h-3.5" />
						<span>End-to-End Encrypted</span>
					</div>

					{/* Avatar Profile */}
					<div className="relative mb-6 z-10">
						<div
							className={`w-28 h-28 rounded-full bg-white flex items-center justify-center text-[#714B67] shadow-2xl text-5xl font-black uppercase border-4 border-white/20 ${callState === "connecting" ? "animate-pulse" : ""}`}
						>
							{targetName.charAt(0)}
						</div>
						{/* Animated Ring for Calling */}
						{callState === "connecting" && (
							<div className="absolute -inset-4 border-2 border-white/40 rounded-full animate-ping pointer-events-none"></div>
						)}
					</div>

					<h2 className="text-2xl font-bold text-white text-center z-10 leading-tight drop-shadow-md">
						{targetName}
					</h2>
					<p className="text-white/80 text-sm font-semibold mt-1 z-10 tracking-wider uppercase flex items-center gap-2">
						{callState === "connecting" &&
							(isCaller ? "Calling..." : "Incoming Call...")}
						{callState === "connected" && (
							<>
								<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
								Connected
							</>
						)}
						{callState === "failed" && "Call Failed"}
						{callState === "closed" && "Call Ended"}
					</p>
					{callState === "connected" && (
						<p className="text-white text-lg font-mono font-bold mt-2 z-10 tracking-widest drop-shadow">
							{formatTimer(timerSeconds)}
						</p>
					)}
				</div>

				{/* Controls */}
				<div className="px-8 py-8 flex items-center justify-center gap-8 bg-gray-50/50">
					{/* Mute Button */}
					<button
						onClick={handleToggleMute}
						disabled={callState !== "connected"}
						className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer ${
							callState !== "connected"
								? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-400"
								: isMuted
									? "bg-white text-gray-800 border-2 border-gray-200"
									: "bg-[#00A09D] text-white hover:bg-[#008f8c]"
						}`}
					>
						{isMuted ? (
							<MicOff className="w-6 h-6" />
						) : (
							<Mic className="w-6 h-6" />
						)}
					</button>

					{/* End Call Button */}
					<button
						onClick={handleEndCall}
						className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/30 transition-transform hover:scale-105 cursor-pointer"
					>
						<PhoneOff className="w-7 h-7" />
					</button>
				</div>
			</div>
		</div>
	);
}
