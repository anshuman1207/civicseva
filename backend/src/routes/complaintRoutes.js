const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Vote = require('../models/Vote');
const Comment = require('../models/Comment');
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { suggestCategory } = require('../services/aiService');

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
const calculatePriorityScore = (upvotes, category) => {
  const getWeight = (cat) => {
    if (cat === 'Roads' || cat === 'Water') return 5;
    if (cat === 'Garbage' || cat === 'Electricity') return 4;
    return 2; // Others
  };
  return (upvotes * 2) + getWeight(category);
};

// @desc    Get all complaints (supports optional sorting by priority)
// @route   GET /api/complaints?sortBy=priority
router.get('/', async (req, res) => {
  const { sortBy } = req.query;

  try {
    let complaints;
    if (sortBy === 'priority') {
      // Sort database by priorityScore descending
      complaints = await Complaint.find().sort({ priorityScore: -1 });
    } else {
      // Default: Most recent first
      complaints = await Complaint.find().sort({ createdAt: -1 });
    }
    
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
router.post('/', optionalAuth, upload.single('photo'), async (req, res) => {
  try {
    // Defensive check to avoid destructuring error if body is missing
    const { title, description, category, longitude, latitude, city, pincode } = req.body || {};

    if (!title || !description || !longitude || !latitude || !city || !pincode) {
      return res.status(400).json({ 
        message: 'Please provide all required fields: title, description, longitude, latitude, city, and pincode.' 
      });
    }

    // Backend validation for pincode (must be exactly 6 digits)
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        message: 'Invalid Pincode. Pincode must be exactly 6 digits.'
      });
    }

    // Basic Kolkata Validation
    const lon = parseFloat(longitude);
    const lat = parseFloat(latitude);

    // AI Category Detection
    let finalCategory = category;
    if (!category || category === 'Others') {
      finalCategory = suggestCategory(title, description);
    }

    // --- STEP 1: DUPLICATE DETECTION LOGIC (Haversine Formula) ---
    // Check for complaints within 200m of same category
    
    // First, fetch complaints of the same category (can be optimized further to be near bounding box, but we'll fetch then filter)
    // To avoid fetching all, we use a basic $near query for a larger radius, then manual Haversine filter
    const nearbyComplaints = await Complaint.find({
      category: finalCategory,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lon, lat] },
          $maxDistance: 1000 // get within 1km first
        }
      }
    });

    let existingDuplicate = null;
    for (const comp of nearbyComplaints) {
      if (comp.location && comp.location.coordinates && comp.location.coordinates.length === 2) {
        const compLon = comp.location.coordinates[0];
        const compLat = comp.location.coordinates[1];
        const distance = calculateDistance(lat, lon, compLat, compLon);
        
        if (distance <= 200) { // 200 meters radius
          existingDuplicate = comp;
          break;
        }
      }
    }

    if (existingDuplicate) {
      // Logic: Instead of creating a NEW one, we increment upvotes of the existing one
      existingDuplicate.upvotes += 1;
      existingDuplicate.priorityScore = calculatePriorityScore(existingDuplicate.upvotes, existingDuplicate.category);
      await existingDuplicate.save();
      
      return res.status(200).json({ 
        message: 'A similar issue was already reported within 200m. We have added your upvote to it!',
        complaint: existingDuplicate,
        isDuplicate: true
      });
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
      priorityScore: calculatePriorityScore(0, finalCategory)
    });

    const savedComplaint = await complaint.save();

    // GAMIFICATION: Award points to user if authenticated
    if (req.user) {
      await req.user.addPoints(10);
    }

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint: savedComplaint
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Update complaint status (Admin/Authority)
// @route   PATCH /api/complaints/:id/status
router.patch('/:id/status', protect, admin, async (req, res) => {
  let { status } = req.body;
  
  // Normalize input (e.g., "in progress" -> "In Progress")
  if (status) {
    status = status.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  // Validate status
  const validStatuses = ['Pending', 'In Progress', 'Resolved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value. Use "Pending", "In Progress", or "Resolved".' });
  }

  try {
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true } // Returns the modified document rather than the original
    );

    if (!updatedComplaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Emit real-time status update to connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('statusUpdate', {
        id: updatedComplaint._id,
        status: updatedComplaint.status
      });
    }

    res.json(updatedComplaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
      complaint.priorityScore = calculatePriorityScore(complaint.upvotes, complaint.category);
      await complaint.save();
      return res.status(200).json({ message: 'Upvote removed', upvotes: complaint.upvotes });
    } else {
      // Add vote
      await Vote.create({ complaintId, userId });
      complaint.upvotes += 1;
      complaint.priorityScore = calculatePriorityScore(complaint.upvotes, complaint.category);
      await complaint.save();
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
    const { text } = req.body;
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
      text
    });

    const populatedComment = await Comment.findById(comment._id).populate('userId', 'name');
    
    // GAMIFICATION: Award points for commenting
    await req.user.addPoints(2);
    
    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get comments for a complaint
// @route   GET /api/complaints/:id/comments
router.get('/:id/comments', async (req, res) => {
  try {
    // Only return non-deleted comments, sorted by newest first (or oldest first, up to preference)
    const comments = await Comment.find({ complaintId: req.params.id, deleted: false })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
