// src/scripts/seedDB.js
require('dotenv').config();
const mongoose = require('mongoose');
const Trade = require('../models/Trade');
const trades = require('../data/trades');

const seedTrades = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing trades
        await Trade.deleteMany({});
        console.log('Cleared existing trades');

        // Insert new trades
        for (const trade of trades) {
            await Trade.findOneAndUpdate(
                { name: trade.name },
                trade,
                { upsert: true, new: true }
            );
        }
        
        console.log('Trades seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding trades:', error);
        process.exit(1);
    }
};

seedTrades();