// utils/tokenHelper.js
// Creates JWT, sets httpOnly cookie, and sends standardized response

/**
 * sendTokenResponse
 * Generates JWT, attaches it to an httpOnly cookie, and returns
 * the user object + token in the JSON body.
 *
 * @param {Object} user - Mongoose User document
 * @param {number} statusCode - HTTP status to send
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.getSignedToken();

  const cookieOptions = {
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRE) || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // Prevents XSS access from JS
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  };

  // Strip sensitive fields before sending user data
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    isVerified: user.isVerified,
    sellerInfo: user.sellerInfo,
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    message,
    token,
    data: userData,
  });
};

module.exports = { sendTokenResponse };
