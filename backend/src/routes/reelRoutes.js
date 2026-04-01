const express = require('express');
const {
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
} = require('../controllers/reelController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.route('/')
  .get(protect, getReels)
  .post(protect, upload.single('video'), createReel);

router.get('/trending', protect, getTrendingReels);
router.get('/user/:userId', protect, getUserReels);
router.get('/:id', protect, getReelById);
router.delete('/:id', protect, deleteReel);
router.put('/:id/like', protect, likeReel);
router.post('/:id/share', protect, shareReel);
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);

module.exports = router;