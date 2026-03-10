const foodPartnerModel = require('../models/foodpartner.model');
const foodModel = require('../models/food.model');
const orderModel = require('../models/order.model');

// Get a partner's public store page
async function getStore(req, res) {
    try {
        const { partnerId } = req.params;

        const partner = await foodPartnerModel.findById(partnerId).select('-password -email');
        if (!partner) return res.status(404).json({ message: 'Store not found' });

        const foods = await foodModel.find({ foodPartner: partnerId, isAvailable: true })
            .sort({ createdAt: -1 });

        const totalOrders = await orderModel.countDocuments({ foodPartner: partnerId, status: 'delivered' });

        res.status(200).json({
            partner: {
                _id: partner._id,
                name: partner.name,
                address: partner.address,
                phone: partner.phone,
                contactName: partner.contactName,
                totalOrders,
                totalItems: foods.length
            },
            foods
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to load store', error: error.message });
    }
}

// Get all partners (browse stores)
async function getAllStores(req, res) {
    try {
        const partners = await foodPartnerModel.find({}).select('-password -email');

        const storesWithCount = await Promise.all(partners.map(async (p) => {
            const itemCount = await foodModel.countDocuments({ foodPartner: p._id, isAvailable: true });
            return {
                _id: p._id,
                name: p.name,
                address: p.address,
                phone: p.phone,
                itemCount
            };
        }));

        res.status(200).json({ stores: storesWithCount });
    } catch (error) {
        res.status(500).json({ message: 'Failed to load stores', error: error.message });
    }
}

module.exports = { getStore, getAllStores };
