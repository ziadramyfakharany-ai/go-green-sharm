const mongoose = require('mongoose');

const ecoSpotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  highlights: { type: [String], default: [] },
  packages: [{
    label: String,
    extraPrice: Number
  }],
  equipmentOptions: [{
    name: String,
    price: Number
  }],
  image: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('EcoSpot', ecoSpotSchema);