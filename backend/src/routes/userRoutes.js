const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Comment = require('../models/Comment');
const { calculateImpactScore } = require('../utils/impactEngine');


// @desc    Get leaderboard data
// @route   GET /api/users/leaderboard
// @access  Public
// @desc    Get leaderboard data
// @route   GET /api/users/leaderboard
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderData = await User.aggregate([
      {
        $lookup: {
          from: 'complaints',
          localField: '_id',
          foreignField: 'user',
          as: 'userComplaints'
        }
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'userId',
          as: 'userComments'
        }
      },
      {
        $lookup: {
          from: 'complaints',
          localField: '_id',
          foreignField: 'verifications',
          as: 'verifiedComplaints'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          level: 1,
          currentStreak: 1,
          reports: { $size: '$userComplaints' },
          comments: { $size: '$userComments' },
          verifications: { $size: '$verifiedComplaints' },
          resolved: {
            $size: {
              $filter: {
                input: '$userComplaints',
                as: 'c',
                cond: { $eq: ['$$c.status', 'Resolved'] }
              }
            }
          },
          upvotes: {
            $sum: '$userComplaints.upvotes'
          },
          categoryBreakdown: {
            $reduce: {
              input: '$userComplaints.category',
              initialValue: [],
              in: {
                $concatArrays: ['$$value', ['$$this']]
              }
            }
          }
        }
      }
    ]);

    // Map through the aggregated data to apply the JS impact score calculation 
    // since impactScore algorithm is complex and shared with other routes.
    const mappedLeaderData = leaderData.map(user => {
      // Create category breakdown map
      const categoryBreakdown = (user.categoryBreakdown || []).reduce((acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

      const impactScore = calculateImpactScore({
        reports: user.reports,
        resolved: user.resolved,
        upvotes: user.upvotes,
        streak: user.currentStreak || 0,
        verifications: user.verifications,
        comments: user.comments,
        categoryBreakdown
      }, user.level);

      return {
        id: user._id,
        name: user.name,
        avatar: user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
        reports: user.reports,
        resolved: user.resolved,
        upvotes: user.upvotes,
        streak: user.currentStreak || 0,
        badge: user.level || 'Beginner',
        impactScore
      };
    });

    mappedLeaderData.sort((a, b) => b.impactScore - a.impactScore);
    
    res.json(mappedLeaderData);
  } catch (err) {
    console.error('Leaderboard aggregation error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
