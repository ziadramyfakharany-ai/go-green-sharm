const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  activityName: { type: String, required: true, trim: true, maxlength: 100 },
  customerName: { type: String, required: true, trim: true, maxlength: 100 },
  contactInfo: { type: String, required: true, trim: true, maxlength: 150 },
  date: { type: String, required: true, trim: true, maxlength: 30 },
  guests: { type: Number, required: true, min: 1, max: 50, default: 1 },
  selectedOption: { type: String, default: 'Standard', trim: true, maxlength: 120 },
  selectedEquipment: { type: [String], default: [] },
  notes: { type: String, default: '', trim: true, maxlength: 500 },
  totalPrice: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);