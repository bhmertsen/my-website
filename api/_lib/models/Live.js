const mongoose = require('mongoose');

const LiveSchema = new mongoose.Schema({
  channel: { type: String, default: '' },
  datetime: { type: String, default: '' },
  url: { type: String, default: '' }
}, { timestamps: true, collection: 'lives' });

module.exports = mongoose.models.Live || mongoose.model('Live', LiveSchema);
