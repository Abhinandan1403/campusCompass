const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    minlength: [5, 'Post must be at least 5 characters'],
    maxlength: [500, 'Post cannot exceed 500 characters'],
    trim: true
  },
  type: {
    type: String,
    enum: ['question', 'recommendation', 'tip', 'alert', 'event'],
    default: 'question'
  },
  tags: [{
    type: String,
    maxlength: 30
  }],
  linkedPlaces: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Place'
  }],
  images: [{
    type: String
  }],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  commentCount: {
    type: Number,
    default: 0
  },
  isPinned: {
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

postSchema.index({ college: 1, createdAt: -1 });
postSchema.index({ college: 1, upvotes: -1 });
postSchema.index({ content: 'text' });

// Virtual for upvote count
postSchema.virtual('upvoteCount').get(function () {
  return this.upvotes ? this.upvotes.length : 0;
});

module.exports = mongoose.model('Post', postSchema);
