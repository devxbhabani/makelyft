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
		<div className="absolute inset-0 z-0 w-full h-full bg-[var(--bg-hover)] flex flex-col items-center justify-center text-[var(--text-3)] overflow-hidden transition-all duration-300">
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
