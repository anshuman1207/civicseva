const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const LEVELS = [
  { name: 'Civic Explorer', minXp: 0 },
  { name: 'Local Observer', minXp: 20 },
  { name: 'Active Citizen', minXp: 50 },
  { name: 'Community Contributor', minXp: 100 },
  { name: 'Neighborhood Guard', minXp: 200 },
  { name: 'Civic Leader', minXp: 350 },
  { name: 'City Advocate', minXp: 550 },
  { name: 'Urban Visionary', minXp: 800 },
  { name: 'Civic Guardian', minXp: 1100 },
  { name: 'Civic Champion', minXp: 1500 }
];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin", "authority"], default: "user" },
  points: { type: Number, default: 0 },
  level: { type: String, default: "Beginner" },
  currentStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  badges: [{
    name: String,
    description: String,
    icon: String,
    awardedAt: { type: Date, default: Date.now }
  }],
  challenges: [{
    title: String,
    description: String,
    target: Number,
    progress: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    xpReward: Number
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to add points and update level
userSchema.methods.addPoints = async function(points) {
  this.points += points;
  
  // Find the highest level the user has reached
  let currentLevel = LEVELS[0].name;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (this.points >= LEVELS[i].minXp) {
      currentLevel = LEVELS[i].name;
      break;
    }
  }
  
  this.level = currentLevel;
  await this.save();
};

// Method to update daily streak
userSchema.methods.updateActivityStreak = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!this.lastActiveDate) {
    this.currentStreak = 1;
    this.lastActiveDate = today;
  } else {
    const lastActive = new Date(this.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(today - lastActive);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      this.currentStreak += 1;
      this.lastActiveDate = today;
    } else if (diffDays > 1) {
      this.currentStreak = 1;
      this.lastActiveDate = today;
    }
  }
  await this.save();
};

// Method to award a badge if not already possessed
userSchema.methods.awardBadge = async function(name, description, icon) {
  const hasBadge = this.badges.some(b => b.name === name);
  if (!hasBadge) {
    this.badges.push({ name, description, icon });
    return true; // Badge awarded
  }
  return false; // Already has it
};

module.exports = mongoose.model('User', userSchema);
