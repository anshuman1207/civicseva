const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const upload = require('../middleware/upload');
const { suggestCategory } = require('../services/aiService');

// @desc    Get all complaints (supports optional sorting by priority)
// @route   GET /api/complaints?sortBy=priority
router.get('/', async (req, res) => {
  const { sortBy } = req.query;

  try {
    let complaints = await Complaint.find();

    if (sortBy === 'priority') {
      // Sort in-memory based on Impact Score formula: (Upvotes * 2) + CategoryWeight
      complaints = complaints.sort((a, b) => {
        const getWeight = (cat) => {
          if (['Electricity', 'Water'].includes(cat)) return 10; // Safety/Hazard
          if (cat === 'Roads') return 7; // Infrastructure
          return 4; // Cleanliness / Others
        };

        const scoreA = (a.upvotes * 2) + getWeight(a.category);
        const scoreB = (b.upvotes * 2) + getWeight(b.category);
        return scoreB - scoreA; // Highest priority first
      });
    } else {
      // Default: Most recent first
      complaints = complaints.sort((a, b) => b.createdAt - a.createdAt);
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
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    // Defensive check to avoid destructuring error if body is missing
    const { title, description, category, longitude, latitude } = req.body || {};

    if (!title || !description || !longitude || !latitude) {
      return res.status(400).json({ 
        message: 'Please provide all required fields: title, description, longitude, and latitude.' 
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

    // --- STEP 9: DUPLICATE DETECTION LOGIC ---
    // Check for complaints within 100m of same category
    const existingDuplicate = await Complaint.findOne({
      category: finalCategory,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lon, lat] },
          $maxDistance: 100 // 100 meters radius
        }
      }
    });

    if (existingDuplicate) {
      // Logic: Instead of creating a NEW one, we increment upvotes of the existing one
      existingDuplicate.upvotes += 1;
      await existingDuplicate.save();
      
      return res.status(200).json({ 
        message: 'A similar issue was already reported nearby. We have added your upvote to it!',
        complaint: existingDuplicate,
        isDuplicate: true
      });
    }
    // ------------------------------------------

    const complaint = new Complaint({
      title,
      description,
      category: finalCategory,
      photo: req.file ? `/uploads/${req.file.filename}` : null,
      location: {
        type: 'Point',
        coordinates: [lon, lat]
      }
    });

    const newComplaint = await complaint.save();
    res.status(201).json(newComplaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Update complaint status (Admin/Authority)
// @route   PATCH /api/complaints/:id/status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  
  // Validate status
  const validStatuses = ['Pending', 'In Progress', 'Resolved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
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

    res.json(updatedComplaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
