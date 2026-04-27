const express = require('express');
const router = express.Router();
const {
  getFeed, createPost, getPost, deletePost, toggleUpvote,
  addComment, toggleCommentUpvote, acceptComment, deleteComment
} = require('../controllers/postController');
const { protect, optionalAuth } = require('../middleware/auth');
const { validatePost, validateComment, handleValidation } = require('../middleware/validate');
const { writeLimiter } = require('../middleware/rateLimiter');

router.get('/:collegeId', optionalAuth, getFeed);
router.get('/single/:id', optionalAuth, getPost);
router.post('/', protect, writeLimiter, validatePost, handleValidation, createPost);
router.delete('/:id', protect, deletePost);
router.post('/:id/upvote', protect, toggleUpvote);

// Comments
router.post('/:postId/comments', protect, writeLimiter, validateComment, handleValidation, addComment);
router.post('/comments/:id/upvote', protect, toggleCommentUpvote);
router.post('/comments/:id/accept', protect, acceptComment);
router.delete('/comments/:id', protect, deleteComment);

module.exports = router;
