import React, { useState, useEffect, useRef } from "react";
import {
	X,
	MapPin,
	Calendar,
	Users,
	DollarSign,
	Loader2,
	Compass,
} from "lucide-react";

// Robust place search with Photon (Komoot OSM) + Nominatim fallback
async function fetchPlaceSuggestions(query, userLoc) {
	if (!query || query.trim().length < 2) return [];

	// Try Photon with user location bias
	try {
		let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&limit=6`;
		if (userLoc && userLoc.length === 2) {
			url += `&lat=${userLoc[0]}&lon=${userLoc[1]}`;
		}
		const res = await fetch(url);
		const data = await res.json();
		if (data && data.features && data.features.length > 0) {
			return data.features.map((f) => {
				const p = f.properties;
				const main = p.name || p.street || p.city || "Location";
				const parts = [
					p.street,
					p.city || p.town || p.district,
					p.state,
					p.country,
				].filter(Boolean);
				const sub = parts.join(", ");
				return {
					title: main,
					subtitle: sub,
					fullAddress: main + (sub ? `, ${sub}` : ""),
					coords: [f.geometry.coordinates[1], f.geometry.coordinates[0]], // [lat, lon]
				};
			});
		}
	} catch (err) {
		console.warn("Photon search failed, falling back to Nominatim", err);
	}

	// Fallback to Nominatim
	try {
		const res = await fetch(
			`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&limit=5`,
		);
		const data = await res.json();
		if (data && data.length > 0) {
			return data.map((item) => ({
				title: item.display_name.split(",")[0],
				subtitle: item.display_name.split(",").slice(1, 4).join(","),
				fullAddress: item.display_name,
				coords: [parseFloat(item.lat), parseFloat(item.lon)],
			}));
		}
	} catch (err) {
		console.error("Nominatim search failed", err);
	}

	return [];
}

function PublishRideModal({ onClose, onPublish, userLocation }) {
	const [originInput, setOriginInput] = useState("");
	const [originData, setOriginData] = useState(null); // { lat, lng, address }

	const [destInput, setDestInput] = useState("");
	const [destData, setDestData] = useState(null); // { lat, lng, address }

	const [departureTime, setDepartureTime] = useState("");
	const [seats, setSeats] = useState(4);
	const [fare, setFare] = useState("");

	const [originSuggestions, setOriginSuggestions] = useState([]);
	const [destSuggestions, setDestSuggestions] = useState([]);
	const [loadingOrigin, setLoadingOrigin] = useState(false);
	const [loadingDest, setLoadingDest] = useState(false);

	const [showOriginDropdown, setShowOriginDropdown] = useState(false);
	const [showDestDropdown, setShowDestDropdown] = useState(false);

	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	const originRef = useRef(null);
	const destRef = useRef(null);

	// Click outside listener to close dropdowns
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (originRef.current && !originRef.current.contains(e.target)) {
				setShowOriginDropdown(false);
			}
			if (destRef.current && !destRef.current.contains(e.target)) {
				setShowDestDropdown(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Set default origin to Current Location when GPS is detected
	useEffect(() => {
		if (
			userLocation &&
			(!originInput || originInput === "Your Current Location")
		) {
			//eslint-disable-next-line
			setOriginInput("Your Current Location");
			setOriginData({
				lat: userLocation[0],
				lng: userLocation[1],
				address: "Your Current Location",
			});
		}
		//eslint-disable-next-line
	}, [userLocation]);

	// Fetch suggestions for Origin
	useEffect(() => {
		if (!originInput.trim() || originInput.trim().length < 2) {
			//eslint-disable-next-line
			setOriginSuggestions([]);
			setShowOriginDropdown(false);
			return;
		}

		// Skip if input matches the selected data address exactly
		if (originData && originInput === originData.address) {
			return;
		}

		const timer = setTimeout(async () => {
			setLoadingOrigin(true);
			const results = await fetchPlaceSuggestions(originInput, userLocation);
			setOriginSuggestions(results);
			setShowOriginDropdown(true);
			setLoadingOrigin(false);
		}, 250);

		return () => clearTimeout(timer);
	}, [originInput, userLocation, originData]);

	// Fetch suggestions for Destination
	useEffect(() => {
		if (!destInput.trim() || destInput.trim().length < 2) {
			//eslint-disable-next-line
			setDestSuggestions([]);
			setShowDestDropdown(false);
			return;
		}

		// Skip if input matches the selected data address exactly
		if (destData && destInput === destData.address) {
			return;
		}

		const timer = setTimeout(async () => {
			setLoadingDest(true);
			const results = await fetchPlaceSuggestions(destInput, userLocation);
			setDestSuggestions(results);
			setShowDestDropdown(true);
			setLoadingDest(false);
		}, 250);

		return () => clearTimeout(timer);
	}, [destInput, userLocation, destData]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (!originData) {
			setError("Please select a valid origin from the suggestions.");
			return;
		}
		if (!destData) {
			setError("Please select a valid destination from the suggestions.");
			return;
		}
		if (!departureTime) {
			setError("Please select a departure time.");
			return;
		}
		if (!fare || parseFloat(fare) <= 0) {
			setError("Please enter a valid fare per seat.");
			return;
		}

		setSubmitting(true);
		try {
			const token = localStorage.getItem("token");
			const res = await fetch("/publish-ride", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					origin: originData,
					destination: destData,
					departure_time: departureTime,
					seats: parseInt(seats), // Passed to form body, backend handles DB sync
					fare_per_seat: parseFloat(fare),
				}),
			});

			const data = await res.json();
			if (res.ok && data.success) {
				onPublish(data);
			} else {
				setError(
					data.message || "Failed to publish ride. Please try again.",
				);
			}
		} catch (err) {
			console.error("Error publishing ride:", err);
			setError("A network error occurred. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
			<div className="bg-[var(--bg-card)] rounded-xl shadow-none w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--bg-hover)]/50 shrink-0">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)]">
							<Compass className="w-5 h-5" />
						</div>
						<h2 className="text-xl font-bold text-[var(--text)]">
							Publish a Ride
						</h2>
					</div>
					<button
						onClick={onClose}
						className="text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors cursor-pointer"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				{/* Body */}
				<div className="overflow-y-auto p-6">
					{error && (
						<div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm font-medium">
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Origin Input */}
						<div className="space-y-1.5 relative" ref={originRef}>
							<label className="text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider flex items-center gap-1.5">
								<MapPin className="w-3.5 h-3.5 text-emerald-600" />
								Origin Address
							</label>
							<div className="relative">
								<input
									required
									type="text"
									value={originInput}
									onChange={(e) => {
										setOriginInput(e.target.value);
										if (originData) setOriginData(null);
									}}
									placeholder="Search departure location..."
									className="w-full pl-4 pr-10 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[var(--border-focus)] transition-all"
								/>
								{loadingOrigin && (
									<div className="absolute right-3.5 top-3.5">
										<Loader2 className="w-4 h-4 animate-spin text-[var(--text-3)]" />
									</div>
								)}
							</div>

							{/* Origin Suggestions Dropdown */}
							{showOriginDropdown && originSuggestions.length > 0 && (
								<div className="absolute left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-none max-h-52 overflow-y-auto z-50 py-1">
									{originSuggestions.map((item, idx) => (
										<button
											key={idx}
											type="button"
											onClick={() => {
												setOriginInput(item.fullAddress);
												setOriginData({
													lat: item.coords[0],
													lng: item.coords[1],
													address: item.fullAddress,
												});
												setShowOriginDropdown(false);
											}}
											className="w-full text-left px-4 py-2.5 hover:bg-[var(--bg-hover)] flex items-start gap-2.5 transition-colors border-b border-gray-50 last:border-b-0 cursor-pointer"
										>
											<MapPin className="w-4 h-4 text-[var(--text-3)] shrink-0 mt-0.5" />
											<div>
												<p className="text-sm font-semibold text-[var(--text)]">
													{item.title}
												</p>
												{item.subtitle && (
													<p className="text-xs text-[var(--text-3)] mt-0.5">
														{item.subtitle}
													</p>
												)}
											</div>
										</button>
									))}
								</div>
							)}
						</div>

						{/* Destination Input */}
						<div className="space-y-1.5 relative" ref={destRef}>
							<label className="text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider flex items-center gap-1.5">
								<MapPin className="w-3.5 h-3.5 text-rose-600" />
								Destination Address
							</label>
							<div className="relative">
								<input
									required
									type="text"
									value={destInput}
									onChange={(e) => {
										setDestInput(e.target.value);
										if (destData) setDestData(null);
									}}
									placeholder="Search drop-off location..."
									className="w-full pl-4 pr-10 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[var(--border-focus)] transition-all"
								/>
								{loadingDest && (
									<div className="absolute right-3.5 top-3.5">
										<Loader2 className="w-4 h-4 animate-spin text-[var(--text-3)]" />
									</div>
								)}
							</div>

							{/* Destination Suggestions Dropdown */}
							{showDestDropdown && destSuggestions.length > 0 && (
								<div className="absolute left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-none max-h-52 overflow-y-auto z-50 py-1">
									{destSuggestions.map((item, idx) => (
										<button
											key={idx}
											type="button"
											onClick={() => {
												setDestInput(item.fullAddress);
												setDestData({
													lat: item.coords[0],
													lng: item.coords[1],
													address: item.fullAddress,
												});
												setShowDestDropdown(false);
											}}
											className="w-full text-left px-4 py-2.5 hover:bg-[var(--bg-hover)] flex items-start gap-2.5 transition-colors border-b border-gray-50 last:border-b-0 cursor-pointer"
										>
											<MapPin className="w-4 h-4 text-[var(--text-3)] shrink-0 mt-0.5" />
											<div>
												<p className="text-sm font-semibold text-[var(--text)]">
													{item.title}
												</p>
												{item.subtitle && (
													<p className="text-xs text-[var(--text-3)] mt-0.5">
														{item.subtitle}
													</p>
												)}
											</div>
										</button>
									))}
								</div>
							)}
						</div>

						{/* Departure Time */}
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider flex items-center gap-1.5">
								<Calendar className="w-3.5 h-3.5 text-[var(--text-3)]" />
								Departure Time
							</label>
							<input
								required
								type="datetime-local"
								value={departureTime}
								onChange={(e) => setDepartureTime(e.target.value)}
								className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[var(--border-focus)] transition-all"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							{/* Seats */}
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider flex items-center gap-1.5">
									<Users className="w-3.5 h-3.5 text-[var(--text-3)]" />
									Available Seats
								</label>
								<input
									required
									type="number"
									min="1"
									max="8"
									value={seats}
									onChange={(e) => setSeats(e.target.value)}
									className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[var(--border-focus)] transition-all"
								/>
							</div>

							{/* Fare Per Seat */}
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider flex items-center gap-1.5">
									<DollarSign className="w-3.5 h-3.5 text-[var(--text-3)]" />
									Fare Per Seat (â‚¹)
								</label>
								<input
									required
									type="number"
									min="0"
									step="0.01"
									value={fare}
									onChange={(e) => setFare(e.target.value)}
									placeholder="e.g. 150"
									className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[var(--border-focus)] transition-all"
								/>
							</div>
						</div>

						{/* Submit button */}
						<div className="pt-4">
							<button
								type="submit"
								disabled={submitting}
								className="w-full py-3 px-4 bg-[var(--primary)] hover:bg-[var(--primary)] text-white font-semibold rounded-xl transition-all shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
							>
								{submitting ? (
									<>
										<Loader2 className="w-5 h-5 animate-spin" />
										Publishing Ride...
									</>
								) : (
									"Publish Ride"
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}

export default PublishRideModal;
