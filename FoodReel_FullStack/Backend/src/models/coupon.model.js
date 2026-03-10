const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'flat'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 1
    },
    maxDiscount: {
        type: Number,   // cap for percentage discounts
        default: null
    },
    minOrderAmount: {
        type: Number,
        default: 0
    },
    usageLimit: {
        type: Number,
        default: null   // null = unlimited
    },
    usedCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'foodpartner',
        default: null   // null = platform-wide coupon
    }
}, { timestamps: true });

const couponModel = mongoose.model('coupon', couponSchema);
module.exports = couponModel;
