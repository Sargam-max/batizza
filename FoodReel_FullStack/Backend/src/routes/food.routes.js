const express = require('express');
const foodController = require("../controllers/food.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const videoMimeTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];
        if (videoMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed'), false);
        }
    }
});

// POST /api/food/  → Food partner uploads a reel (requires price)
router.post('/',
    authMiddleware.authFoodPartnerMiddleware,
    upload.single("mama"),
    (err, req, res, next) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Max 100MB' : err.message });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    },
    foodController.createFood
);

// GET /api/food/   → Users browse food reels
router.get("/", authMiddleware.authUserMiddleware, foodController.getFoodItems);

// GET /api/food/partner → Food partner sees their own listings
router.get("/partner", authMiddleware.authFoodPartnerMiddleware, foodController.getPartnerFoodItems);

// PATCH /api/food/partner/:foodId/toggle → Toggle availability
router.patch("/partner/:foodId/toggle", authMiddleware.authFoodPartnerMiddleware, foodController.toggleFoodAvailability);

module.exports = router;
