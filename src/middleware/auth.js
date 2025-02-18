const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                     req.cookies.token;

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify user exists and is active
        const user = await User.findOne({ 
            _id: decoded.id, 
            status: { $nin: ['suspended', 'inactive'] },
            emailVerified: true
        });

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found or account disabled' 
            });
        }

        // Set req.user to the decoded token payload
        req.user = {
            id: decoded.id,
            role: decoded.role
        };
        
        // Attach full user document if needed elsewhere
        req.fullUser = user;
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired. Please log in again.' 
            });
        }
        
        res.status(401).json({ 
            success: false,
            message: error.message || 'Authentication failed'
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};

module.exports = { auth, authorize };