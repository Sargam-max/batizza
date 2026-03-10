const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    foodItem: { type: mongoose.Schema.Types.ObjectId, ref: 'food', required: true },
    text: { type: String, required: true, maxlength: 300 },
}, { timestamps: true });

module.exports = mongoose.model('comment', commentSchema);
