const express = require('express');
const {
  getUserProfile,
  updateProfile,
  followUser,
  searchUsers,
  getUserSuggestions,
  getUserFollowers,
  getUserFollowing
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/search', protect, searchUsers);
router.get('/suggestions', protect, getUserSuggestions);
router.get('/:id', protect, getUserProfile);
router.get('/:id/followers', protect, getUserFollowers);
router.get('/:id/following', protect, getUserFollowing);
router.put('/:id/follow', protect, followUser);
router.put('/profile', protect, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 }
]), updateProfile);

module.exports = router;