const express = require('express');
const router = express.Router();
const storeController = require('../controllers/store.controller');
const { authUserMiddleware } = require('../middlewares/auth.middleware');

router.get('/', authUserMiddleware, storeController.getAllStores);
router.get('/:partnerId', authUserMiddleware, storeController.getStore);

module.exports = router;
