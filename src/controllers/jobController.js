// src/controllers/jobController.js
const Job = require('../models/Job');
const { TradespersonProfile } = require('../models/TradespersonProfile');
const { uploadToCloudinary } = require('../config/cloudinary');
const { sendEmail, emailTemplates } = require('../config/email');

const jobController = {
    // Create new job
    createJob: async (req, res) => {
        try {
            const { jobTitle, jobCategory, jobAbout, jobLocation, jobDeadline, 
                   jobUrgency, budget, requirements } = req.body;

            // Upload images if provided
            let jobImages = [];
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const result = await uploadToCloudinary(file.path, 'job-images');
                    jobImages.push(result.url);
                }
            }

            const job = new Job({
                customer: req.user.id,
                jobTitle,
                jobCategory,
                jobAbout,
                jobLocation,
                jobDeadline,
                jobUrgency,
                jobImages,
                budget,
                requirements
            });

            await job.save();

            // Notify relevant tradespeople
            const matchingTradespeople = await TradespersonProfile.find({
                selectedTrade: jobCategory,
                'subscription.status': 'active'
            }).populate('userId');

            for (const profile of matchingTradespeople) {
                await sendEmail({
                    to: profile.userId.email,
                    ...emailTemplates.newJobAlert(jobTitle, `${process.env.FRONTEND_URL}/jobs/${job._id}`)
                });
            }

            res.status(201).json(job);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get all jobs with filters
    getJobs: async (req, res) => {
        try {
            const { 
                category, 
                location, 
                urgency, 
                status,
                minBudget,
                maxBudget,
                page = 1,
                limit = 10
            } = req.query;

            const query = {};

            if (category) query.jobCategory = category;
            if (location) query.jobLocation = { $regex: location, $options: 'i' };
            if (urgency) query.jobUrgency = urgency;
            if (status) query.jobStatus = status;
            if (minBudget || maxBudget) {
                query.budget = {};
                if (minBudget) query.budget.$gte = Number(minBudget);
                if (maxBudget) query.budget.$lte = Number(maxBudget);
            }

            const skip = (page - 1) * limit;

            const jobs = await Job.find(query)
                .populate('customer', 'firstName lastName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit));

            const total = await Job.countDocuments(query);

            res.json({
                jobs,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                total
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get single job
    getJob: async (req, res) => {
        try {
            const job = await Job.findById(req.params.id)
                .populate('customer', 'firstName lastName email')
                .populate('assignedTradesperson', 'firstName lastName')
                .populate('applicants.tradesPerson', 'firstName lastName');

            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }

            res.json(job);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Apply for job
    applyForJob: async (req, res) => {
        try {
            const job = await Job.findById(req.params.id);
            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }

            // Check if tradesPerson has enough credits
            const profile = await TradespersonProfile.findOne({ userId: req.user.id });
            if (profile.credits < 1) {
                return res.status(400).json({ error: 'Insufficient credits' });
            }

            // Add application
            await job.addApplicant(req.user.id);

            // Deduct credit
            profile.credits -= 1;
            await profile.save();

            res.json({ 
                message: 'Application submitted successfully',
                remainingCredits: profile.credits
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Update job status
    updateJobStatus: async (req, res) => {
        try {
            const { status } = req.body;
            const job = await Job.findById(req.params.id);

            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }

            // Verify permission
            if (job.customer.toString() !== req.user.id) {
                return res.status(403).json({ error: 'Not authorized' });
            }

            job.jobStatus = status;
            if (status === 'completed') {
                job.completionDate = Date.now();
            }

            await job.save();
            res.json(job);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Accept/Reject applicant
    handleApplication: async (req, res) => {
        try {
            const { applicantId, status } = req.body;
            const job = await Job.findById(req.params.id);

            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }

            // Verify permission
            if (job.customer.toString() !== req.user.id) {
                return res.status(403).json({ error: 'Not authorized' });
            }

            const applicant = job.applicants.id(applicantId);
            if (!applicant) {
                return res.status(404).json({ error: 'Applicant not found' });
            }

            applicant.status = status;
            if (status === 'accepted') {
                job.assignedTradesperson = applicant.tradesPerson;
                job.jobStatus = 'inProgress';
            }

            await job.save();
            res.json(job);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = jobController;