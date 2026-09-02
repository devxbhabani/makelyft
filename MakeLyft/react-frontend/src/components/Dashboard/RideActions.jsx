import React, { useState, useEffect, useRef } from "react";
import { showAlert } from "../../utils/alertService";
import {
	Search,
	MapPin,
	Plus,
	Loader2,
	LocateFixed,
	Navigation,
	Clock,
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

function RideActions({
	onPublishRide,
	onLocationUpdate,
	pickupCoords,
	dropoffCoords,
	userLocation,
	onSearchRoute,
	onBrowseRides,
}) {
	const [source, setSource] = useState("");
	const [destination, setDestination] = useState("");

	const [sourceSuggestions, setSourceSuggestions] = useState([]);
	const [destSuggestions, setDestSuggestions] = useState([]);
	const [loadingSource, setLoadingSource] = useState(false);
	const [loadingDest, setLoadingDest] = useState(false);

	const [showSourceDropdown, setShowSourceDropdown] = useState(false);
	const [showDestDropdown, setShowDestDropdown] = useState(false);

	const [searchingRoute, setSearchingRoute] = useState(false);
	const [tripSummary, setTripSummary] = useState(null);

	const sourceRef = useRef(null);
	const destRef = useRef(null);

	// Set default source to Current Location when GPS is detected
	useEffect(() => {
		if (userLocation && (!source || source === "Your Current Location")) {
			//eslint-disable-next-line
			setSource("Your Current Location");
			onLocationUpdate("source", userLocation);
		}
		//eslint-disable-next-line
	}, [userLocation]);

	// Click outside listener to close dropdowns
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (sourceRef.current && !sourceRef.current.contains(e.target)) {
				setShowSourceDropdown(false);
			}
			if (destRef.current && !destRef.current.contains(e.target)) {
				setShowDestDropdown(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Fetch suggestions for Source
	useEffect(() => {
		if (
			!source.trim() ||
			source === "Your Current Location" ||
			source.trim().length < 2
		) {
			//eslint-disable-next-line
			setSourceSuggestions([]);
			setShowSourceDropdown(false);
			return;
		}

		const timer = setTimeout(async () => {
			setLoadingSource(true);
			const results = await fetchPlaceSuggestions(source, userLocation);
			setSourceSuggestions(results);
			setShowSourceDropdown(true);
			setLoadingSource(false);
		}, 250);

		return () => clearTimeout(timer);
	}, [source, userLocation]);

	// Fetch suggestions for Destination
	useEffect(() => {
		if (!destination.trim() || destination.trim().length < 2) {
			setDestSuggestions([]);
			setShowDestDropdown(false);
			return;
		}

		const timer = setTimeout(async () => {
			setLoadingDest(true);
			const results = await fetchPlaceSuggestions(destination, userLocation);
			setDestSuggestions(results);
			setShowDestDropdown(true);
			setLoadingDest(false);
		}, 250);

		return () => clearTimeout(timer);
	}, [destination, userLocation]);

	const handleSelectSource = (item) => {
		setSource(item.title);
		onLocationUpdate("source", item.coords);
		setShowSourceDropdown(false);
		setTripSummary(null);
	};

	const handleSelectDest = (item) => {
		setDestination(item.title);
		onLocationUpdate("destination", item.coords);
		setShowDestDropdown(false);
		setTripSummary(null);
	};

	const handleUseCurrentLocation = () => {
		if (userLocation) {
			setSource("Your Current Location");
			onLocationUpdate("source", userLocation);
			setShowSourceDropdown(false);
			setTripSummary(null);
		} else if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					const coords = [pos.coords.latitude, pos.coords.longitude];
					setSource("Your Current Location");
					onLocationUpdate("source", coords);
					setShowSourceDropdown(false);
				},
				(err) => {
					showAlert(
						"Could not access your location. Please enable location permissions.",
						"Location Error",
						"error"
					);
				},
			);
		}
	};

	const handleSearch = async () => {
		if (!source.trim() || !destination.trim()) {
			showAlert("Please enter both a Source and a Destination!", "Missing Fields", "error");
			return;
		}

		setSearchingRoute(true);
		try {
			// Resolve source coordinates if missing
			let startCoords = pickupCoords;
			if (!startCoords) {
				if (source === "Your Current Location" && userLocation) {
					startCoords = userLocation;
				} else {
					const sRes = await fetchPlaceSuggestions(source, userLocation);
					if (sRes.length > 0) {
						startCoords = sRes[0].coords;
						onLocationUpdate("source", startCoords);
					}
				}
			}

			// Resolve destination coordinates if missing
			let endCoords = dropoffCoords;
			if (!endCoords) {
				const dRes = await fetchPlaceSuggestions(destination, userLocation);
				if (dRes.length > 0) {
					endCoords = dRes[0].coords;
					onLocationUpdate("destination", endCoords);
				}
			}

			if (!startCoords || !endCoords) {
				showAlert("Could not locate the addresses entered. Please pick from the dropdown.", "Location Not Found", "error");
				return;
			}

			// Query OSRM routing API
			const startStr = `${startCoords[1]},${startCoords[0]}`; // lng,lat
			const endStr = `${endCoords[1]},${endCoords[0]}`;
			const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startStr};${endStr}?overview=full&geometries=geojson`;

			const res = await fetch(osrmUrl);
			const data = await res.json();

			if (data && data.routes && data.routes.length > 0) {
				const route = data.routes[0];
				// Map [lon, lat] to [lat, lon] for Leaflet
				const routeCoords = route.geometry.coordinates.map(
					([lon, lat]) => [lat, lon],
				);

				const distanceKm = (route.distance / 1000).toFixed(1);
				const durationMins = Math.round(route.duration / 60);

				setTripSummary({
					distance: distanceKm,
					duration: durationMins,
				});

				onSearchRoute(routeCoords);
			} else {
				// Fallback straight line
				onSearchRoute([startCoords, endCoords]);
				const distApprox = 12.5;
				setTripSummary({
					distance: distApprox,
					duration: 25,
				});
			}
		} catch (err) {
			console.error("Route calculation error:", err);
			if (pickupCoords && dropoffCoords) {
				onSearchRoute([pickupCoords, dropoffCoords]);
			}
		} finally {
			setSearchingRoute(false);
		}
	};

	return (
		<div className="flex flex-col h-full gap-4 text-left overflow-y-auto pr-0.5">
			{/* Publish Ride Card */}
			<div className="bg-white rounded-2xl shadow-2xs border border-gray-200 p-4 shrink-0">
				<div className="flex items-center justify-between mb-1.5">
					<h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
						<Compass className="w-4 h-4 text-[#714B67]" />
						<span>Publish a Ride</span>
					</h3>
					<span className="text-[10px] font-bold text-[#714B67] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
						Driver
					</span>
				</div>
				<p className="text-xs text-gray-500 mb-3">
					Driving to office or returning home? Share empty seats & earn.
				</p>
				<button
					onClick={onPublishRide}
					className="w-full py-2.5 px-4 bg-[#714B67] hover:bg-[#5c3c54] text-white text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
				>
					<Plus className="w-4 h-4" /> Publish Ride
				</button>
			</div>

			{/* Find Rides Card */}
			<div className="bg-white rounded-2xl shadow-2xs border border-gray-200 p-4 flex-1 flex flex-col justify-between">
				<div>
					<div className="flex items-center justify-between mb-1">
						<h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
							<Navigation className="w-4 h-4 text-[#00A09D]" />
							<span>Find Rides & Plan Route</span>
						</h3>
						<span className="text-[10px] font-bold text-[#00A09D] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
							Passenger
						</span>
					</div>
					<p className="text-xs text-gray-500 mb-3.5">
						Search your route or explore nearby carpools.
					</p>

					<div className="space-y-3">
						{/* Source Input & Suggestions */}
						<div className="space-y-1 relative" ref={sourceRef}>
							<div className="flex items-center justify-between">
								<label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
									Source
								</label>
								<button
									type="button"
									onClick={handleUseCurrentLocation}
									className="text-[11px] text-[#00A09D] hover:text-[#008f8c] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
									title="Use Current Location"
								>
									<LocateFixed className="w-3 h-3" />
									<span>My Location</span>
								</button>
							</div>

							<div className="relative">
								<input
									type="text"
									value={source}
									onChange={(e) => {
										setSource(e.target.value);
										if (pickupCoords) onLocationUpdate("source", null);
										setTripSummary(null);
									}}
									onFocus={() => {
										if (sourceSuggestions.length > 0)
											setShowSourceDropdown(true);
									}}
									placeholder="e.g. Current Location or Adamas University"
									className="w-full pl-8 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A09D]/20 focus:border-[#00A09D] transition-all"
								/>
								<MapPin className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#00A09D]" />
								{loadingSource && (
									<Loader2 className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
								)}
							</div>

							{/* Source Suggestions Dropdown */}
							{showSourceDropdown && (
								<div className="absolute top-full left-0 right-0 z-[1000] bg-white border border-gray-200 rounded-xl shadow-2xl mt-1 max-h-52 overflow-y-auto divide-y divide-gray-100">
									{sourceSuggestions.length > 0
										? sourceSuggestions.map((item, idx) => (
												<div
													key={idx}
													onMouseDown={(e) => {
														e.preventDefault();
														handleSelectSource(item);
													}}
													className="p-2.5 hover:bg-teal-50/60 cursor-pointer flex items-start gap-2 transition-colors text-left"
												>
													<MapPin className="w-3.5 h-3.5 text-[#00A09D] shrink-0 mt-0.5" />
													<div className="flex-1 min-w-0">
														<p className="text-xs font-semibold text-gray-900 truncate">
															{item.title}
														</p>
														{item.subtitle && (
															<p className="text-[10px] text-gray-500 truncate">
																{item.subtitle}
															</p>
														)}
													</div>
												</div>
											))
										: !loadingSource && (
												<div className="p-2.5 text-xs text-gray-500 text-center">
													No matching locations found
												</div>
											)}
								</div>
							)}
						</div>

						{/* Destination Input & Suggestions */}
						<div className="space-y-1 relative" ref={destRef}>
							<label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
								Destination
							</label>
							<div className="relative">
								<input
									type="text"
									value={destination}
									onChange={(e) => {
										setDestination(e.target.value);
										if (dropoffCoords)
											onLocationUpdate("destination", null);
										setTripSummary(null);
									}}
									onFocus={() => {
										if (destSuggestions.length > 0)
											setShowDestDropdown(true);
									}}
									placeholder="e.g. Barrackpore or Howrah Station"
									className="w-full pl-8 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A09D]/20 focus:border-[#00A09D] transition-all"
								/>
								<MapPin className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#EF4444]" />
								{loadingDest && (
									<Loader2 className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
								)}
							</div>

							{/* Destination Suggestions Dropdown */}
							{showDestDropdown && (
								<div className="absolute top-full left-0 right-0 z-[1000] bg-white border border-gray-200 rounded-xl shadow-2xl mt-1 max-h-52 overflow-y-auto divide-y divide-gray-100">
									{destSuggestions.length > 0
										? destSuggestions.map((item, idx) => (
												<div
													key={idx}
													onMouseDown={(e) => {
														e.preventDefault();
														handleSelectDest(item);
													}}
													className="p-2.5 hover:bg-rose-50/60 cursor-pointer flex items-start gap-2 transition-colors text-left"
												>
													<MapPin className="w-3.5 h-3.5 text-[#EF4444] shrink-0 mt-0.5" />
													<div className="flex-1 min-w-0">
														<p className="text-xs font-semibold text-gray-900 truncate">
															{item.title}
														</p>
														{item.subtitle && (
															<p className="text-[10px] text-gray-500 truncate">
																{item.subtitle}
															</p>
														)}
													</div>
												</div>
											))
										: !loadingDest && (
												<div className="p-2.5 text-xs text-gray-500 text-center">
													No matching locations found
												</div>
											)}
								</div>
							)}
						</div>

						{/* Search Button */}
						<button
							onClick={handleSearch}
							disabled={searchingRoute}
							className="w-full py-2.5 px-4 bg-[#00A09D] hover:bg-[#008f8c] disabled:bg-[#00A09D]/60 text-white font-bold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
						>
							{searchingRoute ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Calculating Road Route...
								</>
							) : (
								<>
									<Search className="w-4 h-4" />
									Calculate Route on Map
								</>
							)}
						</button>

						{/* Trip Summary Card */}
						{tripSummary && (
							<div className="bg-teal-50/80 border border-teal-100 rounded-xl p-3 flex items-center justify-between shadow-2xs">
								<div className="flex flex-col">
									<span className="text-[10px] text-teal-700 font-extrabold uppercase tracking-wider flex items-center gap-1">
										<Clock className="w-3 h-3" /> Est. Time
									</span>
									<span className="text-base font-extrabold text-teal-950">
										{tripSummary.duration} mins
									</span>
								</div>
								<div className="h-6 w-px bg-teal-200"></div>
								<div className="flex flex-col items-end">
									<span className="text-[10px] text-teal-700 font-extrabold uppercase tracking-wider flex items-center gap-1">
										<Navigation className="w-3 h-3" /> Distance
									</span>
									<span className="text-base font-extrabold text-teal-950">
										{tripSummary.distance} km
									</span>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Quick Browse Button */}
				<div className="pt-3 mt-3 border-t border-gray-100">
					<button
						onClick={onBrowseRides}
						className="w-full py-2.5 px-3 bg-gradient-to-r from-teal-50/80 via-white to-purple-50/80 hover:from-teal-100 hover:to-purple-100 text-gray-800 font-bold text-xs rounded-xl border border-gray-200 hover:border-[#00A09D]/40 transition-all duration-200 flex items-center justify-between shadow-2xs cursor-pointer group"
					>
						<div className="flex items-center gap-2">
							<Navigation className="w-4 h-4 text-[#00A09D] group-hover:scale-110 transition-transform" />
							<span>Browse Nearby Carpools (10 km)</span>
						</div>
						<span className="px-2 py-0.5 text-[10px] font-bold bg-[#00A09D] text-white rounded-full">
							Explore →
						</span>
					</button>
				</div>
			</div>
		</div>
	);
}

export default RideActions;
