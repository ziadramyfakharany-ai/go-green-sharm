const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcoSpot', required: true },
  activityName: { type: String, required: true, trim: true, maxlength: 100 },
  reviewerName: { type: String, required: true, trim: true, maxlength: 80 },
  country: { type: String, default: 'Guest', trim: true, maxlength: 60 },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 1000 }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);