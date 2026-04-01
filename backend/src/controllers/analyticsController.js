const User = require('../models/User');
const Post = require('../models/Post');
const ProfileView = require('../models/ProfileView');
const PostAnalytics = require('../models/PostAnalytics');

// @desc    Track profile view
// @route   POST /api/analytics/profile/:userId/view
// @access  Private
const trackProfileView = async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user._id;

    if (userId === viewerId.toString()) {
      return res.status(400).json({ error: 'Cannot view your own profile' });
    }

    // Check if already viewed in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingView = await ProfileView.findOne({
      profileOwner: userId,
      viewer: viewerId,
      viewedAt: { $gte: oneDayAgo }
    });

    if (!existingView) {
      await ProfileView.create({
        profileOwner: userId,
        viewer: viewerId,
        viewedAt: new Date()
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Track profile view error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Track post view
// @route   POST /api/analytics/post/:postId/view
// @access  Private
const trackPostView = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    let analytics = await PostAnalytics.findOne({ post: postId });

    if (!analytics) {
      analytics = await PostAnalytics.create({
        post: postId,
        user: userId,
        views: 0,
        uniqueViewers: []
      });
    }

    // Check if already viewed
    const alreadyViewed = analytics.uniqueViewers.includes(userId);
    if (!alreadyViewed) {
      analytics.uniqueViewers.push(userId);
      analytics.views++;
      analytics.lastUpdated = new Date();
      await analytics.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Track post view error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get user analytics dashboard
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get profile views
    const profileViews = await ProfileView.find({
      profileOwner: userId,
      viewedAt: { $gte: thirtyDaysAgo }
    }).sort('-viewedAt');

    // Get total profile views
    const totalProfileViews = await ProfileView.countDocuments({ profileOwner: userId });

    // Get unique viewers count
    const uniqueViewers = await ProfileView.distinct('viewer', { profileOwner: userId });

    // Get posts
    const posts = await Post.find({ user: userId }).sort('-createdAt');

    // Get post analytics
    const postAnalytics = await PostAnalytics.find({ user: userId });

    // Calculate post stats
    let totalPostViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalEngagement = 0;

    posts.forEach(post => {
      totalLikes += post.likes?.length || 0;
      totalComments += post.comments?.length || 0;
      totalShares += post.shares || 0;
    });

    postAnalytics.forEach(analytic => {
      totalPostViews += analytic.views || 0;
    });

    totalEngagement = totalLikes + totalComments + totalShares;

    // Get weekly data for chart
    const weeklyViews = [];
    const weeklyLikes = [];
    const weeklyComments = [];
    const weeklyShares = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const dayViews = await ProfileView.countDocuments({
        profileOwner: userId,
        viewedAt: { $gte: date, $lt: nextDate }
      });

      const dayPosts = await Post.find({
        user: userId,
        createdAt: { $gte: date, $lt: nextDate }
      });

      let dayLikes = 0;
      let dayComments = 0;
      let dayShares = 0;

      dayPosts.forEach(post => {
        dayLikes += post.likes?.length || 0;
        dayComments += post.comments?.length || 0;
        dayShares += post.shares || 0;
      });

      weeklyViews.push(dayViews);
      weeklyLikes.push(dayLikes);
      weeklyComments.push(dayComments);
      weeklyShares.push(dayShares);
    }

    // Get recent activity
    const recentViews = await ProfileView.find({ profileOwner: userId })
      .populate('viewer', 'name avatar')
      .sort('-viewedAt')
      .limit(10);

    const recentPosts = await Post.find({ user: userId })
      .sort('-createdAt')
      .limit(10);

    // Get user data
    const userData = await User.findById(userId)
      .populate('followers', 'name avatar')
      .populate('following', 'name avatar');

    // Get top performing posts
    const topPosts = [];
    for (const post of posts.slice(0, 10)) {
      const analytics = await PostAnalytics.findOne({ post: post._id });
      topPosts.push({
        _id: post._id,
        content: post.content,
        image: post.image,
        createdAt: post.createdAt,
        likes: post.likes?.length || 0,
        comments: post.comments?.length || 0,
        shares: post.shares || 0,
        views: analytics?.views || 0,
        engagement: (post.likes?.length || 0) + (post.comments?.length || 0) + (post.shares || 0)
      });
    }

    // Sort by engagement
    topPosts.sort((a, b) => b.engagement - a.engagement);

    res.json({
      overview: {
        totalProfileViews,
        totalPostViews,
        totalLikes,
        totalComments,
        totalShares,
        totalEngagement,
        totalPosts: posts.length,
        totalFollowers: userData.followers?.length || 0,
        totalFollowing: userData.following?.length || 0,
        uniqueViewers: uniqueViewers.length
      },
      weeklyData: {
        labels: ['6 days ago', '5 days ago', '4 days ago', '3 days ago', '2 days ago', 'Yesterday', 'Today'],
        views: weeklyViews,
        likes: weeklyLikes,
        comments: weeklyComments,
        shares: weeklyShares
      },
      recentActivity: {
        views: recentViews,
        posts: recentPosts
      },
      topPosts: topPosts.slice(0, 5)
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  trackProfileView,
  trackPostView,
  getDashboard
};