const express = require('express');
const router = express.Router();
const { getWallet, addMoney } = require('../handlers/WalletHandler');
const { createOrder, verifyPayment } = require('../handlers/rajorHandler');

// GET /wallet
// Retrieves the current user's wallet information
router.get('/', getWallet);

// POST /wallet/add
// Adds money to the user's wallet
router.post('/add', addMoney);

// POST /wallet/create-order
// Create a Razorpay order
router.post('/create-order', createOrder);

// POST /wallet/verify-payment
// Verify Razorpay payment
router.post('/verify-payment', verifyPayment);

// GET /wallet/razorpay-key
// Returns the public Razorpay key ID for the frontend checkout
router.get('/razorpay-key', (req, res) => {
    return res.json({ success: true, key: process.env.RAZORPAY_KEY_ID });
});

module.exports = router;
