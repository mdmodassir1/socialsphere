const Chat = require('../models/Chat');
const { createNotification } = require('./notificationController');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// @desc    Get or create chat between two users
const getOrCreateChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ error: 'Cannot create chat with yourself' });
    }

    let chat = await Chat.findOne({
      participants: { $all: [currentUserId, userId], $size: 2 }
    }).populate('participants', 'name avatar')
      .populate('messages.sender', 'name avatar')
      .populate('messages.replyTo.senderId', 'name')
      .populate('messages.reactions.user', 'name avatar');

    if (chat) {
      return res.json(chat);
    }

    await Chat.deleteMany({
      participants: { $all: [currentUserId, userId] },
      messages: { $size: 0 }
    });

    chat = await Chat.create({
      participants: [currentUserId, userId],
      messages: []
    });
    
    chat = await Chat.findById(chat._id)
      .populate('participants', 'name avatar')
      .populate('messages.sender', 'name avatar')
      .populate('messages.replyTo.senderId', 'name')
      .populate('messages.reactions.user', 'name avatar');

    res.json(chat);
  } catch (error) {
    console.error('GetOrCreateChat error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all chats for current user
const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id
    })
      .populate('participants', 'name avatar')
      .populate('messages.sender', 'name avatar')
      .populate('messages.replyTo.senderId', 'name')
      .populate('messages.reactions.user', 'name avatar')
      .sort('-lastMessageTime');

    res.json(chats);
  } catch (error) {
    console.error('GetUserChats error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Send message
const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text, replyTo } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const message = {
      sender: req.user._id,
      text: text || '',
      read: false,
      isCall: false,
      reactions: [],
      createdAt: new Date()
    };

    if (replyTo && replyTo.messageId) {
      const originalMessage = chat.messages.id(replyTo.messageId);
      if (originalMessage) {
        message.replyTo = {
          messageId: replyTo.messageId,
          text: originalMessage.text,
          senderName: originalMessage.sender.toString() === req.user._id.toString() 
            ? 'You' 
            : (replyTo.senderName || 'User'),
          senderId: originalMessage.sender
        };
      }
    }

    chat.messages.push(message);
    chat.lastMessage = text || '';
    chat.lastMessageTime = new Date();
    await chat.save();

    const updatedChat = await Chat.findById(chatId)
      .populate('participants', 'name avatar')
      .populate('messages.sender', 'name avatar')
      .populate('messages.replyTo.senderId', 'name')
      .populate('messages.reactions.user', 'name avatar');

    const receiverId = chat.participants.find(
      p => p.toString() !== req.user._id.toString()
    );
    
    if (receiverId) {
      const notification = await createNotification(
        receiverId,
        'message',
        req.user._id,
        { chat: chat._id, text: text || 'New message' }
      );
      
      if (notification && global.io) {
        const receiverSocket = global.onlineUsers?.get(receiverId.toString());
        if (receiverSocket) {
          global.io.to(receiverSocket).emit('new_notification', notification);
        }
      }
    }

    res.json(updatedChat);
  } catch (error) {
    console.error('SendMessage error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Send media message (voice/video note)
const sendMediaMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { mediaType, mediaDuration } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No media file provided' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    let mediaUrl = '';
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'chat_media',
        resource_type: 'auto',
        transformation: [{ quality: 'auto' }]
      });
      mediaUrl = result.secure_url;
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return res.status(500).json({ error: 'Media upload failed', details: uploadError.message });
    } finally {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }

    const messageText = mediaType === 'voice_note' ? '🎤 Voice note' : '📹 Video note';
    
    const message = {
      sender: req.user._id,
      text: messageText,
      media: mediaUrl,
      mediaType: mediaType,
      mediaDuration: parseInt(mediaDuration) || 0,
      read: false,
      isCall: false,
      reactions: [],
      createdAt: new Date()
    };

    chat.messages.push(message);
    chat.lastMessage = messageText;
    chat.lastMessageTime = new Date();
    await chat.save();

    const updatedChat = await Chat.findById(chatId)
      .populate('participants', 'name avatar')
      .populate('messages.sender', 'name avatar')
      .populate('messages.replyTo.senderId', 'name')
      .populate('messages.reactions.user', 'name avatar');

    const receiverId = chat.participants.find(
      p => p.toString() !== req.user._id.toString()
    );
    
    if (receiverId) {
      const notification = await createNotification(
        receiverId,
        'message',
        req.user._id,
        { chat: chat._id, text: messageText }
      );
      
      if (notification && global.io) {
        const receiverSocket = global.onlineUsers?.get(receiverId.toString());
        if (receiverSocket) {
          global.io.to(receiverSocket).emit('new_notification', notification);
        }
      }
    }

    res.json(updatedChat);
  } catch (error) {
    console.error('SendMediaMessage error:', error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete message
const deleteMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const messageIndex = chat.messages.findIndex(m => m._id.toString() === messageId);
    
    if (messageIndex === -1) {
      return res.status(404).json({ error: 'Message not found' });
    }

    chat.messages.splice(messageIndex, 1);

    if (chat.messages.length > 0) {
      const lastMsg = chat.messages[chat.messages.length - 1];
      chat.lastMessage = lastMsg.text;
      chat.lastMessageTime = lastMsg.createdAt;
    } else {
      chat.lastMessage = '';
      chat.lastMessageTime = new Date();
    }

    await chat.save();

    const updatedChat = await Chat.findById(chatId)
      .populate('participants', 'name avatar')
      .populate('messages.sender', 'name avatar')
      .populate('messages.replyTo.senderId', 'name')
      .populate('messages.reactions.user', 'name avatar');

    res.json(updatedChat);
  } catch (error) {
    console.error('DeleteMessage error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Save call log
const saveCallLog = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { callType, duration, status } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const durationText = `${mins}:${secs.toString().padStart(2, '0')}`;

    let statusText = '';
    if (status === 'answered') {
      statusText = `Duration: ${durationText}`;
    } else if (status === 'missed') {
      statusText = 'Missed';
    } else if (status === 'rejected') {
      statusText = 'Rejected';
    } else {
      statusText = 'Ended';
    }

    const callMessage = {
      sender: req.user._id,
      text: `${callType === 'audio' ? '📞 Audio' : '📹 Video'} call - ${statusText}`,
      isCall: true,
      callType: callType || 'audio',
      callDuration: duration,
      callStatus: status || 'ended',
      read: true,
      reactions: [],
      createdAt: new Date()
    };

    chat.messages.push(callMessage);
    chat.lastMessage = callMessage.text;
    chat.lastMessageTime = new Date();
    await chat.save();

    const updatedChat = await Chat.findById(chatId)
      .populate('participants', 'name avatar')
      .populate('messages.sender', 'name avatar')
      .populate('messages.replyTo.senderId', 'name')
      .populate('messages.reactions.user', 'name avatar');

    res.json(updatedChat);
  } catch (error) {
    console.error('SaveCallLog error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Mark messages as read
const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    let updated = false;
    chat.messages.forEach(msg => {
      if (msg.sender.toString() !== userId.toString() && !msg.read) {
        msg.read = true;
        updated = true;
      }
    });

    if (updated) {
      await chat.save();
    }

    const updatedChat = await Chat.findById(chatId)
      .populate('participants', 'name avatar')
      .populate('messages.sender', 'name avatar')
      .populate('messages.replyTo.senderId', 'name')
      .populate('messages.reactions.user', 'name avatar');

    res.json(updatedChat);
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Toggle reaction on message
const toggleReaction = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { type } = req.body;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const message = chat.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const existingReaction = message.reactions.find(
      r => r.user.toString() === userId.toString()
    );

    if (existingReaction) {
      if (existingReaction.type === type) {
        message.reactions = message.reactions.filter(
          r => r.user.toString() !== userId.toString()
        );
      } else {
        existingReaction.type = type;
        existingReaction.createdAt = new Date();
      }
    } else {
      message.reactions.push({
        user: userId,
        type: type
      });
    }

    await chat.save();

    const updatedChat = await Chat.findById(chatId)
      .populate('participants', 'name avatar')
      .populate('messages.sender', 'name avatar')
      .populate('messages.replyTo.senderId', 'name')
      .populate('messages.reactions.user', 'name avatar');

    res.json(updatedChat);
  } catch (error) {
    console.error('ToggleReaction error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get reactions for message
const getReactions = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const message = chat.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const reactionSummary = {};
    message.reactions.forEach(reaction => {
      if (!reactionSummary[reaction.type]) {
        reactionSummary[reaction.type] = {
          count: 0,
          users: []
        };
      }
      reactionSummary[reaction.type].count++;
      reactionSummary[reaction.type].users.push(reaction.user);
    });

    res.json({ reactions: message.reactions, summary: reactionSummary });
  } catch (error) {
    console.error('GetReactions error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getOrCreateChat,
  getUserChats,
  sendMessage,
  sendMediaMessage,
  deleteMessage,
  saveCallLog,
  markMessagesAsRead,
  toggleReaction,
  getReactions
};