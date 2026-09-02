//the main app
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const {handle404, masterErrorHandler, FN_verifyTkn, API_Limiter} = require("../handlers/middlewareHandler");
const { sanitizeInput } = require("../utils/sanitize");
//ROUTES
const authRoutes = require("../routes/auth");
const chatRoutes = require("../routes/chat");
const feedbackRoutes = require("../routes/feedback");
const publishRideRoutes = require("../routes/publishRide");
const bookRideRoutes = require("../routes/bookRide");
const pickupRideRoutes = require("../routes/pickupRide");
const adminRoutes = require("../routes/admin");
const registerVehicleRoutes = require("../routes/registerVehicle");
const dropPassengerRoutes = require("../routes/dropPassenger");
const walletRoutes = require("../routes/wallet");
const finishRideRoutes = require("../routes/finishRide");
const ridesRoutes = require("../routes/rides");
const historyRoutes = require("../routes/history");
const rateRoutes = require("../routes/rate");
const { getRouting } = require("../handlers/GPS_CalcHandler");
const { startLiveTracking } = require("../routes/GPS_fetch");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});
app.set("socketio", io);

app.set('trust proxy', 1); // Trust first proxy (solves the X-Forwarded-For rate limit error)
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../react-frontend")));

// Global limiter (optional)
// app.use(API_Limiter("standard")); 
app.use("/auth", API_Limiter("strict"), authRoutes);
app.use("/chat", FN_verifyTkn, API_Limiter("relaxed"), chatRoutes);
app.use("/feedback", FN_verifyTkn, API_Limiter("standard"), feedbackRoutes);
app.use("/publish-ride", FN_verifyTkn, API_Limiter("standard"), publishRideRoutes);
app.use("/book-ride", FN_verifyTkn, API_Limiter("standard"), bookRideRoutes);
app.use("/pickup-ride", FN_verifyTkn, API_Limiter("standard"), pickupRideRoutes);
app.use("/register-vehicle", FN_verifyTkn, API_Limiter("standard"), registerVehicleRoutes);
app.use("/drop-passenger", FN_verifyTkn, API_Limiter("standard"), dropPassengerRoutes);
app.use("/admin", FN_verifyTkn, API_Limiter("standard"), adminRoutes);
app.use("/wallet", FN_verifyTkn, API_Limiter("standard"), walletRoutes);
app.use("/finish-ride", FN_verifyTkn, API_Limiter("standard"), finishRideRoutes);
app.use("/rides", FN_verifyTkn, API_Limiter("standard"), ridesRoutes);
app.use("/history", FN_verifyTkn, API_Limiter("standard"), historyRoutes);
app.use("/rate", FN_verifyTkn, API_Limiter("standard"), rateRoutes);

// Socket.io connection logic for GPS Tracking
io.on("connection", (socket) => {
	console.log(`[Socket.io] Client connected: ${socket.id}`);
	
	socket.on("join_ride_room", (data) => {
		if (data && data.ride_id) {
			socket.join(`ride_${data.ride_id}`);
			console.log(`[Socket.io] Client ${socket.id} joined room ride_${data.ride_id}`);
		}
	});

	socket.on("start_tracking", async (data) => {
		// data: { ride_id, startCoords: [lat, lon], endCoords: [lat, lon], phase: 'pickup' | 'dropoff' }
		if (data && data.ride_id && data.startCoords && data.endCoords) {
			console.log(`[Socket.io] Starting tracking for ride ${data.ride_id}, phase ${data.phase}`);
			await startLiveTracking(io, data.ride_id, data.startCoords, data.endCoords, data.phase);
		}
	});

    // Chat functionality
    socket.on('send_chat_message', (data) => {
        // data should contain: ride_id, sender_id, sender_name, text, timestamp, and potentially public_key for E2EE
        const { ride_id, ...messageData } = data;
        if (messageData.text) {
            messageData.text = sanitizeInput(messageData.text);
        }
        const roomName = `ride_${ride_id}`;
        
        // Broadcast the message to everyone in the ride room (driver & passenger)
        io.to(roomName).emit('new_chat_message', messageData);
    });

    // WebRTC Voice Call Signaling
    socket.on('voice_signal', (data) => {
        const { ride_id, ...signalData } = data;
        const roomName = `ride_${ride_id}`;
        socket.to(roomName).emit('voice_signal', signalData);
    });

	socket.on("disconnect", () => {
		console.log(`[Socket.io] Client disconnected: ${socket.id}`);
	});
});

// error handlers
app.use(handle404);
app.use(masterErrorHandler);

server.listen(PORT, () => {
    console.log(`[Backend] is running on http://localhost:${PORT}`);
});
