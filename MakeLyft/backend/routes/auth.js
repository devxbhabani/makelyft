const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("../handlers/dbHandler");
const { FN_verifyTkn } = require("../handlers/middlewareHandler");

/* HASHING FUNCTIONS */
async function Hash_Pass(password) {
    const saltRounds = parseInt(process.env.CRYPT_SALT || "10");
    const salt = await bcrypt.genSalt(isNaN(saltRounds) ? 10 : saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

async function Compare_Pass(password, hash) {
    return await bcrypt.compare(password, hash);
}

const router = express.Router();

// 2FA Setup
const otpStore = new Map();
const signupStore = new Map();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- SIGNUP FLOW ---
router.post("/signup", async (req, res, next) => {
    const { name, email, phone, password, role, organization } = req.body;

    if (!name || !email || !password || !organization) {
        return res.status(400).json({ message: "Name, email, password, and organization are required." });
    }

    const selectedRole = (role === 'admin') ? 'admin' : 'employee';

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows[0]) {
            return res.status(400).json({ message: "Email already registered." });
        }

        const hashedPassword = await Hash_Pass(password);
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000;
        const org_name = organization; // Use dropdown value instead of email extraction

        signupStore.set(email, { 
            name, 
            phone, 
            role: selectedRole,
            hashedPassword, 
            org_name,
            code: otp, 
            expiresAt 
        });

        try {
            await transporter.sendMail({
                from: `"MakeLyft" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: "Verify Your MakeLyft Account",
                text: `Your verification OTP is: ${otp}. Valid for 5 minutes.`
            });

            return res.json({ 
                success: true, 
                message: `Verification OTP sent to ${email}.`,
                requires2FA: true 
            });
        } catch (emailErr) {
            console.error("Failed to send signup OTP:", emailErr);
            return res.status(500).json({ message: "Failed to send verification email. Please check server configuration." });
        }
    } catch (err) {
        return next(err);
    }
    
});

router.post("/verify-signup-otp", async (req, res, next) => {
    const { email, otp } = req.body;
    const record = signupStore.get(email);

    if (!record) {
        return res.status(400).json({ message: "No signup verification session found. Please register again." });
    }

    if (Date.now() > record.expiresAt) {
        signupStore.delete(email);
        return res.status(400).json({ message: "Verification session expired. Please register again." });
    }

    if (record.code === otp) {
        try {
            const emp_id = "EMP-" + crypto.randomBytes(3).toString("hex").toUpperCase();
            const userRole = record.role || 'employee';
            
            await db.query(
                `INSERT INTO users (emp_id, name, email, org_name, phone, role, password_hash) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
                [emp_id, record.name, email, record.org_name, record.phone || null, userRole, record.hashedPassword]
            );

            // Also ensure org_settings exists for this new org_name
            await db.query(
                `INSERT INTO org_settings (org_name, fuel_cost_per_km, travel_cost_per_km) 
                 VALUES ($1, 5.50, 2.00) 
                 ON CONFLICT (org_name) DO NOTHING`,
                [record.org_name]
            );

            signupStore.delete(email);

            const user_data = { emp_id, email, name: record.name, role: userRole, org_name: record.org_name };
            const token = jwt.sign(user_data, process.env.JWT_SECRET || 'secret', { expiresIn: "7d" });

            return res.json({ 
                success: true, 
                message: "Signed up and logged in successfully!", 
                token: token,
                user: user_data
            });
        } catch (err) {
            return next(err);
        }
    }

    return res.status(400).json({ message: "Invalid verification code. Please try again." });
});


// --- LOGIN FLOW ---
router.post("/login", async (req, res, next) => {
    const { email, password, organization } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1 OR emp_id = $1', [email]);
        const user = result.rows[0];

        if (user) {
            if (user.org_name && user.org_name !== organization) {
                return res.status(401).json({ message: "This email does not belong to the selected organization." });
            }
            const isMatch = await Compare_Pass(password, user.password_hash);
            if (isMatch) {
                const otp = crypto.randomInt(100000, 999999).toString();
                const expiresAt = Date.now() + 5 * 60 * 1000;

                otpStore.set(user.email, { 
                    code: otp, 
                    expiresAt, 
                    emp_id: user.emp_id,
                    name: user.name,
                    role: user.role,
                    org_name: user.org_name
                });

                try {
                    await transporter.sendMail({
                        from: `"MakeLyft" <${process.env.EMAIL_USER}>`,
                        to: user.email,
                        subject: "Your Login OTP for MakeLyft",
                        text: `Your OTP for login is: ${otp}. Valid for 5 minutes.`
                    });
                    
                    return res.json({ 
                        success: true, 
                        message: `OTP sent successfully to ${user.email}.`,
                        requires2FA: true,
                        resolvedEmail: user.email
                    });
                } catch (emailErr) {
                    console.error("Failed to send OTP:", emailErr);
                    return res.status(500).json({ message: "Failed to send OTP email. Please check server configuration." });
                }
            } else {
                return res.status(401).json({ message: "Incorrect password" });
            }
        } else {
            return res.status(400).json({ message: "Account not found. Please sign up first." });
        }
    } catch (err) {
        return next(err);
    }
});

router.post("/verify-otp", (req, res, next) => {
    const { email, otp } = req.body;
    const record = otpStore.get(email);

    if (!record) {
        return res.status(400).json({ message: "No OTP requested or session expired. Please log in again." });
    }

    if (Date.now() > record.expiresAt) {
        otpStore.delete(email);
        return res.status(400).json({ message: "OTP has expired. Please log in again." });
    }

    if (record.code === otp) {
        otpStore.delete(email); 
        
        const user_data = { emp_id: record.emp_id, email, name: record.name, role: record.role, org_name: record.org_name };
        const token = jwt.sign(user_data, process.env.JWT_SECRET || 'secret', { expiresIn: "7d" });
        
        return res.json({ 
            success: true, 
            message: "Successfully Logged In!", 
            token: token,
            user: user_data
        });
    }

    return res.status(400).json({ message: "Invalid OTP. Please try again." });
});

router.get("/me", FN_verifyTkn, async (req, res, next) => {
    try {
        const emp_id = req.user.emp_id;
        const userQuery = await db.query(
            "SELECT emp_id, name, email, org_name, phone, role, address, passenger_rating, driving_rating FROM users WHERE emp_id = $1",
            [emp_id]
        );
        
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const profile = userQuery.rows[0];
        
        // Fetch vehicle if any
        const vehicleQuery = await db.query(
            "SELECT * FROM vehicles WHERE emp_id = $1",
            [emp_id]
        );
        
        profile.vehicle = vehicleQuery.rows.length > 0 ? vehicleQuery.rows[0] : null;
        
        return res.json({ success: true, profile });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;