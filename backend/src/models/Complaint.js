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
  city: { type: String },
  pincode: { 
    type: String, 
    match: [/^\d{6}$/, 'Pincode must be exactly 6 digits']
  },
  upvotes: { type: Number, default: 0 },
  priorityScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Index for geo-spatial queries
complaintSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Complaint', complaintSchema);
