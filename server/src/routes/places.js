const express = require('express');
const router = express.Router();
const {
  getPlaces, getPlace, createPlace, updatePlace, deletePlace,
  getTrending, getNearby, reportPlace, getCategories
} = require('../controllers/placeController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { validatePlace, handleValidation } = require('../middleware/validate');
const { writeLimiter } = require('../middleware/rateLimiter');

router.get('/', getPlaces);
router.get('/nearby', getNearby);
router.get('/trending/:collegeId', getTrending);
router.get('/categories/:collegeId', getCategories);
router.get('/:id', optionalAuth, getPlace);
router.post('/', protect, writeLimiter, validatePlace, handleValidation, createPlace);
router.put('/:id', protect, updatePlace);
router.delete('/:id', protect, deletePlace);
router.post('/:id/report', protect, reportPlace);

module.exports = router;
