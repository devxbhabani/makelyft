const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');
const { FN_verifyAdmin } = require('../handlers/middlewareHandler');

// Use the admin middleware for all routes in this file
router.use(FN_verifyAdmin);

// 1. Get all employees
router.get('/employees', async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT emp_id, name, email, phone, role, is_vehicle_registered, passenger_rating, driving_rating, created_at 
             FROM users 
             WHERE org_name = $1
             ORDER BY created_at DESC`,
            [req.user.org_name]
        );
        res.json({ success: true, employees: result.rows });
    } catch (err) {
        next(err);
    }
});

// 2. Get all vehicles (with driver details)
router.get('/vehicles', async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT v.veh_id, v.veh_no, v.vehicle_model, v.seating_capacity, v.fuel_consumption_ratio, 
                    u.name as driver_name, u.email as driver_email, u.is_vehicle_registered 
             FROM vehicles v
             JOIN users u ON v.emp_id = u.emp_id
             WHERE u.org_name = $1
             ORDER BY v.created_at DESC`,
            [req.user.org_name]
        );
        res.json({ success: true, vehicles: result.rows });
    } catch (err) {
        next(err);
    }
});
// 2.5 Admin Add Vehicle Directly
router.post('/vehicles', async (req, res, next) => {
    try {
        const { emp_id, vehicle_model, veh_no, seating_capacity, fuel_consumption_ratio } = req.body;
        
        if (!emp_id || !veh_no) return res.status(400).json({ success: false, message: "emp_id and veh_no are required" });

        const crypto = require('crypto');
        const veh_id = 'VEH-' + crypto.randomBytes(4).toString('hex').toUpperCase();

        await db.query('BEGIN');
        
        // Insert vehicle
        await db.query(
            `INSERT INTO vehicles (veh_id, veh_no, emp_id, vehicle_model, seating_capacity, fuel_consumption_ratio) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [veh_id, veh_no, emp_id, vehicle_model, seating_capacity || 4, fuel_consumption_ratio || 1.0]
        );

        // Update user status directly to '2' (Approved)
        await db.query("UPDATE users SET is_vehicle_registered = '2' WHERE emp_id = $1", [emp_id]);

        await db.query('COMMIT');
        res.json({ success: true, message: "Vehicle registered successfully by admin" });
    } catch (err) {
        await db.query('ROLLBACK');
        if(err.code === '23505') {
            return res.status(400).json({ success: false, message: "Vehicle number already exists." });
        }
        next(err);
    }
});

// 2.75 Approve a pending vehicle
router.post('/vehicles/approve', async (req, res, next) => {
    try {
        const { veh_id } = req.body;
        if (!veh_id) return res.status(400).json({ success: false, message: "veh_id is required" });

        // Find the owner of this vehicle
        const vehRes = await db.query('SELECT emp_id FROM vehicles WHERE veh_id = $1', [veh_id]);
        if (vehRes.rows.length === 0) return res.status(404).json({ success: false, message: "Vehicle not found" });

        const emp_id = vehRes.rows[0].emp_id;

        // Update the owner's status to '2' (Approved)
        await db.query("UPDATE users SET is_vehicle_registered = '2' WHERE emp_id = $1", [emp_id]);

        res.json({ success: true, message: "Vehicle approved successfully" });
    } catch (err) {
        next(err);
    }
});

// 3. Get org settings
router.get('/settings', async (req, res, next) => {
    try {
        const result = await db.query(
            'SELECT * FROM org_settings WHERE org_name = $1 LIMIT 1', 
            [req.user.org_name]
        );
        res.json({ success: true, settings: result.rows[0] || {} });
    } catch (err) {
        next(err);
    }
});

// 4. Update org settings
router.put('/settings', async (req, res, next) => {
    try {
        const { fuel_cost_per_km, travel_cost_per_km, max_rides_per_day } = req.body;
        
        const result = await db.query(
            `UPDATE org_settings 
             SET fuel_cost_per_km = $1, travel_cost_per_km = $2, max_rides_per_day = $3, updated_at = CURRENT_TIMESTAMP
             WHERE org_name = $4
             RETURNING *`,
            [fuel_cost_per_km, travel_cost_per_km, max_rides_per_day, req.user.org_name]
        );
        
        // If table was somehow empty, insert it
        if (result.rows.length === 0) {
            const insertResult = await db.query(
                `INSERT INTO org_settings (org_name, fuel_cost_per_km, travel_cost_per_km, max_rides_per_day) 
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [req.user.org_name, fuel_cost_per_km, travel_cost_per_km, max_rides_per_day]
            );
            return res.json({ success: true, settings: insertResult.rows[0], message: "Settings created" });
        }
        
        res.json({ success: true, settings: result.rows[0], message: "Settings updated successfully" });
    } catch (err) {
        next(err);
    }
});

// 5. Get Metrics / Monitor Participation
router.get('/metrics', async (req, res, next) => {
    try {
        const org_name = req.user.org_name;
        const usersRes = await db.query("SELECT COUNT(*) as total FROM users WHERE role = 'employee' AND org_name = $1", [org_name]);
        const vehRes = await db.query("SELECT COUNT(*) as total FROM vehicles v JOIN users u ON v.emp_id = u.emp_id WHERE u.org_name = $1", [org_name]);
        const ridesRes = await db.query("SELECT COUNT(*) as total FROM rides r JOIN users u ON r.driver_id = u.emp_id WHERE u.org_name = $1", [org_name]);
        const activeRes = await db.query("SELECT COUNT(*) as total FROM rides r JOIN users u ON r.driver_id = u.emp_id WHERE (r.status = 'scheduled' OR r.status = 'in_progress') AND u.org_name = $1", [org_name]);

        res.json({
            success: true,
            metrics: {
                total_employees: parseInt(usersRes.rows[0].total),
                total_vehicles: parseInt(vehRes.rows[0].total),
                total_rides_published: parseInt(ridesRes.rows[0].total),
                active_rides: parseInt(activeRes.rows[0].total)
            }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
