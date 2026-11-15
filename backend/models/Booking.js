const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  activityName: { type: String, required: true },
  customerName: { type: String, required: true },
  contactInfo: { type: String, required: true },
  date: { type: String, required: true },
  guests: { type: Number, required: true, default: 1 },
  selectedOption: { type: String, default: 'Standard' },
  selectedEquipment: { type: [String], default: [] },
  notes: { type: String, default: '' },
  totalPrice: { type: Number, required: true },
  status: { type: String, default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);