const Razorpay = require('razorpay');
const crypto = require('crypto');

const env = process.env;

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

// Create Order Handler
const createOrder = async (req, res) => {
  const options = {
    amount: req.body.amount * 100, // Convert to paise
    currency: 'INR',
    receipt: 'receipt_' + Math.random().toString(36).substring(7),
  };
  try {
    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (err) {
    console.error("Razorpay create order error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};   

// Verify Payment Handler
const verifyPayment = (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  const sign = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSign = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(sign).digest('hex');
  
  if (razorpay_signature === expectedSign) {
    return res.json({ success: true, message: "Payment verified successfully" });
  } else {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }
};

module.exports = {createOrder, verifyPayment};