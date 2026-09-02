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
		<div className="w-full h-full min-h-[580px] bg-gray-100 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-gray-400 relative overflow-hidden transition-all duration-300">
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
