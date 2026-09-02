import React from "react";
import Map from "./Map.jsx";

function MapPlaceholder({
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
	return (
		<div className="w-full h-full min-h-[580px] bg-[var(--bg-hover)] rounded-xl border border-[var(--border)] shadow-none flex flex-col items-center justify-center text-[var(--text-3)] relative overflow-hidden transition-all duration-300">
			<Map 
				pickupCoords={pickupCoords} 
				dropoffCoords={dropoffCoords} 
				routePolyline={routePolyline}
				userLocation={userLocation}
				viewMode={viewMode}
				nearbyRides={nearbyRides}
				selectedRide={selectedRide}
				onSelectRide={onSelectRide}
				activeTrip={activeTrip}
			/>
		</div>
	);
}

export default MapPlaceholder;
