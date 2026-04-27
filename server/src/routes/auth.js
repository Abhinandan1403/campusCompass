const express = require('express');
const router = express.Router();
const {
  register, login, getMe, updateProfile, changePassword, toggleBookmark
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  validateRegister, validateLogin, handleValidation
} = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, validateRegister, handleValidation, register);
router.post('/login', authLimiter, validateLogin, handleValidation, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/bookmark/:placeId', protect, toggleBookmark);

module.exports = router;
