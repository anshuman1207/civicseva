const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  points: { type: Number, default: 0 },
  level: { type: String, default: "Beginner" },
  createdAt: { type: Date, default: Date.now }
});
// Method to add points and update level
userSchema.methods.addPoints = async function(points) {
  this.points += points;
  
  if (this.points > 100) {
    this.level = "Active Citizen";
  } else if (this.points > 50) {
    this.level = "Intermediate";
  } else {
    this.level = "Beginner";
  }
  
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
