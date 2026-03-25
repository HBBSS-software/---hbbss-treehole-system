const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  images: [String],
  tags: [String],
  poll: {
    question: String,
    options: [String],
    votes: [{ user: mongoose.Schema.Types.ObjectId, option: Number }]
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  status: { type: String, enum: ['pending', 'approved'], default: 'approved' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
