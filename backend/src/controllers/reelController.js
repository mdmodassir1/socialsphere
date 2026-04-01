const Reel = require('../models/Reel');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const { createNotification } = require('./notificationController');

// @desc    Create a reel
const createReel = async (req, res) => {
  try {
    const { caption, music, duration } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a video' });
    }

    console.log('Uploading video to Cloudinary...');

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'reels',
      resource_type: 'video',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    console.log('Video uploaded:', result.secure_url);

    let thumbnailUrl = '';
    try {
      const thumbnailResult = await cloudinary.uploader.upload(req.file.path, {
        folder: 'reels/thumbnails',
        resource_type: 'video',
        transformation: [
          { start_offset: '2', width: 640, height: 640, crop: 'fill' },
          { fetch_format: 'jpg' }
        ]
      });
      thumbnailUrl = thumbnailResult.secure_url;
    } catch (thumbError) {
      thumbnailUrl = result.secure_url.replace('/upload/', '/upload/w_640,h_640,c_fill/');
    }

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const reel = await Reel.create({
      user: req.user._id,
      video: result.secure_url,
      thumbnail: thumbnailUrl,
      caption: caption || '',
      music: music || '',
      duration: duration || 0
    });

    const populatedReel = await Reel.findById(reel._id)
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar');

    res.status(201).json(populatedReel);
  } catch (error) {
    console.error('Create reel error:', error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all reels (feed)
const getReels = async (req, res) => {
  try {
    const { page = 1, limit = 10, trending } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (trending === 'true') {
      query = { isTrending: true };
    }

    const reels = await Reel.find(query)
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar')
      .sort(trending === 'true' ? { views: -1, likes: -1 } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Reel.countDocuments(query);

    res.json({
      reels,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      total
    });
  } catch (error) {
    console.error('Get reels error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get trending reels
const getTrendingReels = async (req, res) => {
  try {
    const reels = await Reel.find({ isTrending: true })
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar')
      .sort({ views: -1, likes: -1 })
      .limit(20);

    res.json({ reels });
  } catch (error) {
    console.error('Get trending reels error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get user's reels
const getUserReels = async (req, res) => {
  try {
    const { userId } = req.params;
    const reels = await Reel.find({ user: userId })
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar')
      .sort('-createdAt');

    res.json(reels);
  } catch (error) {
    console.error('Get user reels error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get single reel
const getReelById = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id)
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar');

    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    const alreadyViewed = reel.uniqueViewers.includes(req.user._id);
    if (!alreadyViewed) {
      reel.uniqueViewers.push(req.user._id);
      reel.views++;
      
      if (reel.views > 1000 || reel.likes.length > 100) {
        reel.isTrending = true;
      }
      
      await reel.save();
    }

    res.json(reel);
  } catch (error) {
    console.error('Get reel by id error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete reel
const deleteReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    if (reel.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    if (reel.video && reel.video.includes('cloudinary')) {
      const publicId = reel.video.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    }

    await reel.deleteOne();
    res.json({ message: 'Reel deleted' });
  } catch (error) {
    console.error('Delete reel error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Like/Unlike a reel
const likeReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }
    
    let liked = false;
    
    if (reel.likes.includes(req.user._id)) {
      reel.likes = reel.likes.filter(like => like.toString() !== req.user._id.toString());
      liked = false;
    } else {
      reel.likes.push(req.user._id);
      liked = true;
      
      if (reel.user.toString() !== req.user._id.toString()) {
        const notification = await createNotification(
          reel.user,
          'like',
          req.user._id,
          { reel: reel._id }
        );
        
        if (notification && global.io) {
          const receiverSocket = global.onlineUsers?.get(reel.user.toString());
          if (receiverSocket) {
            global.io.to(receiverSocket).emit('new_notification', notification);
          }
        }
      }
    }
    
    if (reel.likes.length > 100 || reel.views > 1000) {
      reel.isTrending = true;
    }
    
    await reel.save();
    res.json({ message: liked ? 'Reel liked' : 'Reel unliked', likes: reel.likes.length });
  } catch (error) {
    console.error('Like reel error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Add comment to reel
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }
    
    const comment = {
      user: req.user._id,
      text: text,
      createdAt: new Date()
    };
    
    reel.comments.push(comment);
    await reel.save();
    
    if (reel.user.toString() !== req.user._id.toString()) {
      const notification = await createNotification(
        reel.user,
        'comment',
        req.user._id,
        { reel: reel._id, comment: comment }
      );
      
      if (notification && global.io) {
        const receiverSocket = global.onlineUsers?.get(reel.user.toString());
        if (receiverSocket) {
          global.io.to(receiverSocket).emit('new_notification', notification);
        }
      }
    }
    
    const updatedReel = await Reel.findById(req.params.id)
      .populate('comments.user', 'name avatar');
    
    res.json(updatedReel.comments);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete comment
const deleteComment = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }
    
    const commentIndex = reel.comments.findIndex(
      comment => comment._id.toString() === req.params.commentId
    );
    
    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const comment = reel.comments[commentIndex];
    
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    
    reel.comments.splice(commentIndex, 1);
    await reel.save();
    
    const updatedReel = await Reel.findById(req.params.id)
      .populate('comments.user', 'name avatar');
    
    res.json({ message: 'Comment deleted', comments: updatedReel.comments });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Share reel
const shareReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }
    
    reel.shares++;
    await reel.save();
    
    res.json({ message: 'Reel shared', shares: reel.shares });
  } catch (error) {
    console.error('Share reel error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createReel,
  getReels,
  getTrendingReels,
  getUserReels,
  getReelById,
  deleteReel,
  likeReel,
  addComment,
  deleteComment,
  shareReel
};