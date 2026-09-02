import React, { useState, useEffect, useRef } from "react";
import {
	Wallet,
	Plus,
	X,
	ArrowDownLeft,
	ArrowUpRight,
	CreditCard,
	Smartphone,
	Building2,
	CheckCircle2,
	ShieldCheck,
	Sparkles,
	History,
	RefreshCw,
	ChevronRight,
	AlertCircle,
} from "lucide-react";
import {
	getWalletData,
	addMoneyToWallet,
	subscribeToWallet,
} from "../../utils/walletService";

export default function WalletModal({ isOpen, onClose }) {
	const [wallet, setWallet] = useState(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'add_money' | 'history'
	const [addAmount, setAddAmount] = useState("");
	const [paymentMethod, setPaymentMethod] = useState("UPI (Google Pay)");
	const [processingPayment, setProcessingPayment] = useState(false);
	const [successMsg, setSuccessMsg] = useState("");
	const [errorMsg, setErrorMsg] = useState("");
	const [historyFilter, setHistoryFilter] = useState("all"); // 'all' | 'credit' | 'debit'
	const scrollContainerRef = useRef(null);

	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const empId = user.emp_id || "EMP-DEFAULT";

	useEffect(() => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTop = 0;
		}
	}, [activeTab]);

	useEffect(() => {
		if (!isOpen) return;

		let isMounted = true;
		//eslint-disable-next-line
		setLoading(true);

		getWalletData(empId).then((data) => {
			if (isMounted) {
				setWallet(data);
				setLoading(false);
			}
		});

		const unsubscribe = subscribeToWallet((updatedWallet) => {
			if (isMounted) {
				setWallet(updatedWallet);
			}
		});

		return () => {
			isMounted = false;
			unsubscribe();
		};
	}, [isOpen, empId]);

	if (!isOpen) return null;

	const presetAmounts = [100, 250, 500, 1000, 2000];

	const paymentMethods = [
		{
			id: "UPI (Google Pay)",
			name: "Google Pay / UPI",
			desc: "Instant top-up via UPI QR or App",
			icon: Smartphone,
			badge: "Fastest",
		},
		{
			id: "UPI (PhonePe/Paytm)",
			name: "PhonePe / Paytm UPI",
			desc: "Direct zero-fee commute transfer",
			icon: Smartphone,
		},
		{
			id: "Net Banking (HDFC/ICICI)",
			name: "Corporate Net Banking",
			desc: "Direct debit from authorized account",
			icon: Building2,
		},
		{
			id: "Corporate Fuel Card",
			name: "MakeLyft Fleet & Expense Card",
			desc: "Monthly commute allowance budget",
			icon: CreditCard,
			badge: "Pre-approved",
		},
	];

	const handleAddMoney = async (e) => {
		e?.preventDefault();
		const amountNum = parseFloat(addAmount);
		if (isNaN(amountNum) || amountNum <= 0) {
			setErrorMsg("Please enter a valid amount (minimum ₹10).");
			return;
		}

		setErrorMsg("");
		setProcessingPayment(true);

		try {
			// Simulate real gateway delay + execute backend connection & local state update
			await new Promise((r) => setTimeout(r, 600));
			const updated = await addMoneyToWallet(
				empId,
				amountNum,
				paymentMethod,
			);
			if (updated) {
				setWallet(updated);
			}
			setSuccessMsg(
				`Initiated transaction of ₹${amountNum.toLocaleString("en-IN")}. Complete it in the gateway!`,
			);
			setAddAmount("");
			setActiveTab("overview");

			setTimeout(() => {
				setSuccessMsg("");
			}, 4000);
		} catch (err) {
			console.error("Top-up failed:", err);
			setErrorMsg(err.message || "Failed to add money. Please try again.");
		} finally {
			setProcessingPayment(false);
		}
	};

	const filteredTransactions = (wallet?.transactions || []).filter((tx) => {
		if (historyFilter === "credit") return tx.type === "credit";
		if (historyFilter === "debit") return tx.type === "debit";
		return true;
	});

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
			<div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] text-left transform transition-all">
				{/* Modal Top Bar */}
				<div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#714B67]/10 via-white to-[#00A09D]/10">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#714B67] to-[#5c3c54] flex items-center justify-center shadow-md shadow-[#714B67]/20 text-white">
							<Wallet className="w-5 h-5" />
						</div>
						<div>
							<h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
								MakeLyft Commute Wallet
								<span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-[#00A09D]/15 text-[#00A09D] border border-[#00A09D]/30">
									Active
								</span>
							</h3>
							<p className="text-xs text-gray-500 font-medium">
								{user.name || "Employee"} • {empId}
							</p>
						</div>
					</div>

					<button
						onClick={onClose}
						className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Toast Alerts */}
				{successMsg && (
					<div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-medium animate-in slide-in-from-top-2">
						<CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
						<div className="flex-1">{successMsg}</div>
					</div>
				)}

				{errorMsg && (
					<div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-medium animate-in slide-in-from-top-2">
						<AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
						<div className="flex-1">{errorMsg}</div>
					</div>
				)}

				{/* Navigation Tabs */}
				<div className="flex px-6 pt-3 border-b border-gray-100 gap-6">
					<button
						onClick={() => setActiveTab("overview")}
						className={`pb-2.5 text-xs font-bold transition-all relative cursor-pointer ${
							activeTab === "overview"
								? "text-[#714B67]"
								: "text-gray-500 hover:text-gray-800"
						}`}
					>
						Balance & Cards
						{activeTab === "overview" && (
							<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#714B67] rounded-full"></span>
						)}
					</button>

					<button
						onClick={() => setActiveTab("add_money")}
						className={`pb-2.5 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-1 ${
							activeTab === "add_money"
								? "text-[#714B67]"
								: "text-gray-500 hover:text-gray-800"
						}`}
					>
						<Plus className="w-3.5 h-3.5" />
						Add Money
						{activeTab === "add_money" && (
							<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#714B67] rounded-full"></span>
						)}
					</button>

					<button
						onClick={() => setActiveTab("history")}
						className={`pb-2.5 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-1 ${
							activeTab === "history"
								? "text-[#714B67]"
								: "text-gray-500 hover:text-gray-800"
						}`}
					>
						<History className="w-3.5 h-3.5" />
						Transactions
						{activeTab === "history" && (
							<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#714B67] rounded-full"></span>
						)}
					</button>
				</div>

				{/* Modal Body */}
				<div
					ref={scrollContainerRef}
					className="p-6 overflow-y-auto flex-1 space-y-6"
				>
					{loading ? (
						<div className="py-16 text-center">
							<RefreshCw className="w-8 h-8 text-[#714B67] animate-spin mx-auto mb-3" />
							<p className="text-sm font-semibold text-gray-600">
								Loading wallet information...
							</p>
						</div>
					) : activeTab === "overview" ? (
						<>
							{/* Hero Balance Card */}
							<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#714B67] via-[#5c3c54] to-[#392433] text-white p-6 shadow-xl shadow-[#714B67]/25">
								{/* Background Pattern Deco */}
								<div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
								{/* <div className="absolute top-0 right-0 w-32 h-32 bg-[#00A09D]/20 rounded-full blur-xl pointer-events-none"></div> */}

								<div className="relative z-10 flex flex-col justify-between h-full">
									<div className="flex items-start justify-between">
										<div>
											<span className="text-[11px] font-semibold uppercase tracking-widest text-purple-200/90">
												Available Balance
											</span>
											<div className="flex items-baseline gap-1 mt-1">
												<span className="text-2xl font-bold text-teal-300">
													₹
												</span>
												<span className="text-4xl font-extrabold tracking-tight text-white">
													{(wallet?.balance || 0).toLocaleString(
														"en-IN",
														{
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														},
													)}
												</span>
											</div>
										</div>

										<div className="px-3 py-1 bg-white/15 backdrop-blur-md rounded-xl text-xs font-semibold text-purple-100 flex items-center gap-1.5 border border-white/10">
											<Sparkles className="w-3.5 h-3.5 text-teal-300" />
											Auto-Refill On
										</div>
									</div>

									<div className="pt-6 mt-6 border-t border-white/15 flex items-center justify-between text-xs text-purple-200">
										<div>
											<p className="text-[10px] text-purple-300 uppercase tracking-wider font-semibold">
												Account ID
											</p>
											<p className="font-mono font-bold text-white mt-0.5">
												{empId}
											</p>
										</div>
										<div className="text-right">
											<p className="text-[10px] text-purple-300 uppercase tracking-wider font-semibold">
												Default Source
											</p>
											<p className="font-medium text-white mt-0.5">
												{wallet?.bank_connection ||
													"HDFC Bank (•••• 4821)"}
											</p>
										</div>
									</div>
								</div>
							</div>

							{/* Quick Action Buttons */}
							<div className="grid grid-cols-2 gap-3">
								<button
									onClick={() => setActiveTab("add_money")}
									className="py-3 px-4 bg-[#714B67] hover:bg-[#5c3c54] text-white font-bold text-sm rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
								>
									<Plus className="w-4 h-4" />
									<span>Add Money</span>
								</button>
								<button
									onClick={() => setActiveTab("history")}
									className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-gray-200"
								>
									<History className="w-4 h-4 text-gray-600" />
									<span>View History</span>
								</button>
							</div>

							{/* Recent Activity Snippet */}
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
										Recent Commute Activity
									</h4>
									<button
										onClick={() => setActiveTab("history")}
										className="text-xs font-bold text-[#714B67] hover:underline flex items-center gap-0.5 cursor-pointer"
									>
										View All <ChevronRight className="w-3 h-3" />
									</button>
								</div>

								<div className="space-y-2">
									{(wallet?.transactions || [])
										.slice(0, 3)
										.map((tx) => (
											<div
												key={tx.id}
												className="p-3.5 bg-gray-50/80 hover:bg-gray-100/80 rounded-2xl border border-gray-100 transition-colors flex items-center justify-between"
											>
												<div className="flex items-center gap-3">
													<div
														className={`w-9 h-9 rounded-xl flex items-center justify-center ${
															tx.type === "credit"
																? "bg-emerald-100 text-emerald-700"
																: "bg-purple-100 text-[#714B67]"
														}`}
													>
														{tx.type === "credit" ? (
															<ArrowDownLeft className="w-4 h-4" />
														) : (
															<ArrowUpRight className="w-4 h-4" />
														)}
													</div>
													<div>
														<p className="text-xs font-bold text-gray-900 leading-tight">
															{tx.title}
														</p>
														<p className="text-[11px] text-gray-500 mt-0.5">
															{new Date(
																tx.date,
															).toLocaleDateString("en-IN", {
																month: "short",
																day: "numeric",
																hour: "2-digit",
																minute: "2-digit",
															})}
														</p>
													</div>
												</div>

												<div className="text-right">
													<p
														className={`text-sm font-extrabold ${
															tx.type === "credit"
																? "text-emerald-600"
																: "text-gray-900"
														}`}
													>
														{tx.type === "credit" ? "+" : "-"}₹
														{tx.amount.toFixed(2)}
													</p>
													<span className="text-[10px] text-gray-400 font-mono">
														{tx.id}
													</span>
												</div>
											</div>
										))}
								</div>
							</div>

							{/* Security Tag */}
							<div className="p-3.5 bg-teal-50/60 border border-teal-100 rounded-2xl flex items-center gap-3 text-xs text-teal-800">
								<ShieldCheck className="w-4 h-4 text-[#00A09D] shrink-0" />
								<span>
									MakeLyft uses 256-bit encrypted corporate banking
									routes. Fares are automatically synced with drivers
									upon ride completion.
								</span>
							</div>
						</>
					) : activeTab === "add_money" ? (
						/* ADD MONEY TAB */
						<form onSubmit={handleAddMoney} className="space-y-5">
							{/* Current Balance Reminder */}
							<div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-100 flex items-center justify-between">
								<span className="text-xs text-purple-900 font-semibold">
									Current Wallet Balance:
								</span>
								<span className="text-sm font-extrabold text-[#714B67]">
									₹
									{(wallet?.balance || 0).toLocaleString("en-IN", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</span>
							</div>

							{/* Amount Input */}
							<div>
								<label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
									Enter Amount to Add (₹)
								</label>
								<div className="relative">
									<span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">
										₹
									</span>
									<input
										type="number"
										min="10"
										step="10"
										placeholder="500"
										value={addAmount}
										onChange={(e) => setAddAmount(e.target.value)}
										className="w-full pl-10 pr-4 py-3 text-2xl font-extrabold text-gray-900 bg-gray-50 focus:bg-white border-2 border-gray-200 focus:border-[#714B67] rounded-2xl outline-none transition-all"
										required
										autoFocus
									/>
								</div>

								{/* Quick Amount Chips */}
								<div className="flex flex-wrap gap-2 mt-3">
									{presetAmounts.map((amt) => (
										<button
											type="button"
											key={amt}
											onClick={() => setAddAmount(amt.toString())}
											className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
												addAmount === amt.toString()
													? "bg-[#714B67] text-white border-[#714B67] shadow-xs"
													: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
											}`}
										>
											+₹{amt.toLocaleString("en-IN")}
										</button>
									))}
								</div>
							</div>

							{/* Payment Method Selector */}
							<div>
								<label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
									Select Payment Mode
								</label>
								<div className="space-y-2">
									{paymentMethods.map((method) => {
										const Icon = method.icon;
										const isSelected = paymentMethod === method.id;
										return (
											<label
												key={method.id}
												onClick={() => setPaymentMethod(method.id)}
												className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
													isSelected
														? "border-[#714B67] bg-purple-50/30 shadow-2xs"
														: "border-gray-200 hover:border-gray-300 bg-white"
												}`}
											>
												<div className="flex items-center gap-3">
													<div
														className={`w-9 h-9 rounded-xl flex items-center justify-center ${
															isSelected
																? "bg-[#714B67] text-white"
																: "bg-gray-100 text-gray-600"
														}`}
													>
														<Icon className="w-4 h-4" />
													</div>
													<div>
														<div className="flex items-center gap-2">
															<p className="text-xs font-bold text-gray-900">
																{method.name}
															</p>
															{method.badge && (
																<span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
																	{method.badge}
																</span>
															)}
														</div>
														<p className="text-[11px] text-gray-500">
															{method.desc}
														</p>
													</div>
												</div>

												<input
													type="radio"
													name="payment_method"
													checked={isSelected}
													onChange={() =>
														setPaymentMethod(method.id)
													}
													className="w-4 h-4 accent-[#714B67] cursor-pointer"
												/>
											</label>
										);
									})}
								</div>
							</div>

							{/* Action Buttons */}
							<div className="pt-2 flex gap-3">
								<button
									type="button"
									onClick={() => setActiveTab("overview")}
									className="flex-1 py-3 px-4 rounded-2xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors cursor-pointer"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={processingPayment}
									className="flex-2 py-3 px-4 bg-[#714B67] hover:bg-[#5c3c54] text-white font-bold text-xs rounded-2xl shadow-md shadow-[#714B67]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
								>
									{processingPayment ? (
										<>
											<RefreshCw className="w-4 h-4 animate-spin" />
											<span>Processing Transfer...</span>
										</>
									) : (
										<>
											<Plus className="w-4 h-4" />
											<span>
												Add ₹
												{addAmount
													? parseFloat(addAmount).toLocaleString(
															"en-IN",
														)
													: "0"}{" "}
												Now
											</span>
										</>
									)}
								</button>
							</div>
						</form>
					) : (
						/* TRANSACTION HISTORY TAB */
						<div className="space-y-4">
							{/* Filter Chips */}
							<div className="flex items-center justify-between gap-2">
								<div className="flex gap-1.5">
									{["all", "credit", "debit"].map((type) => (
										<button
											key={type}
											onClick={() => setHistoryFilter(type)}
											className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
												historyFilter === type
													? "bg-[#714B67] text-white shadow-xs"
													: "bg-gray-100 text-gray-600 hover:bg-gray-200"
											}`}
										>
											{type === "all"
												? "All"
												: type === "credit"
													? "Top-Ups (+)"
													: "Rides (-)"}
										</button>
									))}
								</div>

								<span className="text-xs font-bold text-gray-500">
									{filteredTransactions.length} records
								</span>
							</div>

							{filteredTransactions.length === 0 ? (
								<div className="py-12 text-center text-gray-400">
									<History className="w-8 h-8 mx-auto mb-2 opacity-40" />
									<p className="text-xs font-semibold">
										No transactions found
									</p>
								</div>
							) : (
								<div className="space-y-2.5">
									{filteredTransactions.map((tx) => (
										<div
											key={tx.id}
											className="p-3.5 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-100 transition-colors flex items-center justify-between"
										>
											<div className="flex items-center gap-3">
												<div
													className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
														tx.type === "credit"
															? "bg-emerald-100 text-emerald-700"
															: "bg-purple-100 text-[#714B67]"
													}`}
												>
													{tx.type === "credit" ? (
														<ArrowDownLeft className="w-4 h-4" />
													) : (
														<ArrowUpRight className="w-4 h-4" />
													)}
												</div>
												<div>
													<p className="text-xs font-bold text-gray-900 leading-tight">
														{tx.title}
													</p>
													<div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
														<span>
															{new Date(
																tx.date,
															).toLocaleDateString("en-IN", {
																day: "numeric",
																month: "short",
																year: "numeric",
															})}
														</span>
														<span>•</span>
														<span className="font-mono">
															{tx.id}
														</span>
													</div>
												</div>
											</div>

											<div className="text-right">
												<p
													className={`text-sm font-extrabold ${
														tx.type === "credit"
															? "text-emerald-600"
															: "text-gray-900"
													}`}
												>
													{tx.type === "credit" ? "+" : "-"}₹
													{tx.amount.toFixed(2)}
												</p>
												<span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
													{tx.status || "Success"}
												</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>

				{/* Modal Footer */}
				<div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
					<div className="flex items-center gap-1.5">
						<ShieldCheck className="w-4 h-4 text-[#00A09D]" />
						<span>100% Secure Commute Billing</span>
					</div>
					<button
						onClick={onClose}
						className="text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
