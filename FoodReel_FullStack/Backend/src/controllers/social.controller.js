const likeModel = require('../models/like.model');
const commentModel = require('../models/comment.model');
const foodModel = require('../models/food.model');

// Toggle like on a food item
async function toggleLike(req, res) {
    try {
        const { foodId } = req.params;
        const userId = req.user._id;

        const existing = await likeModel.findOne({ user: userId, foodItem: foodId });

        if (existing) {
            await likeModel.deleteOne({ _id: existing._id });
            await foodModel.findByIdAndUpdate(foodId, { $inc: { likeCount: -1 } });
            return res.status(200).json({ liked: false, message: 'Unliked' });
        } else {
            await likeModel.create({ user: userId, foodItem: foodId });
            await foodModel.findByIdAndUpdate(foodId, { $inc: { likeCount: 1 } });
            return res.status(200).json({ liked: true, message: 'Liked' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to toggle like', error: error.message });
    }
}

// Get like status for current user on a food item
async function getLikeStatus(req, res) {
    try {
        const { foodId } = req.params;
        const liked = await likeModel.exists({ user: req.user._id, foodItem: foodId });
        res.status(200).json({ liked: !!liked });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get like status', error: error.message });
    }
}

// Get bulk like status for multiple food items
async function getBulkLikeStatus(req, res) {
    try {
        const { foodIds } = req.body; // array of food IDs
        if (!Array.isArray(foodIds)) return res.status(400).json({ message: 'foodIds must be an array' });

        const likes = await likeModel.find({ user: req.user._id, foodItem: { $in: foodIds } });
        const likedSet = new Set(likes.map(l => l.foodItem.toString()));

        const result = {};
        foodIds.forEach(id => { result[id] = likedSet.has(id.toString()); });

        res.status(200).json({ likes: result });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get like statuses', error: error.message });
    }
}

// Post a comment
async function postComment(req, res) {
    try {
        const { foodId } = req.params;
        const { text } = req.body;

        if (!text || !text.trim()) return res.status(400).json({ message: 'Comment text is required' });
        if (text.length > 300) return res.status(400).json({ message: 'Comment too long (max 300 chars)' });

        const comment = await commentModel.create({
            user: req.user._id,
            foodItem: foodId,
            text: text.trim()
        });

        await foodModel.findByIdAndUpdate(foodId, { $inc: { commentCount: 1 } });

        const populated = await comment.populate('user', 'fullName');
        res.status(201).json({ message: 'Comment posted', comment: populated });
    } catch (error) {
        res.status(500).json({ message: 'Failed to post comment', error: error.message });
    }
}

// Get comments for a food item
async function getComments(req, res) {
    try {
        const { foodId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = 20;

        const comments = await commentModel.find({ foodItem: foodId })
            .populate('user', 'fullName')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await commentModel.countDocuments({ foodItem: foodId });

        res.status(200).json({ comments, total, page, hasMore: total > page * limit });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
    }
}

// Delete own comment
async function deleteComment(req, res) {
    try {
        const { commentId } = req.params;
        const comment = await commentModel.findOne({ _id: commentId, user: req.user._id });
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        await commentModel.deleteOne({ _id: commentId });
        await foodModel.findByIdAndUpdate(comment.foodItem, { $inc: { commentCount: -1 } });

        res.status(200).json({ message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete comment', error: error.message });
    }
}

module.exports = { toggleLike, getLikeStatus, getBulkLikeStatus, postComment, getComments, deleteComment };
