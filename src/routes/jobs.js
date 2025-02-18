// src/routes/profiles.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { auth } = require('../middleware/auth');

// Public routes
router.get('/:id', (req, res) => profileController.getProfile(req, res));

// Protected routes
router.put('/', auth, (req, res) => profileController.updateProfile(req, res));
router.post('/credits', auth, (req, res) => profileController.purchaseCredits(req, res));
router.post('/subscribe', auth, (req, res) => profileController.subscribe(req, res));
router.post('/cancel-subscription', auth, (req, res) => profileController.cancelSubscription(req, res));
router.delete('/gallery-image', auth, (req, res) => profileController.deleteGalleryImage(req, res));

module.exports = router;