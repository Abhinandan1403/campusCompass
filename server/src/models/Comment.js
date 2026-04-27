const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
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
  body: {
    type: String,
    required: [true, 'Comment body is required'],
    minlength: [1, 'Comment must be at least 1 character'],
    maxlength: [500, 'Comment cannot exceed 500 characters'],
    trim: true
  },
  linkedPlaces: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Place'
  }],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAccepted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

commentSchema.index({ post: 1, createdAt: 1 });

// Virtual for upvote count
commentSchema.virtual('upvoteCount').get(function () {
  return this.upvotes ? this.upvotes.length : 0;
});

// Update post comment count on save/delete
commentSchema.post('save', async function () {
  await updatePostCommentCount(this.post);
});

commentSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await updatePostCommentCount(doc.post);
});

async function updatePostCommentCount(postId) {
  const count = await mongoose.model('Comment').countDocuments({
    post: postId,
    isActive: true
  });
  await mongoose.model('Post').findByIdAndUpdate(postId, { commentCount: count });
}

module.exports = mongoose.model('Comment', commentSchema);
