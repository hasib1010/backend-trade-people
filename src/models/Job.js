
// src/models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    jobTitle: {
        type: String,
        required: true
    },
    jobCategory: {
        type: String,
        required: true
    },
    jobAbout: {
        type: String,
        required: true
    },
    jobLocation: {
        type: String,
        required: true
    },
    jobDeadline: Date,
    jobUrgency: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    jobImages: [String],
    jobStatus: {
        type: String,
        enum: ['pending', 'inProgress', 'completed', 'cancelled'],
        default: 'pending'
    },
    budget: Number,
    requirements: [String],
    assignedTradesperson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    applicants: [{
        tradesPerson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        appliedAt: {
            type: Date,
            default: Date.now
        }
    }],
    completionDate: Date
}, {
    timestamps: true
});

// Pre-save middleware to check number of applicants
jobSchema.pre('save', function(next) {
    if (this.applicants && this.applicants.length > 3) {
        next(new Error('Maximum of 3 tradespeople can apply for each job'));
    }
    next();
});

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;

