const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Enforce one vote per user per complaint
voteSchema.index({ complaintId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
