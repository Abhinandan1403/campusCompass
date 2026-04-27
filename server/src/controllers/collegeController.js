const College = require('../models/College');

// @desc    Get all colleges
// @route   GET /api/colleges
// @access  Public
exports.getColleges = async (req, res, next) => {
  try {
    const { search, city, state } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortName: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }
    if (city) query.city = { $regex: city, $options: 'i' };
    if (state) query.state = { $regex: state, $options: 'i' };

    const colleges = await College.find(query)
      .sort({ name: 1 })
      .lean();

    res.json({ success: true, data: { colleges } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single college
// @route   GET /api/colleges/:id
// @access  Public
exports.getCollege = async (req, res, next) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }
    res.json({ success: true, data: { college } });
  } catch (error) {
    next(error);
  }
};

// @desc    Create college (admin only)
// @route   POST /api/colleges
// @access  Private/Admin
exports.createCollege = async (req, res, next) => {
  try {
    const college = await College.create(req.body);
    res.status(201).json({ success: true, data: { college } });
  } catch (error) {
    next(error);
  }
};

// @desc    Update college (admin only)
// @route   PUT /api/colleges/:id
// @access  Private/Admin
exports.updateCollege = async (req, res, next) => {
  try {
    const college = await College.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }

    res.json({ success: true, data: { college } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get college stats
// @route   GET /api/colleges/:id/stats
// @access  Public
exports.getCollegeStats = async (req, res, next) => {
  try {
    const Place = require('../models/Place');
    const User = require('../models/User');
    const Post = require('../models/Post');

    const [placeCount, studentCount, postCount] = await Promise.all([
      Place.countDocuments({ college: req.params.id, isActive: true }),
      User.countDocuments({ college: req.params.id }),
      Post.countDocuments({ college: req.params.id, isActive: true })
    ]);

    res.json({
      success: true,
      data: { stats: { placeCount, studentCount, postCount } }
    });
  } catch (error) {
    next(error);
  }
};
