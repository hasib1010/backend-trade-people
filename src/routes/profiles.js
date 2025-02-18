const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/fileUpload');
const { auth } = require('../middleware/auth');
const profileController = require('../controllers/profileController');

// Get current user's profile
router.get('/', auth, profileController.getCurrentProfile);

// Update profile
router.put('/', 
    auth, 
    upload.fields([
        { name: 'profileImage', maxCount: 1 },
        { name: 'certificationImage', maxCount: 1 },
        { name: 'insuranceImage', maxCount: 1 }
    ]), 
    profileController.updateProfile
);

// Update home address
router.put('/home-address', auth, profileController.updateHomeAddress);

// Update business address
router.put('/business-address', auth, profileController.updateBusinessAddress);

// Update trade and skills
router.put('/trade-skills', auth, profileController.updateTradeAndSkills);

// Upload job gallery images
router.post('/job-gallery', 
    auth, 
    upload.array('jobImages', 5), 
    profileController.uploadJobGalleryImages
);

// Delete job gallery image
router.delete('/job-gallery', auth, profileController.deleteJobGalleryImage);

module.exports = router;