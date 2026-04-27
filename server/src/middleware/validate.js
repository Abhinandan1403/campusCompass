const { body, param, query, validationResult } = require('express-validator');

// Handle validation results
exports.handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array()
    });
  }
  next();
};

// Auth validations
exports.validateRegister = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('college').isMongoId().withMessage('Please select a valid college'),
  body('year').optional().isIn(['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG', 'PhD', 'Alumni'])
];

exports.validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Place validations
exports.validatePlace = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Place name must be 2-100 characters'),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be 10-500 characters'),
  body('category').isIn([
    'restaurant', 'cafe', 'street-food', 'stationery', 'pharmacy',
    'gym', 'library', 'hostel', 'salon', 'grocery', 'entertainment',
    'printing', 'coaching', 'other'
  ]).withMessage('Invalid category'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Invalid coordinates'),
  body('location.coordinates.*').isFloat().withMessage('Coordinates must be numbers'),
  body('priceRange.min').optional().isInt({ min: 0 }).withMessage('Min price must be a positive number'),
  body('priceRange.max').optional().isInt({ min: 0 }).withMessage('Max price must be a positive number')
];

// Review validations
exports.validateReview = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('body').trim().isLength({ min: 10, max: 1000 }).withMessage('Review must be 10-1000 characters'),
  body('title').optional().trim().isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('isAnonymous').optional().isBoolean()
];

// Post validations
exports.validatePost = [
  body('content').trim().isLength({ min: 5, max: 500 }).withMessage('Post content must be 5-500 characters'),
  body('type').optional().isIn(['question', 'recommendation', 'tip', 'alert', 'event']).withMessage('Invalid post type'),
  body('isAnonymous').optional().isBoolean()
];

// Comment validations
exports.validateComment = [
  body('body').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be 1-500 characters'),
  body('isAnonymous').optional().isBoolean()
];

// Query validations
exports.validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];
