import React, { useState, useRef, useEffect } from "react";
import { X, Send, MessageSquare, ShieldCheck, User, Clock, Lock } from "lucide-react";

export default function ChatModal({
	isOpen,
	onClose,
	//eslint-disable-next-line
	socket,
	activeTrip,
	user,
}) {
	const [messageInput, setMessageInput] = useState("");
	//eslint-disable-next-line
	const [messages, setMessages] = useState([
		{
			id: 1,
			sender_name: "System",
			text: "Chat started. Messages are End-to-End Encrypted (XOR) with a symmetric session key derived from your ride.",
			isSystem: true,
			timestamp: new Date().toISOString(),
		},
	]);
	const messagesEndRef = useRef(null);

	const rideId = activeTrip?.ride?.ride_id;

	// Scroll to bottom on new messages
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Join ride room and listen for incoming messages
	useEffect(() => {
		if (!socket || !rideId || !isOpen) return;

		// Join the ride's socket room so we receive messages
		socket.emit("join_ride_room", { ride_id: rideId });

		const handleNewMessage = (data) => {
			// Don't add our own messages (we already added them optimistically)
			if (data.sender_id === user?.emp_id) return;

			setMessages((prev) => [
				...prev,
				{
					id: Date.now(),
					sender_id: data.sender_id,
					sender_name: data.sender_name,
					text: data.text,
					timestamp: data.timestamp || new Date().toISOString(),
				},
			]);
		};

		socket.on("new_chat_message", handleNewMessage);

		return () => {
			socket.off("new_chat_message", handleNewMessage);
		};
	}, [socket, rideId, isOpen, user?.emp_id]);

	if (!isOpen) return null;

	const targetName =
		activeTrip?.mode === "driver"
			? activeTrip?.bookings?.[0]?.passenger_name || "Passenger"
			: activeTrip?.ride?.driver_name || "Driver";

	const handleSend = () => {
		const text = messageInput.trim();
		if (!text || !socket || !rideId) return;

		const messagePayload = {
			ride_id: rideId,
			sender_id: user?.emp_id,
			sender_name: user?.name || "You",
			text: text,
			timestamp: new Date().toISOString(),
		};

		// Emit to socket
		socket.emit("send_chat_message", messagePayload);

		// Optimistically add to local messages
		setMessages((prev) => [
			...prev,
			{
				id: Date.now(),
				sender_id: user?.emp_id,
				sender_name: user?.name || "You",
				text: text,
				timestamp: messagePayload.timestamp,
			},
		]);

		setMessageInput("");
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
			<div className="bg-[var(--bg-card)] w-full max-w-md rounded-xl shadow-none flex flex-col transform transition-all h-[600px] border border-[var(--border)] overflow-hidden">
				{/* Elaborate Header - Odoo Theme */}
				<div className="p-5 flex items-center justify-between bg-[var(--bg-hover)] from-[#00A09D] to-[#017E84] relative overflow-hidden">
					{/* Abstract Background Design */}
					<div className="absolute right-0 top-0 w-48 h-48 bg-[var(--bg-card)]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
					<div className="absolute left-0 bottom-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

					<div className="flex items-center gap-4 relative z-10">
						<div className="w-12 h-12 rounded-full bg-[var(--bg-card)] flex items-center justify-center text-[var(--accent)] font-bold text-xl uppercase shadow-none">
							{targetName.charAt(0)}
						</div>
						<div>
							<h3 className="text-white font-bold text-lg leading-tight">
								{targetName}
							</h3>
							<div className="flex items-center gap-1.5 text-white/80 text-[10px] font-bold uppercase tracking-wider mt-0.5">
								<Lock className="w-3 h-3" /> E2EE Secured Chat
							</div>
						</div>
					</div>

					<button
						onClick={onClose}
						className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-card)]/10 hover:bg-[var(--bg-card)]/20 text-white transition-colors relative z-10 cursor-pointer"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Chat Messages */}
				<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-hover)]/50">
					{messages.map((msg, idx) => {
						const isMe = msg.sender_id === user?.emp_id;
						if (msg.isSystem) {
							return (
								<div key={idx} className="flex justify-center my-4">
									<div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] uppercase font-bold tracking-wider px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-none">
										<ShieldCheck className="w-3.5 h-3.5" />
										{msg.text}
									</div>
								</div>
							);
						}

						return (
							<div
								key={idx}
								className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2`}
							>
								{!isMe && (
									<div className="w-6 h-6 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-none">
										{msg.sender_name?.charAt(0) || "U"}
									</div>
								)}
								<div
									className={`max-w-[75%] px-4 py-2.5 shadow-none ${
										isMe
											? "bg-gradient-to-br from-[#714B67] to-[#8C5D80] text-white rounded-xl rounded-br-sm"
											: "bg-[var(--bg-card)] text-[var(--text)] border border-[var(--border)] rounded-xl rounded-bl-sm"
									}`}
								>
									<p className="text-sm">{msg.text}</p>
									<p
										className={`text-[9px] mt-1 text-right font-medium ${isMe ? "text-white/70" : "text-[var(--text-3)]"}`}
									>
										{new Date(msg.timestamp).toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</p>
								</div>
							</div>
						);
					})}
					<div ref={messagesEndRef} />
				</div>

				{/* Input Area */}
				<div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border)]">
					<div className="flex gap-2">
						<input
							type="text"
							value={messageInput}
							onChange={(e) => setMessageInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Type an encrypted message..."
							className="flex-1 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-transparent/20 focus:border-[var(--border-focus)] transition-all"
						/>
						<button 
							onClick={handleSend}
							disabled={!messageInput.trim()}
							className="w-12 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)] disabled:opacity-50 text-white flex items-center justify-center transition-colors cursor-pointer shadow-none shadow-[#00A09D]/20"
						>
							<Send className="w-5 h-5 ml-1" />
						</button>
					</div>
					<div className="text-center mt-2">
						<span className="text-[9px] text-[var(--text-3)] font-bold uppercase tracking-widest flex items-center justify-center gap-1">
							<ShieldCheck className="w-3 h-3 text-emerald-500" />{" "}
							End-to-End Encrypted via XOR
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
