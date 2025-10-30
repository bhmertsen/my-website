const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String },
  image: { type: String },
  excerpt: { type: String },
  content: { type: String },
  published: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('News', NewsSchema);
