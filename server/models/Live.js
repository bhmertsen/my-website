const mongoose = require('mongoose');

const LiveSchema = new mongoose.Schema({
  channel: { type: String, default: '' },
  datetime: { type: String, default: '' },
  url: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Live', LiveSchema);
