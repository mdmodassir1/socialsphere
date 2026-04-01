const Story = require('../models/Story');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// @desc    Create a story
// @route   POST /api/stories
// @access  Private
const createStory = async (req, res) => {
  try {
    const { caption } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image or video' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'stories',
      resource_type: 'auto',
      transformation: [
        { width: 1080, height: 1920, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const story = await Story.create({
      user: req.user._id,
      media: result.secure_url,
      mediaType: result.resource_type,
      caption: caption || ''
    });

    const populatedStory = await Story.findById(story._id)
      .populate('user', 'name avatar')
      .populate('viewers.user', 'name avatar');

    res.status(201).json(populatedStory);
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get stories from following users
// @route   GET /api/stories
// @access  Private
const getStories = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    const stories = await Story.find({
      user: { $in: [...currentUser.following, req.user._id] },
      createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
      .populate('user', 'name avatar')
      .populate('viewers.user', 'name avatar')
      .sort('-createdAt');

    // Group stories by user and remove duplicate viewers
    const groupedStories = {};
    stories.forEach(story => {
      const userId = story.user._id.toString();
      if (!groupedStories[userId]) {
        // Remove duplicate viewers from each story
        const uniqueViewers = [];
        const viewerIds = new Set();
        story.viewers.forEach(viewer => {
          const viewerId = viewer.user._id.toString();
          if (!viewerIds.has(viewerId)) {
            viewerIds.add(viewerId);
            uniqueViewers.push(viewer);
          }
        });
        story.viewers = uniqueViewers;
        
        groupedStories[userId] = {
          user: story.user,
          stories: [story]
        };
      } else {
        // Remove duplicate viewers for subsequent stories
        const uniqueViewers = [];
        const viewerIds = new Set();
        story.viewers.forEach(viewer => {
          const viewerId = viewer.user._id.toString();
          if (!viewerIds.has(viewerId)) {
            viewerIds.add(viewerId);
            uniqueViewers.push(viewer);
          }
        });
        story.viewers = uniqueViewers;
        groupedStories[userId].stories.push(story);
      }
    });

    res.json(Object.values(groupedStories));
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    View a story
// @route   POST /api/stories/:storyId/view
// @access  Private
const viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Check if already viewed - prevent duplicate
    const alreadyViewed = story.viewers.some(
      v => v.user.toString() === req.user._id.toString()
    );

    if (!alreadyViewed) {
      story.viewers.push({ user: req.user._id, viewedAt: new Date() });
      await story.save();
    }

    const updatedStory = await Story.findById(story._id)
      .populate('user', 'name avatar')
      .populate('viewers.user', 'name avatar');

    // Remove any potential duplicates from viewers (just in case)
    const uniqueViewers = [];
    const viewerIds = new Set();
    updatedStory.viewers.forEach(viewer => {
      const viewerId = viewer.user._id.toString();
      if (!viewerIds.has(viewerId)) {
        viewerIds.add(viewerId);
        uniqueViewers.push(viewer);
      }
    });
    updatedStory.viewers = uniqueViewers;

    res.json(updatedStory);
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete story
// @route   DELETE /api/stories/:storyId
// @access  Private
const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await story.deleteOne();
    res.json({ message: 'Story deleted' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createStory,
  getStories,
  viewStory,
  deleteStory
};