// src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const jobRoutes = require('./jobs');
const profileRoutes = require('./profiles');
const tradeRoutes = require('./trades');

router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/profiles', profileRoutes);
router.use('/trades', tradeRoutes);

module.exports = router;