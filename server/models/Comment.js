const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({

  content: String,

  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },

  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  createdAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model('Comment', commentSchema);