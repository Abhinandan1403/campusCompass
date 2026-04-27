const Post = require('../models/Post');
const Comment = require('../models/Comment');

// @desc    Get college feed posts
// @route   GET /api/posts/:collegeId
// @access  Public
exports.getFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, type, sort = 'newest' } = req.query;
    const { collegeId } = req.params;

    const query = { college: collegeId, isActive: true };
    if (type) query.type = type;

    const sortObj = sort === 'popular'
      ? { upvotes: -1 }
      : { isPinned: -1, createdAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate({
          path: 'author',
          select: 'name avatar isStudentVerified year'
        })
        .populate('linkedPlaces', 'name category averageRating address images')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Post.countDocuments(query)
    ]);

    // Mask anonymous authors
    const sanitizedPosts = posts.map(post => ({
      ...post,
      author: post.isAnonymous
        ? { name: 'Anonymous Student', avatar: null, isStudentVerified: false }
        : post.author,
      upvoteCount: post.upvotes ? post.upvotes.length : 0,
      isUpvoted: req.user ? post.upvotes?.some(id => id.toString() === req.user._id.toString()) : false
    }));

    res.json({
      success: true,
      data: {
        posts: sanitizedPosts,
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

// @desc    Create post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    const post = await Post.create({
      ...req.body,
      author: req.user._id,
      college: req.user.college._id
    });

    const populated = await Post.findById(post._id)
      .populate('author', 'name avatar isStudentVerified year')
      .populate('linkedPlaces', 'name category averageRating');

    res.status(201).json({
      success: true,
      message: 'Post shared with your campus community!',
      data: { post: populated }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post with comments
// @route   GET /api/posts/single/:id
// @access  Public
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate({
        path: 'author',
        select: 'name avatar isStudentVerified year'
      })
      .populate('linkedPlaces', 'name category averageRating address images');

    if (!post || !post.isActive) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const comments = await Comment.find({ post: post._id, isActive: true, parentComment: null })
      .populate('author', 'name avatar isStudentVerified year')
      .populate('linkedPlaces', 'name category averageRating address images')
      .sort({ isAccepted: -1, upvotes: -1, createdAt: 1 });

    const sanitizedPost = {
      ...post.toObject(),
      author: post.isAnonymous ? { name: 'Anonymous Student', avatar: null, isStudentVerified: false } : post.author,
      upvoteCount: post.upvotes?.length || 0,
      isUpvoted: req.user ? post.upvotes?.some(id => id.toString() === req.user?._id.toString()) : false
    };

    const sanitizedComments = comments.map(c => ({
      ...c.toObject(),
      author: c.isAnonymous ? { name: 'Anonymous Student', avatar: null, isStudentVerified: false } : c.author,
      upvoteCount: c.upvotes?.length || 0,
      isUpvoted: req.user ? c.upvotes?.some(id => id.toString() === req.user?._id.toString()) : false
    }));

    res.json({
      success: true,
      data: { post: sanitizedPost, comments: sanitizedComments }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private (owner or admin)
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await Post.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Post removed.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle upvote on post
// @route   POST /api/posts/:id/upvote
// @access  Private
exports.toggleUpvote = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const voteIndex = post.upvotes.indexOf(req.user._id);
    let isUpvoted;

    if (voteIndex > -1) {
      post.upvotes.splice(voteIndex, 1);
      isUpvoted = false;
    } else {
      post.upvotes.push(req.user._id);
      isUpvoted = true;
    }

    await post.save();
    res.json({ success: true, data: { isUpvoted, upvoteCount: post.upvotes.length } });
  } catch (error) {
    next(error);
  }
};

// --- COMMENTS ---

// @desc    Add comment to post
// @route   POST /api/posts/:postId/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post || !post.isActive) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const comment = await Comment.create({
      ...req.body,
      post: req.params.postId,
      author: req.user._id,
      college: post.college
    });

    const populated = await Comment.findById(comment._id)
      .populate('author', 'name avatar isStudentVerified year')
      .populate('linkedPlaces', 'name category averageRating address images');

    const sanitized = {
      ...populated.toObject(),
      author: comment.isAnonymous ? { name: 'Anonymous Student', avatar: null, isStudentVerified: false } : populated.author,
      upvoteCount: 0,
      isUpvoted: false
    };

    res.status(201).json({
      success: true,
      message: 'Comment added!',
      data: { comment: sanitized }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle upvote on comment
// @route   POST /api/posts/comments/:id/upvote
// @access  Private
exports.toggleCommentUpvote = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    const voteIndex = comment.upvotes.indexOf(req.user._id);
    let isUpvoted;

    if (voteIndex > -1) {
      comment.upvotes.splice(voteIndex, 1);
      isUpvoted = false;
    } else {
      comment.upvotes.push(req.user._id);
      isUpvoted = true;
    }

    await comment.save();
    res.json({ success: true, data: { isUpvoted, upvoteCount: comment.upvotes.length } });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark comment as accepted answer
// @route   POST /api/posts/comments/:id/accept
// @access  Private (post author only)
exports.acceptComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id).populate('post');
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    const post = await Post.findById(comment.post);
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the post author can accept an answer.' });
    }

    // Unaccept all other comments on this post first
    await Comment.updateMany({ post: comment.post }, { isAccepted: false });

    // Toggle acceptance
    comment.isAccepted = !comment.isAccepted;
    await comment.save();

    res.json({ success: true, data: { isAccepted: comment.isAccepted } });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/posts/comments/:id
// @access  Private (owner or admin)
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await Comment.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Comment removed.' });
  } catch (error) {
    next(error);
  }
};
