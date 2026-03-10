const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'order',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        enum: ['cod', 'online'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed', 'refunded'],
        default: 'pending'
    },
    // For online payments (Razorpay / Stripe etc.)
    transactionId: {
        type: String,
        default: null
    },
    gatewayResponse: {
        type: Object,
        default: null
    }
}, { timestamps: true });

const paymentModel = mongoose.model('payment', paymentSchema);
module.exports = paymentModel;
