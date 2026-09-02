const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');
const crypto = require('crypto');

router.post('/', async (req, res, next) => {
    const client = await db.getClient();
    try {
        const { ride_id, pickup_location, dropoff_location } = req.body;

        // Ensure user is authenticated
        if (!req.user || !req.user.emp_id) {
            client.release();
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        
        const passenger_id = req.user.emp_id;

        // Validate payload
        if (!ride_id || !pickup_location || !dropoff_location) {
            client.release();
            return res.status(400).json({ message: "Missing required fields: ride_id, pickup_location, dropoff_location." });
        }

        await client.query('BEGIN');

        // Check if the ride exists and fetch metadata (locks the row with FOR UPDATE to prevent concurrent booking)
        const rideResult = await client.query(
            `SELECT r.available_seats, r.driver_id, u.org_name 
             FROM rides r
             JOIN users u ON r.driver_id = u.emp_id
             WHERE r.ride_id = $1
             FOR UPDATE`, 
            [ride_id]
        );

        if (!rideResult.rows || rideResult.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ message: "Ride not found." });
        }

        const ride = rideResult.rows[0];

        if (ride.driver_id === passenger_id) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(400).json({ message: "You cannot book your own published ride." });
        }

        if (ride.org_name !== req.user.org_name) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(403).json({ message: "You can only book rides within your own organization." });
        }

        // Atomic seat decrement — only succeeds if seats are still available
        const seatResult = await client.query(
            'UPDATE rides SET available_seats = available_seats - 1 WHERE ride_id = $1 AND available_seats > 0 RETURNING available_seats',
            [ride_id]
        );

        if (seatResult.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(400).json({ message: "Sorry, this ride is fully booked!" });
        }

        // Generate a 4-digit OTP for the driver to verify pickup
        const otp = crypto.randomInt(1000, 9999).toString();

        // Insert booking into the bookings table
        const insertQuery = `
            INSERT INTO bookings (
                ride_id, passenger_id, pickup_location, 
                dropoff_location, booking_status, payment_status, otp
            ) 
            VALUES ($1, $2, $3, $4, 'pending', 'pending', $5) 
            RETURNING booking_id
        `;
        
        const insertResult = await client.query(insertQuery, [
            ride_id, 
            passenger_id, 
            pickup_location, 
            dropoff_location, 
            otp
        ]);

        await client.query('COMMIT');
        client.release();

        const io = req.app.get("socketio");
        if (io) {
            io.to(`ride_${ride_id}`).emit('driver_refresh_bookings');
            
            // Emit notification to driver
            io.emit('new_notification', {
                target_emp_id: ride.driver_id,
                title: "New Ride Request",
                message: `${req.user.name || 'A passenger'} wants to join your ride.`,
                type: "request",
                timestamp: new Date().toISOString()
            });

            // Emit seat count update so browse panels refresh
            io.emit('ride_seats_updated', {
                ride_id: ride_id,
                available_seats: seatResult.rows[0].available_seats
            });
        }

        return res.json({ 
            success: true, 
            message: 'Ride booked successfully!',
            booking_id: insertResult.rows[0].booking_id,
            pickup_otp: otp
        });

    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        client.release();
        console.error("Error booking ride:", error);
        return next(error);
    }
});

module.exports = router;