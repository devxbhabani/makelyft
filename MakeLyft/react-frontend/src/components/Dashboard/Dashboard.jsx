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

	// Get user's current location on mount — fast first, then watch for accuracy
	useEffect(() => {
		const geoOpts = {
			enableHighAccuracy: true,
			timeout: 15000,
			maximumAge: 30000,
		};
		const fallback = () => {
			const defaultCoords = [22.5726, 88.3639];
			setUserLocation(defaultCoords);
			setPickupCoords(defaultCoords);
		};
		const onSuccess = (pos) => {
			const coords = [pos.coords.latitude, pos.coords.longitude];
			setUserLocation(coords);
			setPickupCoords((prev) => (prev ? prev : coords)); // Only override pickup if not already set
		};

		if (!navigator.geolocation) {
			fallback();
			return;
		}

		// Quick low-accuracy position first
		navigator.geolocation.getCurrentPosition(onSuccess, fallback, {
			enableHighAccuracy: false,
			timeout: 5000,
			maximumAge: 60000,
		});

		// Then watch for a more accurate position
		const watchId = navigator.geolocation.watchPosition(
			onSuccess,
			() => {},
			geoOpts,
		);
		return () => navigator.geolocation.clearWatch(watchId);
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

			const res = await fetch(`/rides?lat=${lat}&lng=${lng}&radius=10`, {
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			});
			const data = await res.json();
			if (data.success && data.rides) {
				// Haversine distance helper
				const toRad = (d) => (d * Math.PI) / 180;
				const haversine = (a, b) => {
					const R = 6371;
					const dLat = toRad(b[0] - a[0]);
					const dLon = toRad(b[1] - a[1]);
					const h =
						Math.sin(dLat / 2) ** 2 +
						Math.cos(toRad(a[0])) *
							Math.cos(toRad(b[0])) *
							Math.sin(dLon / 2) ** 2;
					return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
				};

				// Parse origin/destination coords from a ride field
				const parseCoords = (field) => {
					if (!field) return null;
					let o = field;
					if (typeof o === "string") {
						try {
							o = JSON.parse(o);
							//eslint-disable-next-line
						} catch (_) {
							return null;
						}
					}
					if (o.lat != null && o.lng != null)
						return [parseFloat(o.lat), parseFloat(o.lng)];
					return null;
				};

				const userCoords = [lat, lng];

				// Enrich rides with distance and filter to 10km
				const enriched = data.rides
					.map((ride) => {
						const originCoords = parseCoords(ride.origin);
						const destCoords = parseCoords(ride.destination);
						const distFromUser = originCoords
							? haversine(userCoords, originCoords)
							: null;

						// Route relevance: is this ride going through user's pickup/dropoff?
						let routeMatch = false;
						if (pickupCoords && originCoords) {
							routeMatch = haversine(pickupCoords, originCoords) <= 3;
						}
						if (!routeMatch && dropoffCoords && destCoords) {
							routeMatch = haversine(dropoffCoords, destCoords) <= 3;
						}

						return {
							...ride,
							origin:
								typeof ride.origin === "string"
									? JSON.parse(ride.origin)
									: ride.origin,
							destination:
								typeof ride.destination === "string"
									? JSON.parse(ride.destination)
									: ride.destination,
							distance_km:
								distFromUser != null
									? parseFloat(distFromUser.toFixed(1))
									: null,
							route_match: routeMatch,
						};
					})
					.filter((ride) => {
						// Keep only rides within 10km of user
						if (ride.distance_km === null) return true;
						return ride.distance_km <= 10;
					})
					.sort((a, b) => (a.distance_km ?? 99) - (b.distance_km ?? 99));

				setNearbyRides(enriched);
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
		<div
			className="min-h-screen flex flex-col w-full text-left"
			style={{ background: "var(--bg)" }}
		>
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
			<main className="flex-1 w-full">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
					{/* Welcome Banner */}
					<div className="mb-6 animate-fade-up">
						<h1
							style={{
								fontSize: "1.6rem",
								fontWeight: 700,
								letterSpacing: "-0.02em",
								color: "var(--text)",
								margin: 0,
							}}
						>
							Good{" "}
							{new Date().getHours() < 12
								? "morning"
								: new Date().getHours() < 18
									? "afternoon"
									: "evening"}
							, {user?.name ? user.name.split(" ")[0] : "there"} 👋
						</h1>
						<div
							style={{
								display: "flex",
								gap: "20px",
								marginTop: "6px",
								fontSize: "0.85rem",
								color: "var(--text-2)",
								flexWrap: "wrap",
							}}
						>
							<span>
								{new Date().toLocaleDateString("en-US", {
									weekday: "long",
									month: "long",
									day: "numeric",
								})}
							</span>
							<span
								style={{
									display: "flex",
									alignItems: "center",
									gap: "6px",
								}}
							>
								<div
									style={{
										width: 7,
										height: 7,
										borderRadius: "50%",
										background: "#22c55e",
									}}
								/>
								Ready for your commute
							</span>
						</div>
					</div>

					{/* Split Layout: Map + Controls */}
					<div className="flex flex-col lg:flex-row gap-6 items-stretch">
						{viewMode === "browse" ? (
							<>
								{/* BROWSE MODE: Rides list on left */}
								<div
									className="w-full lg:w-105 shrink-0 animate-slide-in-left"
									style={{ height: 640 }}
								>
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
								{/* BROWSE MODE: Map on right */}
								<div
									className="flex-1 rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm"
									style={{ height: 640, minHeight: 400 }}
								>
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
								{/* DEFAULT MODE: Map on left */}
								<div
									className="flex-1 rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm"
									style={{ height: 640, minHeight: 400 }}
								>
									<MapPlaceholder
										pickupCoords={pickupCoords}
										dropoffCoords={dropoffCoords}
										routePolyline={routePolyline}
										userLocation={userLocation}
										viewMode={viewMode}
										activeTrip={showActiveTrip ? activeTrip : null}
									/>
								</div>
								{/* DEFAULT MODE: Controls on right */}
								<div
									className="w-full lg:w-[400px] flex-shrink-0 flex flex-col animate-slide-in-bottom"
									style={{ height: 640 }}
								>
									{activeTrip && showActiveTrip ? (
										<ActiveTripPanel
											activeTrip={activeTrip}
											socket={socket}
											onTripEnded={handleTripEnded}
											onHideActiveTrip={handleHideActiveTrip}
											onRefreshPassenger={fetchPassengerActiveRide}
										/>
									) : (
										<div className="card h-full overflow-hidden flex flex-col">
											<RideActions
												activeTrip={activeTrip}
												onViewActiveTrip={() =>
													setShowActiveTrip(true)
												}
												onPublishRide={handlePublishRide}
												onLocationUpdate={handleLocationUpdate}
												pickupCoords={pickupCoords}
												dropoffCoords={dropoffCoords}
												userLocation={userLocation}
												onSearchRoute={setRoutePolyline}
												onBrowseRides={handleBrowseRides}
											/>
										</div>
									)}
								</div>
							</>
						)}
					</div>
				</div>
			</main>

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
