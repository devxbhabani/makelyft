const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');
const { deductAmt, creditAmt } = require('../handlers/WalletHandler');

router.post('/', async (req, res, next) => {
    try {
        const { ride_id } = req.body;
        if (!req.user || !req.user.emp_id) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        
        if (!ride_id) {
            return res.status(400).json({ message: "ride_id is required" });
        }

        const driver_id = req.user.emp_id;
        
        // 1. Verify the ride belongs to this driver and is not already completed
        const rideResult = await db.query(
            'SELECT driver_id, status, fare_per_seat FROM rides WHERE ride_id = $1', 
            [ride_id]
        );

        if (rideResult.rows.length === 0) {
            return res.status(404).json({ message: "Ride not found" });
        }

        const ride = rideResult.rows[0];
        
        if (ride.driver_id !== driver_id) {
            return res.status(403).json({ message: "You are not authorized to finish this ride" });
        }
        
        if (ride.status === 'completed') {
            return res.status(400).json({ message: "Ride is already completed" });
        }

        const fare = parseFloat(ride.fare_per_seat);
        
        // Start Atomic Transaction
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // 2. Find all confirmed passengers
            const bookingsResult = await client.query(
                `SELECT booking_id, passenger_id FROM bookings 
                 WHERE ride_id = $1 AND booking_status = 'confirmed'`,
                [ride_id]
            );

            const bookings = bookingsResult.rows;
            let total_driver_credit = 0;

            // 3. Process each passenger
            for (const booking of bookings) {
                // Deduct from passenger (allows negative balance as per requirements)
                await deductAmt(booking.passenger_id, fare, client);
                
                // Mark booking as completed and paid
                await client.query(
                    `UPDATE bookings 
                     SET booking_status = 'completed', payment_status = 'paid' 
                     WHERE booking_id = $1`,
                    [booking.booking_id]
                );

                total_driver_credit += fare;
            }

            // 4. Credit the driver for all passengers
            if (total_driver_credit > 0) {
                await creditAmt(driver_id, total_driver_credit, client);
            }

            // 5. Mark the ride itself as completed
            await client.query(
                `UPDATE rides SET status = 'completed' WHERE ride_id = $1`,
                [ride_id]
            );

            await client.query('COMMIT');
            
            return res.json({ 
                success: true, 
                message: "Ride completed successfully. Payments processed.",
                earnings: total_driver_credit
            });

        } catch (txnError) {
            await client.query('ROLLBACK');
            throw txnError;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error("Error finishing ride:", error);
        return next(error);
    }
});

module.exports = router;
