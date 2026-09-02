import React, { useEffect, useState } from "react";
import {
	MapContainer,
	TileLayer,
	Marker,
	Popup,
	Polyline,
	Circle,
	useMap,
} from "react-leaflet";
import L from "leaflet";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
	iconUrl: markerIcon,
	shadowUrl: markerShadow,
	iconSize: [25, 41],
	iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Parse coordinates and ensure they are [latitude, longitude] for Leaflet
//eslint-disable-next-line
export function parseAndNormalizePolyline(raw) {
	if (!raw) return null;
	let coords = raw;
	if (typeof coords === "string") {
		try {
			coords = JSON.parse(coords);
			//eslint-disable-next-line
		} catch (e) {
			return null;
		}
	}
	if (!Array.isArray(coords) || coords.length === 0) return null;

	const normalized = [];
	for (let pt of coords) {
		if (Array.isArray(pt) && pt.length >= 2) {
			let [a, b] = pt;
			a = parseFloat(a);
			b = parseFloat(b);
			if (isNaN(a) || isNaN(b)) continue;
			// Leaflet expects [latitude, longitude].
			// Standard GPS latitude is -90..90; longitude is -180..180.
			// GeoJSON returns [longitude, latitude].
			// In India / Kolkata: longitude ~88.x, latitude ~22.x.
			// If `a` (first element) is > 50 and `b` (second element) <= 50, then `a` is longitude and `b` is latitude -> flip to [b, a].
			if (Math.abs(a) > 50 && Math.abs(b) <= 50) {
				normalized.push([b, a]);
			} else {
				normalized.push([a, b]);
			}
		} else if (typeof pt === "object" && pt !== null) {
			const lat = parseFloat(pt.lat ?? pt.latitude);
			const lng = parseFloat(pt.lng ?? pt.lon ?? pt.longitude);
			if (!isNaN(lat) && !isNaN(lng)) {
				normalized.push([lat, lng]);
			}
		}
	}

	return normalized.length > 0 ? normalized : null;
}

// Fetch OSRM route as fallback if no pre-stored polyline exists
async function fetchOsrmPolyline(start, end) {
	if (!start || !end) return null;
	try {
		// OSRM expects {longitude},{latitude};{longitude},{latitude}
		const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
		const res = await fetch(url);
		const data = await res.json();
		if (data.routes && data.routes.length > 0) {
			const coordinates = data.routes[0].geometry.coordinates;
			return coordinates.map(([lon, lat]) => [lat, lon]);
		}
	} catch (err) {
		console.warn("Could not fetch OSRM fallback route:", err);
	}
	return null;
}

// Custom stylish HTML markers
const createCarIcon = (isSelected, name, fare) => {
	const bg = isSelected ? "#00A09D" : "#714B67";
	const scale = isSelected ? "scale(1.15)" : "scale(1)";
	return L.divIcon({
		className: "custom-car-marker",
		html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%) ${scale};
        transition: transform 0.2s ease;
        cursor: pointer;
      ">
        <div style="
          background: ${bg};
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          border: 2px solid white;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span>🚗</span>
          <span>${name || "Carpool"}</span>
          <span style="background: rgba(255,255,255,0.25); padding: 1px 4px; border-radius: 6px; font-size: 10px;">₹${fare || 45}</span>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid ${bg};
        "></div>
      </div>
    `,
		iconSize: [0, 0],
		iconAnchor: [0, 0],
	});
};

const createUserLocationIcon = () => {
	return L.divIcon({
		className: "custom-user-marker",
		html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -50%);
      ">
        <div style="
          position: relative;
          width: 20px;
          height: 20px;
          background: #00A09D;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(0,160,157,0.35), 0 4px 10px rgba(0,0,0,0.3);
        "></div>
      </div>
    `,
		iconSize: [0, 0],
		iconAnchor: [0, 0],
	});
};

const createLocationPinIcon = (color, label) => {
	return L.divIcon({
		className: "custom-pin-marker",
		html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%);
      ">
        <div style="
          background: ${color};
          color: white;
          padding: 4px 8px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
          border: 2px solid white;
          display: flex;
          align-items: center;
          gap: 3px;
        ">
          <span>${label}</span>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid ${color};
        "></div>
      </div>
    `,
		iconSize: [0, 0],
		iconAnchor: [0, 0],
	});
};

function MapUpdater({
	pickupCoords,
	dropoffCoords,
	routePolyline,
	userLocation,
	viewMode,
	selectedRide,
	activeTrip,
	activePolyline,
	selectedRidePolyline,
}) {
	const map = useMap();

	// Resize map when layout splits / animates
	useEffect(() => {
		const timer = setTimeout(() => {
			map.invalidateSize();
		}, 300);
		return () => clearTimeout(timer);
	}, [viewMode, activeTrip, map]);

	useEffect(() => {
		// 1. If active trip has a valid polyline
		if (activePolyline && activePolyline.length > 0) {
			const bounds = L.latLngBounds(activePolyline);
			map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
			return;
		}

		// 2. If selected ride in Browse mode has a polyline
		if (selectedRidePolyline && selectedRidePolyline.length > 0) {
			const bounds = L.latLngBounds(selectedRidePolyline);
			if (routePolyline && routePolyline.length > 0) {
				bounds.extend(L.latLngBounds(routePolyline));
			}
			map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
			return;
		}

		// 3. If selected ride has origin and destination
		if (selectedRide && selectedRide.origin && selectedRide.destination) {
			const p1 = [selectedRide.origin.lat, selectedRide.origin.lng];
			const p2 = [
				selectedRide.destination.lat,
				selectedRide.destination.lng,
			];
			if (!isNaN(p1[0]) && !isNaN(p2[0])) {
				const bounds = L.latLngBounds([p1, p2]);
				if (routePolyline && routePolyline.length > 0) {
					bounds.extend(L.latLngBounds(routePolyline));
				}
				map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
				return;
			}
		}

		// 4. User's searched route
		if (routePolyline && routePolyline.length > 0) {
			const bounds = L.latLngBounds(routePolyline);
			map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
			return;
		}

		// 5. Browse mode with 10km circle
		if (viewMode === "browse" && userLocation) {
			map.setView(userLocation, 12);
			return;
		}

		// 6. Source + Destination points
		if (pickupCoords && dropoffCoords) {
			const bounds = L.latLngBounds([pickupCoords, dropoffCoords]);
			map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
		} else if (pickupCoords) {
			map.setView(pickupCoords, 14);
		} else if (dropoffCoords) {
			map.setView(dropoffCoords, 14);
		} else if (userLocation) {
			map.setView(userLocation, 14);
		}
	}, [
		pickupCoords,
		dropoffCoords,
		routePolyline,
		userLocation,
		viewMode,
		selectedRide,
		activeTrip,
		activePolyline,
		selectedRidePolyline,
		map,
	]);

	return null;
}

export default function Map({
	pickupCoords,
	dropoffCoords,
	routePolyline,
	userLocation,
	viewMode = "default",
	nearbyRides = [],
	selectedRide = null,
	onSelectRide,
	activeTrip = null,
}) {
	// Fallback coordinates: Kolkata Hub
	const defaultPosition = [22.5726, 88.3639];
	const initialCenter = userLocation || pickupCoords || defaultPosition;

	// Process Active Trip Polyline
	const [activePolyline, setActivePolyline] = useState(null);
	// Process Selected Ride Polyline
	const [selectedRidePolyline, setSelectedRidePolyline] = useState(null);

	// Extract active trip coordinates
	const activeRide = activeTrip?.ride || activeTrip;
	const activeOrigin = activeRide?.origin;
	const activeDest = activeRide?.destination;

	// Convert activeOrigin / activeDest to numeric [lat, lng]
	const getPointCoords = (pt) => {
		if (!pt) return null;
		if (Array.isArray(pt) && pt.length >= 2)
			return [parseFloat(pt[0]), parseFloat(pt[1])];
		if (pt.lat !== undefined && pt.lng !== undefined)
			return [parseFloat(pt.lat), parseFloat(pt.lng)];
		if (pt.latitude !== undefined && pt.longitude !== undefined)
			return [parseFloat(pt.latitude), parseFloat(pt.longitude)];
		return null;
	};

	const activeOriginCoords = getPointCoords(activeOrigin);
	const activeDestCoords = getPointCoords(activeDest);

	// Update Active Trip Polyline
	useEffect(() => {
		let isMounted = true;
		if (!activeTrip || !activeRide) {
			//eslint-disable-next-line
			setActivePolyline(null);
			return;
		}

		// 1. Try parsing pre-stored polyline
		const parsed = parseAndNormalizePolyline(
			activeRide.polyline || activeTrip.polyline,
		);
		if (parsed && parsed.length > 1) {
			setActivePolyline(parsed);
			return;
		}

		// 2. If origin & destination coords exist, fetch OSRM route dynamically
		if (activeOriginCoords && activeDestCoords) {
			fetchOsrmPolyline(activeOriginCoords, activeDestCoords).then(
				(route) => {
					if (isMounted && route && route.length > 0) {
						setActivePolyline(route);
					}
				},
			);
		}

		return () => {
			isMounted = false;
		};
	}, [
		activeTrip,
		activeRide?.polyline,
		activeOriginCoords?.[0],
		activeDestCoords?.[0],
	]);

	// Update Selected Ride Polyline
	useEffect(() => {
		let isMounted = true;
		if (!selectedRide) {
			//eslint-disable-next-line
			setSelectedRidePolyline(null);
			return;
		}

		// 1. Try parsing pre-stored polyline
		const parsed = parseAndNormalizePolyline(selectedRide.polyline);
		if (parsed && parsed.length > 1) {
			setSelectedRidePolyline(parsed);
			return;
		}

		// 2. Fetch fallback OSRM route
		const sOrigin = getPointCoords(selectedRide.origin);
		const sDest = getPointCoords(selectedRide.destination);
		if (sOrigin && sDest) {
			fetchOsrmPolyline(sOrigin, sDest).then((route) => {
				if (isMounted && route && route.length > 0) {
					setSelectedRidePolyline(route);
				}
			});
		}

		return () => {
			isMounted = false;
		};
	}, [selectedRide]);

	// Normalized searched route
	const normalizedSearchPolyline = parseAndNormalizePolyline(routePolyline);

	return (
		<div className="relative z-0 h-full w-full overflow-hidden">
			<MapContainer
				center={initialCenter}
				zoom={viewMode === "browse" ? 12 : 13}
				scrollWheelZoom={true}
				className="h-full w-full"
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>

				<MapUpdater
					pickupCoords={pickupCoords}
					dropoffCoords={dropoffCoords}
					routePolyline={normalizedSearchPolyline}
					userLocation={userLocation}
					viewMode={viewMode}
					selectedRide={selectedRide}
					activeTrip={activeTrip}
					activePolyline={activePolyline}
					selectedRidePolyline={selectedRidePolyline}
				/>

				{/* 10km Radius Geofence Circle (Browse Mode) */}
				{viewMode === "browse" && userLocation && (
					<Circle
						center={userLocation}
						radius={10000} // 10,000 meters = 10km
						pathOptions={{
							color: "#00A09D",
							fillColor: "#00A09D",
							fillOpacity: 0.08,
							weight: 2,
							dashArray: "6, 8",
						}}
					>
						<Popup>
							<div className="text-xs font-bold text-[#00A09D]">
								📍 10km Radius Carpool Zone
							</div>
						</Popup>
					</Circle>
				)}

				{/* User's Location Marker */}
				{userLocation && (
					<Marker position={userLocation} icon={createUserLocationIcon()}>
						<Popup>
							<div className="font-bold text-xs text-[#00A09D] p-1">
								📍 You are here
							</div>
						</Popup>
					</Marker>
				)}

				{/* Nearby Ride Markers (Browse Mode) */}
				{viewMode === "browse" &&
					nearbyRides.map((ride) => {
						const originCoords = getPointCoords(ride.origin);
						if (!originCoords) return null;
						const isSelected = selectedRide?.ride_id === ride.ride_id;

						return (
							<Marker
								key={ride.ride_id}
								position={originCoords}
								icon={createCarIcon(
									isSelected,
									ride.driver_name,
									ride.fare_per_seat,
								)}
								eventHandlers={{
									click: () => onSelectRide && onSelectRide(ride),
								}}
							>
								<Popup>
									<div className="text-xs space-y-1.5 p-1 text-left min-w-[170px]">
										<div className="flex items-center justify-between border-b border-gray-100 pb-1">
											<span className="font-bold text-gray-900">
												{ride.driver_name}
											</span>
											<span className="text-[#00A09D] font-extrabold">
												₹{ride.fare_per_seat}
											</span>
										</div>
										<p className="text-gray-600">
											<strong>Vehicle:</strong> {ride.vehicle_model}
										</p>
										<p className="text-gray-600">
											<strong>Destination:</strong>{" "}
											{ride.destination?.name ||
												(typeof ride.destination === "string"
													? ride.destination
													: "Destination")}
										</p>
										<p className="text-[#00A09D] font-semibold">
											{ride.distance_km || 1.2} km away •{" "}
											{ride.available_seats} seats left
										</p>
										<button
											onClick={() =>
												onSelectRide && onSelectRide(ride)
											}
											className="w-full mt-1.5 py-1.5 px-2 bg-[#00A09D] hover:bg-[#008f8c] text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
										>
											Select Carpool
										</button>
									</div>
								</Popup>
							</Marker>
						);
					})}

				{/* Selected Ride Destination Marker & Route in Browse Mode */}
				{viewMode === "browse" && selectedRide && (
					<>
						{getPointCoords(selectedRide.destination) && (
							<Marker
								position={getPointCoords(selectedRide.destination)}
								icon={createLocationPinIcon("#EF4444", "🏁 Dest")}
							>
								<Popup>
									<div className="text-xs font-bold text-[#EF4444]">
										🏁 Destination:{" "}
										{selectedRide.destination?.name ||
											"Dropoff Point"}
									</div>
								</Popup>
							</Marker>
						)}
						{selectedRidePolyline && (
							<>
								{/* Polyline shadow/glow */}
								<Polyline
									positions={selectedRidePolyline}
									pathOptions={{
										color: "#714B67",
										weight: 8,
										opacity: 0.35,
									}}
								/>
								{/* Main polyline */}
								<Polyline
									positions={selectedRidePolyline}
									pathOptions={{
										color: "#714B67",
										weight: 5,
										opacity: 0.95,
										dashArray: "8, 6",
									}}
								/>
							</>
						)}
					</>
				)}

				{/* Search Pickup Marker (Source) */}
				{pickupCoords && (
					<Marker
						position={pickupCoords}
						icon={createLocationPinIcon("#00A09D", "🟢 Pickup")}
					>
						<Popup>
							<div className="font-semibold text-sm text-[#00A09D]">
								🟢 Pickup Location (Source)
							</div>
						</Popup>
					</Marker>
				)}

				{/* Search Dropoff Marker (Destination) */}
				{dropoffCoords && (
					<Marker
						position={dropoffCoords}
						icon={createLocationPinIcon("#EF4444", "🔴 Dropoff")}
					>
						<Popup>
							<div className="font-semibold text-sm text-[#EF4444]">
								🔴 Dropoff Location (Destination)
							</div>
						</Popup>
					</Marker>
				)}

				{/* Active Trip Route Polyline & Markers */}
				{activeTrip && (
					<>
						{/* Active Origin Marker */}
						{activeOriginCoords && (
							<Marker
								position={activeOriginCoords}
								icon={createLocationPinIcon("#00A09D", "🟢 Pickup")}
							>
								<Popup>
									<div className="font-semibold text-sm text-[#00A09D]">
										🟢 Pickup:{" "}
										{typeof activeOrigin === "string"
											? activeOrigin
											: activeOrigin?.name ||
												activeOrigin?.address ||
												"Pickup Point"}
									</div>
								</Popup>
							</Marker>
						)}
						{/* Active Destination Marker */}
						{activeDestCoords && (
							<Marker
								position={activeDestCoords}
								icon={createLocationPinIcon("#EF4444", "🔴 Dropoff")}
							>
								<Popup>
									<div className="font-semibold text-sm text-[#EF4444]">
										🔴 Dropoff:{" "}
										{typeof activeDest === "string"
											? activeDest
											: activeDest?.name ||
												activeDest?.address ||
												"Dropoff Point"}
									</div>
								</Popup>
							</Marker>
						)}
						{/* Active Trip Polyline */}
						{activePolyline && activePolyline.length > 0 && (
							<>
								{/* Polyline Outer Glow */}
								<Polyline
									positions={activePolyline}
									pathOptions={{
										color: "#00A09D",
										weight: 10,
										opacity: 0.35,
									}}
								/>
								{/* Main Polyline */}
								<Polyline
									positions={activePolyline}
									pathOptions={{
										color: "#00A09D",
										weight: 6,
										opacity: 0.95,
									}}
								/>
							</>
						)}
					</>
				)}

				{/* User Search Route Polyline */}
				{!activeTrip &&
					normalizedSearchPolyline &&
					normalizedSearchPolyline.length > 0 && (
						<>
							<Polyline
								positions={normalizedSearchPolyline}
								pathOptions={{
									color: "#00A09D",
									weight: 9,
									opacity: 0.3,
								}}
							/>
							<Polyline
								positions={normalizedSearchPolyline}
								pathOptions={{
									color: "#00A09D",
									weight: 5,
									opacity: 0.95,
								}}
							/>
						</>
					)}

				{/* Default fallback marker if no GPS permission and no points */}
				{!userLocation &&
					!pickupCoords &&
					!dropoffCoords &&
					!activeTrip && (
						<Marker position={defaultPosition}>
							<Popup>MakeLyft Hub</Popup>
						</Marker>
					)}
			</MapContainer>
		</div>
	);
}
