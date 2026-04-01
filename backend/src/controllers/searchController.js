const User = require('../models/User');
const Post = require('../models/Post');
const Chat = require('../models/Chat');

// @desc    Advanced search
// @route   GET /api/search
// @access  Private
const advancedSearch = async (req, res) => {
  try {
    const { q, type, from, to, sort, limit = 20 } = req.query;
    const userId = req.user._id;

    if (!q || q.trim() === '') {
      return res.json({ users: [], posts: [], messages: [] });
    }

    const results = {};

    // Search Users
    if (!type || type === 'users') {
      const users = await User.find({
        $and: [
          {
            $or: [
              { name: { $regex: q, $options: 'i' } },
              { email: { $regex: q, $options: 'i' } },
              { bio: { $regex: q, $options: 'i' } }
            ]
          },
          { _id: { $ne: userId } }
        ]
      })
      .select('name email avatar bio followers following')
      .limit(parseInt(limit))
      .sort(sort === 'followers' ? { followers: -1 } : { name: 1 });

      results.users = users;
    }

    // Search Posts
    if (!type || type === 'posts') {
      let dateFilter = {};
      if (from) {
        dateFilter.createdAt = { $gte: new Date(from) };
      }
      if (to) {
        dateFilter.createdAt = { ...dateFilter.createdAt, $lte: new Date(to) };
      }

      const posts = await Post.find({
        $and: [
          {
            $or: [
              { content: { $regex: q, $options: 'i' } }
            ]
          },
          dateFilter
        ]
      })
      .populate('user', 'name email avatar')
      .populate('comments.user', 'name avatar')
      .sort(sort === 'likes' ? { likes: -1 } : sort === 'comments' ? { comments: -1 } : { createdAt: -1 })
      .limit(parseInt(limit));

      results.posts = posts;
    }

    // Search Messages
    if (!type || type === 'messages') {
      const chats = await Chat.find({
        participants: userId,
        'messages.text': { $regex: q, $options: 'i' }
      })
      .populate('participants', 'name avatar')
      .populate('messages.sender', 'name avatar')
      .limit(parseInt(limit));

      const messages = [];
      chats.forEach(chat => {
        const otherUser = chat.participants.find(p => p._id.toString() !== userId.toString());
        chat.messages.forEach(msg => {
          if (msg.text && msg.text.toLowerCase().includes(q.toLowerCase())) {
            messages.push({
              _id: msg._id,
              text: msg.text,
              sender: msg.sender,
              chatId: chat._id,
              otherUser: otherUser,
              createdAt: msg.createdAt,
              isCall: msg.isCall,
              mediaType: msg.mediaType
            });
          }
        });
      });

      messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      results.messages = messages.slice(0, parseInt(limit));
    }

    res.json(results);
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Search suggestions
// @route   GET /api/search/suggestions
// @access  Private
const getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user._id;

    if (!q || q.trim() === '') {
      return res.json({ users: [], hashtags: [] });
    }

    // User suggestions
    const users = await User.find({
      $and: [
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        },
        { _id: { $ne: userId } }
      ]
    })
    .select('name email avatar')
    .limit(5);

    // Hashtag suggestions from posts
    const posts = await Post.find({
      content: { $regex: `#${q}`, $options: 'i' }
    })
    .limit(10);

    const hashtags = new Set();
    posts.forEach(post => {
      const hashtagMatches = post.content.match(/#[\w]+/g);
      if (hashtagMatches) {
        hashtagMatches.forEach(tag => {
          if (tag.toLowerCase().includes(q.toLowerCase())) {
            hashtags.add(tag);
          }
        });
      }
    });

    res.json({
      users,
      hashtags: Array.from(hashtags).slice(0, 5)
    });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  advancedSearch,
  getSearchSuggestions
};