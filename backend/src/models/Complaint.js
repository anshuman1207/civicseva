const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['Roads', 'Garbage', 'Water', 'Electricity', 'Others'],
    default: 'Others'
  },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Resolved'], 
    default: 'Pending' 
  },
  photo: { type: String }, // Path to uploaded image
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  city: { type: String },
  pincode: { 
    type: String, 
    match: [/^\d{6}$/, 'Pincode must be exactly 6 digits']
  },
  upvotes: { type: Number, default: 0 },
  priorityScore: { type: Number, default: 0 },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  verifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  timeline: [{
    status: { type: String },
    message: { type: String },
    timestamp: { type: Date, default: Date.now },
    actor: { type: String, default: 'System' },
    isMilestone: { type: Boolean, default: false }
  }]
}, { 
  timestamps: true 
});

// Index for geo-spatial queries
complaintSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Complaint', complaintSchema);
