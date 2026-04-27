const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  place: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Place',
    required: true
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
    default: ''
  },
  body: {
    type: String,
    required: [true, 'Review body is required'],
    minlength: [10, 'Review must be at least 10 characters'],
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  },
  tags: [{
    type: String
  }],
  images: [{
    type: String
  }],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isStudentVerified: {
    type: Boolean,
    default: false
  },
  helpfulVotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reportCount: {
    type: Number,
    default: 0
  },
  reports: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    createdAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure one review per user per place
reviewSchema.index({ user: 1, place: 1 }, { unique: true });
reviewSchema.index({ place: 1, createdAt: -1 });
reviewSchema.index({ college: 1, createdAt: -1 });

// Virtual for helpful count
reviewSchema.virtual('helpfulCount').get(function () {
  return this.helpfulVotes ? this.helpfulVotes.length : 0;
});

// Post-save: Update place's average rating and review count
reviewSchema.post('save', async function () {
  await updatePlaceRating(this.place);
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await updatePlaceRating(doc.place);
});

reviewSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) await updatePlaceRating(doc.place);
});

async function updatePlaceRating(placeId) {
  const Place = mongoose.model('Place');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { place: placeId, isActive: true } },
    {
      $group: {
        _id: '$place',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
        weeklyReviews: {
          $sum: {
            $cond: [
              { $gte: ['$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  if (stats.length > 0) {
    const place = await Place.findById(placeId);
    if (place) {
      place.averageRating = Math.round(stats[0].averageRating * 10) / 10;
      place.reviewCount = stats[0].reviewCount;
      place.weeklyReviews = stats[0].weeklyReviews;
      place.updateTrendingScore();
      await place.save();
    }
  } else {
    await Place.findByIdAndUpdate(placeId, {
      averageRating: 0,
      reviewCount: 0,
      weeklyReviews: 0,
      trendingScore: 0
    });
  }
}

module.exports = mongoose.model('Review', reviewSchema);
