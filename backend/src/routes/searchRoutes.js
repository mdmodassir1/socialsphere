const express = require('express');
const {
  advancedSearch,
  getSearchSuggestions
} = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, advancedSearch);
router.get('/suggestions', protect, getSearchSuggestions);

module.exports = router;