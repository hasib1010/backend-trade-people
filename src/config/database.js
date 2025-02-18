// src/config/database.js
const mongoose = require('mongoose');
const Trade = require('../models/Trade');
const trades = require('../data/trades');

const seedTrades = async () => {
    try {
        // Check if trades exist
        const tradesCount = await Trade.countDocuments();
        if (tradesCount === 0) {
            console.log('No trades found, seeding database...');
            for (const trade of trades) {
                await Trade.findOneAndUpdate(
                    { name: trade.name },
                    trade,
                    { upsert: true, new: true }
                );
            }
            console.log('Database seeded with trades');
        }
    } catch (error) {
        console.error('Error seeding trades:', error);
    }
};

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Seed trades after successful connection
        await seedTrades();

        // Handle MongoDB connection errors after initial connection
        mongoose.connection.on('error', (err) => {
            console.error(`MongoDB connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        // Handle application termination
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('MongoDB connection closed through app termination');
                process.exit(0);
            } catch (err) {
                console.error('Error during MongoDB connection closure:', err);
                process.exit(1);
            }
        });

    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;