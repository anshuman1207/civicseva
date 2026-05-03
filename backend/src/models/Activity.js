const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  userName: String, // Denormalized for quick feed display
  type: {
    type: String,
    enum: ['complaint_created', 'upvote_added', 'comment_added', 'status_updated', 'verified', 'milestone'],
    required: true
  },
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  complaintTitle: String, // Denormalized
  metadata: {
    type: mongoose.Schema.Types.Mixed // For extra info like status: 'Resolved'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('Activity', activitySchema);
