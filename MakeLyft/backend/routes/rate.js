const express = require("express");
const router = express.Router();
const db = require("../handlers/dbHandler");

// POST /rate
router.post("/", async (req, res, next) => {
    try {
        const { target_emp_id, type, rating } = req.body; // type is 'driver' or 'passenger' (the role of the person being rated)
        
        if (!target_emp_id || !type || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Invalid rating parameters" });
        }

        const field = type === "driver" ? "driving_rating" : "passenger_rating";
        
        // Simple weighted average (gives more weight to history, but incorporates new rating)
        const query = `
            UPDATE users 
            SET ${field} = CASE 
                WHEN ${field} IS NULL THEN $1 
                ELSE (${field} * 9.0 + $1) / 10.0 
            END 
            WHERE emp_id = $2
            RETURNING ${field}
        `;
        
        const { rows } = await db.query(query, [rating, target_emp_id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        
        return res.json({ success: true, new_rating: rows[0][field] });
    } catch (error) {
        console.error("Error submitting rating:", error);
        return next(error);
    }
});

module.exports = router;
