const express = require('express');
const router = express.Router();
const socialController = require('../controllers/social.controller');
const { authUserMiddleware } = require('../middlewares/auth.middleware');

// Likes
router.post('/like/:foodId', authUserMiddleware, socialController.toggleLike);
router.get('/like/:foodId', authUserMiddleware, socialController.getLikeStatus);
router.post('/likes/bulk', authUserMiddleware, socialController.getBulkLikeStatus);

// Comments
router.post('/comment/:foodId', authUserMiddleware, socialController.postComment);
router.get('/comment/:foodId', authUserMiddleware, socialController.getComments);
router.delete('/comment/:commentId', authUserMiddleware, socialController.deleteComment);

module.exports = router;
