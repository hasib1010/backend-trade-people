// src/models/Trade.js
const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    icon: {
        type: String // URL for trade icon
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Trade = mongoose.model('Trade', tradeSchema);
module.exports = Trade;