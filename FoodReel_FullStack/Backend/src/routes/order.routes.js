const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// ─── User Routes ──────────────────────────────────────────────────────────────
// POST /api/orders/         → Place an order (user auth)
router.post('/', authMiddleware.authUserMiddleware, orderController.placeOrder);

// GET  /api/orders/         → Get logged-in user's orders
router.get('/', authMiddleware.authUserMiddleware, orderController.getUserOrders);

// POST /api/orders/validate-coupon → Validate coupon before ordering
router.post('/validate-coupon', authMiddleware.authUserMiddleware, orderController.validateCoupon);

// GET  /api/orders/coupons  → List all active coupons
router.get('/coupons', authMiddleware.authUserMiddleware, orderController.getActiveCoupons);

// POST /api/orders/confirm-payment → Confirm online payment
router.post('/confirm-payment', authMiddleware.authUserMiddleware, orderController.confirmPayment);

// DELETE /api/orders/:orderId/cancel → Cancel an order
router.delete('/:orderId/cancel', authMiddleware.authUserMiddleware, orderController.cancelOrder);

// ─── Food Partner Routes ──────────────────────────────────────────────────────
// GET  /api/orders/partner          → Get partner's incoming orders (filter by ?status=)
router.get('/partner', authMiddleware.authFoodPartnerMiddleware, orderController.getPartnerOrders);

// PATCH /api/orders/partner/:orderId/status → Update order status
router.patch('/partner/:orderId/status', authMiddleware.authFoodPartnerMiddleware, orderController.updateOrderStatus);

// POST /api/orders/partner/coupon   → Food partner creates a coupon
router.post('/partner/coupon', authMiddleware.authFoodPartnerMiddleware, orderController.createCoupon);

module.exports = router;
