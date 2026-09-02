import React, { useState, useEffect } from "react";
import {
	Bell,
	//eslint-disable-next-line
	ChevronDown,
	LogOut,
	Wallet,
	Car,
	//eslint-disable-next-line
	Settings,
	User,
	Clock,
	Phone,
	MessageSquare,
	MessageSquareHeart,
	Plus,
	//eslint-disable-next-line
	Calendar,
	//eslint-disable-next-line
	MapPin,
} from "lucide-react";
import WalletModal from "./WalletModal";
import { getWalletData, subscribeToWallet } from "../../utils/walletService";

function Header({
	socket,
	onOpenVehicleModal,
	onOpenChat,
	onOpenVoiceCall,
	onOpenHistory,
	onOpenFeedback,
	onOpenProfile,
}) {
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [notificationsOpen, setNotificationsOpen] = useState(false);
	const [walletModalOpen, setWalletModalOpen] = useState(false);
	const [walletBalance, setWalletBalance] = useState(650.0);
	const [notifications, setNotifications] = useState([]);

	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const empId = user.emp_id || "EMP-DEFAULT";

	useEffect(() => {
		if (!socket) return;
		const handleNotif = (data) => {
			if (data.target_emp_id === empId || data.target_emp_id === "all") {
				setNotifications((prev) => [data, ...prev]);
			}
		};
		socket.on("new_notification", handleNotif);
		return () => socket.off("new_notification", handleNotif);
	}, [socket, empId]);

	useEffect(() => {
		getWalletData(empId).then((data) => {
			if (data && typeof data.balance === "number") {
				setWalletBalance(data.balance);
			}
		});

		const unsubscribe = subscribeToWallet((updatedWallet) => {
			if (updatedWallet && typeof updatedWallet.balance === "number") {
				setWalletBalance(updatedWallet.balance);
			}
		});

		return () => unsubscribe();
	}, [empId]);

	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		window.location.href = "/";
	};

	return (
		<>
			<header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
				{/* Brand */}
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 bg-[#714B67] rounded-lg flex items-center justify-center shadow-xs">
						<Car className="w-5 h-5 text-white" />
					</div>
					<span className="text-xl font-bold text-gray-900 tracking-tight">
						MakeLyft
					</span>
				</div>

				{/* Right Navbar Elements: Wallet, Notifications & User Profile */}
				<div className="flex items-center gap-3 md:gap-4 relative">
					{/* Wallet Pill Button */}
					<button
						onClick={() => {
							setWalletModalOpen(true);
							setDropdownOpen(false);
							setNotificationsOpen(false);
						}}
						className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-purple-50 via-teal-50/40 to-white hover:from-purple-100/70 hover:to-teal-100/50 text-[#714B67] border border-[#714B67]/20 hover:border-[#714B67]/40 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer group"
						title="Open MakeLyft Commute Wallet"
					>
						<div className="w-6 h-6 rounded-lg bg-[#714B67] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
							<Wallet className="w-3.5 h-3.5" />
						</div>
						<div className="text-left flex flex-col leading-tight">
							<span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
								Wallet
							</span>
							<span className="text-xs font-extrabold text-gray-900 font-mono">
								₹
								{walletBalance.toLocaleString("en-IN", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</span>
						</div>
						<span className="hidden sm:flex w-5 h-5 rounded-full bg-[#00A09D]/15 text-[#00A09D] items-center justify-center ml-0.5">
							<Plus className="w-3 h-3" />
						</span>
					</button>

					{/* Notifications Bell */}
					<div className="relative">
						<button
							onClick={() => {
								setNotificationsOpen(!notificationsOpen);
								setDropdownOpen(false);
							}}
							className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200 cursor-pointer relative"
						>
							<Bell className="w-5 h-5 text-gray-600" />
							{/* Notification Badge */}
							<span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
						</button>

						{notificationsOpen && (
							<div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-2 z-50">
								<div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
									<h4 className="font-bold text-gray-900">
										Notifications
									</h4>
									{notifications.length > 0 && (
										<span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
											{notifications.length}
										</span>
									)}
								</div>

								{notifications.length === 0 ? (
									<div className="p-6 text-center text-gray-500 text-sm font-semibold">
										No new notifications
									</div>
								) : (
									<div className="max-h-[350px] overflow-y-auto">
										{notifications.map((notif, idx) => (
											<div
												key={idx}
												className="p-4 bg-teal-50/30 hover:bg-teal-50/60 transition-colors border-b border-gray-50 text-left"
											>
												<div className="flex justify-between items-start mb-2">
													<span
														className={`text-[10px] font-bold px-2 py-1 text-white rounded-md uppercase tracking-wide ${notif.type === "request" ? "bg-[#714B67]" : "bg-[#00A09D]"}`}
													>
														{notif.title}
													</span>
													<span className="text-xs text-gray-500">
														{new Date(
															notif.timestamp,
														).toLocaleTimeString([], {
															hour: "2-digit",
															minute: "2-digit",
														})}
													</span>
												</div>
												<p className="text-sm text-gray-800 mb-3">
													{notif.message}
												</p>

												<div className="flex gap-2">
													<button
														onClick={() => {
															setNotificationsOpen(false);
															if (onOpenVoiceCall)
																onOpenVoiceCall();
														}}
														className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-[#714B67] hover:bg-[#5c3c54] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
													>
														<Phone className="w-3.5 h-3.5" /> Call
													</button>
													<button
														onClick={() => {
															setNotificationsOpen(false);
															if (onOpenChat) onOpenChat();
														}}
														className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-[#00A09D] hover:bg-[#008f8c] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
													>
														<MessageSquare className="w-3.5 h-3.5" />{" "}
														Chat
													</button>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						)}
					</div>

					{/* User Profile */}
					<div className="relative">
						<button
							onClick={() => {
								setDropdownOpen(!dropdownOpen);
								setNotificationsOpen(false);
							}}
							className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200 cursor-pointer"
						>
							<User className="w-5 h-5 text-gray-600" />
						</button>

						{dropdownOpen && (
							<div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-1.5 z-50 text-left">
								<div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50">
									<p className="text-xs font-bold text-gray-900 truncate">
										{user.name || "Employee"}
									</p>
									<p className="text-[10px] text-gray-500 font-mono">
										{empId}
									</p>
								</div>
								<button
									onClick={() => {
										setDropdownOpen(false);
										setWalletModalOpen(true);
									}}
									className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-purple-50/50 hover:text-[#714B67] flex items-center justify-between cursor-pointer transition-colors"
								>
									<span className="flex items-center gap-2">
										<Wallet className="w-4 h-4 text-[#714B67]" />{" "}
										Commute Wallet
									</span>
									<span className="text-xs font-bold text-emerald-600 font-mono">
										₹{walletBalance.toFixed(0)}
									</span>
								</button>
								<button
									onClick={() => {
										setDropdownOpen(false);
										onOpenVehicleModal();
									}}
									className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer transition-colors"
								>
									<Car className="w-4 h-4 text-gray-400" /> Register
									Vehicle
								</button>
								<button
									onClick={() => {
										setDropdownOpen(false);
										if (onOpenProfile) onOpenProfile();
									}}
									className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer transition-colors font-medium"
								>
									<User className="w-4 h-4" /> Profile Details
								</button>
								<button
									onClick={() => {
										setDropdownOpen(false);
										if (onOpenHistory) onOpenHistory();
									}}
									className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer transition-colors font-medium"
								>
									<Clock className="w-4 h-4" /> View History
								</button>
								<button
									onClick={() => {
										setDropdownOpen(false);
										if (onOpenFeedback) onOpenFeedback();
									}}
									className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer transition-colors font-medium"
								>
									<MessageSquareHeart className="w-4 h-4" /> Send
									Feedback
								</button>
								<button
									onClick={handleLogout}
									className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors font-medium mt-1 border-t border-gray-100"
								>
									<LogOut className="w-4 h-4 text-red-400" /> Logout
								</button>
							</div>
						)}
					</div>
				</div>
			</header>

			{/* Render Interactive Wallet Modal */}
			<WalletModal
				isOpen={walletModalOpen}
				onClose={() => setWalletModalOpen(false)}
			/>
		</>
	);
}

export default Header;
