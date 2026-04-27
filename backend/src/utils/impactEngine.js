/**
 * CivicSeva Impact Score Engine
 * Centralized logic for calculating citizen impact and reputation.
 */

const calculateImpactScore = (stats, level = "Beginner") => {
  const {
    reports = 0,
    resolved = 0,
    upvotes = 0,
    streak = 0,
    verifications = 0,
    comments = 0,
    categoryBreakdown = {} // { 'Roads': 5, 'Waste': 2 }
  } = stats;

  // 1. Report Score with Diminishing Returns (Spam Resistance)
  let reportBaseScore = 0;
  if (reports <= 5) {
    reportBaseScore = reports * 10;
  } else if (reports <= 15) {
    reportBaseScore = (5 * 10) + ((reports - 5) * 5);
  } else {
    reportBaseScore = (5 * 10) + (10 * 5) + ((reports - 15) * 2);
  }

  // 2. Category Weighting (Weighted Scoring)
  // High Priority: Roads, Infrastructure, Safety (1.2x)
  // Normal Priority: Water, Electricity (1.0x)
  // Lower Priority: Waste, Noise (0.8x)
  let categoryBonus = 0;
  Object.entries(categoryBreakdown).forEach(([category, count]) => {
    if (['Roads', 'Infrastructure', 'Safety', 'Public Health'].includes(category)) {
      categoryBonus += count * 2; // Extra 2 points per high-impact report
    } else if (['Waste', 'Noise', 'Graffiti'].includes(category)) {
      categoryBonus -= count * 1; // Minor reduction for low-effort reports (still net positive)
    }
  });

  // 3. Trust & Verification Factor
  // Reward users whose reports are verified by others
  const verificationBonus = verifications * 5;

  // 4. Community Engagement
  const engagementScore = (upvotes * 2) + (comments * 2);

  // 5. Resolution & Consistency
  const performanceScore = (resolved * 30) + (streak * 5);

  // Base Calculation
  const totalBaseScore = reportBaseScore + categoryBonus + verificationBonus + engagementScore + performanceScore;

  // 6. Reputation Multiplier (Level based)
  let levelMultiplier = 1;
  switch (level) {
    case "Local Observer": levelMultiplier = 1.1; break;
    case "Active Citizen": levelMultiplier = 1.2; break;
    case "Community Contributor": levelMultiplier = 1.3; break;
    case "Neighborhood Guard": levelMultiplier = 1.4; break;
    case "Civic Leader": levelMultiplier = 1.5; break;
    case "City Advocate": levelMultiplier = 1.6; break;
    case "Urban Visionary": levelMultiplier = 1.7; break;
    case "Civic Guardian": levelMultiplier = 1.8; break;
    case "Civic Champion": levelMultiplier = 2.0; break;
    default: levelMultiplier = 1.0;
  }

  return Math.max(0, Math.floor(totalBaseScore * levelMultiplier));
};

module.exports = {
  calculateImpactScore
};
