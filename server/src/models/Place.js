const mongoose = require('mongoose');

const VALID_TAGS = [
  'cheap-eats-50-100',
  'cheap-eats-100-200',
  'good-for-study',
  'wifi-available',
  'late-night-open',
  'group-hangout',
  'outdoor-seating',
  'ac-available',
  'vegetarian-friendly',
  'quick-bites',
  'delivery-available',
  'bike-friendly',
  'date-spot',
  'exam-fuel',
  'street-food',
  'chai-coffee',
  'breakfast-spot',
  'great-ambience',
  'pet-friendly',
  'power-outlets'
];

const CATEGORIES = [
  'restaurant',
  'cafe',
  'street-food',
  'stationery',
  'pharmacy',
  'gym',
  'library',
  'hostel',
  'salon',
  'grocery',
  'entertainment',
  'printing',
  'coaching',
  'other'
];

const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Place name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: CATEGORIES
  },
  tags: [{
    type: String,
    enum: VALID_TAGS
  }],
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  landmark: {
    type: String,
    default: ''
  },
  distanceFromGate: {
    type: String, // e.g., "200m from Main Gate"
    default: ''
  },
  images: [{
    url: String,
    caption: String
  }],
  contactNumber: {
    type: String,
    default: ''
  },
  timings: {
    openTime: { type: String, default: '08:00' },
    closeTime: { type: String, default: '22:00' },
    closedOn: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
    isOpen24Hours: { type: Boolean, default: false }
  },
  priceRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 500 }
  },
  // Computed fields updated via aggregation / post-save hooks
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  // Trending algorithm data
  trendingScore: {
    type: Number,
    default: 0
  },
  weeklyViews: {
    type: Number,
    default: 0
  },
  weeklyReviews: {
    type: Number,
    default: 0
  },
  totalViews: {
    type: Number,
    default: 0
  },
  lastTrendingReset: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reportCount: {
    type: Number,
    default: 0
  },
  reports: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Geospatial index
placeSchema.index({ location: '2dsphere' });
placeSchema.index({ college: 1, trendingScore: -1 });
placeSchema.index({ college: 1, averageRating: -1 });
placeSchema.index({ college: 1, category: 1 });
placeSchema.index({ name: 'text', description: 'text', address: 'text' });

// Update trending score
placeSchema.methods.updateTrendingScore = function () {
  const ageInDays = (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24);
  const recencyFactor = Math.max(0, 1 - ageInDays / 30);
  const reviewWeight = this.weeklyReviews * 10;
  const viewWeight = this.weeklyViews * 1;
  const ratingWeight = this.averageRating * 5;
  this.trendingScore = (reviewWeight + viewWeight + ratingWeight) * (1 + recencyFactor);
};

module.exports = mongoose.model('Place', placeSchema);
module.exports.VALID_TAGS = VALID_TAGS;
module.exports.CATEGORIES = CATEGORIES;
