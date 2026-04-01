const express = require('express');
const {
  getOrCreateChat,
  getUserChats,
  sendMessage,
  sendMediaMessage,
  deleteMessage,
  saveCallLog,
  markMessagesAsRead,
  toggleReaction,
  getReactions
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', protect, getUserChats);
router.post('/:userId', protect, getOrCreateChat);
router.post('/:chatId/messages', protect, sendMessage);
router.post('/:chatId/media', protect, upload.single('media'), sendMediaMessage);
router.delete('/:chatId/messages/:messageId', protect, deleteMessage);
router.post('/:chatId/call-log', protect, saveCallLog);
router.put('/:chatId/read', protect, markMessagesAsRead);
router.post('/:chatId/messages/:messageId/reactions', protect, toggleReaction);
router.get('/:chatId/messages/:messageId/reactions', protect, getReactions);

module.exports = router;