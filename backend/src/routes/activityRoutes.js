const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');

// @desc    Get global activity feed
// @route   GET /api/activities
router.get('/', async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
