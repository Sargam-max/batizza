const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    foodItem: { type: mongoose.Schema.Types.ObjectId, ref: 'food', required: true },
}, { timestamps: true });

likeSchema.index({ user: 1, foodItem: 1 }, { unique: true });

module.exports = mongoose.model('like', likeSchema);
