const Razorpay = require('razorpay');
const crypto = require('crypto');
const orderModel = require('../models/order.model');
const paymentModel = require('../models/payment.model');

function getRazorpay() {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
}

// Create a Razorpay order (called before showing payment UI)
async function createRazorpayOrder(req, res) {
    try {
        const { orderId } = req.body;

        const order = await orderModel.findOne({ _id: orderId, user: req.user._id });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.paymentStatus === 'paid') return res.status(400).json({ message: 'Already paid' });
        if (order.paymentMethod !== 'online') return res.status(400).json({ message: 'Order is not set for online payment' });

        const razorpay = getRazorpay();

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(order.finalPrice * 100), // paise
            currency: 'INR',
            receipt: `receipt_${order._id}`,
            notes: { orderId: order._id.toString(), userId: req.user._id.toString() }
        });

        res.status(200).json({
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID,
            orderId: order._id,
            prefill: {
                name: req.user.fullName,
                email: req.user.email,
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create payment order', error: error.message });
    }
}

// Verify Razorpay payment signature and mark order as paid
async function verifyRazorpayPayment(req, res) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed — invalid signature' });
        }

        // Update order
        const order = await orderModel.findOneAndUpdate(
            { _id: orderId, user: req.user._id },
            { paymentStatus: 'paid', paymentId: razorpay_payment_id, status: 'confirmed' },
            { new: true }
        );

        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Update payment record
        await paymentModel.findOneAndUpdate(
            { order: orderId },
            { status: 'success', transactionId: razorpay_payment_id, gatewayResponse: req.body }
        );

        res.status(200).json({ message: 'Payment verified successfully', order });
    } catch (error) {
        res.status(500).json({ message: 'Payment verification failed', error: error.message });
    }
}

module.exports = { createRazorpayOrder, verifyRazorpayPayment };
