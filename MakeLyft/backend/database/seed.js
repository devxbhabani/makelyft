const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcrypt');

const db = new Pool({
    connectionString: process.env.DB_URI,
});

const generateRandomString = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const seedDatabase = async () => {
    try {
        console.log("🌱 Starting Database Seeding...");
        
        // Clean up first to prevent constraint violations on re-runs
        console.log("🧹 Cleaning up old data...");
        await db.query(`TRUNCATE TABLE bookings, rides, vehicles, wallets, users RESTART IDENTITY CASCADE;`);

        // Insert Users (Employees & Admins)
        console.log("👥 Seeding 120 Employees...");
        const users = [];
        const password_hash = await bcrypt.hash("password123", 10);
        
        // Add 1 Admin
        await db.query(
            `INSERT INTO users (emp_id, name, email, org_name, phone, role, password_hash, is_vehicle_registered) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            ['EMP-ADMIN01', 'Super Admin', 'admin@example.com', 'Odoo', '555-0000', 'admin', password_hash, '0']
        );

        for(let i=1; i<=120; i++) {
            const emp_id = `EMP-${generateRandomString(6)}`;
            const is_vehicle_registered = Math.random() > 0.4 ? '2' : (Math.random() > 0.5 ? '1' : '0');
            
            await db.query(
                `INSERT INTO users (emp_id, name, email, org_name, phone, role, password_hash, is_vehicle_registered, passenger_rating, driving_rating) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    emp_id, 
                    `Employee ${i}`, 
                    `employee${i}@example.com`, 
                    'Odoo',
                    `555-${1000+i}`, 
                    'employee', 
                    password_hash, 
                    is_vehicle_registered,
                    (Math.random() * 2 + 3).toFixed(2), // 3.00 to 5.00
                    (Math.random() * 2 + 3).toFixed(2)
                ]
            );
            
            // Create Wallet
            await db.query(
                `INSERT INTO wallets (emp_id, balance) VALUES ($1, $2)`,
                [emp_id, 10000.00]
            );
            
            users.push({ emp_id, is_vehicle_registered });
        }

        // Insert Vehicles
        console.log("🚗 Seeding Vehicles for approved employees...");
        const vehicles = [];
        const approvedUsers = users.filter(u => u.is_vehicle_registered === '2');
        
        for(let i=0; i<approvedUsers.length; i++) {
            const veh_id = `VEH-${generateRandomString(6)}`;
            const veh_no = `GJ01${generateRandomString(4)}`;
            
            await db.query(
                `INSERT INTO vehicles (veh_id, veh_no, emp_id, insurance_no, dl_no, vehicle_model, seating_capacity, fuel_consumption_ratio) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    veh_id, 
                    veh_no, 
                    approvedUsers[i].emp_id, 
                    `INS-${generateRandomString(6)}`, 
                    `DL-${generateRandomString(8)}`, 
                    ['Swift Dzire', 'Honda City', 'Toyota Innova', 'Hyundai i20'][Math.floor(Math.random()*4)],
                    Math.floor(Math.random() * 4) + 4, // 4 to 7
                    (Math.random() * 10 + 10).toFixed(2) // 10.00 to 20.00
                ]
            );
            vehicles.push({ veh_no, emp_id: approvedUsers[i].emp_id });
        }

        // Insert Rides
        console.log("🛣️ Seeding 100 Rides...");
        const rides = [];
        for(let i=1; i<=100; i++) {
            const randomVehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
            const statusOptions = ['scheduled', 'in_progress', 'completed', 'cancelled'];
            
            const rideResult = await db.query(
                `INSERT INTO rides (driver_id, veh_no, origin, destination, departure_time, total_seats, available_seats, fare_per_seat, status) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING ride_id`,
                [
                    randomVehicle.emp_id,
                    randomVehicle.veh_no,
                    JSON.stringify({ lat: 23.0 + Math.random()*0.1, lng: 72.5 + Math.random()*0.1, address: "Random Origin" }),
                    JSON.stringify({ lat: 23.1 + Math.random()*0.1, lng: 72.6 + Math.random()*0.1, address: "Random Destination" }),
                    new Date(Date.now() + (Math.random() * 7 - 2) * 24 * 60 * 60 * 1000), // Random time between -2 days to +5 days
                    4,
                    Math.floor(Math.random() * 4),
                    (Math.random() * 100 + 50).toFixed(2),
                    statusOptions[Math.floor(Math.random() * statusOptions.length)]
                ]
            );
            rides.push({ ride_id: rideResult.rows[0].ride_id });
        }

        // Insert Bookings
        console.log("🎫 Seeding 200 Bookings...");
        for(let i=1; i<=200; i++) {
            const randomRide = rides[Math.floor(Math.random() * rides.length)];
            const randomPassenger = users[Math.floor(Math.random() * users.length)];
            const bookingStatuses = ['completed', 'cancelled'];
            const paymentStatuses = ['pending', 'paid'];
            
            await db.query(
                `INSERT INTO bookings (ride_id, passenger_id, pickup_location, dropoff_location, booking_status, payment_status, otp) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    randomRide.ride_id,
                    randomPassenger.emp_id,
                    JSON.stringify({ lat: 23.05 + Math.random()*0.05, lng: 72.55 + Math.random()*0.05 }),
                    JSON.stringify({ lat: 23.08 + Math.random()*0.05, lng: 72.58 + Math.random()*0.05 }),
                    bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)],
                    paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
                    generateRandomString(4)
                ]
            );
        }

        console.log("✅ Seeding Complete! Enjoy the flooded Admin Dashboard!");
    } catch (error) {
        console.error("❌ Seeding failed:", error);
    } finally {
        await db.end();
    }
};

seedDatabase();
