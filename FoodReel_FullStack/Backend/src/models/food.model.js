const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
    name: { type: String, required: true },
    video: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, default: 0, min: 0 },
    category: { type: String, default: 'General' },
    isAvailable: { type: Boolean, default: true },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    foodPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'foodpartner' }
}, { timestamps: true });

module.exports = mongoose.model('food', foodSchema);
