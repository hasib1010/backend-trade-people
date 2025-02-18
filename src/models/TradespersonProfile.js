
// src/models/TradespersonProfile.js
const mongoose = require('mongoose');

const tradespersonProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    selectedTrade: {
        type: String,
        required: true
    },
    experience: String,
    certificationImage: String,
    companyName: String,
    insuranceImage: String,
    companyRegistrationNumber: String,
    bio: String,
    businessType: String,
    employeeCount: Number,
    companyWebsiteURL: String,
    galleryImages: [String],
    skills: [String],
    businessAddress: {
        addressLine1: String,
        addressLine2: String,
        town: String,
        country: String,
        postcode: String
    },
    credits: {
        type: Number,
        default: 0
    },
    subscription: {
        plan: String,
        status: String,
        expiryDate: Date,
        stripeCustomerId: String,
        stripeSubscriptionId: String
    },
    ratings: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

const TradespersonProfile = mongoose.model('TradespersonProfile', tradespersonProfileSchema);
module.exports = TradespersonProfile;
