const jwt = require('jsonwebtoken');
const User = require('../models/User');
const College = require('../models/College');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, college, year, department } = req.body;

    // Verify college exists
    const collegeDoc = await College.findById(college);
    if (!collegeDoc) {
      return res.status(400).json({ success: false, message: 'College not found.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name, email, password, college, year, department
    });

    const populatedUser = await User.findById(user._id).populate('college', 'name shortName city');
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Campus Compass.',
      data: { user: populatedUser, token }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password').populate('college', 'name shortName city');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
    }

    const token = generateToken(user._id);

    // Don't send password in response
    user.password = undefined;

    res.json({
      success: true,
      message: 'Welcome back!',
      data: { user, token }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('college', 'name shortName city location')
      .populate('bookmarks', 'name category averageRating reviewCount images address');

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, year, department, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, year, department, avatar },
      { new: true, runValidators: true }
    ).populate('college', 'name shortName city');

    res.json({ success: true, message: 'Profile updated successfully.', data: { user } });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle bookmark
// @route   POST /api/auth/bookmark/:placeId
// @access  Private
exports.toggleBookmark = async (req, res, next) => {
  try {
    const { placeId } = req.params;
    const user = await User.findById(req.user._id);

    const bookmarkIndex = user.bookmarks.indexOf(placeId);
    let isBookmarked;

    if (bookmarkIndex > -1) {
      user.bookmarks.splice(bookmarkIndex, 1);
      isBookmarked = false;
    } else {
      user.bookmarks.push(placeId);
      isBookmarked = true;
    }

    await user.save();

    res.json({
      success: true,
      message: isBookmarked ? 'Place bookmarked!' : 'Bookmark removed.',
      data: { isBookmarked, bookmarks: user.bookmarks }
    });
  } catch (error) {
    next(error);
  }
};
