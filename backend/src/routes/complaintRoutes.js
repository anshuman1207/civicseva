const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Vote = require('../models/Vote');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');
const { complaintLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');
const asyncHandler = require('../middleware/asyncHandler');
const { suggestCategory } = require('../services/aiService');
const { checkAndAwardBadges } = require('../services/badgeService');
const { ValidationError, NotFoundError, UnauthorizedError } = require('../utils/errorUtils');

// Haversine formula to calculate distance between two coordinates in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const toRadians = (deg) => (deg * Math.PI) / 180;
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

// Helper function for priority score
// Helper function for priority score with Reputation Weighting
const calculatePriorityScore = (upvotes, category, userLevel = 'Beginner') => {
  const getCategoryWeight = (cat) => {
    if (cat === 'Roads' || cat === 'Water') return 8;
    if (cat === 'Garbage' || cat === 'Electricity') return 6;
    return 3; // Others
  };

  const getLevelWeight = (level) => {
    switch (level) {
      case 'Contributor': return 1.2;
      case 'Leader': return 1.5;
      case 'Civic Champion': return 2.0;
      default: return 1.0;
    }
  };

  const baseScore = (upvotes * 2) + getCategoryWeight(category);
  return Math.floor(baseScore * getLevelWeight(userLevel));
};

// @desc    Get all complaints (supports sorting, filtering, and pagination)
// @route   GET /api/complaints?sortBy=priority&page=1&limit=10&status=All&search=
router.get('/', asyncHandler(async (req, res) => {
  const { sortBy, page = 1, limit = 20, status, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Sorting logic
  let sortQuery = { createdAt: -1 };
  if (sortBy === 'priority') {
    sortQuery = { priorityScore: -1, createdAt: -1 };
  } else if (sortBy === 'oldest') {
    sortQuery = { createdAt: 1 };
  } else if (sortBy === 'upvotes') {
    sortQuery = { upvotes: -1, createdAt: -1 };
  }

  // Filtering logic
  let filterQuery = {};
  if (status && status !== 'All') {
    filterQuery.status = status;
  }
  
  let searchMatch = {};
  if (search) {
    searchMatch = {
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ]
    };
    filterQuery = { ...filterQuery, ...searchMatch };
  }

  // Get aggregated counts for badges (ignores status filter, but applies search)
  const countAgg = await Complaint.aggregate([
    { $match: searchMatch },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  let counts = { All: 0, Pending: 0, 'In Progress': 0, Resolved: 0 };
  countAgg.forEach(c => {
    if (counts[c._id] !== undefined) {
      counts[c._id] = c.count;
      counts.All += c.count;
    }
  });

  const total = await Complaint.countDocuments(filterQuery);
  
  // Query Optimization: Select only necessary fields
  const complaints = await Complaint.find(filterQuery)
    .select('title category status city pincode photo location user priorityScore upvotes createdAt timeline followers verifications')
    .sort(sortQuery)
    .skip(skip)
    .limit(parseInt(limit))
    .lean(); // Faster execution by returning plain JS objects
  
  res.json({
    complaints,
    counts,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      limit: parseInt(limit)
    }
  });
}));

// @desc    Get complaints within a radius (meters)
// @route   GET /api/complaints/nearby?lon=...&lat=...&radius=...
router.get('/nearby', async (req, res) => {
  const { lon, lat, radius } = req.query;

  if (!lon || !lat) {
    return res.status(400).json({ message: 'Longitude and Latitude are required' });
  }

  try {
    const complaints = await Complaint.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lon), parseFloat(lat)] },
          $maxDistance: parseInt(radius) || 1000 // default 1km
        }
      }
    });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Create a new complaint (with optional image)
// @route   POST /api/complaints
router.post('/', complaintLimiter, optionalAuth, upload.single('photo'), asyncHandler(async (req, res) => {
    // Defensive check to avoid destructuring error if body is missing
    const { title, description, category, longitude, latitude, city, pincode } = req.body || {};

    if (!title || !description || !longitude || !latitude || !city || !pincode) {
      throw new ValidationError('Please provide all required fields: title, description, longitude, latitude, city, and pincode.');
    }

    // Backend validation for pincode (must be exactly 6 digits)
    if (!/^\d{6}$/.test(pincode)) {
      throw new ValidationError('Invalid Pincode. Pincode must be exactly 6 digits.');
    }

    // Basic Kolkata Validation
    const lon = parseFloat(longitude);
    const lat = parseFloat(latitude);

    // AI Category Detection
    let finalCategory = category;
    if (!category || category === 'Others') {
      finalCategory = suggestCategory(title, description);
    }

    // --- STEP 1: DUPLICATE DETECTION LOGIC (Optimized Geo-Spatial Query) ---
    // Check for complaints within 200m of same category using MongoDB's $near
    const duplicate = await Complaint.findOne({
      category: finalCategory,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lon, lat] },
          $maxDistance: 200 // 200 meters threshold
        }
      }
    });

    if (duplicate) {
      // Check if it's the SAME user reporting the SAME thing within 5 minutes (Spam/Duplicate Click)
      const isVeryRecent = (new Date() - new Date(duplicate.createdAt)) < 5 * 60 * 1000;
      if (isVeryRecent && req.user && duplicate.user && duplicate.user.toString() === req.user._id.toString()) {
        throw new ValidationError('You just reported this issue a moment ago. Duplicate request blocked.');
      }
      
      throw new ValidationError('A similar issue has already been reported nearby. Please upvote the existing issue instead of creating a duplicate.');
    }

    // ------------------------------------------

    const complaint = new Complaint({
      title,
      description,
      category: finalCategory,
      city,
      pincode,
      photo: req.file ? `/uploads/${req.file.filename}` : null,
      location: {
        type: 'Point',
        coordinates: [lon, lat]
      },
      user: req.user ? req.user._id : undefined,
      priorityScore: calculatePriorityScore(0, finalCategory, req.user ? req.user.level : 'Beginner'),
      timeline: [{
        status: 'Pending',
        message: 'Complaint reported by citizen.',
        actor: 'Citizen'
      }]
    });

    const savedComplaint = await complaint.save();

    // Emit newComplaint event to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('newComplaint', savedComplaint);
      
      // Create activity
      if (req.user) {
        const activity = await Activity.create({
          user: req.user._id,
          userName: req.user.name,
          type: 'complaint_created',
          complaint: savedComplaint._id,
          complaintTitle: savedComplaint.title
        });
        io.emit('newActivity', {
          ...activity.toObject(),
          userName: req.user.name,
          action: 'reported a new issue'
        });
      }
    }

    // GAMIFICATION: Award points to user if authenticated
    if (req.user) {
      await req.user.addPoints(10);
      await req.user.updateActivityStreak();
      await checkAndAwardBadges(req.user, 'REPORT_CREATED');
    }

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint: savedComplaint
    });
}));

// @desc    Update complaint status (Admin/Authority)
// @route   PATCH /api/complaints/:id/status
router.patch('/:id/status', protect, authorize('admin', 'authority'), asyncHandler(async (req, res) => {
  let { status, message, isMilestone } = req.body;
  
  // Normalize input (e.g., "in progress" -> "In Progress")
  if (status) {
    status = status.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  // Validate status
  const validStatuses = ['Pending', 'In Progress', 'Resolved'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError('Invalid status value. Use "Pending", "In Progress", or "Resolved".');
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    throw new NotFoundError('Complaint');
  }

  const wasResolved = complaint.status === 'Resolved';
  complaint.status = status;
  
  // Add timeline entry
  complaint.timeline.push({
    status: status,
    message: message || `Status updated to ${status}.`,
    actor: 'Authority',
    isMilestone: !!isMilestone
  });

  const updatedComplaint = await complaint.save();

  // If newly resolved, award points and badges to the reporter
  if (status === 'Resolved' && !wasResolved && updatedComplaint.user) {
    const reporter = await User.findById(updatedComplaint.user);
    if (reporter) {
      // Awarding 50 points (High reward for resolution)
      await reporter.addPoints(50);
      await checkAndAwardBadges(reporter, 'ISSUE_RESOLVED');
      
      // Notify reporter
      await Notification.create({
        recipient: reporter._id,
        title: 'Issue Resolved!',
        message: `Your report "${updatedComplaint.title}" has been marked as resolved. You earned 50 points!`,
        type: 'status_change'
      });
    }
  }

  // Notify followers of status change
  if (updatedComplaint.followers && updatedComplaint.followers.length > 0) {
    const notifications = updatedComplaint.followers.map(followerId => ({
      recipient: followerId,
      sender: req.user._id,
      type: 'status_change',
      complaint: updatedComplaint._id,
      message: `The issue "${updatedComplaint.title}" is now ${updatedComplaint.status}.`
    }));
    await Notification.insertMany(notifications);
  }

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.emit('statusUpdate', { 
      id: updatedComplaint._id, 
      status: updatedComplaint.status,
      timeline: updatedComplaint.timeline 
    });
  }

  res.json(updatedComplaint);
}));

// @desc    Toggle upvote for a complaint
// @route   POST /api/complaints/:id/upvote
router.post('/:id/upvote', protect, async (req, res) => {
  try {
    const complaintId = req.params.id;
    const userId = req.user._id;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check if vote exists
    const existingVote = await Vote.findOne({ complaintId, userId });

    if (existingVote) {
      // Remove vote
      await Vote.findByIdAndDelete(existingVote._id);
      complaint.upvotes = Math.max(0, complaint.upvotes - 1);
      // Recalculate with original owner's level or current user as proxy
      complaint.priorityScore = calculatePriorityScore(
        complaint.upvotes, 
        complaint.category, 
        req.user ? req.user.level : 'Beginner'
      );
      await complaint.save();
      
      const io = req.app.get('io');
      if (io) {
        io.emit('upvoteUpdate', {
          id: complaint._id,
          upvotes: complaint.upvotes,
          priorityScore: complaint.priorityScore
        });
      }

      return res.status(200).json({ message: 'Upvote removed', upvotes: complaint.upvotes });
    } else {
      // Add vote
      await Vote.create({ complaintId, userId });
      complaint.upvotes += 1;
      // Reputation Weighting: Voter's level influences the priority score increase
      complaint.priorityScore = calculatePriorityScore(
        complaint.upvotes, 
        complaint.category,
        req.user ? req.user.level : 'Beginner'
      );
      await complaint.save();
      
      const io = req.app.get('io');
      if (io) {
        io.emit('upvoteUpdate', {
          id: complaint._id,
          upvotes: complaint.upvotes,
          priorityScore: complaint.priorityScore
        });

        // Create activity
        await Activity.create({
          user: req.user._id,
          userName: req.user.name,
          type: 'upvote_added',
          complaint: complaint._id,
          complaintTitle: complaint.title
        });
        io.emit('newActivity', {
          user: req.user.name,
          type: 'upvote_added',
          complaintTitle: complaint.title,
          time: new Date()
        });

        // Notify owner
        if (complaint.user && complaint.user.toString() !== req.user._id.toString()) {
          await Notification.create({
            recipient: complaint.user,
            sender: req.user._id,
            type: 'upvote',
            complaint: complaint._id,
            message: `${req.user.name} upvoted your issue: "${complaint.title}".`
          });
        }
      }

      await req.user.updateActivityStreak();
      await checkAndAwardBadges(req.user, 'UPVOTE_GIVEN');
      if (complaint.user) {
        const owner = await User.findById(complaint.user);
        if (owner) {
          await owner.addPoints(2);
        }
      }

      return res.status(200).json({ message: 'Upvote added', upvotes: complaint.upvotes });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get upvote count
// @route   GET /api/complaints/:id/upvotes
router.get('/:id/upvotes', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.json({ upvotes: complaint.upvotes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Delete a complaint (Bonus)
// @route   DELETE /api/complaints/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    await Complaint.findByIdAndDelete(req.params.id);
    // Note: In a real app we might also want to delete associated votes/comments
    await Vote.deleteMany({ complaintId: req.params.id });
    await Comment.deleteMany({ complaintId: req.params.id });
    
    res.json({ message: 'Complaint deleted completely' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Add a comment to a complaint
// @route   POST /api/complaints/:id/comments
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { text, parentCommentId } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const comment = await Comment.create({
      complaintId: req.params.id,
      userId: req.user._id,
      text,
      parentCommentId: parentCommentId || null
    });

    const populatedComment = await Comment.findById(comment._id).populate('userId', 'name');
    
    // Emit real-time comment update to connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('newComment', {
        complaintId: req.params.id,
        comment: populatedComment
      });

      // Create activity
      await Activity.create({
        user: req.user._id,
        userName: req.user.name,
        type: 'comment_added',
        complaint: complaint._id,
        complaintTitle: complaint.title
      });
      io.emit('newActivity', {
        user: req.user.name,
        type: 'comment_added',
        complaintTitle: complaint.title,
        time: new Date()
      });

      // Create notifications for owner and followers (excluding the commenter)
      const notifyIds = new Set();
      if (complaint.user && complaint.user.toString() !== req.user._id.toString()) {
        notifyIds.add(complaint.user.toString());
      }
      if (complaint.followers) {
        complaint.followers.forEach(f => {
          if (f.toString() !== req.user._id.toString()) notifyIds.add(f.toString());
        });
      }

      if (notifyIds.size > 0) {
        const notifications = Array.from(notifyIds).map(recipientId => ({
          recipient: recipientId,
          sender: req.user._id,
          type: 'comment',
          complaint: complaint._id,
          message: `${req.user.name} commented on "${complaint.title}".`
        }));
        await Notification.insertMany(notifications);
      }
    }
    
    // GAMIFICATION: Award points for commenting
    await req.user.addPoints(2);
    await req.user.updateActivityStreak();
    
    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get comments for a complaint
// @route   GET /api/complaints/:id/comments
router.get('/:id/comments', async (req, res) => {
  try {
    // Only return non-deleted comments, sorted by oldest first for threading
    const comments = await Comment.find({ complaintId: req.params.id, deleted: false })
      .populate('userId', 'name')
      .sort({ createdAt: 1 });
    
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Toggle follow status for a complaint
// @route   POST /api/complaints/:id/follow
// @access  Private
router.post('/:id/follow', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const userId = req.user._id;
    const isFollowing = complaint.followers && complaint.followers.includes(userId);

    if (isFollowing) {
      complaint.followers.pull(userId);
    } else {
      if (!complaint.followers) complaint.followers = [];
      complaint.followers.push(userId);
    }

    await complaint.save();

    // Emit real-time follow update
    const io = req.app.get('io');
    if (io) {
      io.emit('followUpdate', { id: complaint._id, followers: complaint.followers });

      if (!isFollowing) {
        // Notify owner
        if (complaint.user && complaint.user.toString() !== req.user._id.toString()) {
          await Notification.create({
            recipient: complaint.user,
            sender: req.user._id,
            type: 'follow',
            complaint: complaint._id,
            message: `${req.user.name} started following your issue: "${complaint.title}".`
          });
        }
      }
    }

    res.json({ message: isFollowing ? 'Unfollowed' : 'Followed', followers: complaint.followers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Toggle verification status for a complaint
// @route   POST /api/complaints/:id/verify
// @access  Private
router.post('/:id/verify', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Users can't verify their own complaints
    if (complaint.user && complaint.user.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot verify your own complaint' });
    }

    const userId = req.user._id;
    const isVerified = complaint.verifications && complaint.verifications.includes(userId);

    if (isVerified) {
      complaint.verifications.pull(userId);
    } else {
      if (!complaint.verifications) complaint.verifications = [];
      complaint.verifications.push(userId);
      // GAMIFICATION: Award points for verifying
      await req.user.addPoints(3);
      await req.user.updateActivityStreak();
      await checkAndAwardBadges(req.user, 'VERIFIED');
    }

    await complaint.save();

    // Emit real-time verification update
    const io = req.app.get('io');
    if (io) {
      io.emit('verifyUpdate', { id: complaint._id, verifications: complaint.verifications });
      
      if (!isVerified) {
        // Create activity for verification
        await Activity.create({
          user: req.user._id,
          userName: req.user.name,
          type: 'verified',
          complaint: complaint._id,
          complaintTitle: complaint.title
        });
        io.emit('newActivity', {
          user: req.user.name,
          type: 'verified',
          complaintTitle: complaint.title,
          time: new Date()
        });

        // Notify owner
        if (complaint.user && complaint.user.toString() !== req.user._id.toString()) {
          await Notification.create({
            recipient: complaint.user,
            sender: req.user._id,
            type: 'verification',
            complaint: complaint._id,
            message: `${req.user.name} verified your report: "${complaint.title}".`
          });
        }

        // --- STEP 3A.4 Milestone: Community Verification Badge ---
        const VERIFICATION_THRESHOLD = 3; // Should match frontend
        if (complaint.verifications.length === VERIFICATION_THRESHOLD) {
          // Platform milestone activity
          await Activity.create({
            user: null, // System/Community event
            userName: 'Community',
            type: 'milestone',
            complaint: complaint._id,
            complaintTitle: complaint.title,
            metadata: { milestone: 'Community Verified' }
          });
          io.emit('newActivity', {
            user: 'Community',
            type: 'milestone',
            complaintTitle: complaint.title,
            action: 'has been community-verified!',
            time: new Date()
          });
        }
      }
    }

    res.json({ message: isVerified ? 'Verification removed' : 'Verified', verifications: complaint.verifications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
