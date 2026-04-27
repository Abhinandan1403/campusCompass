const express = require('express');
const router = express.Router();
const {
  getPlaceReviews, createReview, updateReview, deleteReview,
  toggleHelpful, reportReview, getUserReviews
} = require('../controllers/reviewController');
const { protect, optionalAuth } = require('../middleware/auth');
const { validateReview, handleValidation } = require('../middleware/validate');
const { writeLimiter } = require('../middleware/rateLimiter');

router.get('/place/:placeId', optionalAuth, getPlaceReviews);
router.get('/user/:userId', getUserReviews);
router.post('/place/:placeId', protect, writeLimiter, validateReview, handleValidation, createReview);
router.put('/:id', protect, validateReview, handleValidation, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/helpful', protect, toggleHelpful);
router.post('/:id/report', protect, reportReview);

module.exports = router;
