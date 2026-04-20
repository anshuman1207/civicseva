const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const { protect } = require('../middleware/authMiddleware');

// @desc    Soft delete a comment
// @route   DELETE /api/comments/:commentId
router.delete('/:commentId', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if the user trying to delete is the owner of the comment
    if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'User not authorized to delete this comment' });
    }

    comment.deleted = true;
    await comment.save();

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
