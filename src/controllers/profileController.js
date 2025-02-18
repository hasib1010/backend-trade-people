const TradespersonProfile = require('../models/TradespersonProfile');
const User = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

exports.getCurrentProfile = async (req, res) => {
    try {
        const profile = await TradespersonProfile.findOne({ userId: req.user.id })
            .populate('userId', 'firstName lastName email phone profilePicture');

        if (!profile) {
            return res.status(404).json({ 
                success: false, 
                message: 'Profile not found' 
            });
        }

        // Calculate profile completion
        const completionProgress = calculateProfileCompletion(profile);

        res.json({
            success: true,
            profile: {
                ...profile.toObject(),
                user: profile.userId,
                profileCompletionProgress: completionProgress
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error retrieving profile' 
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const profile = await TradespersonProfile.findOne({ userId: req.user.id });
        const user = await User.findById(req.user.id);

        if (!profile || !user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Profile not found' 
            });
        }

        // Handle file uploads
        if (req.files) {
            if (req.files.profileImage) {
                const profileImageResult = await uploadToCloudinary(
                    req.files.profileImage[0].path, 
                    'tradesperson-profiles'
                );
                user.profilePicture = profileImageResult.secure_url;
            }

            if (req.files.certificationImage) {
                const certImageResult = await uploadToCloudinary(
                    req.files.certificationImage[0].path, 
                    'certification-images'
                );
                profile.certificationImage = certImageResult.secure_url;
            }

            if (req.files.insuranceImage) {
                const insuranceImageResult = await uploadToCloudinary(
                    req.files.insuranceImage[0].path, 
                    'insurance-images'
                );
                profile.insuranceImage = insuranceImageResult.secure_url;
            }
        }

        // Update other profile details
        const updateFields = [
            'selectedTrade', 'experience', 'companyName', 
            'companyRegistrationNumber', 'businessAddress'
        ];

        updateFields.forEach(field => {
            if (req.body[field]) {
                profile[field] = req.body[field];
            }
        });

        // Recalculate profile completion
        profile.profileCompletionProgress = calculateProfileCompletion(profile);

        await profile.save();
        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile: {
                ...profile.toObject(),
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating profile' 
        });
    }
};

exports.updateHomeAddress = async (req, res) => {
    try {
        const profile = await TradespersonProfile.findOne({ userId: req.user.id });

        if (!profile) {
            return res.status(404).json({ 
                success: false, 
                message: 'Profile not found' 
            });
        }

        profile.homeAddress = {
            addressLine1: req.body.homeAddress1,
            addressLine2: req.body.homeAddress2,
            town: req.body.homeTown,
            country: req.body.homeCountry,
            postCode: req.body.homePostCode
        };

        await profile.save();

        res.json({
            success: true,
            message: 'Home address updated successfully',
            profile
        });
    } catch (error) {
        console.error('Update home address error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating home address' 
        });
    }
};

exports.updateBusinessAddress = async (req, res) => {
    try {
        const profile = await TradespersonProfile.findOne({ userId: req.user.id });

        if (!profile) {
            return res.status(404).json({ 
                success: false, 
                message: 'Profile not found' 
            });
        }

        profile.businessAddress = {
            addressLine1: req.body.businessAddressLine1,
            addressLine2: req.body.businessAddressLine2,
            town: req.body.businessTown,
            country: req.body.businessCountry,
            postCode: req.body.businessPostCode
        };

        await profile.save();

        res.json({
            success: true,
            message: 'Business address updated successfully',
            profile
        });
    } catch (error) {
        console.error('Update business address error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating business address' 
        });
    }
};

exports.updateTradeAndSkills = async (req, res) => {
    try {
        const profile = await TradespersonProfile.findOne({ userId: req.user.id });

        if (!profile) {
            return res.status(404).json({ 
                success: false, 
                message: 'Profile not found' 
            });
        }

        profile.selectedTrade = req.body.trade;
        profile.skills = req.body.skills;

        await profile.save();

        res.json({
            success: true,
            message: 'Trade and skills updated successfully',
            profile
        });
    } catch (error) {
        console.error('Update trade and skills error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating trade and skills' 
        });
    }
};

exports.uploadJobGalleryImages = async (req, res) => {
    try {
        const profile = await TradespersonProfile.findOne({ userId: req.user.id });

        if (!profile) {
            return res.status(404).json({ 
                success: false, 
                message: 'Profile not found' 
            });
        }

        // Upload multiple images
        const uploadPromises = req.files.map(file => 
            uploadToCloudinary(file.path, 'job-gallery-images')
        );

        const uploadResults = await Promise.all(uploadPromises);
        const newImageUrls = uploadResults.map(result => result.secure_url);

        // Append new images to existing gallery
        profile.jobGalleryImages = [
            ...(profile.jobGalleryImages || []),
            ...newImageUrls
        ];

        await profile.save();

        res.json({
            success: true,
            message: 'Job gallery images uploaded successfully',
            jobGalleryImages: profile.jobGalleryImages
        });
    } catch (error) {
        console.error('Upload job gallery images error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error uploading job gallery images' 
        });
    }
};

exports.deleteJobGalleryImage = async (req, res) => {
    try {
        const profile = await TradespersonProfile.findOne({ userId: req.user.id });

        if (!profile) {
            return res.status(404).json({ 
                success: false, 
                message: 'Profile not found' 
            });
        }

        const { imageUrl } = req.body;

        // Delete from Cloudinary
        const publicId = imageUrl.split('/').pop().split('.')[0];
        await deleteFromCloudinary(publicId);

        // Remove from profile
        profile.jobGalleryImages = profile.jobGalleryImages.filter(
            img => img !== imageUrl
        );

        await profile.save();

        res.json({
            success: true,
            message: 'Job gallery image deleted successfully',
            jobGalleryImages: profile.jobGalleryImages
        });
    } catch (error) {
        console.error('Delete job gallery image error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting job gallery image' 
        });
    }
};

// Helper function to calculate profile completion
function calculateProfileCompletion(profile) {
    const requiredFields = [
        'selectedTrade', 
        'experience', 
        'certificationImage', 
        'companyName', 
        'insuranceImage', 
        'homeAddress', 
        'businessAddress',
        'jobGalleryImages'
    ];

    let completedFields = 0;
    requiredFields.forEach(field => {
        if (profile[field] && 
            (typeof profile[field] !== 'object' || 
             Object.keys(profile[field]).length > 0 || 
             profile[field].length > 0)) {
            completedFields++;
        }
    });

    return Math.round((completedFields / requiredFields.length) * 100);
}