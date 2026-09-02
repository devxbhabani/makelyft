import React, { useState, useEffect } from "react";
import {
	X,
	User,
	Mail,
	Building2,
	Phone,
	Car,
	Star,
	ShieldCheck,
	FileText,
	Droplets,
	CalendarDays,
	MapPin,
} from "lucide-react";

export default function ProfileModal({ isOpen, onClose }) {
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (isOpen) {
			//eslint-disable-next-line
			fetchProfile();
		}
	}, [isOpen]);

	const fetchProfile = async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			const res = await fetch("/auth/me", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.success) {
				setProfile(data.profile);
			}
		} catch (error) {
			console.error("Error fetching profile:", error);
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	//eslint-disable-next-line
	const renderRating = (rating) => {
		const val = parseFloat(rating || 0).toFixed(1);
		return (
			<div className="flex items-center gap-1.5 bg-amber-400/10 text-amber-500 px-3 py-1.5 rounded-lg font-bold text-sm border border-amber-400/20 shadow-inner">
				<Star className="w-4 h-4 fill-amber-400 text-amber-400 drop-shadow-sm" />
				<span>{val}</span>
			</div>
		);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
			<div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col transform transition-all relative overflow-hidden border border-gray-100 max-h-[90vh]">
				{/* Header - Elaborate Odoo Branding */}
				<div className="p-8 flex justify-between items-start bg-gradient-to-br from-[#714B67] to-[#8C5D80] relative overflow-hidden">
					{/* Abstract Background Design */}
					<div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
					<div className="absolute left-0 bottom-0 w-40 h-40 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

					<div className="flex items-center gap-5 relative z-10">
						<div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-[#714B67] shadow-xl text-3xl font-black uppercase border-4 border-white/20">
							{profile?.name?.charAt(0) || "U"}
						</div>
						<div className="space-y-1">
							<h2 className="text-2xl font-bold text-white leading-tight drop-shadow-md">
								{profile?.name || "Loading..."}
							</h2>
							<div className="flex items-center gap-2 text-white/80 font-mono text-sm">
								<ShieldCheck className="w-4 h-4" />
								<span>EMP ID: {profile?.emp_id || "..."}</span>
							</div>
							{profile?.role && (
								<span className="inline-block mt-1 px-2.5 py-0.5 bg-white/20 text-white text-[10px] uppercase font-bold tracking-widest rounded-md backdrop-blur-sm">
									{profile.role}
								</span>
							)}
						</div>
					</div>

					<button
						onClick={onClose}
						className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer z-10 border border-white/10 hover:scale-105"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Body Content */}
				<div className="p-6 overflow-y-auto bg-gray-50/50">
					{loading ? (
						<div className="flex justify-center items-center h-64 flex-col gap-4">
							<div className="w-10 h-10 border-4 border-[#00A09D]/30 border-t-[#00A09D] rounded-full animate-spin"></div>
							<p className="text-sm font-bold text-gray-400 animate-pulse">
								Loading Profile Details...
							</p>
						</div>
					) : profile ? (
						<div className="space-y-6">
							{/* Ratings & Overview */}
							<div className="grid grid-cols-2 gap-4">
								<div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between transition-transform hover:-translate-y-1 hover:shadow-md">
									<div>
										<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
											Passenger Rating
										</p>
										{renderRating(
											profile.passenger_rating,
											"passenger",
										)}
									</div>
									<div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
										<User className="w-5 h-5 text-[#714B67]" />
									</div>
								</div>
								<div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between transition-transform hover:-translate-y-1 hover:shadow-md">
									<div>
										<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
											Driver Rating
										</p>
										{renderRating(profile.driving_rating, "driver")}
									</div>
									<div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
										<Car className="w-5 h-5 text-[#00A09D]" />
									</div>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Personal Information */}
								<div className="space-y-4">
									<h3 className="text-xs font-black text-[#714B67] uppercase tracking-widest border-b border-gray-200 pb-2 flex items-center gap-2">
										<User className="w-4 h-4" />
										Personal Info
									</h3>

									<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
										<div className="flex gap-4 items-center p-4">
											<div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
												<Mail className="w-5 h-5 text-gray-400" />
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-[10px] uppercase text-gray-400 font-bold">
													Email Address
												</p>
												<p className="text-sm text-gray-900 font-semibold truncate">
													{profile.email}
												</p>
											</div>
										</div>

										<div className="flex gap-4 items-center p-4">
											<div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
												<Phone className="w-5 h-5 text-gray-400" />
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-[10px] uppercase text-gray-400 font-bold">
													Phone Number
												</p>
												<p className="text-sm text-gray-900 font-semibold truncate">
													{profile.phone || "Not provided"}
												</p>
											</div>
										</div>

										<div className="flex gap-4 items-center p-4">
											<div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
												<Building2 className="w-5 h-5 text-gray-400" />
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-[10px] uppercase text-gray-400 font-bold">
													Organization
												</p>
												<p className="text-sm text-gray-900 font-semibold truncate">
													{profile.org_name}
												</p>
											</div>
										</div>

										{profile.address && (
											<div className="flex gap-4 items-center p-4">
												<div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
													<MapPin className="w-5 h-5 text-gray-400" />
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-[10px] uppercase text-gray-400 font-bold">
														Address
													</p>
													<p className="text-sm text-gray-900 font-semibold line-clamp-2">
														{profile.address}
													</p>
												</div>
											</div>
										)}
									</div>
								</div>

								{/* Elaborate Vehicle Details */}
								<div className="space-y-4">
									<h3 className="text-xs font-black text-[#00A09D] uppercase tracking-widest border-b border-gray-200 pb-2 flex items-center gap-2">
										<Car className="w-4 h-4" />
										Vehicle Profile
									</h3>

									{profile.vehicle ? (
										<div className="bg-white rounded-2xl border border-[#00A09D]/20 shadow-md overflow-hidden relative">
											{/* Top Accent Bar */}
											<div className="h-2 w-full bg-gradient-to-r from-[#00A09D] to-[#017E84]"></div>

											<div className="p-5">
												<div className="flex justify-between items-start mb-6">
													<div className="flex items-center gap-3">
														<div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-[#00A09D] flex items-center justify-center">
															<Car className="w-6 h-6" />
														</div>
														<div>
															<h4 className="text-lg font-black text-gray-900 tracking-tight leading-none mb-1">
																{profile.vehicle.vehicle_model}
															</h4>
															<div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded border border-gray-200 text-xs font-mono font-bold text-gray-700 uppercase">
																{profile.vehicle.veh_no}
															</div>
														</div>
													</div>
													<div className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg flex items-center gap-1 text-[10px] font-black uppercase tracking-wider border border-emerald-200 shadow-sm">
														<ShieldCheck className="w-3 h-3" />
														Verified
													</div>
												</div>

												<div className="grid grid-cols-2 gap-4">
													{/* DL */}
													<div className="space-y-1">
														<p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
															<FileText className="w-3 h-3" />{" "}
															Driving License
														</p>
														<p className="text-sm font-semibold text-gray-800 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100">
															{profile.vehicle.dl_no || "N/A"}
														</p>
													</div>

													{/* Insurance */}
													<div className="space-y-1">
														<p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
															<ShieldCheck className="w-3 h-3 text-blue-400" />{" "}
															Insurance No.
														</p>
														<p className="text-sm font-semibold text-gray-800 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100">
															{profile.vehicle.insurance_no ||
																"N/A"}
														</p>
													</div>

													{/* Seats */}
													<div className="space-y-1">
														<p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
															<User className="w-3 h-3 text-[#714B67]" />{" "}
															Seating
														</p>
														<p className="text-sm font-bold text-gray-900">
															{profile.vehicle.seating_capacity}{" "}
															Seats
														</p>
													</div>

													{/* Mileage */}
													<div className="space-y-1">
														<p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
															<Droplets className="w-3 h-3 text-[#00A09D]" />{" "}
															Mileage Setup
														</p>
														<p className="text-sm font-bold text-gray-900">
															{parseFloat(
																profile.vehicle
																	.fuel_consumption_ratio || 1,
															).toFixed(1)}
															x Multiplier
														</p>
													</div>
												</div>

												{profile.vehicle.created_at && (
													<div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase">
														<CalendarDays className="w-3.5 h-3.5" />
														Registered:{" "}
														{new Date(
															profile.vehicle.created_at,
														).toLocaleDateString(undefined, {
															year: "numeric",
															month: "short",
															day: "numeric",
														})}
													</div>
												)}
											</div>
										</div>
									) : (
										<div className="bg-white p-8 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 text-center">
											<div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-2">
												<Car className="w-8 h-8 text-gray-300" />
											</div>
											<div>
												<h4 className="text-sm font-bold text-gray-900">
													No Vehicle Registered
												</h4>
												<p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto">
													Register a vehicle from the main menu to
													start publishing rides.
												</p>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					) : (
						<div className="text-center text-gray-500 text-sm py-10">
							Failed to load profile details.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
