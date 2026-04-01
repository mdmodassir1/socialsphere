const mongoose = require('mongoose');

const ReactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    default: ''
  },
  media: {
    type: String,
    default: ''
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'audio', 'voice_note', 'video_note', ''],
    default: ''
  },
  mediaDuration: {
    type: Number,
    default: 0
  },
  read: {
    type: Boolean,
    default: false
  },
  isCall: {
    type: Boolean,
    default: false
  },
  callType: {
    type: String,
    default: ''
  },
  callDuration: {
    type: Number,
    default: 0
  },
  callStatus: {
    type: String,
    default: ''
  },
  reactions: [ReactionSchema],
  replyTo: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    text: {
      type: String,
      default: ''
    },
    senderName: {
      type: String,
      default: ''
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ChatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  messages: [MessageSchema],
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Chat', ChatSchema);