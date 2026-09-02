const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');
const { deductAmt, creditAmt } = require('../handlers/WalletHandler');

// GET /rides
// Fetch available scheduled rides for the user's organization
router.get('/', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id || !req.user.org_name) {
            return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
        }

        const org_name = req.user.org_name;
        
        const query = `
            SELECT 
                r.ride_id, r.driver_id, r.veh_no, r.origin, r.destination, 
                r.departure_time, r.total_seats, r.available_seats, r.fare_per_seat, r.status,
                r.polyline,
                u.name as driver_name, u.passenger_rating, u.driving_rating,
                v.vehicle_model
            FROM rides r
            JOIN users u ON r.driver_id = u.emp_id
            JOIN vehicles v ON r.veh_no = v.veh_no
            WHERE r.status = 'scheduled' 
              AND r.available_seats > 0
              AND u.org_name = $1
            ORDER BY r.departure_time ASC
        `;

        const result = await db.query(query, [org_name]);

        return res.json({
            success: true,
            rides: result.rows
        });
    } catch (err) {
        console.error("Error fetching rides:", err);
        return next(err);
    }
});

// GET /rides/driver/active
// Fetch the active ride published by the logged-in user, along with its bookings
router.get('/driver/active', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id) {
            return res.status(401).json({ success: false, message: "Unauthorized." });
        }

        const driver_id = req.user.emp_id;

        // Query to get the driver's active ride (scheduled or in_progress)
        const rideQuery = `
            SELECT r.*, v.vehicle_model
            FROM rides r
            JOIN vehicles v ON r.veh_no = v.veh_no
            WHERE r.driver_id = $1 AND r.status IN ('scheduled', 'in_progress')
            ORDER BY r.created_at DESC
            LIMIT 1
        `;
        const rideResult = await db.query(rideQuery, [driver_id]);

        if (rideResult.rows.length === 0) {
            return res.json({ success: true, ride: null });
        }

        const activeRide = rideResult.rows[0];

        // Query to get bookings for this ride
        const bookingsQuery = `
            SELECT b.booking_id, b.passenger_id, b.pickup_location, b.dropoff_location, 
                   b.booking_status, b.payment_status, 
                   r.fare_per_seat,
                   u.name as passenger_name, u.phone as passenger_phone
            FROM bookings b
            JOIN rides r ON b.ride_id = r.ride_id
            JOIN users u ON b.passenger_id = u.emp_id
            WHERE b.ride_id = $1
            ORDER BY b.created_at ASC
        `;
        const bookingsResult = await db.query(bookingsQuery, [activeRide.ride_id]);

        activeRide.bookings = bookingsResult.rows;

        return res.json({
            success: true,
            ride: activeRide
        });
    } catch (err) {
        console.error("Error fetching driver active ride:", err);
        return next(err);
    }
});

// POST /rides/driver/booking/accept
// Accept a pending booking request
router.post('/driver/booking/accept', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id) return res.status(401).json({ success: false, message: "Unauthorized." });
        const { booking_id } = req.body;
        
        // Ensure the driver owns the ride for this booking
        const verifyQuery = `
            SELECT r.ride_id FROM bookings b 
            JOIN rides r ON b.ride_id = r.ride_id 
            WHERE b.booking_id = $1 AND r.driver_id = $2 AND b.booking_status = 'pending'
        `;
        const verifyResult = await db.query(verifyQuery, [booking_id, req.user.emp_id]);
        if (verifyResult.rows.length === 0) {
            return res.status(403).json({ success: false, message: "Invalid booking or unauthorized." });
        }

        await db.query(`UPDATE bookings SET booking_status = 'confirmed' WHERE booking_id = $1`, [booking_id]);
        
        const ride_id = verifyResult.rows[0].ride_id;
        const passenger_id = verifyResult.rows[0].passenger_id;
        const io = req.app.get("socketio");
        if (io) {
            const payload = { booking_id: Number(booking_id), booking_status: 'confirmed', ride_id };
            io.to(`ride_${ride_id}`).emit('booking_status_updated', payload);
            io.emit('booking_status_updated', payload);
            io.to(`ride_${ride_id}`).emit('driver_refresh_bookings');
            io.emit('driver_refresh_bookings');
            
            // Emit notification to passenger
            io.emit('new_notification', {
                target_emp_id: passenger_id,
                title: "Ride Accepted",
                message: `Your ride request has been confirmed!`,
                type: "confirmed",
                timestamp: new Date().toISOString()
            });
        }

        return res.json({ success: true, message: "Booking accepted." });
    } catch (err) {
        console.error("Error accepting booking:", err);
        return next(err);
    }
});

// POST /rides/driver/booking/decline
// Decline a pending booking request and refund the seat
router.post('/driver/booking/decline', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id) return res.status(401).json({ success: false, message: "Unauthorized." });
        const { booking_id } = req.body;
        
        // Ensure the driver owns the ride for this booking
        const verifyQuery = `
            SELECT b.ride_id FROM bookings b 
            JOIN rides r ON b.ride_id = r.ride_id 
            WHERE b.booking_id = $1 AND r.driver_id = $2 AND b.booking_status = 'pending'
        `;
        const verifyResult = await db.query(verifyQuery, [booking_id, req.user.emp_id]);
        if (verifyResult.rows.length === 0) {
            return res.status(403).json({ success: false, message: "Invalid booking or unauthorized." });
        }

        const ride_id = verifyResult.rows[0].ride_id;

        // Cancel the booking
        await db.query(`UPDATE bookings SET booking_status = 'cancelled' WHERE booking_id = $1`, [booking_id]);
        
        // Refund the seat
        await db.query(`UPDATE rides SET available_seats = available_seats + 1 WHERE ride_id = $1`, [ride_id]);

        const io = req.app.get("socketio");
        if (io) {
            const payload = { booking_id: Number(booking_id), booking_status: 'cancelled', ride_id };
            io.to(`ride_${ride_id}`).emit('booking_status_updated', payload);
            io.emit('booking_status_updated', payload);
            io.to(`ride_${ride_id}`).emit('driver_refresh_bookings');
            io.emit('driver_refresh_bookings');
        }

        return res.json({ success: true, message: "Booking declined." });
    } catch (err) {
        console.error("Error declining booking:", err);
        return next(err);
    }
});

// GET /rides/passenger/active
// Fetch the active ride the logged-in user is a passenger on
router.get('/passenger/active', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id) return res.status(401).json({ success: false, message: "Unauthorized." });
        
        const query = `
            SELECT b.booking_id, b.booking_status, b.payment_status, b.otp,
                   r.ride_id, r.origin, r.destination, r.departure_time, r.veh_no, r.polyline, r.fare_per_seat,
                   v.vehicle_model,
                   u.name as driver_name, u.phone as driver_phone
            FROM bookings b
            JOIN rides r ON b.ride_id = r.ride_id
            JOIN vehicles v ON r.veh_no = v.veh_no
            JOIN users u ON r.driver_id = u.emp_id
            WHERE b.passenger_id = $1 AND b.booking_status IN ('in_progress')
            ORDER BY b.booking_id DESC LIMIT 1
        `;
        const result = await db.query(query, [req.user.emp_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "No active trip found." });
        }
        
        const row = result.rows[0];

        return res.json({
            success: true,
            booking: {
                booking_id: row.booking_id,
                booking_status: row.booking_status,
                payment_status: row.payment_status,
                otp: row.otp
            },
            ride: {
                ride_id: row.ride_id,
                origin: row.origin,
                destination: row.destination,
                departure_time: row.departure_time,
                veh_no: row.veh_no,
                polyline: row.polyline,
                fare_per_seat: row.fare_per_seat,
                vehicle_model: row.vehicle_model,
                driver_name: row.driver_name,
                driver_phone: row.driver_phone
            }
        });
    } catch (err) {
        console.error("Error fetching active passenger ride:", err);
        return next(err);
    }
});

// POST /rides/passenger/pay
// Passenger makes payment for dropped off / completed ride
router.post('/passenger/pay', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id) return res.status(401).json({ success: false, message: "Unauthorized." });
        const { booking_id, payment_method, razorpay_payment_id } = req.body;
        const passenger_id = req.user.emp_id;

        if (!booking_id) {
            return res.status(400).json({ success: false, message: "booking_id is required" });
        }

        // Verify booking belongs to this passenger
        const bookingResult = await db.query(`
            SELECT b.booking_id, b.booking_status, b.payment_status, b.ride_id, r.fare_per_seat, r.driver_id
            FROM bookings b
            JOIN rides r ON b.ride_id = r.ride_id
            WHERE b.booking_id = $1 AND b.passenger_id = $2
        `, [booking_id, passenger_id]);

        if (bookingResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Booking not found or unauthorized." });
        }

        const booking = bookingResult.rows[0];
        const fare = parseFloat(booking.fare_per_seat || 45);

        // Process payment deduction from passenger's wallet if paying with wallet
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            if (payment_method === 'wallet' || !payment_method) {
                // Check if passenger has sufficient balance
                const walletRes = await client.query('SELECT balance FROM wallets WHERE emp_id = $1', [passenger_id]);
                const currentBalance = walletRes.rows.length > 0 ? parseFloat(walletRes.rows[0].balance) : 0;

                if (currentBalance < fare) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        insufficient_balance: true,
                        current_balance: currentBalance,
                        fare: fare,
                        message: `Insufficient wallet balance (₹${currentBalance.toFixed(2)}). Ride fare is ₹${fare.toFixed(2)}. Please pay via Razorpay / UPI or top up your wallet.`
                    });
                }

                // Deduct fare from passenger wallet
                await deductAmt(passenger_id, fare, client);
            }

            // Mark booking payment status as paid_pending_confirmation
            await client.query(
                `UPDATE bookings SET payment_status = 'paid_pending_confirmation' WHERE booking_id = $1`,
                [booking_id]
            );

            await client.query('COMMIT');

            const io = req.app.get("socketio");
            if (io) {
                const payload = {
                    booking_id: Number(booking_id),
                    booking_status: booking.booking_status,
                    payment_status: 'paid_pending_confirmation',
                    fare: fare,
                    ride_id: booking.ride_id,
                    payment_method: payment_method || 'wallet'
                };
                io.to(`ride_${booking.ride_id}`).emit('booking_payment_updated', payload);
                io.emit('booking_payment_updated', payload);
                io.to(`ride_${booking.ride_id}`).emit('driver_refresh_bookings');
                io.emit('driver_refresh_bookings');
            }

            return res.json({
                success: true,
                message: `Payment of ₹${fare} completed! Awaiting driver confirmation.`,
                payment_status: 'paid_pending_confirmation',
                fare: fare
            });
        } catch (txnError) {
            await client.query('ROLLBACK');
            throw txnError;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error processing passenger payment:", err);
        return next(err);
    }
});

// POST /rides/driver/confirm-payment
// Driver confirms receipt of passenger's payment
router.post('/driver/confirm-payment', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id) return res.status(401).json({ success: false, message: "Unauthorized." });
        const { booking_id } = req.body;
        const driver_id = req.user.emp_id;

        if (!booking_id) {
            return res.status(400).json({ success: false, message: "booking_id is required" });
        }

        // Verify driver owns the ride for this booking
        const bookingResult = await db.query(`
            SELECT b.booking_id, b.booking_status, b.payment_status, b.ride_id, r.fare_per_seat, r.driver_id
            FROM bookings b
            JOIN rides r ON b.ride_id = r.ride_id
            WHERE b.booking_id = $1 AND r.driver_id = $2
        `, [booking_id, driver_id]);

        if (bookingResult.rows.length === 0) {
            return res.status(403).json({ success: false, message: "Unauthorized or booking not found." });
        }

        const booking = bookingResult.rows[0];
        const fare = parseFloat(booking.fare_per_seat || 45);

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // Credit the driver's wallet
            await creditAmt(driver_id, fare, client);

            // Mark booking payment status as completed
            await client.query(
                `UPDATE bookings SET payment_status = 'completed' WHERE booking_id = $1`,
                [booking_id]
            );

            await client.query('COMMIT');

            const io = req.app.get("socketio");
            if (io) {
                const payload = {
                    booking_id: Number(booking_id),
                    booking_status: 'completed',
                    payment_status: 'completed',
                    fare: fare,
                    ride_id: booking.ride_id
                };
                io.to(`ride_${booking.ride_id}`).emit('booking_payment_updated', payload);
                io.emit('booking_payment_updated', payload);
                io.to(`ride_${booking.ride_id}`).emit('booking_status_updated', payload);
                io.emit('booking_status_updated', payload);
                io.to(`ride_${booking.ride_id}`).emit('driver_refresh_bookings');
                io.emit('driver_refresh_bookings');
            }

            return res.json({
                success: true,
                message: `Payment of ₹${fare} confirmed and credited to your commute wallet!`,
                payment_status: 'completed',
                fare: fare
            });
        } catch (txnError) {
            await client.query('ROLLBACK');
            throw txnError;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error confirming payment by driver:", err);
        return next(err);
    }
});

module.exports = router;
