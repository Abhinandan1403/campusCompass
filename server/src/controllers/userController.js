const User = require('../models/User');
const Review = require('../models/Review');
const Post = require('../models/Post');
const Place = require('../models/Place');

// @desc    Get user public profile
// @route   GET /api/users/:id
// @access  Public
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('college', 'name shortName city')
      .select('-isBanned -reportCount');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const [reviews, posts, addedPlaces] = await Promise.all([
      Review.find({ user: req.params.id, isActive: true })
        .populate('place', 'name category images averageRating')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Post.find({ author: req.params.id, isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Place.find({ addedBy: req.params.id, isActive: true })
        .select('name category averageRating reviewCount')
        .limit(5)
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        user,
        reviews,
        posts,
        addedPlaces,
        stats: {
          reviewCount: reviews.length,
          postCount: posts.length,
          placeCount: addedPlaces.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user bookmarks
// @route   GET /api/users/bookmarks
// @access  Private
exports.getBookmarks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'bookmarks',
      match: { isActive: true },
      populate: { path: 'college', select: 'name shortName' },
      options: { sort: { createdAt: -1 } }
    });

    res.json({ success: true, data: { bookmarks: user.bookmarks } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leaderboard (top reviewers in college)
// @route   GET /api/users/leaderboard/:collegeId
// @access  Public
exports.getLeaderboard = async (req, res, next) => {
  try {
    const topReviewers = await Review.aggregate([
      { $match: { college: require('mongoose').Types.ObjectId(req.params.collegeId), isActive: true } },
      { $group: { _id: '$user', reviewCount: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
      { $sort: { reviewCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          'user.name': 1,
          'user.avatar': 1,
          'user.isStudentVerified': 1,
          'user.year': 1,
          reviewCount: 1,
          avgRating: 1
        }
      }
    ]);

    res.json({ success: true, data: { leaderboard: topReviewers } });
  } catch (error) {
    next(error);
  }
};
