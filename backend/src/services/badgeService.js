const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Vote = require('../models/Vote');

/**
 * Checks and awards badges based on user stats and actions
 */
const checkAndAwardBadges = async (user, type) => {
  let awarded = false;

  switch (type) {
    case 'REPORT_CREATED':
      // 1. First Report Badge
      if (user.badges.length === 0 || !user.badges.some(b => b.name === 'First Responder')) {
        const res = await user.awardBadge(
          'First Responder', 
          'Reported your first civic issue.', 
          'Flag'
        );
        if (res) awarded = true;
      }

      // 2. Issue Master (5 reports)
      const reportCount = await Complaint.countDocuments({ user: user._id });
      if (reportCount >= 5) {
        const res = await user.awardBadge(
          'Issue Master', 
          'Reported 5 or more civic issues.', 
          'Award'
        );
        if (res) awarded = true;
      }
      break;

    case 'UPVOTE_GIVEN':
      // 3. Civic Helper (5 upvotes given)
      const upvoteCount = await Vote.countDocuments({ userId: user._id });
      if (upvoteCount >= 5) {
        const res = await user.awardBadge(
          'Civic Helper', 
          'Gave 5 upvotes to help prioritize issues.', 
          'Zap'
        );
        if (res) awarded = true;
      }
      break;

    case 'VERIFIED':
      // 4. Community Sentry (3 verifications)
      const verificationCount = await Complaint.countDocuments({ verifications: user._id });
      if (verificationCount >= 3) {
        const res = await user.awardBadge(
          'Community Sentry', 
          'Verified 3 or more community issues.', 
          'Shield'
        );
        if (res) awarded = true;
      }
      break;

    case 'ISSUE_RESOLVED':
      // 5. Problem Solver (One of your reports resolved)
      const res = await user.awardBadge(
        'Problem Solver', 
        'Had a reported issue resolved by authorities.', 
        'CheckCircle'
      );
      if (res) awarded = true;
      break;
      
    case 'STREAK_MILESTONE':
      if (user.currentStreak >= 7) {
        const res = await user.awardBadge(
            'Weekly Warrior',
            'Maintained a 7-day activity streak.',
            'Flame'
        );
        if (res) awarded = true;
      }
      break;
  }

  if (awarded) {
    await user.save();
  }

  return awarded;
};

module.exports = { checkAndAwardBadges };
