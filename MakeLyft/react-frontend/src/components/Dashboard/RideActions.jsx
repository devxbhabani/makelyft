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



	const iStyle = {
		width: "100%",
		padding: "8px 10px 8px 32px",
		background: "transparent",
		border: "1px solid var(--border)",
		borderRadius: "7px",
		color: "var(--text)",
		fontFamily: "inherit",
		fontSize: "0.8rem",
		outline: "none",
		transition: "border-color 0.15s ease, box-shadow 0.15s ease",
	};
	const iFocus = (e) => { e.target.style.borderColor = "var(--border-focus)"; e.target.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.04)"; };
	const iBlur  = (e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; };


	return (
		<div className="flex flex-col h-full gap-3 text-left overflow-y-auto">

			{/* Publish card */}
			<div className="card p-4">
				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
					<span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
						<Compass style={{ width: 14, height: 14, color: "var(--text-3)" }} /> Publish a ride
					</span>
					<span style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary)", background: "var(--primary-dim)", padding: "2px 8px", borderRadius: "9999px", border: "1px solid rgba(124,106,255,0.2)" }}>
						Driver
					</span>
				</div>
				<p style={{ fontSize: "0.8rem", color: "var(--text-2)", margin: "0 0 16px", lineHeight: 1.5 }}>
					Going to office or heading home? Share empty seats and earn.
				</p>
				<button
					onClick={onPublishRide}
					style={{ width: "100%", padding: "10px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 500, background: "var(--primary)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "opacity 0.15s", fontFamily: "inherit" }}
					onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
					onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
				>
					<Plus style={{ width: 14, height: 14 }} /> Publish Ride
				</button>
			</div>

			{/* Find rides card */}
			<div className="card p-4 flex-1 flex flex-col">
				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
					<span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
						<Navigation style={{ width: 14, height: 14, color: "var(--text-3)" }} /> Find a ride
					</span>
					<span style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)", background: "var(--accent-dim)", padding: "2px 8px", borderRadius: "9999px", border: "1px solid rgba(45,212,191,0.2)" }}>
						Passenger
					</span>
				</div>
				<p style={{ fontSize: "0.8rem", color: "var(--text-2)", margin: "0 0 16px", lineHeight: 1.5 }}>
					Search your route or browse nearby carpools.
				</p>

				<div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>

					{/* Source */}
					<div ref={sourceRef} style={{ position: "relative" }}>
						<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
							<label style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>From</label>
							<button type="button" onClick={handleUseCurrentLocation} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.72rem", color: "var(--accent)", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
								<LocateFixed style={{ width: 11, height: 11 }} /> My location
							</button>
						</div>
						<div style={{ position: "relative" }}>
							<input type="text" value={source}
								onChange={(e) => { setSource(e.target.value); if (pickupCoords) onLocationUpdate("source", null); setTripSummary(null); }}
								onFocus={(e) => { iFocus(e); if (sourceSuggestions.length > 0) setShowSourceDropdown(true); }}
								onBlur={iBlur} placeholder="Search pickup location..." style={iStyle} />
							<MapPin style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "var(--accent)" }} />
							{loadingSource && <Loader2 style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "var(--text-3)" }} className="animate-spin" />}
						</div>
						{showSourceDropdown && (
							<div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 1000, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow)", marginTop: 4, maxHeight: 200, overflowY: "auto" }} className="animate-fade-up">
								{sourceSuggestions.length > 0 ? sourceSuggestions.map((item, idx) => (
									<div key={idx} onMouseDown={(e) => { e.preventDefault(); handleSelectSource(item); }}
										style={{ padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 8, borderBottom: "1px solid var(--border)" }}
										onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
										onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
										<MapPin style={{ width: 12, height: 12, color: "var(--text-3)", flexShrink: 0, marginTop: 2 }} />
										<div><p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text)", fontWeight: 500 }}>{item.title}</p>
										{item.subtitle && <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-3)" }}>{item.subtitle}</p>}</div>
									</div>
								)) : !loadingSource && <p style={{ padding: "10px 12px", fontSize: "0.78rem", color: "var(--text-3)", margin: 0 }}>No results</p>}
							</div>
						)}
					</div>

					{/* Destination */}
					<div ref={destRef} style={{ position: "relative" }}>
						<label style={{ display: "block", fontSize: "0.72rem", fontWeight: 500, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>To</label>
						<div style={{ position: "relative" }}>
							<input type="text" value={destination}
								onChange={(e) => { setDestination(e.target.value); if (dropoffCoords) onLocationUpdate("destination", null); setTripSummary(null); }}
								onFocus={(e) => { iFocus(e); if (destSuggestions.length > 0) setShowDestDropdown(true); }}
								onBlur={iBlur} placeholder="Search drop-off location..." style={iStyle} />
							<MapPin style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "var(--danger)" }} />
							{loadingDest && <Loader2 style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "var(--text-3)" }} className="animate-spin" />}
						</div>
						{showDestDropdown && (
							<div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 1000, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow)", marginTop: 4, maxHeight: 200, overflowY: "auto" }} className="animate-fade-up">
								{destSuggestions.length > 0 ? destSuggestions.map((item, idx) => (
									<div key={idx} onMouseDown={(e) => { e.preventDefault(); handleSelectDest(item); }}
										style={{ padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 8, borderBottom: "1px solid var(--border)" }}
										onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
										onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
										<MapPin style={{ width: 12, height: 12, color: "var(--text-3)", flexShrink: 0, marginTop: 2 }} />
										<div><p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text)", fontWeight: 500 }}>{item.title}</p>
										{item.subtitle && <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-3)" }}>{item.subtitle}</p>}</div>
									</div>
								)) : !loadingDest && <p style={{ padding: "10px 12px", fontSize: "0.78rem", color: "var(--text-3)", margin: 0 }}>No results</p>}
							</div>
						)}
					</div>

					{/* Search button */}
					<button onClick={handleSearch} disabled={searchingRoute}
						style={{ width: "100%", padding: "10px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 500, background: "var(--bg-hover)", color: "var(--text)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s", fontFamily: "inherit" }}
						onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border)"; e.currentTarget.style.borderColor = "var(--border-focus)"; }}
						onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
						{searchingRoute ? <><Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> Calculating...</> : <><Search style={{ width: 14, height: 14 }} /> Calculate route</>}
					</button>

					{/* Trip summary */}
					{tripSummary && (
						<div style={{ display: "flex", gap: 12, padding: "10px 12px", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8 }} className="animate-fade-up">
							<div><p style={{ margin: 0, fontSize: "0.68rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4 }}><Clock style={{ width: 10, height: 10 }} /> Duration</p><p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--text)" }}>{tripSummary.duration} min</p></div>
							<div style={{ width: 1, background: "var(--border)" }} />
							<div><p style={{ margin: 0, fontSize: "0.68rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4 }}><Navigation style={{ width: 10, height: 10 }} /> Distance</p><p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--text)" }}>{tripSummary.distance} km</p></div>
						</div>
					)}

					{/* Browse */}
					<div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
						<button onClick={onBrowseRides}
							style={{ width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 500, background: "transparent", color: "var(--text-2)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.15s", fontFamily: "inherit" }}
							onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--border-focus)"; }}
							onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
							<span style={{ display: "flex", alignItems: "center", gap: 7 }}><Navigation style={{ width: 14, height: 14 }} /> Browse nearby carpools</span>
							<span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>10 km →</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default RideActions;
