const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'College name is required'],
    trim: true,
    unique: true
  },
  shortName: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 10
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
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
  logo: {
    type: String,
    default: null
  },
  coverImage: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  establishedYear: {
    type: Number
  },
  website: {
    type: String,
    default: ''
  },
  studentCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

collegeSchema.index({ location: '2dsphere' });

// Virtual for place count
collegeSchema.virtual('placeCount', {
  ref: 'Place',
  localField: '_id',
  foreignField: 'college',
  count: true
});

module.exports = mongoose.model('College', collegeSchema);
