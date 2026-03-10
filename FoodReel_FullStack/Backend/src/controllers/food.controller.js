const foodModel = require('../models/food.model');
const storageService = require('../services/storage.service');
const { v4: uuid } = require("uuid");

async function createFood(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Video file is required" });
        }

        if (!req.foodPartner) {
            return res.status(401).json({ message: "Unauthorized food partner" });
        }

        if (!req.body.price) {
            return res.status(400).json({ message: "Price is required" });
        }

        const fileUploadResult = await storageService.uploadFile(
            req.file.buffer,
            uuid(),
            req.file.mimetype
        );

        const foodItem = await foodModel.create({
            name: req.body.name,
            description: req.body.description,
            price: Number(req.body.price),
            category: req.body.category || 'General',
            video: fileUploadResult.url,
            foodPartner: req.foodPartner._id
        });

        res.status(201).json({
            message: "Food created successfully",
            food: foodItem
        });

    } catch (error) {
        res.status(500).json({ message: "Failed to create food", error: error.message });
    }
}

async function getFoodItems(req, res) {
    try {
        const foodItems = await foodModel.find({ isAvailable: true })
            .populate('foodPartner', 'name address phone');

        res.status(200).json({
            message: "Food items fetched successfully",
            foodItems
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch food items", error: error.message });
    }
}

// Food partner gets their own food items
async function getPartnerFoodItems(req, res) {
    try {
        const foodItems = await foodModel.find({ foodPartner: req.foodPartner._id });
        res.status(200).json({ message: "Food items fetched", foodItems });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch food items", error: error.message });
    }
}

// Toggle food availability
async function toggleFoodAvailability(req, res) {
    try {
        const { foodId } = req.params;
        const food = await foodModel.findOne({ _id: foodId, foodPartner: req.foodPartner._id });
        if (!food) return res.status(404).json({ message: 'Food item not found' });

        food.isAvailable = !food.isAvailable;
        await food.save();

        res.status(200).json({ message: `Food item marked as ${food.isAvailable ? 'available' : 'unavailable'}`, food });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update food availability', error: error.message });
    }
}

module.exports = {
    createFood,
    getFoodItems,
    getPartnerFoodItems,
    toggleFoodAvailability
};
