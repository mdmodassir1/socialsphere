const express = require('express');
const {
  createStory,
  getStories,
  viewStory,
  deleteStory
} = require('../controllers/storyController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', protect, getStories);
router.post('/', protect, upload.single('media'), createStory);
router.post('/:storyId/view', protect, viewStory);
router.delete('/:storyId', protect, deleteStory);

module.exports = router;