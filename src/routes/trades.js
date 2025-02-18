// src/routes/trades.js
const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/tradeController');
const { auth, authorize } = require('../middleware/auth');

// Public routes
router.get('/', (req, res) => tradeController.getAllTrades(req, res));
router.get('/:id', (req, res) => tradeController.getTrade(req, res));

// Protected routes (admin only)
router.post('/', auth, authorize('admin'), (req, res) => tradeController.createTrade(req, res));
router.put('/:id', auth, authorize('admin'), (req, res) => tradeController.updateTrade(req, res));
router.delete('/:id', auth, authorize('admin'), (req, res) => tradeController.deleteTrade(req, res));

module.exports = router;