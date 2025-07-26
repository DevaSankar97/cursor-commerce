const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyEmail,
  resendVerificationEmail,
  verifyPhone,
  resendPhoneVerification,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactor,
  refreshToken
} = require('../controllers/authController');

const {
  protect,
  rateLimitSensitive,
  logSecurityEvent,
  requireEmailVerification
} = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', logSecurityEvent('user_register'), register);
router.post('/login', logSecurityEvent('user_login'), login);
router.post('/logout', logout);
router.post('/forgot-password', rateLimitSensitive(3, 60 * 60 * 1000), forgotPassword); // 3 attempts per hour
router.put('/reset-password/:resettoken', rateLimitSensitive(5, 60 * 60 * 1000), resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/refresh-token', refreshToken);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.get('/me', getMe);
router.put('/update-password', 
  rateLimitSensitive(5, 60 * 60 * 1000), 
  logSecurityEvent('password_change'), 
  updatePassword
);

// Email verification routes
router.post('/resend-verification-email', 
  rateLimitSensitive(3, 60 * 60 * 1000), 
  resendVerificationEmail
);

// Phone verification routes
router.post('/verify-phone', 
  rateLimitSensitive(5, 15 * 60 * 1000), 
  verifyPhone
);
router.post('/resend-phone-verification', 
  rateLimitSensitive(3, 60 * 60 * 1000), 
  resendPhoneVerification
);

// Two-factor authentication routes
router.post('/enable-2fa', 
  requireEmailVerification,
  rateLimitSensitive(3, 60 * 60 * 1000),
  logSecurityEvent('2fa_enable'),
  enableTwoFactor
);
router.post('/disable-2fa', 
  rateLimitSensitive(3, 60 * 60 * 1000),
  logSecurityEvent('2fa_disable'),
  disableTwoFactor
);
router.post('/verify-2fa', 
  rateLimitSensitive(5, 15 * 60 * 1000),
  verifyTwoFactor
);

module.exports = router;