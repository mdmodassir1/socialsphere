const Notification = require('../models/Notification');
const User = require('../models/User');
const { messaging } = require('../config/firebase');

// @desc    Get user notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('from', 'name avatar')
      .populate('post', 'content image')
      .sort('-createdAt')
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      read: false
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await notification.deleteOne();
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update notification settings
const updateNotificationSettings = async (req, res) => {
  try {
    const { messages, likes, comments, follows, storyReplies, calls, pushEnabled } = req.body;

    const user = await User.findById(req.user._id);
    
    if (pushEnabled !== undefined) user.pushNotificationsEnabled = pushEnabled;
    if (messages !== undefined) user.notificationSettings.messages = messages;
    if (likes !== undefined) user.notificationSettings.likes = likes;
    if (comments !== undefined) user.notificationSettings.comments = comments;
    if (follows !== undefined) user.notificationSettings.follows = follows;
    if (storyReplies !== undefined) user.notificationSettings.storyReplies = storyReplies;
    if (calls !== undefined) user.notificationSettings.calls = calls;

    await user.save();
    res.json({ message: 'Settings updated', settings: user.notificationSettings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Save FCM token
const saveFCMToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    await User.findByIdAndUpdate(req.user._id, { fcmToken: token });
    res.json({ message: 'Token saved' });
  } catch (error) {
    console.error('Save FCM token error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Send push notification (helper function)
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findById(userId);
    
    if (!user || !user.pushNotificationsEnabled) return;
    if (!user.fcmToken) return;

    // Check notification settings based on type
    const type = data.type;
    if (type === 'message' && !user.notificationSettings.messages) return;
    if (type === 'like' && !user.notificationSettings.likes) return;
    if (type === 'comment' && !user.notificationSettings.comments) return;
    if (type === 'follow' && !user.notificationSettings.follows) return;
    if (type === 'story_reply' && !user.notificationSettings.storyReplies) return;
    if (type === 'call_missed' && !user.notificationSettings.calls) return;

    const message = {
      token: user.fcmToken,
      notification: {
        title: title,
        body: body,
        click_action: 'https://socialsphere.com'
      },
      data: {
        ...data,
        click_action: 'OPEN_APP',
        screen: data.screen || 'home'
      },
      webpush: {
        fcm_options: {
          link: data.link || 'https://socialsphere.com'
        }
      }
    };

    await messaging.send(message);
    console.log(`📱 Push notification sent to ${user.name}`);
  } catch (error) {
    console.error('Send push notification error:', error);
  }
};

// @desc    Create notification (updated with push)
const createNotification = async (userId, type, fromId, data = {}) => {
  try {
    if (userId.toString() === fromId.toString()) {
      return null;
    }

    const fromUser = await User.findById(fromId);
    if (!fromUser) return null;

    let title = '';
    let body = '';
    let link = '';

    switch (type) {
      case 'like':
        title = 'New Like';
        body = `${fromUser.name} liked your post`;
        link = `/post/${data.post}`;
        break;
      case 'comment':
        title = 'New Comment';
        body = `${fromUser.name} commented: "${data.comment?.text?.substring(0, 50)}"`;
        link = `/post/${data.post}`;
        break;
      case 'follow':
        title = 'New Follower';
        body = `${fromUser.name} started following you`;
        link = `/profile/${fromId}`;
        break;
      case 'message':
        title = 'New Message';
        body = `${fromUser.name} sent you a message`;
        link = '/';
        break;
      case 'story_reply':
        title = 'Story Reply';
        body = `${fromUser.name} replied to your story`;
        link = '/';
        break;
      case 'call_missed':
        title = 'Missed Call';
        body = `${fromUser.name} tried to call you`;
        link = '/';
        break;
      default:
        title = 'New Notification';
        body = `${fromUser.name} interacted with you`;
    }

    const notification = new Notification({
      user: userId,
      type,
      from: fromId,
      ...data
    });

    await notification.save();

    const populatedNotification = await Notification.findById(notification._id)
      .populate('from', 'name avatar')
      .populate('post', 'content image');

    // Send push notification
    await sendPushNotification(userId, title, body, {
      type,
      fromId: fromId.toString(),
      fromName: fromUser.name,
      postId: data.post?.toString(),
      link,
      screen: type === 'message' ? 'chat' : 'home'
    });

    // Emit via socket for in-app notification
    if (global.io && global.onlineUsers) {
      const receiverSocket = global.onlineUsers.get(userId.toString());
      if (receiverSocket) {
        global.io.to(receiverSocket).emit('new_notification', populatedNotification);
      }
    }

    return populatedNotification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  updateNotificationSettings,
  saveFCMToken,
  sendPushNotification,
  createNotification
};