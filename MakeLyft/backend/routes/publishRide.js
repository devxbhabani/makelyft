const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');
const { getRouting } = require('../handlers/GPS_CalcHandler');

router.post('/', async (req, res, next) => {
    try {
        const { origin, destination, departure_time, fare_per_seat } = req.body;
        
        // Ensure user is authenticated (populated by FN_verifyTkn)
        if (!req.user || !req.user.emp_id) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        
        const driver_EMP_ID = req.user.emp_id;

        // Basic validation
        if (!origin || !destination || !departure_time || !fare_per_seat) {
            return res.status(400).json({ message: "Missing required fields (origin, destination, departure_time, fare_per_seat)" });
        }

        // Checking if the user has a registered and approved vehicle
        const vehicleResult = await db.query(
            `SELECT v.veh_no, v.seating_capacity, u.is_vehicle_registered 
             FROM vehicles v 
             JOIN users u ON v.emp_id = u.emp_id 
             WHERE v.emp_id = $1`, 
            [driver_EMP_ID]
        );

        if (!vehicleResult.rows || vehicleResult.rows.length === 0) {
            return res.status(400).json({ message: "Vehicle is not registered. Please register a vehicle first." });
        }

        const vehicle = vehicleResult.rows[0];
        
        if (vehicle.is_vehicle_registered === '0') {
            return res.status(400).json({ message: "Vehicle is not registered." });
        } else if (vehicle.is_vehicle_registered === '1') {
            return res.status(400).json({ message: "Your vehicle registration is pending Admin approval." });
        } else if (vehicle.is_vehicle_registered !== '2') {
            return res.status(400).json({ message: "Invalid vehicle registration status." });
        }

        const veh_no = vehicle.veh_no;
        const total_seats = vehicle.seating_capacity;

        // Formating coordinates for OSRM: "longitude,latitude"
        const startStr = `${origin.lng},${origin.lat}`;
        const endStr = `${destination.lng},${destination.lat}`;

        // Get the route polyline from OSRM
        const routeCoords = await getRouting(startStr, endStr);
        let polylineStr = null;
        if (routeCoords) {
            polylineStr = JSON.stringify(routeCoords);
        }

        // Insert the new ride into the database
        const insertQuery = `
            INSERT INTO rides (
                driver_id, veh_no, origin, destination, 
                departure_time, total_seats, available_seats, 
                fare_per_seat, status, polyline
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'scheduled', $9) 
            RETURNING ride_id
        `;
        
        const insertResult = await db.query(insertQuery, [
            driver_EMP_ID, 
            veh_no, 
            origin, // JSONB
            destination, // JSONB
            departure_time, 
            total_seats, 
            total_seats, // initially available = total
            fare_per_seat, 
            polylineStr
        ]);

        return res.json({ 
            success: true, 
            message: 'Ride published successfully',
            ride_id: insertResult.rows[0].ride_id
        });

    } catch (error) {
        console.error("Error publishing ride:", error);
        return next(error);
    }
});

module.exports = router;