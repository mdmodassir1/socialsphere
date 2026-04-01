const express = require('express');
const {
  trackProfileView,
  trackPostView,
  getDashboard
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard', protect, getDashboard);
router.post('/profile/:userId/view', protect, trackProfileView);
router.post('/post/:postId/view', protect, trackPostView);

module.exports = router;