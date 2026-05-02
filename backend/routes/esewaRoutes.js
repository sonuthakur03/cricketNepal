// routes/esewaRoutes.js
// All eSewa payment gateway routes

const express = require('express');
const router  = express.Router();
const {
  initiateEsewaPayment,
  verifyEsewaPayment,
  esewaFailure,
} = require('../controllers/esewaController');
const { protect } = require('../middleware/auth');

// All eSewa routes require authentication
router.use(protect);

// Initiate — frontend calls this to get signed form fields
router.post('/initiate/:orderId', initiateEsewaPayment);

// Verify — called after eSewa redirects user back (success path)
router.post('/verify/:orderId', verifyEsewaPayment);

// Failure — called when user cancels or payment fails
router.post('/failure/:orderId', esewaFailure);

module.exports = router;
