const express = require("express");
const router = express.Router();
const db = require("../handlers/dbHandler");

// GET /history/driver
// Get history of rides published by the user
router.get("/driver", async (req, res, next) => {
	try {
		if (!req.user || !req.user.emp_id) {
			return res.status(401).json({ success: false, message: "Unauthorized." });
		}
		const userId = req.user.emp_id;

		const query = `
            SELECT * FROM rides 
            WHERE driver_id = $1 
            ORDER BY departure_time DESC
        `;
		const { rows } = await db.query(query, [userId]);

		return res.json({ success: true, history: rows });
	} catch (error) {
		console.error("Error fetching driver history:", error);
		return next(error);
	}
});

// GET /history/passenger
// Get history of rides booked by the user
router.get("/passenger", async (req, res, next) => {
	try {
		if (!req.user || !req.user.emp_id) {
			return res.status(401).json({ success: false, message: "Unauthorized." });
		}
		const userId = req.user.emp_id;

		const query = `
            SELECT b.booking_id, b.booking_status, b.payment_status, b.created_at as booking_date,
                   r.*
            FROM bookings b
            JOIN rides r ON b.ride_id = r.ride_id
            WHERE b.passenger_id = $1
            ORDER BY r.departure_time DESC
        `;
		const { rows } = await db.query(query, [userId]);

		return res.json({ success: true, history: rows });
	} catch (error) {
		console.error("Error fetching passenger history:", error);
		return next(error);
	}
});

module.exports = router;
