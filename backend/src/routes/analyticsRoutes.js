const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get Advanced Insights (Phase 3D.1)
// @route   GET /api/analytics/insights
// @access  Public
router.get('/insights', async (req, res) => {
    try {
        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);

        // 1. Resolution Trends (Monthly)
        const resolutionTrends = await Complaint.aggregate([
            { $match: { updatedAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$updatedAt" },
                        month: { $month: "$updatedAt" },
                        status: "$status"
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // 2. Participation Analytics (User engagement over time)
        const participation = await User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    newUsers: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        res.json({
            resolutionTrends,
            participation
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Area Health Index (Phase 3D.2)
// @route   GET /api/analytics/area-health
// @access  Public
router.get('/area-health', async (req, res) => {
    try {
        const areaStats = await Complaint.aggregate([
            {
                $group: {
                    _id: "$pincode",
                    totalComplaints: { $sum: 1 },
                    resolvedCount: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
                    garbageComplaints: {
                        $sum: {
                            $cond: [
                                { $in: ["$category", ["Garbage", "Sanitation", "Cleanliness"]] },
                                1, 0
                            ]
                        }
                    },
                    totalUpvotes: { $sum: "$upvotes" }
                }
            },
            {
                $project: {
                    pincode: "$_id",
                    complaintDensity: "$totalComplaints", // Simple density metric
                    responsivenessScore: {
                        $cond: [
                            { $gt: ["$totalComplaints", 0] },
                            { $multiply: [{ $divide: ["$resolvedCount", "$totalComplaints"] }, 100] },
                            0
                        ]
                    },
                    cleanlinessScore: {
                        $cond: [
                            { $gt: ["$totalComplaints", 0] },
                            { $subtract: [100, { $multiply: [{ $divide: ["$garbageComplaints", "$totalComplaints"] }, 100] }] },
                            100
                        ]
                    }
                }
            },
            { $sort: { responsivenessScore: -1 } }
        ]);

        res.json(areaStats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Issue Category Analytics with Growth Trends (Phase 3D.3)
// @route   GET /api/analytics/categories
// @access  Public
router.get('/categories', async (req, res) => {
    try {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Category totals with area correlations
        const categoryData = await Complaint.aggregate([
            {
                $group: {
                    _id: { category: "$category", pincode: "$pincode" },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.category",
                    areas: {
                        $push: {
                            pincode: "$_id.pincode",
                            count: "$count"
                        }
                    },
                    totalCount: { $sum: "$count" }
                }
            },
            { $sort: { totalCount: -1 } }
        ]);

        // Growth trends: this month vs last month per category
        const [thisMonthCounts, lastMonthCounts] = await Promise.all([
            Complaint.aggregate([
                { $match: { createdAt: { $gte: thisMonthStart } } },
                { $group: { _id: "$category", count: { $sum: 1 } } }
            ]),
            Complaint.aggregate([
                { $match: { createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } } },
                { $group: { _id: "$category", count: { $sum: 1 } } }
            ]),
        ]);

        const thisMap = Object.fromEntries(thisMonthCounts.map(c => [c._id, c.count]));
        const lastMap = Object.fromEntries(lastMonthCounts.map(c => [c._id, c.count]));

        // Merge growth data into category results
        const enriched = categoryData.map(cat => {
            const thisCount = thisMap[cat._id] || 0;
            const lastCount = lastMap[cat._id] || 0;
            const growthRate = lastCount > 0
                ? Math.round(((thisCount - lastCount) / lastCount) * 100)
                : (thisCount > 0 ? 100 : 0);

            return {
                ...cat,
                thisMonth: thisCount,
                lastMonth: lastCount,
                growthRate,
            };
        });

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Heatmap Data (Phase 3D.4)
// @route   GET /api/analytics/heatmap
// @access  Public
router.get('/heatmap', async (req, res) => {
    try {
        const heatmapData = await Complaint.find({ status: { $ne: 'Resolved' } })
            .select('location priorityScore category status')
            .limit(1000); // Limit for performance

        const points = heatmapData.map(c => ({
            lat: c.location.coordinates[1],
            lng: c.location.coordinates[0],
            intensity: (c.priorityScore || 1) / 100 // Normalize intensity
        }));

        res.json(points);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
