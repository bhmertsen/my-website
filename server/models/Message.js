const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  message: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
