const Post = require('../models/Post');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const { createNotification } = require('./notificationController');

// @desc    Create a post with image
const createPost = async (req, res) => {
  try {
    console.log('Create post request received');
    
    const { content } = req.body;
    let imageUrl = '';

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'social_posts',
          transformation: [
            { width: 1000, height: 1000, crop: 'limit' },
            { quality: 'auto' }
          ]
        });
        imageUrl = result.secure_url;
        
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ 
          message: 'Image upload failed', 
          error: uploadError.message 
        });
      }
    }
    
    const post = await Post.create({
      user: req.user._id,
      content: content || '',
      image: imageUrl
    });

    const populatedPost = await Post.findById(post._id)
      .populate('user', 'name email avatar')
      .populate('comments.user', 'name avatar');

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Create post error:', error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all posts (feed)
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name email avatar')
      .populate('comments.user', 'name avatar')
      .populate('sharedFrom', 'user content image')
      .populate('originalPost', 'user content image')
      .sort('-createdAt');
    
    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single post
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'name email avatar')
      .populate('comments.user', 'name avatar')
      .populate('sharedFrom', 'user content image')
      .populate('originalPost', 'user content image');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Get post by id error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Edit post
const editPost = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    post.content = content;
    post.edited = true;
    post.editedAt = new Date();
    await post.save();
    
    const updatedPost = await Post.findById(post._id)
      .populate('user', 'name email avatar')
      .populate('comments.user', 'name avatar');
    
    res.json(updatedPost);
  } catch (error) {
    console.error('Edit post error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete post
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    if (post.image && post.image.includes('cloudinary')) {
      try {
        const publicId = post.image.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error('Cloudinary delete error:', cloudinaryError);
      }
    }
    
    await post.deleteOne();
    res.json({ message: 'Post removed' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Like/Unlike a post
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    let liked = false;
    
    if (post.likes.includes(req.user._id)) {
      post.likes = post.likes.filter(like => like.toString() !== req.user._id.toString());
      liked = false;
    } else {
      post.likes.push(req.user._id);
      liked = true;
      
      if (post.user.toString() !== req.user._id.toString()) {
        const notification = await createNotification(
          post.user,
          'like',
          req.user._id,
          { post: post._id }
        );
        
        if (notification && global.io) {
          const receiverSocket = global.onlineUsers?.get(post.user.toString());
          if (receiverSocket) {
            global.io.to(receiverSocket).emit('new_notification', notification);
          }
        }
      }
    }
    
    await post.save();
    res.json({ message: liked ? 'Post liked' : 'Post unliked', likes: post.likes.length });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add comment
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const comment = {
      user: req.user._id,
      text: text,
      createdAt: new Date()
    };
    
    post.comments.push(comment);
    await post.save();
    
    if (post.user.toString() !== req.user._id.toString()) {
      const notification = await createNotification(
        post.user,
        'comment',
        req.user._id,
        { post: post._id, comment: { _id: comment._id, text: comment.text } }
      );
      
      if (notification && global.io) {
        const receiverSocket = global.onlineUsers?.get(post.user.toString());
        if (receiverSocket) {
          global.io.to(receiverSocket).emit('new_notification', notification);
        }
      }
    }
    
    const updatedPost = await Post.findById(req.params.id)
      .populate('comments.user', 'name avatar');
    
    res.json(updatedPost.comments);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete comment
const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const commentIndex = post.comments.findIndex(
      comment => comment._id.toString() === req.params.commentId
    );
    
    if (commentIndex === -1) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    const comment = post.comments[commentIndex];
    
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this comment' });
    }
    
    post.comments.splice(commentIndex, 1);
    await post.save();
    
    const updatedPost = await Post.findById(req.params.id)
      .populate('comments.user', 'name avatar');
    
    res.json({ 
      message: 'Comment deleted successfully', 
      comments: updatedPost.comments 
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Share a post
const sharePost = async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id);
    
    if (!originalPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    originalPost.shares = (originalPost.shares || 0) + 1;
    await originalPost.save();

    const sharedPost = await Post.create({
      user: req.user._id,
      content: req.body.content || `Shared ${originalPost.user.name}'s post`,
      image: originalPost.image,
      sharedFrom: originalPost._id,
      originalPost: originalPost._id
    });

    const populatedPost = await Post.findById(sharedPost._id)
      .populate('user', 'name email avatar')
      .populate('sharedFrom', 'user content image')
      .populate('originalPost', 'user content image');

    if (originalPost.user.toString() !== req.user._id.toString()) {
      const notification = await createNotification(
        originalPost.user,
        'share',
        req.user._id,
        { post: originalPost._id }
      );
      
      if (notification && global.io) {
        const receiverSocket = global.onlineUsers?.get(originalPost.user.toString());
        if (receiverSocket) {
          global.io.to(receiverSocket).emit('new_notification', notification);
        }
      }
    }

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get posts by user
const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .populate('user', 'name email avatar')
      .populate('sharedFrom', 'user content image')
      .populate('originalPost', 'user content image')
      .sort('-createdAt');
    
    res.json(posts);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  editPost,
  deletePost,
  likePost,
  addComment,
  deleteComment,
  sharePost,
  getUserPosts
};