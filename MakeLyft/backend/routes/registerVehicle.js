const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');
const crypto = require('crypto');

router.post('/', async (req, res, next) => {
    try {
        if(!req.user || !req.user.emp_id){
            return res.status(401).json({message: "User is not Authenticated"});
        }

        const driver_id = req.user.emp_id;
        const {vehicle_no, DL_no, vehicle_model, max_seating_cap, fuel_consumption_ratio, insurance_no} = req.body;
        
        // Basic validation
        if(!vehicle_no || !DL_no || !max_seating_cap) {
            return res.status(400).json({message: "Missing required fields (vehicle_no, DL_no, max_seating_cap)"});
        }

        // Check if the user already has a vehicle registered
        const existingVehicle = await db.query('SELECT veh_id FROM vehicles WHERE emp_id = $1', [driver_id]);
        if(existingVehicle.rows.length > 0) {
            return res.status(400).json({message: "You already have a vehicle registered. MakeLyft currently supports one vehicle per user."});
        }

        // Generate unique vehicle ID
        const veh_id = 'VEH-' + crypto.randomBytes(4).toString('hex').toUpperCase();

        // Start transaction
        await db.query('BEGIN');

        // Insert vehicle
        await db.query(
            `INSERT INTO vehicles (
                veh_id, veh_no, emp_id, insurance_no, dl_no, vehicle_model, seating_capacity, fuel_consumption_ratio
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                veh_id,
                vehicle_no,
                driver_id,
                insurance_no || null,
                DL_no,
                vehicle_model || null,
                parseInt(max_seating_cap),
                parseFloat(fuel_consumption_ratio || 1.0)
            ]
        );

        // Update user profile to pending status
        await db.query(
            'UPDATE users SET is_vehicle_registered = $1 WHERE emp_id = $2',
            ['1', driver_id]
        );

        await db.query('COMMIT');

        return res.status(201).json({
            success: true,
            message: "Vehicle registered successfully",
            veh_id: veh_id
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Error in registerVehicle:", error);
        
        // Handle unique constraint violation on vehicle number
        if(error.code === '23505' && error.constraint === 'vehicles_veh_no_key') {
             return res.status(400).json({message: "This vehicle number is already registered by another user."});
        }
        
        return next(error);
    }
});

module.exports = router;

//fare = approx milage * total distance + (approx_milage*total distance ) * 0.15 + offset