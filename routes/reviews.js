const express = require('express');
const Review = require('../models/Review');

const router = express.Router({ mergeParams: true });

const advancedResults = require('../middlewares/advancedResults');
const { protect, authorize } = require('../middlewares/auth');
const {
    getReviews,
    getReview,
    addReview,
    updateReview,
    deleteReview,
} = require('../controllers/reviews');

router
    .route('/')
    .get(
        advancedResults(Review, {
            path: 'bootcamp',
            select: 'name description',
        }),
        getReviews
    )
    .post(protect, authorize('user', 'admin'), addReview);

router
    .route('/:id')
    .get(getReview)
    .put(protect, authorize('admin', 'user'), updateReview)
    .delete(protect, authorize('admin', 'user'), deleteReview);

module.exports = router;
