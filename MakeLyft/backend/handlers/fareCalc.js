const db = require('../handlers/dbHandler');

const calcFare = async (req, res, next) => {
    try {
        // We expect the frontend to provide the extra detour distance for the driver 
        // and the actual passenger travel distance.
        const { extra_driver_distance, passenger_distance } = req.body;
        
        if (extra_driver_distance === undefined || passenger_distance === undefined) {
            return res.status(400).json({ message: "Missing distance parameters. Provide extra_driver_distance and passenger_distance." });
        }

        // Total chargeable distance = deviation distance + passenger route distance
        const total_chargeable_distance = parseFloat(extra_driver_distance) + parseFloat(passenger_distance);

        // Fetch organization settings for the current rates based on user's organization
        const org_name = req.user ? req.user.org_name : 'Odoo'; // fallback if not authenticated (though it should be)
        const settingsRes = await db.query(
            'SELECT fuel_cost_per_km, travel_cost_per_km FROM org_settings WHERE org_name = $1 LIMIT 1',
            [org_name]
        );
        
        let cost_per_km = 7.50; // default fallback (5.50 fuel + 2.00 travel)
        if (settingsRes.rows.length > 0) {
            const { fuel_cost_per_km, travel_cost_per_km } = settingsRes.rows[0];
            cost_per_km = parseFloat(fuel_cost_per_km) + parseFloat(travel_cost_per_km);
        }

        // Base fare calculation (Distance * Org Cost Per Km)
        const base_fare = total_chargeable_distance * cost_per_km;
        
        // Add 15% to the original fare
        const total_fare = base_fare + (base_fare * 0.15);

        return res.json({
            success: true,
            chargeable_distance: total_chargeable_distance,
            cost_per_km,
            base_fare: parseFloat(base_fare.toFixed(2)),
            total_fare: parseFloat(total_fare.toFixed(2))
        });
    } catch (error) {
        console.error("Error calculating fare:", error);
        res.status(500).json({ message: "Internal server error during fare calculation" });
    }
}

module.exports = {
    calcFare
};