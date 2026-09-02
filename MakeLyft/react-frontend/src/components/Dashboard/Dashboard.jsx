import React, { useState, useEffect } from "react";
import { showAlert } from "../../utils/alertService";
import { io } from "socket.io-client";
import Footer from "../Footer";
import Header from "./Header";
import MapPlaceholder from "./MapPlaceholder";
import RideActions from "./RideActions";
import BrowseRidesPanel from "./BrowseRidesPanel";
import VehicleRegistrationModal from "./VehicleRegistrationModal";
// import AIAssistant from "./AIAssistant";
import ActiveTripPanel from "./ActiveTripPanel";
import ChatModal from "./ChatModal";
import VoiceCallModal from "./VoiceCallModal";
import HistoryModal from "./HistoryModal";
import FeedbackModal from "./FeedbackModal";
import ProfileModal from "./ProfileModal";
import PublishRideModal from "./PublishRideModal";

// Initialize socket connection (connects to the same origin by default)
const socket = io();

function Dashboard() {
	const [viewMode, setViewMode] = useState("default"); // 'default' | 'browse'
	const [showVehicleModal, setShowVehicleModal] = useState(false);
	const [showPublishModal, setShowPublishModal] = useState(false);
	const [hasVehicle, setHasVehicle] = useState("0");

	const [userLocation, setUserLocation] = useState(null);
	const [pickupCoords, setPickupCoords] = useState(null);
	const [dropoffCoords, setDropoffCoords] = useState(null);
	const [routePolyline, setRoutePolyline] = useState(null);

	// Browse mode states
	const [nearbyRides, setNearbyRides] = useState([]);
	const [loadingNearby, setLoadingNearby] = useState(false);
	const [selectedRide, setSelectedRide] = useState(null);
	const [activeTrip, setActiveTrip] = useState(null);
	const [showActiveTrip, setShowActiveTrip] = useState(false);
	const [showGlobalChat, setShowGlobalChat] = useState(false);
	const [showGlobalVoiceCall, setShowGlobalVoiceCall] = useState(false);
	const [showHistoryModal, setShowHistoryModal] = useState(false);
	const [showFeedbackModal, setShowFeedbackModal] = useState(false);
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [isIncomingCall, setIsIncomingCall] = useState(false);

	const user = JSON.parse(localStorage.getItem("user") || "{}");

	// Get user's current location on mount
	useEffect(() => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					const coords = [pos.coords.latitude, pos.coords.longitude];
					setUserLocation(coords);
					setPickupCoords(coords); // Default pickup to current location
				},
				(err) => {
					console.warn(
						"Geolocation permission denied or unavailable:",
						err.message,
					);
					// Default fallback coordinates: Kolkata
					const defaultCoords = [22.5726, 88.3639];
					setUserLocation(defaultCoords);
					setPickupCoords(defaultCoords);
				},
				{ enableHighAccuracy: true, timeout: 10000 },
			);
		} else {
			const defaultCoords = [22.5726, 88.3639];
			//eslint-disable-next-line
			setUserLocation(defaultCoords);
			setPickupCoords(defaultCoords);
		}
	}, []);

	// Fetch Driver's Active Ride
	const fetchDriverActiveRide = async () => {
		const token = localStorage.getItem("token");
		if (!token) return;
		try {
			const res = await fetch("/rides/driver/active", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.success && data.ride) {
				setActiveTrip({
					mode: "driver",
					ride: data.ride,
					bookings: data.ride.bookings || [],
				});
			}
		} catch (err) {
			console.error("Error fetching active driver ride:", err);
		}
	};

	// Fetch Passenger's Active Ride
	const fetchPassengerActiveRide = async () => {
		const token = localStorage.getItem("token");
		if (!token) return;
		try {
			const res = await fetch("/rides/passenger/active", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.success && data.ride && data.booking) {
				setActiveTrip({
					mode: "passenger",
					ride: data.ride,
					booking_id: data.booking.booking_id,
					booking_status: data.booking.booking_status,
					otp: data.booking.otp,
					payment_status: data.booking.payment_status,
				});
			}
		} catch (err) {
			console.error("Error fetching active passenger ride:", err);
		}
	};

	// Check if user already has a vehicle registered & Check active ride
	useEffect(() => {
		const user = JSON.parse(localStorage.getItem("user") || "{}");
		//eslint-disable-next-line
		setHasVehicle(user.is_vehicle_registered || "0");
		fetchDriverActiveRide();
		fetchPassengerActiveRide();

		// Listen for incoming voice calls
		socket.on("voice_signal", (data) => {
			if (data.type === "offer") {
				setIsIncomingCall(true);
				setShowGlobalVoiceCall(true);
			}
		});
		return () => socket.off("voice_signal");
	}, []);

	const handlePublishRide = () => {
		if (hasVehicle === "0" || !hasVehicle) {
			setShowVehicleModal(true);
		} else if (hasVehicle === "1") {
			showAlert(
				"Your vehicle registration is pending Admin approval.",
				"Pending Approval",
				"info",
			);
		} else if (hasVehicle === "2") {
			setShowPublishModal(true);
		}
	};

	//eslint-disable-next-line
	const handleRidePublished = (publishData) => {
		setShowPublishModal(false);
		showAlert(
			"Your ride has been successfully published! Passengers will now be able to search and book seats on your route.",
			"Ride Published",
			"success",
		);
		fetchDriverActiveRide();
	};

	const handleRegisterVehicle = async (vehicleData) => {
		const token = localStorage.getItem("token");
		try {
			const res = await fetch("/register-vehicle", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(vehicleData),
			});
			const data = await res.json();
			if (data.success) {
				setHasVehicle("1");
				setShowVehicleModal(false);
				const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
				storedUser.is_vehicle_registered = "1";
				localStorage.setItem("user", JSON.stringify(storedUser));
				showAlert(
					"Vehicle registered successfully! It is now pending Admin approval.",
					"Registration Submitted",
					"success",
				);
			} else {
				showAlert(
					"Vehicle registration failed: " +
						(data.message || "Please check details"),
					"Registration Error",
					"error",
				);
			}
		} catch (err) {
			console.error("Error registering vehicle:", err);
			showAlert(
				"Error registering vehicle. Please try again.",
				"Network Error",
				"error",
			);
		}
	};

	const handleLocationUpdate = (type, coords) => {
		if (type === "source") setPickupCoords(coords);
		if (type === "destination") setDropoffCoords(coords);
		setRoutePolyline(null); // Reset route when location changes
	};

	const handleBrowseRides = async () => {
		setViewMode("browse");
		setLoadingNearby(true);
		try {
			const token = localStorage.getItem("token");
			const lat = userLocation ? userLocation[0] : 22.5726;
			const lng = userLocation ? userLocation[1] : 88.3639;
			const res = await fetch(`/rides`, {
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			});
			const data = await res.json();
			if (data.success && data.rides) {
				setNearbyRides(data.rides);
				// Do not auto-select the first ride so the map stays focused on the user's searched route
			}
		} catch (err) {
			console.error("Failed to fetch nearby rides:", err);
		} finally {
			setLoadingNearby(false);
		}
	};

	const handleBackToSearch = () => {
		setViewMode("default");
		setSelectedRide(null);
	};

	const handleRideBooked = (bookingSuccessData) => {
		// When a ride is booked successfully, switch to active trip view
		setActiveTrip({
			mode: "passenger",
			...bookingSuccessData,
		});
		// Don't auto-show ActiveTripPanel — user can see it via banner
	};

	const handleTripEnded = () => {
		setActiveTrip(null);
		setShowActiveTrip(false);
	};

	const handleHideActiveTrip = () => {
		setShowActiveTrip(false);
	};

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col w-full text-left">
			<Header
				socket={socket}
				onOpenVehicleModal={() => setShowVehicleModal(true)}
				onOpenChat={() => setShowGlobalChat(true)}
				onOpenVoiceCall={() => {
					setIsIncomingCall(false);
					setShowGlobalVoiceCall(true);
				}}
				onOpenHistory={() => setShowHistoryModal(true)}
				onOpenFeedback={() => setShowFeedbackModal(true)}
				onOpenProfile={() => setShowProfileModal(true)}
			/>

			{/* Main Content Area */}
			<main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
				<div className="relative flex flex-col lg:flex-row gap-6 items-stretch transition-all duration-500 ease-in-out">
					{viewMode === "browse" ? (
						<>
							{/* BROWSE MODE: Available Rides on Left */}
							<div className="w-full lg:w-[48%] h-[680px] transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-left-6">
								<BrowseRidesPanel
									rides={nearbyRides}
									loading={loadingNearby}
									selectedRide={selectedRide}
									onSelectRide={setSelectedRide}
									onBack={handleBackToSearch}
									userLocation={userLocation}
									activeTrip={activeTrip}
									onRideBooked={(bookingData) => {
										setViewMode("default");
										handleRideBooked(bookingData);
									}}
								/>
							</div>

							{/* BROWSE MODE: Panel on Left */}
							<div className="w-full lg:w-[48%] h-[680px] flex flex-col slide-in-panel page-transition">
								<MapPlaceholder
									pickupCoords={pickupCoords}
									dropoffCoords={dropoffCoords}
									routePolyline={routePolyline}
									userLocation={userLocation}
									viewMode={viewMode}
									nearbyRides={nearbyRides}
									selectedRide={selectedRide}
									onSelectRide={setSelectedRide}
									activeTrip={showActiveTrip ? activeTrip : null}
								/>
							</div>
						</>
					) : (
						<>
							{/* DEFAULT MODE: Map on Left */}
							<div className="w-full lg:w-2/3 h-[680px] transition-all duration-500 ease-in-out">
								<MapPlaceholder
									pickupCoords={pickupCoords}
									dropoffCoords={dropoffCoords}
									routePolyline={routePolyline}
									userLocation={userLocation}
									viewMode={viewMode}
									activeTrip={showActiveTrip ? activeTrip : null}
								/>
							</div>

							{/* DEFAULT MODE: Search / Ride Actions / Active Trip on Right */}
							<div className="w-full lg:w-1/3 flex flex-col h-[680px] max-h-[680px] overflow-hidden slide-in-panel">
								{activeTrip && showActiveTrip ? (
									<ActiveTripPanel
										activeTrip={activeTrip}
										socket={socket}
										onTripEnded={handleTripEnded}
										onHideActiveTrip={handleHideActiveTrip}
										onRefreshPassenger={fetchPassengerActiveRide}
									/>
								) : (
									<RideActions
										activeTrip={activeTrip}
										onViewActiveTrip={() => setShowActiveTrip(true)}
										onPublishRide={handlePublishRide}
										onLocationUpdate={handleLocationUpdate}
										pickupCoords={pickupCoords}
										dropoffCoords={dropoffCoords}
										userLocation={userLocation}
										onSearchRoute={setRoutePolyline}
										onBrowseRides={handleBrowseRides}
									/>
								)}
							</div>
						</>
					)}
				</div>
			</main>

			{/* Footer */}
			<Footer />

			{/* Modals */}
			{showVehicleModal && (
				<VehicleRegistrationModal
					onClose={() => setShowVehicleModal(false)}
					onRegister={handleRegisterVehicle}
				/>
			)}

			{showGlobalChat && (
				<ChatModal
					isOpen={showGlobalChat}
					onClose={() => setShowGlobalChat(false)}
					socket={socket}
					activeTrip={
						activeTrip || {
							ride: { ride_id: "DEMO_RIDE_1", driver_name: "Rahul M." },
						}
					}
					user={user}
				/>
			)}

			{showPublishModal && (
				<PublishRideModal
					onClose={() => setShowPublishModal(false)}
					onPublish={handleRidePublished}
					userLocation={userLocation}
				/>
			)}
			{showGlobalVoiceCall && (
				<VoiceCallModal
					isOpen={showGlobalVoiceCall}
					onClose={() => {
						setShowGlobalVoiceCall(false);
						setIsIncomingCall(false);
					}}
					socket={socket}
					activeTrip={
						activeTrip || {
							ride: { ride_id: "DEMO_RIDE_1", driver_name: "Rahul M." },
						}
					}
					user={user}
					isCaller={!isIncomingCall}
				/>
			)}

			<HistoryModal
				isOpen={showHistoryModal}
				onClose={() => setShowHistoryModal(false)}
			/>

			<FeedbackModal
				isOpen={showFeedbackModal}
				onClose={() => setShowFeedbackModal(false)}
			/>

			<ProfileModal
				isOpen={showProfileModal}
				onClose={() => setShowProfileModal(false)}
			/>
		</div>
	);
}

export default Dashboard;
