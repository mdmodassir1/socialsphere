const express = require('express');
const {
  createPost,
  getPosts,
  getPostById,
  deletePost,
  editPost,
  likePost,
  addComment,
  deleteComment,
  sharePost,
  getUserPosts
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.route('/')
  .get(protect, getPosts)
  .post(protect, upload.single('image'), createPost);

router.get('/user/:userId', protect, getUserPosts);

router.route('/:id')
  .get(protect, getPostById)
  .put(protect, editPost)
  .delete(protect, deletePost);

router.put('/:id/like', protect, likePost);
router.post('/:id/share', protect, sharePost);

router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);

module.exports = router;