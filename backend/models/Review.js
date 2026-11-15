const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcoSpot', required: true },
  activityName: { type: String, required: true },
  reviewerName: { type: String, required: true },
  country: { type: String, default: 'Guest' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);