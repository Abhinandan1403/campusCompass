const express = require('express');
const router = express.Router();
const { getUserProfile, getBookmarks, getLeaderboard } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/bookmarks', protect, getBookmarks);
router.get('/leaderboard/:collegeId', getLeaderboard);
router.get('/:id', getUserProfile);

module.exports = router;
