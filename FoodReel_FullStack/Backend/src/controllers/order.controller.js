const orderModel = require('../models/order.model');
const couponModel = require('../models/coupon.model');
const paymentModel = require('../models/payment.model');
const foodModel = require('../models/food.model');

// ─── Place Order (User) ───────────────────────────────────────────────────────
async function placeOrder(req, res) {
    try {
        const { foodItemId, quantity = 1, deliveryAddress, phoneNumber, couponCode, paymentMethod = 'cod', notes = '' } = req.body;

        if (!foodItemId || !deliveryAddress || !phoneNumber) {
            return res.status(400).json({ message: 'foodItemId, deliveryAddress, and phoneNumber are required' });
        }

        // Fetch food item
        const foodItem = await foodModel.findById(foodItemId).populate('foodPartner');
        if (!foodItem) return res.status(404).json({ message: 'Food item not found' });
        if (!foodItem.isAvailable) return res.status(400).json({ message: 'Food item is currently unavailable' });

        const originalPrice = foodItem.price * quantity;
        let discountAmount = 0;
        let couponApplied = null;

        // ── Coupon Handling ──
        if (couponCode) {
            const coupon = await couponModel.findOne({ code: couponCode.toUpperCase(), isActive: true });

            if (!coupon) return res.status(400).json({ message: 'Invalid or expired coupon code' });
            if (coupon.expiresAt && new Date() > coupon.expiresAt) return res.status(400).json({ message: 'Coupon has expired' });
            if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ message: 'Coupon usage limit reached' });
            if (originalPrice < coupon.minOrderAmount) {
                return res.status(400).json({ message: `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}` });
            }

            if (coupon.discountType === 'percentage') {
                discountAmount = (originalPrice * coupon.discountValue) / 100;
                if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
            } else {
                discountAmount = coupon.discountValue;
            }

            discountAmount = Math.min(discountAmount, originalPrice); // can't exceed total
            couponApplied = coupon.code;

            // Increment usage
            await couponModel.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
        }

        const finalPrice = originalPrice - discountAmount;

        // ── Create Order ──
        const order = await orderModel.create({
            user: req.user._id,
            foodPartner: foodItem.foodPartner._id,
            foodItem: foodItem._id,
            quantity,
            deliveryAddress,
            phoneNumber,
            originalPrice,
            discountAmount,
            finalPrice,
            couponApplied,
            paymentMethod,
            notes,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending'
        });

        // ── Create Payment Record ──
        const payment = await paymentModel.create({
            order: order._id,
            user: req.user._id,
            amount: finalPrice,
            method: paymentMethod,
            status: paymentMethod === 'cod' ? 'pending' : 'pending'
        });

        const populatedOrder = await orderModel.findById(order._id)
            .populate('foodItem', 'name description price video')
            .populate('foodPartner', 'name address phone');

        res.status(201).json({
            message: 'Order placed successfully',
            order: populatedOrder,
            payment,
            summary: {
                originalPrice,
                discountAmount,
                finalPrice,
                couponApplied,
                paymentMethod
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Failed to place order', error: error.message });
    }
}

// ─── Validate Coupon (User can check before ordering) ────────────────────────
async function validateCoupon(req, res) {
    try {
        const { couponCode, orderAmount } = req.body;
        if (!couponCode || !orderAmount) return res.status(400).json({ message: 'couponCode and orderAmount are required' });

        const coupon = await couponModel.findOne({ code: couponCode.toUpperCase(), isActive: true });
        if (!coupon) return res.status(400).json({ message: 'Invalid or expired coupon code' });
        if (coupon.expiresAt && new Date() > coupon.expiresAt) return res.status(400).json({ message: 'Coupon has expired' });
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ message: 'Coupon usage limit reached' });
        if (orderAmount < coupon.minOrderAmount) {
            return res.status(400).json({ message: `Minimum order amount is ₹${coupon.minOrderAmount}` });
        }

        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = (orderAmount * coupon.discountValue) / 100;
            if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        } else {
            discountAmount = coupon.discountValue;
        }
        discountAmount = Math.min(discountAmount, orderAmount);

        res.status(200).json({
            message: 'Coupon is valid',
            coupon: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                maxDiscount: coupon.maxDiscount
            },
            discountAmount,
            finalPrice: orderAmount - discountAmount
        });

    } catch (error) {
        res.status(500).json({ message: 'Coupon validation failed', error: error.message });
    }
}

// ─── Get User's Orders ────────────────────────────────────────────────────────
async function getUserOrders(req, res) {
    try {
        const orders = await orderModel.find({ user: req.user._id })
            .populate('foodItem', 'name description price video')
            .populate('foodPartner', 'name address phone')
            .sort({ createdAt: -1 });

        res.status(200).json({ message: 'Orders fetched successfully', orders });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
    }
}

// ─── Get Food Partner's Incoming Orders ──────────────────────────────────────
async function getPartnerOrders(req, res) {
    try {
        const { status } = req.query;
        const filter = { foodPartner: req.foodPartner._id };
        if (status) filter.status = status;

        const orders = await orderModel.find(filter)
            .populate('user', 'fullName email')
            .populate('foodItem', 'name price')
            .sort({ createdAt: -1 });

        res.status(200).json({ message: 'Partner orders fetched', orders });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch partner orders', error: error.message });
    }
}

// ─── Update Order Status (Food Partner) ──────────────────────────────────────
async function updateOrderStatus(req, res) {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

        const order = await orderModel.findOne({ _id: orderId, foodPartner: req.foodPartner._id });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = status;

        // Auto mark payment as paid if COD and delivered
        if (status === 'delivered' && order.paymentMethod === 'cod') {
            order.paymentStatus = 'paid';
            await paymentModel.findOneAndUpdate({ order: order._id }, { status: 'success' });
        }

        await order.save();

        res.status(200).json({ message: `Order status updated to ${status}`, order });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update order status', error: error.message });
    }
}

// ─── Confirm Online Payment ───────────────────────────────────────────────────
async function confirmPayment(req, res) {
    try {
        const { orderId, transactionId } = req.body;

        const order = await orderModel.findOne({ _id: orderId, user: req.user._id });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'Order already paid' });
        }

        // In production: verify transactionId with payment gateway here
        order.paymentStatus = 'paid';
        order.paymentId = transactionId;
        order.status = 'confirmed';
        await order.save();

        await paymentModel.findOneAndUpdate(
            { order: orderId },
            { status: 'success', transactionId }
        );

        res.status(200).json({ message: 'Payment confirmed successfully', order });
    } catch (error) {
        res.status(500).json({ message: 'Payment confirmation failed', error: error.message });
    }
}

// ─── Cancel Order (User) ──────────────────────────────────────────────────────
async function cancelOrder(req, res) {
    try {
        const { orderId } = req.params;
        const order = await orderModel.findOne({ _id: orderId, user: req.user._id });

        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (['delivered', 'out_for_delivery', 'cancelled'].includes(order.status)) {
            return res.status(400).json({ message: `Cannot cancel an order that is ${order.status}` });
        }

        order.status = 'cancelled';
        if (order.paymentStatus === 'paid') {
            order.paymentStatus = 'refunded';
            await paymentModel.findOneAndUpdate({ order: order._id }, { status: 'refunded' });
        }
        await order.save();

        res.status(200).json({ message: 'Order cancelled successfully', order });
    } catch (error) {
        res.status(500).json({ message: 'Failed to cancel order', error: error.message });
    }
}

// ─── ADMIN: Create Coupon ─────────────────────────────────────────────────────
async function createCoupon(req, res) {
    try {
        const { code, discountType, discountValue, maxDiscount, minOrderAmount, usageLimit, expiresAt } = req.body;

        if (!code || !discountType || !discountValue) {
            return res.status(400).json({ message: 'code, discountType, and discountValue are required' });
        }

        const existing = await couponModel.findOne({ code: code.toUpperCase() });
        if (existing) return res.status(400).json({ message: 'Coupon code already exists' });

        const coupon = await couponModel.create({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            maxDiscount: maxDiscount || null,
            minOrderAmount: minOrderAmount || 0,
            usageLimit: usageLimit || null,
            expiresAt: expiresAt || null,
            createdBy: req.foodPartner ? req.foodPartner._id : null
        });

        res.status(201).json({ message: 'Coupon created successfully', coupon });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create coupon', error: error.message });
    }
}

// ─── Get All Active Coupons (public) ─────────────────────────────────────────
async function getActiveCoupons(req, res) {
    try {
        const coupons = await couponModel.find({ isActive: true }).select('-usedCount -createdBy');
        res.status(200).json({ message: 'Active coupons', coupons });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch coupons', error: error.message });
    }
}

module.exports = {
    placeOrder,
    validateCoupon,
    getUserOrders,
    getPartnerOrders,
    updateOrderStatus,
    confirmPayment,
    cancelOrder,
    createCoupon,
    getActiveCoupons
};
