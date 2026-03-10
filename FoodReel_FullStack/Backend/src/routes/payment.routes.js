const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authUserMiddleware } = require('../middlewares/auth.middleware');

router.post('/razorpay/create', authUserMiddleware, paymentController.createRazorpayOrder);
router.post('/razorpay/verify', authUserMiddleware, paymentController.verifyRazorpayPayment);

module.exports = router;
