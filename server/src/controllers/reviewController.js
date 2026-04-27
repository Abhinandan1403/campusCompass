const Review = require('../models/Review');
const Place = require('../models/Place');

// @desc    Get reviews for a place
// @route   GET /api/reviews/place/:placeId
// @access  Public
exports.getPlaceReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    const sortObj = sort === 'helpful'
      ? { helpfulVotes: -1 }
      : sort === 'highest'
      ? { rating: -1 }
      : sort === 'lowest'
      ? { rating: 1 }
      : { createdAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ place: req.params.placeId, isActive: true })
        .populate({
          path: 'user',
          select: 'name avatar isStudentVerified year college',
          populate: { path: 'college', select: 'shortName' }
        })
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Review.countDocuments({ place: req.params.placeId, isActive: true })
    ]);

    // Mask anonymous review authors
    const sanitizedReviews = reviews.map(review => ({
      ...review,
      user: review.isAnonymous ? { name: 'Anonymous Student', avatar: null, isStudentVerified: false } : review.user
    }));

    // Rating distribution
    const distribution = await Review.aggregate([
      { $match: { place: reviews[0]?.place || null, isActive: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        reviews: sanitizedReviews,
        distribution,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create review
// @route   POST /api/reviews/place/:placeId
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const place = await Place.findById(req.params.placeId);
    if (!place || !place.isActive) {
      return res.status(404).json({ success: false, message: 'Place not found.' });
    }

    // Check for duplicate review
    const existingReview = await Review.findOne({
      user: req.user._id,
      place: req.params.placeId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this place. You can edit your existing review.'
      });
    }

    const review = await Review.create({
      ...req.body,
      user: req.user._id,
      place: req.params.placeId,
      college: place.college,
      isStudentVerified: req.user.isStudentVerified
    });

    const populated = await Review.findById(review._id)
      .populate('user', 'name avatar isStudentVerified year');

    res.status(201).json({
      success: true,
      message: 'Review posted! Thank you for helping your campus community.',
      data: { review: populated }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (owner only)
exports.updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this review.' });
    }

    review = await Review.findByIdAndUpdate(
      req.params.id,
      { rating: req.body.rating, title: req.body.title, body: req.body.body, isAnonymous: req.body.isAnonymous },
      { new: true, runValidators: true }
    ).populate('user', 'name avatar isStudentVerified year');

    res.json({ success: true, message: 'Review updated.', data: { review } });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (owner or admin)
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review.' });
    }

    await Review.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({ success: true, message: 'Review deleted.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Vote review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
exports.toggleHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    if (review.user.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot vote your own review.' });
    }

    const voteIndex = review.helpfulVotes.indexOf(req.user._id);
    let isHelpful;

    if (voteIndex > -1) {
      review.helpfulVotes.splice(voteIndex, 1);
      isHelpful = false;
    } else {
      review.helpfulVotes.push(req.user._id);
      isHelpful = true;
    }

    await review.save();

    res.json({
      success: true,
      data: { isHelpful, helpfulCount: review.helpfulVotes.length }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Report review
// @route   POST /api/reviews/:id/report
// @access  Private
exports.reportReview = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const alreadyReported = review.reports.some(r => r.user.toString() === req.user._id.toString());
    if (alreadyReported) {
      return res.status(400).json({ success: false, message: 'Already reported.' });
    }

    review.reports.push({ user: req.user._id, reason });
    review.reportCount += 1;
    await review.save();

    res.json({ success: true, message: 'Review reported.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/user/:userId
// @access  Public
exports.getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ user: req.params.userId, isActive: true })
      .populate('place', 'name category images averageRating address')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, data: { reviews } });
  } catch (error) {
    next(error);
  }
};
