const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const { createNotification } = require('./notificationController');

// @desc    Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -fcmToken')
      .populate('followers', 'name avatar')
      .populate('following', 'name avatar');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile with avatar and cover photo
const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    let avatarUrl = '';
    let coverUrl = '';

    console.log('Updating profile for user:', req.user._id);

    // Handle avatar upload
    if (req.files?.avatar) {
      try {
        const currentUser = await User.findById(req.user._id);
        if (currentUser.avatar && currentUser.avatar.includes('cloudinary')) {
          const publicId = currentUser.avatar.split('/').slice(-2).join('/').split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        }

        const result = await cloudinary.uploader.upload(req.files.avatar[0].path, {
          folder: 'avatars',
          transformation: [
            { width: 200, height: 200, crop: 'fill' },
            { quality: 'auto' }
          ]
        });
        avatarUrl = result.secure_url;
        
        if (fs.existsSync(req.files.avatar[0].path)) {
          fs.unlinkSync(req.files.avatar[0].path);
        }
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
      }
    }

    // Handle cover photo upload
    if (req.files?.coverPhoto) {
      try {
        const currentUser = await User.findById(req.user._id);
        if (currentUser.coverPhoto && currentUser.coverPhoto.includes('cloudinary')) {
          const publicId = currentUser.coverPhoto.split('/').slice(-2).join('/').split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        }

        const result = await cloudinary.uploader.upload(req.files.coverPhoto[0].path, {
          folder: 'cover_photos',
          transformation: [
            { width: 1500, height: 500, crop: 'fill' },
            { quality: 'auto' }
          ]
        });
        coverUrl = result.secure_url;
        
        if (fs.existsSync(req.files.coverPhoto[0].path)) {
          fs.unlinkSync(req.files.coverPhoto[0].path);
        }
      } catch (uploadError) {
        console.error('Cover photo upload error:', uploadError);
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl) updateData.avatar = avatarUrl;
    if (coverUrl) updateData.coverPhoto = coverUrl;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -fcmToken');

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Follow/Unfollow a user
const followUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }
    
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);
    
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let followed = false;
    
    if (currentUser.following.includes(req.params.id)) {
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== req.params.id
      );
      userToFollow.followers = userToFollow.followers.filter(
        id => id.toString() !== req.user._id.toString()
      );
      followed = false;
    } else {
      currentUser.following.push(req.params.id);
      userToFollow.followers.push(req.user._id);
      followed = true;
      
      const notification = await createNotification(
        userToFollow._id,
        'follow',
        req.user._id,
        {}
      );
      
      if (notification && global.io) {
        const receiverSocket = global.onlineUsers?.get(userToFollow._id.toString());
        if (receiverSocket) {
          global.io.to(receiverSocket).emit('new_notification', notification);
        }
      }
    }
    
    await currentUser.save();
    await userToFollow.save();
    
    res.json({ 
      message: followed ? 'Followed successfully' : 'Unfollowed successfully',
      following: followed,
      followersCount: userToFollow.followers.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search users
const searchUsers = async (req, res) => {
  try {
    const searchQuery = req.query.q;
    
    if (!searchQuery || searchQuery.trim() === '') {
      return res.json([]);
    }
    
    const users = await User.find({
      $and: [
        {
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } }
          ]
        },
        { _id: { $ne: req.user._id } }
      ]
    }).select('name email avatar bio followers following');
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user suggestions
const getUserSuggestions = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    const suggestions = await User.find({
      _id: { 
        $nin: [req.user._id, ...currentUser.following.map(id => id.toString())]
      }
    })
    .select('name email avatar bio followers following')
    .limit(10)
    .sort('-createdAt');
    
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user followers list
const getUserFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'name email avatar bio')
      .select('followers');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.followers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user following list
const getUserFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'name email avatar bio')
      .select('following');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.following);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  followUser,
  searchUsers,
  getUserSuggestions,
  getUserFollowers,
  getUserFollowing
};