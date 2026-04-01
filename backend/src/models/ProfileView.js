const mongoose = require('mongoose');

const ProfileViewSchema = new mongoose.Schema({
  profileOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  viewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index to prevent duplicate views in short time
ProfileViewSchema.index({ profileOwner: 1, viewer: 1, viewedAt: 1 });

module.exports = mongoose.model('ProfileView', ProfileViewSchema);