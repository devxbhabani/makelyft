const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');

router.post('/', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        // The driver provides the booking_id of the passenger they are picking up, and the OTP the passenger gave them.
        const { booking_id, otp } = req.body;
        const driver_id = req.user.emp_id;

        if(!booking_id){
            return res.status(400).json({message: "Need a booking_id to verify the pickup."});
        }
        if(!otp){
            return res.status(400).json({message: "Need the passenger's OTP to confirm pickup."});
        }

        // Fetch the booking and join with the ride to ensure this driver actually owns the ride
        const bookingResult = await db.query(`
            SELECT b.booking_id, b.otp, b.booking_status, r.driver_id, r.status AS ride_status
            FROM bookings b
            JOIN rides r ON b.ride_id = r.ride_id
            WHERE b.booking_id = $1
        `, [booking_id]);

        if(!bookingResult.rows || bookingResult.rows.length === 0){
            return res.status(404).json({message: "No such booking found."});
        }

        const bookingInfo = bookingResult.rows[0];

        // Verify the driver owns this ride
        if(bookingInfo.driver_id !== driver_id){
            return res.status(403).json({message: "You are not the driver for this ride."});
        }

        // Check if the booking is already completed or cancelled
        if(bookingInfo.booking_status !== "confirmed"){
            return res.status(400).json({message: `Booking is not in confirmed state (Current state: ${bookingInfo.booking_status})`});
        }

        // Validate OTP
        if (bookingInfo.otp !== otp) {
            return res.status(401).json({message: "Invalid OTP. Passenger verification failed."});
        }

        // Update the booking status to indicate the passenger has been picked up
        await db.query(
            "UPDATE bookings SET booking_status = 'in_progress' WHERE booking_id = $1", 
            [booking_id]
        );

        // Optionally, update the ride status to 'in_progress' if it isn't already
        if (bookingInfo.ride_status === 'scheduled') {
            await db.query(
                "UPDATE rides SET status = 'in_progress' WHERE ride_id = (SELECT ride_id FROM bookings WHERE booking_id = $1)", 
                [booking_id]
            );
        }

        const io = req.app.get("socketio");
        if (io) {
            const rideIdResult = await db.query(`SELECT ride_id FROM bookings WHERE booking_id = $1`, [booking_id]);
            if (rideIdResult.rows.length > 0) {
                const ride_id = rideIdResult.rows[0].ride_id;
                const payload = {
                    booking_id: Number(booking_id),
                    booking_status: 'in_progress',
                    ride_id: ride_id
                };
                io.to(`ride_${ride_id}`).emit('booking_status_updated', payload);
                io.emit('booking_status_updated', payload);
            }
        }

        return res.json({
            success: true,
            message: "OTP Verified! Passenger picked up successfully."
        });

    } catch (error) {
        console.error("Error in pickupRide:", error);
        return next(error);
    }
});

module.exports = router;