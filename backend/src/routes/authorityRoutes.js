const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Get authority performance stats
// @route   GET /api/authority/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);

    // 1. Department Stats via Aggregation
    const deptStats = await Complaint.aggregate([
      {
        $facet: {
          // General counts per category
          "counts": [
            {
              $group: {
                _id: "$category",
                total: { $sum: 1 },
                resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
                inProgress: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
                pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } }
              }
            }
          ],
          // Resolution time calculation
          "resolutionTimes": [
            { $match: { status: "Resolved" } },
            { $unwind: "$timeline" },
            { $match: { "timeline.status": "Resolved" } },
            {
              $project: {
                category: 1,
                resolutionTimeHours: {
                  $divide: [
                    { $subtract: ["$timeline.timestamp", "$createdAt"] },
                    1000 * 60 * 60
                  ]
                }
              }
            },
            {
              $group: {
                _id: "$category",
                avgSLA: { $avg: "$resolutionTimeHours" },
                fastResolutions: {
                  $sum: { $cond: [{ $lte: ["$resolutionTimeHours", 48] }, 1, 0] }
                },
                count: { $sum: 1 }
              }
            }
          ],
          // Monthly trends (Global)
          "globalTrends": [
            { $match: { status: "Resolved", updatedAt: { $gte: sixtyDaysAgo } } },
            {
              $group: {
                _id: { $month: "$updatedAt" },
                count: { $sum: 1 },
                monthName: { $first: { $dateToString: { format: "%b", date: "$updatedAt" } } }
              }
            },
            { $sort: { "_id": 1 } }
          ]
        }
      }
    ]);

    const stats = deptStats[0].counts.map(dept => {
      const resTime = deptStats[0].resolutionTimes.find(rt => rt._id === dept._id) || { avgSLA: 0, fastResolutions: 0, count: 0 };
      
      const resolutionRate = dept.total > 0 ? Math.round((dept.resolved / dept.total) * 100) : 0;
      const efficiencyScore = resTime.count > 0 ? Math.round((resTime.fastResolutions / resTime.count) * 100) : 0;

      return {
        department: dept._id,
        total: dept.total,
        resolved: dept.resolved,
        inProgress: dept.inProgress,
        pending: dept.pending,
        resolutionRate,
        efficiencyScore,
        avgSLA: resTime.avgSLA ? parseFloat(resTime.avgSLA.toFixed(1)) : 0,
        trends: [] // We'll handle trends separately if needed, or simplified
      };
    });

    // 2. Weekly Delta & Summary
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const allComplaints = await Complaint.find().select('status updatedAt pincode');
    const resolvedLastWeek = allComplaints.filter(c => c.status === 'Resolved' && c.updatedAt >= oneWeekAgo).length;

    // 3. Most Improved Areas
    const distinctPincodes = [...new Set(allComplaints.map(c => c.pincode).filter(Boolean))];
    const areaImprovements = distinctPincodes.map(pin => {
      const pinComplaints = allComplaints.filter(c => c.pincode === pin);
      const recent = pinComplaints.filter(c => c.updatedAt >= thirtyDaysAgo);
      const recentResolved = recent.filter(c => c.status === 'Resolved').length;
      const recentRate = recent.length > 0 ? (recentResolved / recent.length) * 100 : 0;

      const previous = pinComplaints.filter(c => c.updatedAt >= sixtyDaysAgo && c.updatedAt < thirtyDaysAgo);
      const previousResolved = previous.filter(c => c.status === 'Resolved').length;
      const previousRate = previous.length > 0 ? (previousResolved / previous.length) * 100 : 0;

      return {
        pincode: pin,
        delta: Math.round(recentRate - previousRate),
        currentRate: Math.round(recentRate)
      };
    }).sort((a, b) => b.delta - a.delta).slice(0, 3);

    const leaderboard = [...stats].sort((a, b) => b.resolutionRate - a.resolutionRate);

    res.json({
      summary: {
        totalComplaints: allComplaints.length,
        totalResolved: allComplaints.filter(c => c.status === 'Resolved').length,
        overallResolutionRate: allComplaints.length > 0 ? Math.round((allComplaints.filter(c => c.status === 'Resolved').length / allComplaints.length) * 100) : 0,
        resolvedLastWeek,
        monthlyTrends: deptStats[0].globalTrends.map(t => ({ month: t.monthName, resolved: t.count })),
        mostImprovedAreas: areaImprovements
      },
      departmentStats: stats,
      leaderboard
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// @desc    Get top contributors (Wall of Fame)
// @route   GET /api/authority/wall-of-fame
// @access  Public
router.get('/wall-of-fame', async (req, res) => {
  try {
    const User = require('../models/User');
    const topUsers = await User.find()
      .select('name points level badges')
      .sort({ points: -1 })
      .limit(5);
      
    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get areas needing attention (based on high upvotes and pending status)
// @route   GET /api/authority/needs-attention
// @access  Public
router.get('/needs-attention', async (req, res) => {
  try {
    const criticalIssues = await Complaint.find({ status: 'Pending' })
      .sort({ priorityScore: -1 })
      .limit(5);
      
    res.json(criticalIssues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get public activity feed (Resolutions, Trending, Milestones)
// @route   GET /api/authority/activity-feed
// @access  Public
router.get('/activity-feed', async (req, res) => {
  try {
    const User = require('../models/User');

    const { lat, lon } = req.query;

    // 1. Recent Resolutions
    const recentResolutions = await Complaint.find({ status: 'Resolved' })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title pincode updatedAt category');

    // 2. Nearby Updates (if location provided)
    let nearbyUpdates = [];
    if (lat && lon) {
      nearbyUpdates = await Complaint.find({
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lon), parseFloat(lat)] },
            $maxDistance: 5000 // 5km
          }
        }
      })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title status updatedAt category');
    }

    // 2. Trending Civic Issues (High Priority, not yet resolved)
    const trendingIssues = await Complaint.find({ status: { $ne: 'Resolved' } })
      .sort({ priorityScore: -1 })
      .limit(5)
      .select('title upvotes priorityScore category pincode');

    // 3. Community Milestones (Dynamic calculations)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const resolvedThisMonth = await Complaint.countDocuments({ 
      status: 'Resolved',
      'timeline.status': 'Resolved',
      'timeline.timestamp': { $gte: thirtyDaysAgo }
    });

    const totalPoints = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);

    const activeUsersCount = await User.countDocuments({
      updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      recentResolutions,
      trendingIssues,
      nearbyUpdates,
      milestones: {
        resolvedThisMonth,
        communityXP: totalPoints[0]?.total || 0,
        activeCitizens: activeUsersCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
