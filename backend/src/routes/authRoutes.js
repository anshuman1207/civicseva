const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const { ValidationError, UnauthorizedError, AppError } = require('../utils/errorUtils');
const Complaint = require('../models/Complaint');
const Comment = require('../models/Comment');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  
  res.status(statusCode).cookie('token', token, options).json({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new ValidationError('Please add all fields (name, email, password)');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new ValidationError('User with this email already exists');
  }

  // Create user - Force role to 'user' for public registration to prevent spoofing
  const user = await User.create({
    name,
    email,
    password, // Pre-save hook handles hashing
    role: 'user', // Secure default
  });

  if (user) {
    sendTokenResponse(user, 201, res);
  } else {
    throw new AppError('Invalid user data received', 400);
  }
}));

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  // Check for user email
  const user = await User.findOne({ email });

  if (!user) {
    console.log(`Login failed: User not found with email ${email}`);
    throw new UnauthorizedError('Invalid email or password');
  }

  const isMatch = await user.matchPassword(password);
  
  if (isMatch) {
    console.log(`Login successful for ${email}`);
    sendTokenResponse(user, 200, res);
  } else {
    console.log(`Login failed: Incorrect password for ${email}`);
    // Optional: Check if password was plain text in DB (emergency check)
    if (user.password === password) {
       console.warn(`WARNING: User ${email} has a PLAIN TEXT password in database! Fixing now...`);
       user.password = password; // Will be hashed by pre-save hook
       await user.save();
       
       // Allow login after fixing
       return sendTokenResponse(user, 200, res);
    }
    throw new UnauthorizedError('Invalid email or password');
  }
}));

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Calculate gamification stats
  const userComplaints = await Complaint.find({ user: req.user.id });
  const userComments = await Comment.countDocuments({ userId: req.user.id });
  const userVerifications = await Complaint.countDocuments({ verifications: req.user.id });
  
  const reports = userComplaints.length;
  const resolved = userComplaints.filter(c => c.status === 'Resolved').length;
  const upvotes = userComplaints.reduce((acc, curr) => acc + (curr.upvotes || 0), 0);
  const streak = user.currentStreak || 0;
  const comments = userComments;
  const verifications = userVerifications;
  
  const { calculateImpactScore } = require('../utils/impactEngine');

  // Calculate category breakdown for weighted impact
  const categoryBreakdown = userComplaints.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});

  const impactScore = calculateImpactScore({
    reports,
    resolved,
    upvotes,
    streak,
    verifications,
    comments,
    categoryBreakdown
  }, user.level);

  // Badge System Checks
  let updated = false;

  // Optimized Badge awarding logic
  const checkBadge = async (name, desc, icon, condition) => {
    if (condition) {
      return await user.awardBadge(name, desc, icon);
    }
    return false;
  };

  updated = await checkBadge("Civic Pioneer", "Reported your first issue", "Flag", reports >= 1) || updated;
  updated = await checkBadge("Active Citizen", "Reported 10 civic issues", "Flag", reports >= 10) || updated;
  updated = await checkBadge("Master Reporter", "A pillar of civic reporting with 25 reports", "Award", reports >= 25) || updated;
  updated = await checkBadge("Civic Architect", "A legendary 50 reports filed", "Award", reports >= 50) || updated;

  updated = await checkBadge("Problem Solver", "Got your first issue resolved", "CheckCircle", resolved >= 1) || updated;
  updated = await checkBadge("Impact Maker", "Successfully helped resolve 5 issues", "Target", resolved >= 5) || updated;
  updated = await checkBadge("Civic Hero", "A legendary status with 15 resolved issues", "Award", resolved >= 15) || updated;
  updated = await checkBadge("City Guardian", "A staggering 30 resolutions credited to you", "Shield", resolved >= 30) || updated;

  updated = await checkBadge("Community Voice", "Received 10 upvotes on your reports", "Mic", upvotes >= 10) || updated;
  updated = await checkBadge("Civic Leader", "Reports trusted and upvoted 50 times", "Star", upvotes >= 50) || updated;
  updated = await checkBadge("Bridge Builder", "Active in 10 civic discussions", "MessageSquare", comments >= 10) || updated;
  updated = await checkBadge("Fact Checker", "Verified 10 reports by fellow citizens", "CheckCircle", verifications >= 10) || updated;

  // Challenges System
  const roadReports = userComplaints.filter(c => c.category === 'Roads').length;
  const defaultChallenges = [
    { title: "Civic Starter", description: "Report 3 issues", target: 3, progress: reports, isCompleted: reports >= 3, xpReward: 50 },
    { title: "Community Supporter", description: "Get 5 upvotes", target: 5, progress: upvotes, isCompleted: upvotes >= 5, xpReward: 50 },
    { title: "Verification Expert", description: "Verify 5 nearby complaints", target: 5, progress: verifications, isCompleted: verifications >= 5, xpReward: 75 },
    { title: "Road Guardian", description: "Report 3 road hazards", target: 3, progress: roadReports, isCompleted: roadReports >= 3, xpReward: 60 }
  ];

  if (!user.challenges || user.challenges.length === 0) {
    user.challenges = defaultChallenges;
    updated = true;
  } else {
    // Progress updates
    user.challenges.forEach(challenge => {
      if (!challenge.isCompleted) {
        let oldProgress = challenge.progress;
        if (challenge.title === "Civic Starter") challenge.progress = Math.min(challenge.target, reports);
        if (challenge.title === "Community Supporter") challenge.progress = Math.min(challenge.target, upvotes);
        if (challenge.title === "Verification Expert") challenge.progress = Math.min(challenge.target, verifications);
        if (challenge.title === "Road Guardian") challenge.progress = Math.min(challenge.target, roadReports);

        if (challenge.progress !== oldProgress) updated = true;
        if (challenge.progress >= challenge.target) {
           challenge.isCompleted = true;
           user.points += challenge.xpReward;
           updated = true;
        }
      }
    });
  }

  if (updated) {
    await user.save();
  }

  res.json({
    ...user.toObject(),
    stats: { reports, resolved, upvotes, streak, impactScore, verifications, comments }
  });
}));

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, asyncHandler(async (req, res) => {
  const BlacklistedToken = require('../models/BlacklistedToken');
  
  // Extract token from request (attached by protect middleware)
  const token = req.token;
  
  if (token) {
    // Decode token to get expiration time
    const decoded = jwt.decode(token);
    
    // Blacklist the token until it would have naturally expired
    await BlacklistedToken.create({
      token,
      expiresAt: new Date(decoded.exp * 1000)
    });
  }

  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.json({ message: 'Successfully logged out and session invalidated' });
}));


module.exports = router;

