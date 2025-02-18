// src/routes/auth.js
const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/fileUpload');
const { auth } = require('../middleware/auth');
const {
  registerCustomer,
  registerTradesperson,
  verifyEmail,
  resendVerificationEmail,
  login,
  logout,
  checkAuth,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

// Registration routes
router.post(
  '/customer/register', 
  upload.single('imageInput'),
  (req, res) => registerCustomer(req, res)
);

router.post(
  '/tradesperson/register',
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'licenseImage', maxCount: 1 },
    { name: 'insuranceImage', maxCount: 1 }
  ]),
  (req, res) => registerTradesperson(req, res)
);

// Email verification routes
router.get('/verify-email/:token', (req, res) => verifyEmail(req, res));
router.post('/resend-verification', (req, res) => resendVerificationEmail(req, res));

// Authentication routes
router.post('/login', (req, res) => login(req, res));
router.post('/logout', auth, (req, res) => logout(req, res));
router.get('/jwt', auth, (req, res) => checkAuth(req, res));

// Password reset routes
router.post('/forgot-password', (req, res) => forgotPassword(req, res));
router.post('/reset-password', (req, res) => resetPassword(req, res));

module.exports = router;