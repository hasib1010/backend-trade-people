// src/controllers/tradeController.js
const Trade = require('../models/Trade');

const tradeController = {
    // Get all trades
    getAllTrades: async (req, res) => {
        try {
            const trades = await Trade.find({ isActive: true })
                .select('name description icon')
                .sort({ name: 1 });

            res.json({
                success: true,
                data: {
                    trades
                }
            });
        } catch (error) {
            console.error('Error fetching trades:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching trades'
            });
        }
    },

    // Get single trade
    getTrade: async (req, res) => {
        try {
            const trade = await Trade.findById(req.params.id);
            if (!trade) {
                return res.status(404).json({
                    success: false,
                    message: 'Trade not found'
                });
            }

            res.json({
                success: true,
                data: {
                    trade
                }
            });
        } catch (error) {
            console.error('Error fetching trade:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching trade'
            });
        }
    },

    // Create new trade
    createTrade: async (req, res) => {
        try {
            const { name, description, icon } = req.body;

            // Check if trade already exists
            const existingTrade = await Trade.findOne({ name });
            if (existingTrade) {
                return res.status(400).json({
                    success: false,
                    message: 'Trade already exists'
                });
            }

            const trade = new Trade({
                name,
                description,
                icon
            });

            await trade.save();

            res.status(201).json({
                success: true,
                message: 'Trade created successfully',
                data: {
                    trade
                }
            });
        } catch (error) {
            console.error('Error creating trade:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating trade'
            });
        }
    },

    // Update trade
    updateTrade: async (req, res) => {
        try {
            const { name, description, icon, isActive } = req.body;
            const trade = await Trade.findById(req.params.id);

            if (!trade) {
                return res.status(404).json({
                    success: false,
                    message: 'Trade not found'
                });
            }

            // Check if new name already exists
            if (name && name !== trade.name) {
                const existingTrade = await Trade.findOne({ name });
                if (existingTrade) {
                    return res.status(400).json({
                        success: false,
                        message: 'Trade name already exists'
                    });
                }
            }

            // Update fields
            trade.name = name || trade.name;
            trade.description = description || trade.description;
            trade.icon = icon || trade.icon;
            trade.isActive = isActive ?? trade.isActive;

            await trade.save();

            res.json({
                success: true,
                message: 'Trade updated successfully',
                data: {
                    trade
                }
            });
        } catch (error) {
            console.error('Error updating trade:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating trade'
            });
        }
    },

    // Delete trade (soft delete)
    deleteTrade: async (req, res) => {
        try {
            const trade = await Trade.findById(req.params.id);
            if (!trade) {
                return res.status(404).json({
                    success: false,
                    message: 'Trade not found'
                });
            }

            trade.isActive = false;
            await trade.save();

            res.json({
                success: true,
                message: 'Trade deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting trade:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting trade'
            });
        }
    }
};

module.exports = tradeController;