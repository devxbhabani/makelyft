const express = require("express");
const router = express.Router();
const { getBotAnswer } = require("./getAiAnswer");
const { sanitizeInput } = require("../utils/sanitize");

// Chat routes
router.get("/", (req, res) => {
    res.json({ message: "Chat API ready" });
});

router.post("/", async (req, res, next) => {
    try {
        const { message } = req.body;
        const cleanMessage = sanitizeInput(message);
        if (!cleanMessage) {
            return res.status(400).json({ error: "Message is required" });
        }
        const reply = await getBotAnswer(cleanMessage);
        return res.json({ success: true, reply: sanitizeInput(reply) });
    } catch (error) {
        console.error("Error in chat route:", error);
        return next(error);
    }
});

module.exports = router;
