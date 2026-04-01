const mongoose = require('mongoose');

const ReelSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  video: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: ''
  },
  caption: {
    type: String,
    maxlength: 150,
    default: ''
  },
  music: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  shares: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  uniqueViewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isTrending: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for trending
ReelSchema.index({ views: -1, likes: -1, createdAt: -1 });

module.exports = mongoose.model('Reel', ReelSchema);