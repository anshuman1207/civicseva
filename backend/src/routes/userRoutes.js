const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Comment = require('../models/Comment');
const { calculateImpactScore } = require('../utils/impactEngine');


// @desc    Get leaderboard data
// @route   GET /api/users/leaderboard
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const allComplaints = await Complaint.find();
    const allComments = await Comment.find();
    
    const leaderData = users.map(user => {
      const userComplaints = allComplaints.filter(c => c.user && c.user.toString() === user._id.toString());
      const userComments = allComments.filter(c => c.user && c.user.toString() === user._id.toString()).length;
      
      // Count how many times this user has verified OTHER reports
      const userVerifications = allComplaints.filter(c => c.verifications && c.verifications.includes(user._id)).length;
      
      const reports = userComplaints.length;
      const resolved = userComplaints.filter(c => c.status === 'Resolved').length;
      const upvotes = userComplaints.reduce((acc, curr) => acc + (curr.upvotes || 0), 0);
      const streak = user.currentStreak || 0;

      // Category breakdown for weighted impact
      const categoryBreakdown = userComplaints.reduce((acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      }, {});

      const impactScore = calculateImpactScore({
        reports,
        resolved,
        upvotes,
        streak,
        verifications: userVerifications,
        comments: userComments,
        categoryBreakdown
      }, user.level);
      
      return {
        id: user._id,
        name: user.name,
        avatar: user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
        reports,
        resolved,
        upvotes,
        streak,
        badge: user.level || 'Beginner',
        impactScore
      };
    });

    
    // Sort by impact score descending
    leaderData.sort((a, b) => b.impactScore - a.impactScore);
    
    res.json(leaderData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
