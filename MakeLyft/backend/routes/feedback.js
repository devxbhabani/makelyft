const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');
const nodemailer = require('nodemailer');
const { sanitizeInput } = require("../utils/sanitize");

// feedback routes
router.post('/send_feedback', async (req, res, next) =>{
    const {message, rating} = req.body;
    const cleanMessage = sanitizeInput(message);
    const emp_id = req.user.emp_id;
    
    const user = await db.query(`SELECT name, email FROM users WHERE emp_id = $1`, [emp_id]);
    if(user.rows.length === 0) {
        return res.status(404).json({error: "User not found"});
    }
    const user_email = user.rows[0].email;
    const user_name = user.rows[0].name;

    if(!cleanMessage || !rating){
        return res.status(400).json({error: "No message was provided"});
    }

    //mailer setup-
    const transporter = nodemailer.createTransport({
         host: "smtp.gmail.com",
         port: 587,
         secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOpt = {
        from: process.env.EMAIL_USER,
        replyTo: user_email,
        to: process.env.EMAIL_USER,
        subject: `Feedback for MakeLyft from ${user_name}`,
        text: `Rating: ${rating} Stars\n\nMessage:\n${cleanMessage}`
    };

    transporter.sendMail(mailOpt, (err, info) => {
        if(err){
            console.error("Error sending feedback:", err);
            return res.status(500).json({error: "Failed to send feedback"});
        }
        res.status(200).json({message: "Feedback sent successfully"});
    });
})

module.exports = router;