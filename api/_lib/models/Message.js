const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  message: { type: String, required: true }
}, { timestamps: true, collection: 'messages' });

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);
