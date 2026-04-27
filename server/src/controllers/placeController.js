const Place = require('../models/Place');
const Review = require('../models/Review');
const mongoose = require('mongoose');

// @desc    Get all places (with filters, sorting, geo)
// @route   GET /api/places
// @access  Public
exports.getPlaces = async (req, res, next) => {
  try {
    const {
      college, category, tags, minRating, maxPrice, minPrice,
      sort = 'trending', page = 1, limit = 12,
      lat, lng, maxDistance = 5000, search
    } = req.query;

    const query = { isActive: true };

    if (college) query.college = college;
    if (category) query.category = category;
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      query.tags = { $in: tagArray };
    }
    if (minRating) query.averageRating = { $gte: parseFloat(minRating) };
    if (minPrice || maxPrice) {
      query['priceRange.min'] = {};
      if (minPrice) query['priceRange.min'].$gte = parseInt(minPrice);
      if (maxPrice) query['priceRange.max'] = { $lte: parseInt(maxPrice) };
    }
    if (search) {
      query.$text = { $search: search };
    }

    // Geo query
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance)
        }
      };
    }

    // Sorting
    let sortObj = {};
    switch (sort) {
      case 'trending': sortObj = { trendingScore: -1 }; break;
      case 'rating': sortObj = { averageRating: -1 }; break;
      case 'most-reviewed': sortObj = { reviewCount: -1 }; break;
      case 'newest': sortObj = { createdAt: -1 }; break;
      case 'price-low': sortObj = { 'priceRange.min': 1 }; break;
      default: sortObj = { trendingScore: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [places, total] = await Promise.all([
      Place.find(query)
        .populate('college', 'name shortName')
        .populate('addedBy', 'name isStudentVerified')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Place.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        places,
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

// @desc    Get single place
// @route   GET /api/places/:id
// @access  Public
exports.getPlace = async (req, res, next) => {
  try {
    const place = await Place.findById(req.params.id)
      .populate('college', 'name shortName city')
      .populate('addedBy', 'name isStudentVerified year');

    if (!place || !place.isActive) {
      return res.status(404).json({ success: false, message: 'Place not found.' });
    }

    // Increment views
    await Place.findByIdAndUpdate(req.params.id, {
      $inc: { totalViews: 1, weeklyViews: 1 }
    });

    // Check if current user has bookmarked or reviewed this place
    let userReview = null;
    let isBookmarked = false;

    if (req.user) {
      userReview = await Review.findOne({ user: req.user._id, place: place._id });
      isBookmarked = req.user.bookmarks?.includes(place._id.toString());
    }

    res.json({
      success: true,
      data: { place, userReview, isBookmarked }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create place
// @route   POST /api/places
// @access  Private
exports.createPlace = async (req, res, next) => {
  try {
    const placeData = {
      ...req.body,
      addedBy: req.user._id,
      college: req.body.college || req.user.college._id
    };

    const place = await Place.create(placeData);
    const populated = await Place.findById(place._id)
      .populate('college', 'name shortName')
      .populate('addedBy', 'name isStudentVerified');

    res.status(201).json({
      success: true,
      message: 'Place added successfully! It will be visible to your campus community.',
      data: { place: populated }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update place
// @route   PUT /api/places/:id
// @access  Private (owner or admin)
exports.updatePlace = async (req, res, next) => {
  try {
    let place = await Place.findById(req.params.id);

    if (!place) {
      return res.status(404).json({ success: false, message: 'Place not found.' });
    }

    if (place.addedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this place.' });
    }

    place = await Place.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    }).populate('college', 'name shortName').populate('addedBy', 'name');

    res.json({ success: true, message: 'Place updated successfully.', data: { place } });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete place
// @route   DELETE /api/places/:id
// @access  Private (owner or admin)
exports.deletePlace = async (req, res, next) => {
  try {
    const place = await Place.findById(req.params.id);

    if (!place) {
      return res.status(404).json({ success: false, message: 'Place not found.' });
    }

    if (place.addedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this place.' });
    }

    await Place.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({ success: true, message: 'Place removed.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending places for a college
// @route   GET /api/places/trending/:collegeId
// @access  Public
exports.getTrending = async (req, res, next) => {
  try {
    const places = await Place.find({
      college: req.params.collegeId,
      isActive: true,
      reviewCount: { $gt: 0 }
    })
      .populate('college', 'name shortName')
      .sort({ trendingScore: -1 })
      .limit(10)
      .lean();

    res.json({ success: true, data: { places } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby places
// @route   GET /api/places/nearby
// @access  Public
exports.getNearby = async (req, res, next) => {
  try {
    const { lat, lng, maxDistance = 2000, college } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required.' });
    }

    const query = {
      isActive: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance)
        }
      }
    };

    if (college) query.college = college;

    const places = await Place.find(query)
      .populate('college', 'name shortName')
      .limit(20)
      .lean();

    res.json({ success: true, data: { places } });
  } catch (error) {
    next(error);
  }
};

// @desc    Report a place
// @route   POST /api/places/:id/report
// @access  Private
exports.reportPlace = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const place = await Place.findById(req.params.id);

    if (!place) {
      return res.status(404).json({ success: false, message: 'Place not found.' });
    }

    const alreadyReported = place.reports.some(r => r.user.toString() === req.user._id.toString());
    if (alreadyReported) {
      return res.status(400).json({ success: false, message: 'You have already reported this place.' });
    }

    place.reports.push({ user: req.user._id, reason });
    place.reportCount += 1;
    await place.save();

    res.json({ success: true, message: 'Report submitted. Thank you for keeping Campus Compass safe.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get place categories with counts
// @route   GET /api/places/categories/:collegeId
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Place.aggregate([
      { $match: { college: new mongoose.Types.ObjectId(req.params.collegeId), isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 }, avgRating: { $avg: '$averageRating' } } },
      { $sort: { count: -1 } }
    ]);

    res.json({ success: true, data: { categories } });
  } catch (error) {
    next(error);
  }
};
