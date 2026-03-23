const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({

  name: { type: String, required: true, unique: true },

  description: String,

  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  moderator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  status: { type: String, enum: ['pending', 'approved'], default: 'approved' },

  createdAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model('Section', sectionSchema);