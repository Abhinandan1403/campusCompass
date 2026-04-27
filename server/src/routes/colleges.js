const express = require('express');
const router = express.Router();
const {
  getColleges, getCollege, createCollege, updateCollege, getCollegeStats
} = require('../controllers/collegeController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getColleges);
router.get('/:id', getCollege);
router.get('/:id/stats', getCollegeStats);
router.post('/', protect, authorize('admin'), createCollege);
router.put('/:id', protect, authorize('admin'), updateCollege);

module.exports = router;
