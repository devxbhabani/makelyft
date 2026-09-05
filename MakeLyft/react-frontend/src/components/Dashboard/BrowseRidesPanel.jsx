import React, { useState } from "react";
import { showAlert } from "../../utils/alertService";
import {
	ArrowLeft,
	Car,
	Clock,
	Users,
	Star,
	ShieldCheck,
	Search,
	CheckCircle2,
	X,
	Wallet,
} from "lucide-react";

export default function BrowseRidesPanel({
	rides = [],
	loading = false,
	selectedRide = null,
	onSelectRide,
	onBack,
	userLocation,
	onRideBooked,
	activeTrip,
}) {
	const [searchTerm, setSearchTerm] = useState("");
	const [filterType, setFilterType] = useState("all"); // 'all' | 'under5km' | 'seats' | 'fare' | 'route'
	const [bookingModalRide, setBookingModalRide] = useState(null);
	const [selectedSeatPref, setSelectedSeatPref] = useState("Seat 1 (Front Window)");
	const [bookingLoading, setBookingLoading] = useState(false);
	const [bookingSuccess, setBookingSuccess] = useState(null); // { otp, booking_id }

	// Filter rides
	const filteredRides = rides
		.filter((ride) => {
			const matchesSearch =
				ride.driver_name
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				ride.vehicle_model
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				ride.destination?.name
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				ride.driver_dept?.toLowerCase().includes(searchTerm.toLowerCase());

			if (!matchesSearch) return false;

			if (filterType === "under5km") {
				return (ride.distance_km ?? 99) <= 5.0;
			}
			if (filterType === "seats") {
				return (ride.available_seats || 0) >= 3;
			}
			if (filterType === "route") {
				return ride.route_match === true;
			}
			return true;
		})
		.sort((a, b) => {
			if (filterType === "fare") {
				return (a.fare_per_seat || 0) - (b.fare_per_seat || 0);
			}
			return (a.distance_km ?? 99) - (b.distance_km ?? 99);
		});

	const handleBookRide = async (ride) => {
		const token = localStorage.getItem("token");
		const user = JSON.parse(localStorage.getItem("user") || "{}");
		const empId = user.emp_id || "EMP-DEFAULT";
		const fare = ride.fare_per_seat || 45;

		setBookingLoading(true);

		try {
			const res = await fetch("/book-ride", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					ride_id: ride.ride_id,
					pickup_location: ride.origin,
					dropoff_location: ride.destination,
				}),
			});

			const data = await res.json();
			if (data.success) {

				const seatNo = selectedSeatPref || `Seat #${Math.floor(Math.random() * 3) + 1} (Window)`;
				const bookingObj = {
					otp: data.pickup_otp || Math.floor(1000 + Math.random() * 9000),
					booking_id:
						data.booking_id ||
						"BK-" + Math.floor(10000 + Math.random() * 90000),
					ride: ride,
					fare: fare,
					seat_no: seatNo,
					status: "requested",
				};
				setBookingSuccess(bookingObj);
				if (onRideBooked) onRideBooked(bookingObj);
			} else {
				showAlert(data.message || "Failed to book ride", "Booking Failed", "error");
			}
		} catch (err) {
			console.error("Booking error:", err);
			showAlert("Could not connect to the server. Please check your connection and try again.", "Booking Error", "error");
		} finally {
			setBookingLoading(false);
		}
	};

	return (
		<div className="flex flex-col h-full bg-[var(--bg-card)] rounded-xl shadow-none border border-[var(--border)] overflow-hidden text-left">
			{/* Header */}
			<div className="p-5 border-b border-[var(--border)] bg-[var(--bg-hover)] from-teal-50/40  to-purple-50/30">
				<div className="flex items-center justify-between gap-3 mb-3">
					<button
						onClick={onBack}
						className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[var(--primary)] bg-[var(--bg-card)] border border-[var(--border-focus)]/20 hover:bg-[var(--primary)] hover:text-white rounded-xl shadow-none transition-all duration-200 cursor-pointer group"
					>
						<ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
						<span>Back to Search</span>
					</button>

					<div className="flex items-center gap-2">
						<span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--border-focus)]/20">
							<span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"></span>
							10 km Radius
						</span>
						<span className="px-2 py-0.5 bg-[var(--bg-hover)] text-[var(--text-2)] rounded-lg text-xs font-bold">
							{filteredRides.length} Found
						</span>
					</div>
				</div>

				<div>
					<h2 className="text-lg font-extrabold text-[var(--text)] tracking-tight">
						Available Carpools Nearby
					</h2>
					<p className="text-xs text-[var(--text-3)] mt-0.5">
						Verified colleagues travelling within 10 km of your location.
					</p>
				</div>

				{/* Search & Filter Bar */}
				<div className="mt-3.5 space-y-2">
					<div className="relative">
						<Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Search by driver, department, destination..."
							className="w-full pl-8 pr-3 py-2 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-transparent/20 focus:border-[var(--border-focus)] transition-all"
						/>
						{searchTerm && (
							<button
								onClick={() => setSearchTerm("")}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text-2)]"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						)}
					</div>

					{/* Quick Filter Chips */}
					<div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
						<button
							onClick={() => setFilterType("all")}
							className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
								filterType === "all"
									? "bg-[var(--primary)] text-white shadow-xs"
									: "bg-[var(--bg-hover)] text-[var(--text-2)] hover:bg-[var(--bg-hover)]"
							}`}
						>
							All Rides
						</button>

						<button
							onClick={() => setFilterType("under5km")}
							className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
								filterType === "under5km"
									? "bg-[var(--accent)] text-white shadow-xs"
									: "bg-[var(--bg-hover)] text-[var(--text-2)] hover:bg-[var(--bg-hover)]"
							}`}
						>
							Under 5 km
						</button>

						<button
							onClick={() => setFilterType("route")}
							className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
								filterType === "route"
									? "bg-[var(--accent)] text-white shadow-xs"
									: "bg-[var(--bg-hover)] text-[var(--text-2)] hover:bg-[var(--bg-hover)]"
							}`}
						>
							On My Route
						</button>

						<button
							onClick={() => setFilterType("seats")}
							className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
								filterType === "seats"
									? "bg-[var(--accent)] text-white shadow-xs"
									: "bg-[var(--bg-hover)] text-[var(--text-2)] hover:bg-[var(--bg-hover)]"
							}`}
						>
							3+ Seats
						</button>

						<button
							onClick={() => setFilterType("fare")}
							className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
								filterType === "fare"
									? "bg-[var(--accent)] text-white shadow-xs"
									: "bg-[var(--bg-hover)] text-[var(--text-2)] hover:bg-[var(--bg-hover)]"
							}`}
						>
							Lowest Fare
						</button>
					</div>
				</div>
			</div>

			{/* Rides List Container */}
			<div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-transparent">
				{loading ? (
					<div className="py-12 flex flex-col items-center justify-center text-[var(--text-3)] space-y-2">
						<div className="w-8 h-8 border-3 border-[var(--border-focus)] border-t-transparent rounded-full animate-spin"></div>
						<p className="text-xs font-semibold">
							Scanning 10km radius...
						</p>
					</div>
				) : filteredRides.length > 0 ? (
					filteredRides.map((ride) => {
						const isSelected = selectedRide?.ride_id === ride.ride_id;
						const depTime = new Date(ride.departure_time);
						const timeStr = isNaN(depTime.getTime())
							? "In 15 mins"
							: depTime.toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								});

						return (
							<div
								key={ride.ride_id}
								onClick={() => onSelectRide(ride)}
								className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left ${
									isSelected
										? "bg-[var(--accent)]/5 border-[var(--border-focus)] ring-2 ring-[#00A09D]/20 shadow-none"
										: "bg-[var(--bg-card)] border-[var(--border)]/90 hover:border-[var(--border)] hover:shadow-none"
								}`}
							>
								{/* Driver & Vehicle Header */}
								<div className="flex items-start justify-between gap-2 mb-2.5">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-sm border border-[var(--border-focus)]/20 shrink-0 shadow-none">
											{ride.driver_name
												? ride.driver_name.charAt(0).toUpperCase()
												: "D"}
										</div>
										<div>
											<div className="flex items-center gap-1.5">
												<span className="font-bold text-sm text-[var(--text)]">
													{ride.driver_name}
												</span>
												<ShieldCheck
													className="w-4 h-4 text-[var(--accent)]"
													title="Verified Colleague"
												/>
											</div>
											<p className="text-[11px] text-[var(--text-3)] flex items-center gap-1">
												<span>
													{ride.driver_dept || "Engineering"}
												</span>
												<span>â€¢</span>
												<span className="text-amber-500 font-bold flex items-center gap-0.5">
													<Star className="w-3 h-3 fill-amber-400" />
													{ride.driving_rating || 4.9}
												</span>
											</p>
										</div>
									</div>

									<div className="text-right">
										<div className="text-base font-extrabold text-[var(--accent)] tracking-tight">
											₹{ride.fare_per_seat || 45}
										</div>
										<span className="text-[10px] text-[var(--text-3)] uppercase font-semibold">
											per seat
										</span>
									</div>
								</div>

								{/* Car Details Badge */}
								<div className="mb-3 flex items-center justify-between text-xs py-1.5 px-2.5 bg-[var(--bg-hover)] rounded-lg border border-[var(--border)]">
									<div className="flex items-center gap-1.5 text-[var(--text-2)] font-semibold">
										<Car className="w-3.5 h-3.5 text-[var(--primary)]" />
										<span>{ride.vehicle_model || "Swift Dzire"}</span>
									</div>
									<span className="font-mono text-[11px] text-[var(--text-3)] uppercase font-bold">
										{ride.veh_no || "WB 02 AB 1234"}
									</span>
								</div>

								{/* Route Points */}
								<div className="space-y-1.5 text-xs text-[var(--text-2)] mb-3.5">
									<div className="flex items-start gap-2">
										<div className="w-2 h-2 rounded-full bg-[var(--accent)] mt-1 shrink-0"></div>
										<div className="flex-1 min-w-0">
											<span className="text-[10px] uppercase font-bold text-[var(--text-3)] block">
												Pickup (Near You)
											</span>
											<p className="font-semibold text-[var(--text)] truncate">
												{ride.origin?.name ||
													"1.2km from your spot"}
											</p>
										</div>
										<span className="text-[11px] font-bold text-[var(--accent)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded border border-[var(--border)] shrink-0">
											{ride.distance_km || 1.2} km away
										</span>
									</div>

									<div className="flex items-start gap-2">
										<div className="w-2 h-2 rounded-full bg-[#EF4444] mt-1 shrink-0"></div>
										<div className="flex-1 min-w-0">
											<span className="text-[10px] uppercase font-bold text-[var(--text-3)] block">
												Destination
											</span>
											<p className="font-semibold text-[var(--text)] truncate">
												{ride.destination?.name ||
													"Tech Hub Sector V"}
											</p>
										</div>
									</div>
								</div>

								{/* Footer Info & Actions */}
								<div className="pt-2.5 border-t border-[var(--border)] flex items-center justify-between gap-2">
									<div className="flex items-center gap-3 text-xs text-[var(--text-3)]">
										<span className="flex items-center gap-1 font-semibold text-[var(--text-2)]">
											<Clock className="w-3.5 h-3.5 text-[var(--text-3)]" />
											{timeStr}
										</span>
										<span className="flex items-center gap-1 font-semibold text-[var(--accent)]">
											<Users className="w-3.5 h-3.5" />
											{ride.available_seats || 3} seats left
										</span>
									</div>

									<div className="flex items-center gap-2">
										<button
											onClick={(e) => {
												e.stopPropagation();
												onSelectRide(ride);
											}}
											className="px-2.5 py-1.5 text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors cursor-pointer"
										>
											Map View
										</button>

										{activeTrip && (activeTrip.ride?.ride_id === ride.ride_id || activeTrip.ride_id === ride.ride_id) ? (
											<button
												onClick={(e) => {
													e.stopPropagation();
													if (onBack) onBack();
												}}
												className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
											>
												â³ Seat Requested (View Request)
											</button>
										) : activeTrip ? (
											<button
												disabled
												className="px-3.5 py-1.5 bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-3)] text-xs font-bold rounded-lg cursor-not-allowed flex items-center gap-1"
												title="You already have an active seat request in this time slot!"
											>
												Slot Requested
											</button>
										) : (
											<button
												onClick={(e) => {
													e.stopPropagation();
													setBookingModalRide(ride);
												}}
												className="px-3.5 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent)] text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
											>
												Request Seat
											</button>
										)}
									</div>
								</div>
							</div>
						);
					})
				) : (
					<div className="py-12 px-6 text-center space-y-3 bg-[var(--bg-hover)]/60 rounded-xl border border-dashed border-[var(--border)]">
						<div className="w-12 h-12 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mx-auto text-[var(--text-3)]">
							<Car className="w-6 h-6" />
						</div>
						<div>
							<p className="text-sm font-bold text-[var(--text)]">
								No Carpools In This Filter
							</p>
							<p className="text-xs text-[var(--text-3)] mt-0.5">
								Try switching filter tabs or clearing your search term.
							</p>
						</div>
						<button
							onClick={() => {
								setSearchTerm("");
								setFilterType("all");
							}}
							className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--primary)] hover:bg-[var(--bg-hover)] shadow-none cursor-pointer"
						>
							Reset Filters
						</button>
					</div>
				)}
			</div>

			{/* MODAL: CONFIRM BOOKING */}
			{bookingModalRide && (
				<div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
					<div className="bg-[var(--bg-card)] rounded-xl shadow-none w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
						<div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--bg-hover)]/50">
							<div className="flex items-center gap-2">
								<div className="w-8 h-8 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center text-[var(--accent)]">
									<Car className="w-4 h-4" />
								</div>
								<h3 className="text-base font-bold text-[var(--text)]">
									Request a Seat
								</h3>
							</div>
							<button
								onClick={() => setBookingModalRide(null)}
								className="text-[var(--text-3)] hover:text-[var(--text-2)] cursor-pointer"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="p-5 space-y-4">
							<div className="p-3.5 bg-[var(--bg-hover)]/60 border border-[var(--border)] rounded-xl space-y-2 text-xs">
								<div className="flex justify-between items-center">
									<span className="text-[var(--text-2)] font-semibold">
										Driver
									</span>
									<span className="font-bold text-[var(--text)]">
										{bookingModalRide.driver_name} (
										{bookingModalRide.driver_dept})
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-[var(--text-2)] font-semibold">
										Vehicle
									</span>
									<span className="font-bold text-[var(--text)]">
										{bookingModalRide.vehicle_model} â€¢{" "}
										{bookingModalRide.veh_no}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-[var(--text-2)] font-semibold">
										Destination
									</span>
									<span className="font-bold text-[var(--text)] truncate max-w-[200px]">
										{bookingModalRide.destination?.name}
									</span>
								</div>
								<div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
									<div className="flex items-center gap-1.5 text-[var(--text)] font-bold">
										<Wallet className="w-3.5 h-3.5 text-[var(--primary)]" />
										<span>Commute Contribution</span>
									</div>
									<div className="text-right">
										<span className="text-base font-extrabold text-[var(--accent)]">
											₹{bookingModalRide.fare_per_seat || 45}
										</span>
										<span className="block text-[10px] text-[var(--text-3)] font-medium">
											from MakeLyft Wallet
										</span>
									</div>
								</div>

								{/* Seat Selection â€” Dynamic based on available seats */}
								<div className="pt-2 border-t border-[var(--border)]">
									<label className="block text-xs font-bold text-[var(--text-2)] uppercase tracking-wider mb-1.5">
										Choose Preferred Seat ({bookingModalRide.available_seats} available)
									</label>
									<select
										value={selectedSeatPref}
										onChange={(e) => setSelectedSeatPref(e.target.value)}
										className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-transparent"
									>
										{(() => {
											const seatLabels = ["Seat 1 (Front Window)", "Seat 2 (Rear Left Window)", "Seat 3 (Rear Right Window)", "Seat 4 (Rear Middle)"];
											const totalSeats = bookingModalRide.total_seats || 4;
											const availableCount = bookingModalRide.available_seats || 0;
											// Show only as many seat options as are available, capped by total
											const seatCount = Math.min(availableCount, totalSeats, seatLabels.length);
											return seatLabels.slice(0, seatCount).map((label, idx) => (
												<option key={idx} value={label}>{label}</option>
											));
										})()}
									</select>
								</div>
							</div>

							<p className="text-xs text-[var(--text-3)]">
								Requesting this seat notifies the driver for approval. Once confirmed by the driver, your seat is locked!
							</p>

							<div className="flex items-center gap-3 pt-2">
								<button
									onClick={() => setBookingModalRide(null)}
									className="flex-1 py-2.5 border border-[var(--border)] text-[var(--text-2)] text-xs font-bold rounded-xl hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={() => {
										handleBookRide(bookingModalRide);
										setBookingModalRide(null);
									}}
									disabled={bookingLoading}
									className="flex-1 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
								>
									{bookingLoading ? "Sending..." : "Send Seat Request"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* MODAL: BOOKING SUCCESS WITH OTP */}
			{bookingSuccess && (
				<div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
					<div className="bg-[var(--bg-card)] rounded-xl shadow-none w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-center p-6 space-y-4">
						<div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
							<CheckCircle2 className="w-8 h-8" />
						</div>

						<div>
							<h3 className="text-lg font-extrabold text-[var(--text)]">
								Ride Booked Successfully!
							</h3>
							<p className="text-xs text-[var(--text-3)] mt-1">
								Share this 4-digit OTP with your driver at pickup.
							</p>
						</div>

						{/* Large OTP Display */}
						<div className="bg-[var(--bg-hover)] border-2 border-dashed border-[var(--border-focus)] rounded-xl p-4 my-2">
							<span className="text-xs font-bold text-[var(--text-3)] uppercase tracking-widest block mb-1">
								Pickup Verification OTP
							</span>
							<div className="text-3xl font-mono font-black text-[var(--accent)] tracking-widest">
								{bookingSuccess.otp}
							</div>
							<span className="text-[11px] text-[var(--text-3)] mt-1 block">
								Booking ID: {bookingSuccess.booking_id}
							</span>
							<div className="mt-2 inline-block px-3 py-1 bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--accent)] text-xs font-extrabold rounded-lg">
								📍’º {bookingSuccess.seat_no || "Seat #2 (Front Left)"}
							</div>
						</div>

						{/* Wallet Payment confirmation tag */}
						<div className="p-2.5 bg-[var(--bg-hover)] rounded-xl border border-[var(--border)] flex items-center justify-between text-xs">
							<span className="text-[var(--text-2)] font-medium flex items-center gap-1.5">
								<Wallet className="w-3.5 h-3.5 text-[var(--primary)]" /> MakeLyft Wallet
							</span>
							<span className="font-bold text-[var(--primary)]">
								-₹{bookingSuccess.fare || 45}.00 Deducted
							</span>
						</div>

						<button
							onClick={() => setBookingSuccess(null)}
							className="w-full py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
						>
							Great, Got It!
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
